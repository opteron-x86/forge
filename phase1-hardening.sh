#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TALOS Phase 1 Hardening — Apply Script
# Run from the repo root: bash phase1-hardening.sh
#
# Implements all 5 immediate audit priorities:
#   1. CORS lockdown (S1 — High)
#   2. Helmet.js security headers (S5 — Medium)
#   3. Per-user AI rate limiting (S2 — High)
#   4. Custom exercise delete authorization (S8 — Low)
#   5. Database performance indexes
# Plus bonus fixes:
#   6. Analytics cascade on user delete (S9)
#   7. Graceful shutdown handler
# ═══════════════════════════════════════════════════════════════

set -e

echo "Δ TALOS Phase 1 Hardening"
echo "========================="
echo ""

# ── Step 0: Install helmet ──
echo "📦 Installing helmet..."
npm install helmet
echo ""

# ── Step 1: Apply server.js changes via node ──
echo "🔧 Patching server.js..."

node -e "
const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
let changes = 0;

// ── CHANGE 1: Add helmet import ──
const importFind = 'import { Resend } from \"resend\";';
const importReplace = 'import { Resend } from \"resend\";\nimport helmet from \"helmet\";';
if (code.includes(importFind) && !code.includes('import helmet')) {
  code = code.replace(importFind, importReplace);
  changes++;
  console.log('  ✅ 1/9 Added helmet import');
} else {
  console.log('  ⏭  1/9 Helmet import (already present or import not found)');
}

