// ═══════════════════════════════════════════════════════════════
// TALOS AI Provider — OpenRouter Gateway
//
// All AI calls route through OpenRouter's OpenAI-compatible API.
// Models are specified per-call as OpenRouter model IDs
// (e.g. "google/gemini-2.5-flash", "anthropic/claude-sonnet-4").
//
// This replaces the multi-provider abstraction with a single
// gateway, dramatically simplifying the AI layer.
// ═══════════════════════════════════════════════════════════════

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ─── OpenRouter Provider ────────────────────────────────────

export class OpenRouterProvider {
  constructor(apiKey, defaultModel = "google/gemini-2.5-flash") {
    if (!apiKey) throw new Error("OpenRouter API key required");
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  get providerName() { return "openrouter"; }

  /**
   * Make an OpenAI-compatible chat completion request via OpenRouter.
   * @param {object} body - Request body (model, messages, etc.)
   * @returns {object} OpenAI-format response
   */
  async _call(body) {
    const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://talos.fit",
        "X-Title": "TALOS",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "Unknown error");
      throw new Error(`OpenRouter API error (${res.status}): ${err}`);
    }

    return res.json();
  }

  /**
   * Simple chat completion.
   * @param {string} system - System prompt
   * @param {Array} messages - Chat messages [{role, content}]
   * @param {object} options - { maxTokens, model }
   */
  async chat(system, messages, options = {}) {
    const model = options.model || this.defaultModel;
    const data = await this._call({
      model,
      max_tokens: options.maxTokens || 1500,
      messages: [{ role: "system", content: system }, ...messages],
    });
    return {
      text: data.choices?.[0]?.message?.content || "",
      model: data.model || model,
    };
  }

  /**
   * Chat completion with tool/function calling.
   * Falls back to JSON-prompt approach if tool use fails.
   * @param {string} system - System prompt
   * @param {Array} messages - Chat messages
   * @param {Array} tools - Tool definitions (Anthropic format, converted internally)
   * @param {object} options - { maxTokens, model }
   */
  async chatWithTools(system, messages, tools, options = {}) {
    const model = options.model || this.defaultModel;

    try {
      const data = await this._call({
        model,
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

      return { text, toolCalls, model: data.model || model };
    } catch (e) {
      // If tool use fails (model doesn't support it), fall back to JSON prompt
      console.warn(`[OpenRouter] Tool use failed for ${model}, falling back to JSON prompt:`, e.message);
      return this._jsonFallback(system, messages, tools, options);
    }
  }

  /**
   * JSON-prompt fallback for models without native tool support.
   */
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

    try {
      const codeBlock = result.text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = codeBlock ? codeBlock[1].trim() : result.text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.tool && parsed.input) {
          return { text: null, toolCalls: [{ name: parsed.tool, input: parsed.input }], model: result.model };
        }
      }
    } catch (e) { /* not valid JSON, treat as text */ }

    return { text: result.text, toolCalls: [], model: result.model };
  }
}

// ─── Popular OpenRouter Models (for admin UI) ───────────────

export const OPENROUTER_MODELS = [
  // Anthropic
  { id: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", tier: "pro" },
  { id: "anthropic/claude-haiku-4", label: "Claude Haiku 4", tier: "mid" },
  // Google
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", tier: "pro" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", tier: "free" },
  { id: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash", tier: "free" },
  // OpenAI
  { id: "openai/gpt-4.1", label: "GPT-4.1", tier: "pro" },
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 Mini", tier: "mid" },
  { id: "openai/gpt-4.1-nano", label: "GPT-4.1 Nano", tier: "free" },
  { id: "openai/o4-mini", label: "o4 Mini", tier: "mid" },
  // Meta
  { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", tier: "mid" },
  { id: "meta-llama/llama-4-scout", label: "Llama 4 Scout", tier: "free" },
  // DeepSeek
  { id: "deepseek/deepseek-chat-v3-0324", label: "DeepSeek V3", tier: "free" },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", tier: "mid" },
  // Mistral
  { id: "mistralai/mistral-medium-3", label: "Mistral Medium 3", tier: "mid" },
  { id: "mistralai/mistral-small-3.1-24b", label: "Mistral Small 3.1", tier: "free" },
];
