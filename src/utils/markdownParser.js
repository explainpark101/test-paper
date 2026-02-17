import DOMPurify from 'dompurify';

/**
 * 간단한 Markdown 파서
 * 지원: heading (# ## ###), bold (**text**), italic (*text*), underline (__text__), strikeline (~~text~~)
 * XSS 방지를 위해 DOMPurify로 sanitize
 */
export function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text;
  
  // Strikeline: ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* (bold이 아닌 경우만)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Underline: __text__
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
  
  // Headings: # ## ###
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 줄바꿈 처리
  html = html.replace(/\n/g, '<br>');

  html = html.replace(/<\/h([1-3])>\s*<br>/g, '</h$1>');
  
  // XSS 방지: 허용된 태그만 유지하고 나머지는 이스케이프
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'strong', 'b', 'em', 'u', 'del', 'br'],
    ALLOWED_ATTR: []
  });
}

/**
 * HTML을 텍스트로 변환 (contenteditable에서 사용)
 */
export function htmlToText(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
