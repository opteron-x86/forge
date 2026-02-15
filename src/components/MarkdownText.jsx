// ═══════════════════════ MARKDOWN TEXT ═══════════════════════
// Extracted from App.jsx — MarkdownText function
//
// Simple markdown renderer for AI coach responses.
// Handles: **bold**, headers (#, ##), bullet points (-),
// numbered lists, code blocks, line breaks.
//
// MIGRATION NOTE: Copy the MarkdownText function verbatim from App.jsx.
// It's a pure presentational component with no dependencies on context
// or global state — just receives a `text` prop and renders styled HTML.

export default function MarkdownText({ text }) {
  if (!text) return null;

  // MIGRATION NOTE: Copy the parsing logic from App.jsx MarkdownText.
  // It splits text by newlines and renders each line with appropriate
  // styling based on markdown syntax detection.
  //
  // The original handles:
  // - Lines starting with # or ## → styled as headers
  // - Lines starting with - or * → styled as bullet points
  // - Lines starting with 1. 2. etc → numbered items
  // - **text** → bold spans
  // - `code` → monospace spans
  // - Empty lines → spacing

  const lines = text.split("\n");

  return (
    <div style={{ fontSize: 12, color: "#d4d4d4", lineHeight: 1.6 }}>
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith("## ")) {
          return (
            <div key={i} style={{ fontWeight: 700, color: "#fafafa", marginTop: 12, marginBottom: 4, fontSize: 13 }}>
              {line.replace("## ", "")}
            </div>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <div key={i} style={{ fontWeight: 700, color: "#c9952d", marginTop: 12, marginBottom: 4, fontSize: 14 }}>
              {line.replace("# ", "")}
            </div>
          );
        }

        // Bullets
        if (line.match(/^[-*] /)) {
          return (
            <div key={i} style={{ paddingLeft: 12, marginTop: 2 }}>
              • {formatInline(line.replace(/^[-*] /, ""))}
            </div>
          );
        }

        // Numbered
        if (line.match(/^\d+\. /)) {
          return (
            <div key={i} style={{ paddingLeft: 12, marginTop: 2 }}>
              {formatInline(line)}
            </div>
          );
        }

        // Empty line
        if (!line.trim()) {
          return <div key={i} style={{ height: 8 }} />;
        }

        // Regular text
        return (
          <div key={i} style={{ marginTop: 2 }}>
            {formatInline(line)}
          </div>
        );
      })}
    </div>
  );
}

// Inline formatting: **bold** and `code`
function formatInline(text) {
  // MIGRATION NOTE: If the original App.jsx has inline formatting logic
  // (bold, code, etc.), copy it here. Otherwise this simple version works.
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <span key={i} style={{ fontWeight: 700, color: "#fafafa" }}>
          {part.slice(2, -2)}
        </span>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <span
          key={i}
          style={{
            background: "#262626",
            padding: "1px 4px",
            borderRadius: 3,
            fontFamily: "Courier New, monospace",
            fontSize: 11,
          }}
        >
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}
