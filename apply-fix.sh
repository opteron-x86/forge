#!/bin/bash
# Fix stale date bug in TrainPage.jsx
# Run from repo root: bash apply-fix.sh

FILE="src/pages/TrainPage.jsx"

if [ ! -f "$FILE" ]; then
  echo "Error: $FILE not found. Run this from the repo root."
  exit 1
fi

cp "$FILE" "$FILE.bak"
echo "Backup saved to $FILE.bak"

# 1. Add useEffect to the import
sed -i 's/import { useState, useMemo } from "react";/import { useState, useMemo, useEffect } from "react";/' "$FILE"

# 2. Fix daysAgoText function - replace the T12:00:00 math
sed -i '/^function daysAgoText/,/^}/ {
  s|const d = Math.floor((new Date() - new Date(dateStr + "T12:00:00")) / 86400000);|const now = new Date();\n  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());\n  const thatMidnight = new Date(dateStr + "T00:00:00");\n  const d = Math.round((todayMidnight - thatMidnight) / 86400000);|
}' "$FILE"

# 3. Add day-change detection hook after showLastSession state
sed -i '/const \[showLastSession, setShowLastSession\] = useState(false);/a\
\
  // ── Day-change detection ──\
  const [today, setToday] = useState(() => new Date().toISOString().split("T")[0]);\
\
  useEffect(() => {\
    const check = () => {\
      const now = new Date().toISOString().split("T")[0];\
      if (now !== today) setToday(now);\
    };\
    const onVisible = () => {\
      if (document.visibilityState === "visible") check();\
    };\
    document.addEventListener("visibilitychange", onVisible);\
    const interval = setInterval(check, 60000);\
    return () => {\
      document.removeEventListener("visibilitychange", onVisible);\
      clearInterval(interval);\
    };\
  }, [today]);' "$FILE"

# 4. Fix stats useMemo - replace "today" inline date with todayMidnight
#    Replace: const today = new Date().toISOString().split("T")[0];
#    With:    const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
sed -i 's|const today = new Date().toISOString().split("T")\[0\];|const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);|' "$FILE"

# 5. Fix streak calculation anchors
sed -i 's|new Date(dates\[i\] + "T12:00:00")|new Date(dates[i] + "T00:00:00")|g' "$FILE"
sed -i 's|new Date(dates\[i + 1\] + "T12:00:00")|new Date(dates[i + 1] + "T00:00:00")|g' "$FILE"
sed -i 's|new Date(today + "T12:00:00")|todayMidnight|' "$FILE"

# 6. Fix "this week" filter
sed -i 's|new Date(w\.date + "T12:00:00")|new Date(w.date + "T00:00:00")|g' "$FILE"

# 7. Fix daysSince calculation
sed -i 's|Math\.floor((new Date() - new Date(lastDate + "T12:00:00")) / 86400000)|Math.round((todayMidnight - new Date(lastDate + "T00:00:00")) / 86400000)|' "$FILE"

# 8. Add today to useMemo dependency array
sed -i 's|}, \[workouts\]);|}, [workouts, today]);|' "$FILE"

echo ""
echo "Fixes applied. Changes:"
echo "  1. Added useEffect import"
echo "  2. Fixed daysAgoText() midnight comparison"
echo "  3. Added day-change detection (visibilitychange + interval)"
echo "  4. Fixed stats useMemo date anchors (T12 -> midnight)"
echo "  5. Added 'today' to useMemo deps"
echo ""
echo "Review with: git diff $FILE"
echo "Revert with: mv $FILE.bak $FILE"
