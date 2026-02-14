// ═══════════════════════════════════════════════════════════════
// FORGE AI Provider Abstraction
// Supports: Anthropic, OpenAI, Gemini, OpenAI-compatible (Ollama, LM Studio, etc.)
// ═══════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";

// ─── Base Provider ───────────────────────────────────────────

class AIProvider {
  constructor(config) {
    this.config = config;
  }

  get providerName() { return "base"; }
  get modelName() { return this.config.model; }

  async chat(system, messages, options = {}) {
    throw new Error("chat() not implemented");
  }

  async chatWithTools(system, messages, tools, options = {}) {
    // Default: JSON-prompt fallback for providers without native tool use
    return this._jsonFallback(system, messages, tools, options);
  }

  async _jsonFallback(system, messages, tools, options) {
    const toolDesc = tools.map(t =>
      `Tool: ${t.name}\nDescription: ${t.description}\nParameters: ${JSON.stringify(t.input_schema, null, 2)}`
    ).join("\n\n");

    const augmented = `${system}

When you need to use a tool, respond with ONLY a JSON code block in this exact format (no other text):
\`\`\`json
{"tool": "tool_name", "input": {<parameters matching the schema>}}
\`\`\`

Available tools:
${toolDesc}`;

    const result = await this.chat(augmented, messages, options);

    // Try to extract tool call from response
    try {
      // Match ```json ... ``` or bare JSON
      const codeBlock = result.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = codeBlock ? codeBlock[1].trim() : result.text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool && parsed.input) {
          return { text: null, toolCalls: [{ name: parsed.tool, input: parsed.input }] };
        }
      }
    } catch (e) { /* not valid JSON, treat as text */ }

    return { text: result.text, toolCalls: [] };
  }
}

// ─── Anthropic Provider ──────────────────────────────────────

class AnthropicProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.client = new Anthropic({ apiKey: config.apiKey });
  }

  get providerName() { return "anthropic"; }

  async chat(system, messages, options = {}) {
    const msg = await this.client.messages.create({
      model: this.config.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 1500,
      system,
      messages,
    });
    return { text: msg.content.map(b => b.type === "text" ? b.text : "").join("\n") };
  }

  async chatWithTools(system, messages, tools, options = {}) {
    const msg = await this.client.messages.create({
      model: this.config.model || "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens || 4000,
      system,
      messages,
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
    });

    const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("\n") || null;
    const toolCalls = msg.content.filter(b => b.type === "tool_use").map(b => ({
      name: b.name,
      input: b.input,
    }));

    return { text, toolCalls };
  }
}

// ─── OpenAI-Compatible Provider ──────────────────────────────
// Works with: OpenAI, Ollama, LM Studio, vLLM, Together, Groq, Fireworks, etc.

class OpenAICompatibleProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.baseUrl = (config.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.supportsTools = config.supportsTools !== false; // assume yes unless explicitly disabled
  }

  get providerName() { return "openai-compatible"; }

  async _call(body) {
    const headers = { "Content-Type": "application/json" };
    if (this.apiKey) headers["Authorization"] = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`OpenAI-compatible API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  async chat(system, messages, options = {}) {
    const data = await this._call({
      model: this.config.model || "gpt-4o",
      max_tokens: options.maxTokens || 1500,
      messages: [{ role: "system", content: system }, ...messages],
    });
    return { text: data.choices?.[0]?.message?.content || "" };
  }

  async chatWithTools(system, messages, tools, options = {}) {
    if (!this.supportsTools) {
      return this._jsonFallback(system, messages, tools, options);
    }

    try {
      const data = await this._call({
        model: this.config.model || "gpt-4o",
        max_tokens: options.maxTokens || 4000,
        messages: [{ role: "system", content: system }, ...messages],
        tools: tools.map(t => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema,
          },
        })),
      });

      const msg = data.choices?.[0]?.message;
      const text = msg?.content || null;
      const toolCalls = (msg?.tool_calls || []).map(tc => ({
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments),
      }));

      return { text, toolCalls };
    } catch (e) {
      // If tool use fails (unsupported model), fall back to JSON prompt
      console.warn("Tool use failed, falling back to JSON prompt:", e.message);
      this.supportsTools = false;
      return this._jsonFallback(system, messages, tools, options);
    }
  }
}

// ─── Gemini Provider ─────────────────────────────────────────

class GeminiProvider extends AIProvider {
  constructor(config) {
    super(config);
    this.apiKey = config.apiKey;
  }

  get providerName() { return "gemini"; }

  async _call(body, toolDeclarations = null) {
    const model = this.config.model || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const payload = { ...body };
    if (toolDeclarations) {
      payload.tools = [{ functionDeclarations: toolDeclarations }];
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`Gemini API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  _buildBody(system, messages, options = {}) {
    return {
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { maxOutputTokens: options.maxTokens || 1500 },
    };
  }

  async chat(system, messages, options = {}) {
    const data = await this._call(this._buildBody(system, messages, options));
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    return { text };
  }

  async chatWithTools(system, messages, tools, options = {}) {
    const toolDeclarations = tools.map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    }));

    const data = await this._call(
      this._buildBody(system, messages, options),
      toolDeclarations
    );

    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(p => p.text).map(p => p.text).join("") || null;
    const toolCalls = parts.filter(p => p.functionCall).map(p => ({
      name: p.functionCall.name,
      input: p.functionCall.args,
    }));

    return { text, toolCalls };
  }
}

// ─── Factory ─────────────────────────────────────────────────

export function createProvider(config) {
  if (!config || (!config.apiKey && config.provider !== "openai-compatible")) {
    return null;
  }

  switch (config.provider) {
    case "anthropic":
      return new AnthropicProvider(config);
    case "openai":
      return new OpenAICompatibleProvider({ ...config, baseUrl: "https://api.openai.com/v1" });
    case "gemini":
      return new GeminiProvider(config);
    case "openai-compatible":
      if (!config.baseUrl) throw new Error("baseUrl required for openai-compatible provider");
      return new OpenAICompatibleProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}

// ─── Config Resolution ───────────────────────────────────────
// Resolves AI config from: DB settings → .env → legacy ANTHROPIC_API_KEY

export function resolveConfig(dbSettings, env) {
  // DB settings take priority
  if (dbSettings?.provider) {
    return {
      provider: dbSettings.provider,
      model: dbSettings.model || defaultModelFor(dbSettings.provider),
      apiKey: dbSettings.apiKey || "",
      baseUrl: dbSettings.baseUrl || "",
      supportsTools: dbSettings.supportsTools !== "false",
    };
  }

  // .env AI_PROVIDER config
  if (env.AI_PROVIDER) {
    return {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL || defaultModelFor(env.AI_PROVIDER),
      apiKey: env.AI_API_KEY || "",
      baseUrl: env.AI_BASE_URL || "",
      supportsTools: env.AI_SUPPORTS_TOOLS !== "false",
    };
  }

  // Legacy fallback: ANTHROPIC_API_KEY
  if (env.ANTHROPIC_API_KEY) {
    return {
      provider: "anthropic",
      model: env.AI_MODEL || "claude-sonnet-4-20250514",
      apiKey: env.ANTHROPIC_API_KEY,
      baseUrl: "",
    };
  }

  return null;
}

export function defaultModelFor(provider) {
  switch (provider) {
    case "anthropic": return "claude-sonnet-4-20250514";
    case "openai": return "gpt-4o";
    case "gemini": return "gemini-2.0-flash";
    case "openai-compatible": return "default";
    default: return "";
  }
}

// ─── Provider Info ───────────────────────────────────────────

export const PROVIDERS = [
  { id: "anthropic", name: "Anthropic (Claude)", models: ["claude-sonnet-4-20250514", "claude-haiku-4-5-20251001"] },
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4.1", "gpt-4.1-mini", "o4-mini"] },
  { id: "gemini", name: "Google Gemini", models: ["gemini-2.0-flash", "gemini-2.5-pro", "gemini-2.5-flash"] },
  { id: "openai-compatible", name: "OpenAI-Compatible (Ollama, LM Studio, etc.)", models: [] },
];
