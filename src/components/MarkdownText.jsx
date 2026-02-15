// ═══════════════════════ MARKDOWN RENDERER ═══════════════════════
// Extracted from App.jsx — MarkdownText function

export default function MarkdownText({ text }) {
  const html = (text || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/^### (.+)$/gm, '<h4 class="md-h4">$1</h4>')
  .replace(/^## (.+)$/gm, '<h3 class="md-h3">$1</h3>')
  .replace(/^# (.+)$/gm, '<h2 class="md-h2">$1</h2>')
  .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
  .replace(/^---+$/gm, '<hr class="md-hr" />')
  .replace(/^[\-\*] (.+)$/gm, '<li class="md-li">$1</li>')
  .replace(/^\d+\.\s+(.+)$/gm, '<li class="md-li md-oli">$1</li>')
  .replace(/((?:<li class="md-li">.*<\/li>\n?)+)/g, '<ul class="md-ul">$1</ul>')
  .replace(/<ul class="md-ul">((?:<li class="md-li md-oli">.*<\/li>\n?)+)<\/ul>/g, '<ol class="md-ol">$1</ol>')
  .replace(/\n\n/g, '<div class="md-break"></div>')
  .replace(/\n/g, '<br />');

  return <div className="md-response" dangerouslySetInnerHTML={{ __html: html }} />;
}