// ── CHANGE 2: Lock down CORS + add Helmet middleware ──
const mwFind = \`// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: \"5mb\" }));
if (process.env.NODE_ENV === \"production\") {
  app.use(express.static(join(__dirname, \"dist\")));
}\`;

const mwReplace = \`// --- Middleware ---
// S1 fix: Restrict CORS to actual app origin (was wide open)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || \"https://talos.fit\")
  .split(\",\").map(s => s.trim());
app.use(cors({
  origin: process.env.NODE_ENV === \"production\"
    ? (origin, cb) => {
        // Allow requests with no origin (mobile apps, curl, same-origin)
        if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error(\"Not allowed by CORS\"));
      }
    : true, // Allow all origins in development
  credentials: true,
}));

// S5 fix: Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: false, // CSP breaks inline styles (React SPA)
  crossOriginEmbedderPolicy: false, // Breaks some CDN resources
}));

app.use(express.json({ limit: \"5mb\" }));
if (process.env.NODE_ENV === \"production\") {
  app.use(express.static(join(__dirname, \"dist\")));
}\`;

if (code.includes('app.use(cors());')) {
  code = code.replace(mwFind, mwReplace);
  changes++;
  console.log('  ✅ 2/9 CORS lockdown + Helmet middleware');
} else {
  console.log('  ⏭  2/9 CORS/Helmet (already patched or text mismatch)');
}

// ── CHANGE 3: Add AI rate limiting infrastructure ──
const aiProvFind = '// --- AI Provider ---\nfunction loadAIConfig() {';
const aiProvReplace = \`// --- Per-User AI Rate Limiting (S2 fix) ---
const AI_DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT) || 50;
const AI_MONTHLY_LIMIT = parseInt(process.env.AI_MONTHLY_LIMIT) || 500;

function checkAIRateLimit(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + \"-01\";

  const dailyCount = db.prepare(
    \"SELECT COUNT(*) as c FROM analytics_events WHERE user_id = ? AND event LIKE 'coach_%' AND date(created_at) = date(?)\"
  ).get(userId, today).c;

  if (dailyCount >= AI_DAILY_LIMIT) {
    return { allowed: false, error: \\\`Daily AI limit reached (\\\${AI_DAILY_LIMIT}/day). Resets at midnight UTC.\\\`, remaining: 0 };
  }

  const monthlyCount = db.prepare(
    \"SELECT COUNT(*) as c FROM analytics_events WHERE user_id = ? AND event LIKE 'coach_%' AND date(created_at) >= date(?)\"
  ).get(userId, monthStart).c;

  if (monthlyCount >= AI_MONTHLY_LIMIT) {
    return { allowed: false, error: \\\`Monthly AI limit reached (\\\${AI_MONTHLY_LIMIT}/month). Resets on the 1st.\\\`, remaining: 0 };
  }

  return { allowed: true, remaining: Math.min(AI_DAILY_LIMIT - dailyCount, AI_MONTHLY_LIMIT - monthlyCount) };
}

function requireAIQuota(req, res, next) {
  const check = checkAIRateLimit(req.user.id);
  if (!check.allowed) {
    return res.status(429).json({ error: check.error });
  }
  req.aiRemaining = check.remaining;
  next();
}

// --- AI Provider ---
function loadAIConfig() {\`;

if (!code.includes('checkAIRateLimit')) {
  code = code.replace(aiProvFind, aiProvReplace);
  changes++;
  console.log('  ✅ 3/9 AI rate limiting infrastructure');
} else {
  console.log('  ⏭  3/9 AI rate limiting (already present)');
}

// ── CHANGE 4: Add requireAIQuota to all AI coach endpoints ──
const aiRoutes = [
  'app.post(\"/api/coach\", requireAuth, async',
  'app.post(\"/api/coach/program\", requireAuth, async',
  'app.post(\"/api/coach/analyze\", requireAuth, async',
  'app.post(\"/api/coach/substitute\", requireAuth, async',
  'app.post(\"/api/coach/weekly\", requireAuth, async',
  'app.post(\"/api/coach/analysis\", requireAuth, async',
];

let aiRoutesPatched = 0;
for (const route of aiRoutes) {
  if (code.includes(route) && !code.includes(route.replace('requireAuth, async', 'requireAuth, requireAIQuota, async'))) {
    code = code.replace(route, route.replace('requireAuth, async', 'requireAuth, requireAIQuota, async'));
    aiRoutesPatched++;
  }
}
if (aiRoutesPatched > 0) {
  changes++;
  console.log(\`  ✅ 4/9 Added requireAIQuota to \${aiRoutesPatched} AI routes\`);
} else {
  console.log('  ⏭  4/9 AI route middleware (already patched)');
}

// ── CHANGE 4b: Add /api/ai/quota endpoint ──
const quotaEndpoint = \`// AI usage quota check
app.get(\"/api/ai/quota\", requireAuth, (req, res) => {
  const check = checkAIRateLimit(req.user.id);
  res.json({ remaining: check.remaining, dailyLimit: AI_DAILY_LIMIT, monthlyLimit: AI_MONTHLY_LIMIT });
});\`;

if (!code.includes('/api/ai/quota')) {
  // Insert after the PUT /api/ai/config route's closing });
  const aiConfigEnd = 'res.json({ ok: true, enabled: !!aiProvider, providerName: aiProvider?.providerName || \"\" });\n});';
  if (code.includes(aiConfigEnd)) {
    code = code.replace(aiConfigEnd, aiConfigEnd + '\n\n' + quotaEndpoint);
    changes++;
    console.log('  ✅ 4b/9 Added /api/ai/quota endpoint');
  } else {
    console.log('  ⚠️  4b/9 Could not find insertion point for quota endpoint — add manually');
  }
} else {
  console.log('  ⏭  4b/9 Quota endpoint (already present)');
}

// ── CHANGE 5: Fix custom exercise delete authorization ──
const exDelFind = \`app.delete(\"/api/exercises/:id\", requireAuth, (req, res) => {
  db.prepare(\"DELETE FROM custom_exercises WHERE id = ?\").run(req.params.id);
  res.json({ ok: true });
});\`;

const exDelReplace = \`app.delete(\"/api/exercises/:id\", requireAuth, (req, res) => {
  // S8 fix: Only the creator or an admin can delete custom exercises
  const exercise = db.prepare(\"SELECT id, created_by FROM custom_exercises WHERE id = ?\").get(req.params.id);
  if (!exercise) return res.status(404).json({ error: \"Exercise not found\" });
  if (exercise.created_by !== req.user.id && req.user.role !== \"admin\") {
    return res.status(403).json({ error: \"You can only delete exercises you created\" });
  }
  db.prepare(\"DELETE FROM custom_exercises WHERE id = ?\").run(req.params.id);
  res.json({ ok: true });
});\`;

if (code.includes(exDelFind)) {
  code = code.replace(exDelFind, exDelReplace);
  changes++;
  console.log('  ✅ 5/9 Custom exercise delete authorization');
} else {
  console.log('  ⏭  5/9 Exercise delete auth (already patched or text mismatch)');
}

// ── CHANGE 6: Add database indexes ──
const idxFind = 'try { db.exec(\"CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)\"); } catch (e) { /* already exists */ }';
const idxReplace = \`try { db.exec(\"CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)\"); } catch (e) { /* already exists */ }

// Performance indexes (Phase 1 hardening audit)
try { db.exec(\"CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date)\"); } catch (e) { /* exists */ }
try { db.exec(\"CREATE INDEX IF NOT EXISTS idx_coach_messages_user ON coach_messages(user_id)\"); } catch (e) { /* exists */ }
try { db.exec(\"CREATE INDEX IF NOT EXISTS idx_workout_reviews_user ON workout_reviews(user_id)\"); } catch (e) { /* exists */ }
try { db.exec(\"CREATE INDEX IF NOT EXISTS idx_programs_user ON programs(user_id)\"); } catch (e) { /* exists */ }
try { db.exec(\"CREATE INDEX IF NOT EXISTS idx_bio_history_user ON bio_history(user_id)\"); } catch (e) { /* exists */ }\`;

if (!code.includes('idx_workouts_user_date')) {
  code = code.replace(idxFind, idxReplace);
  changes++;
  console.log('  ✅ 6/9 Database performance indexes');
} else {
  console.log('  ⏭  6/9 Indexes (already present)');
}

// ── CHANGE 7: Fix analytics cascade on user delete ──
const cascadeFind = \`db.prepare(\"DELETE FROM coach_messages WHERE user_id = ?\").run(id);
  db.prepare(\"DELETE FROM users WHERE id = ?\").run(id);\`;
const cascadeReplace = \`db.prepare(\"DELETE FROM coach_messages WHERE user_id = ?\").run(id);
  db.prepare(\"DELETE FROM analytics_events WHERE user_id = ?\").run(id);
  db.prepare(\"DELETE FROM users WHERE id = ?\").run(id);\`;

if (!code.includes('DELETE FROM analytics_events WHERE user_id')) {
  code = code.replace(cascadeFind, cascadeReplace);
  changes++;
  console.log('  ✅ 7/9 Analytics cascade on user delete');
} else {
  console.log('  ⏭  7/9 Analytics cascade (already present)');
}

// ── CHANGE 8: Add graceful shutdown ──
const shutdownCode = \`
// --- Graceful Shutdown ---
function shutdown(signal) {
  console.log(\\\`\\\\n⏹  \\\${signal} received — shutting down gracefully...\\\`);
  try { db.close(); } catch (e) { /* already closed */ }
  process.exit(0);
}
process.on(\"SIGTERM\", () => shutdown(\"SIGTERM\"));
process.on(\"SIGINT\", () => shutdown(\"SIGINT\"));
\`;

if (!code.includes('Graceful Shutdown')) {
  code = code.trimEnd() + '\n' + shutdownCode;
  changes++;
  console.log('  ✅ 8/9 Graceful shutdown handler');
} else {
  console.log('  ⏭  8/9 Graceful shutdown (already present)');
}

// ── Write result ──
fs.writeFileSync('server.js', code);
console.log(\`\n  ── \${changes} changes applied to server.js ──\`);
"

echo ""

# ── Step 2: Update .env.example ──
echo "📝 Updating .env.example..."
if ! grep -q "AI_DAILY_LIMIT" .env.example 2>/dev/null; then
  cat >> .env.example << 'ENVEOF'

# ─── Security ───
# Comma-separated list of allowed CORS origins (default: APP_URL or https://talos.fit)
# In dev, CORS is wide open regardless of this setting.
# ALLOWED_ORIGINS=https://talos.fit,http://localhost:5173

# ─── AI Rate Limits ───
# Per-user daily/monthly caps on AI coach requests (prevents cost runaway)
# AI_DAILY_LIMIT=50
# AI_MONTHLY_LIMIT=500
ENVEOF
  echo "  ✅ Added new env vars to .env.example"
else
  echo "  ⏭  .env.example already updated"
fi

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Phase 1 Hardening Complete"
echo ""
echo "  Changes applied:"
echo "    • CORS restricted to production origin (S1)"
echo "    • Helmet.js security headers added (S5)"
echo "    • Per-user AI rate limiting: ${AI_DAILY_LIMIT:-50}/day, ${AI_MONTHLY_LIMIT:-500}/month (S2)"
echo "    • Custom exercise delete requires ownership (S8)"
echo "    • 5 performance indexes added"
echo "    • Analytics cascade on user delete (S9)"
echo "    • Graceful shutdown handler"
echo ""
echo "  New dependency: helmet"
echo "  New env vars (optional): ALLOWED_ORIGINS, AI_DAILY_LIMIT, AI_MONTHLY_LIMIT"
echo ""
echo "  Next steps:"
echo "    1. Test locally: npm run dev"
echo "    2. Commit: git add -A && git commit -m 'Phase 1 hardening: CORS, Helmet, AI limits, indexes'"
echo "    3. Deploy: git push (Railway auto-deploys)"
echo "    4. Verify: curl https://talos.fit/api/health"
echo "═══════════════════════════════════════════════"
