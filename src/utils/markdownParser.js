import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * 간단한 Markdown 파서
 * 지원: heading (# ## ###), bold (**text**), italic (*text*), underline (__text__), strikeline (~~text~~)
 * LaTeX: 인라인 $...$, 블록 $$...$$
 * XSS 방지를 위해 DOMPurify로 sanitize
 */
export function parseMarkdown(text) {
  if (!text) return '';
  
  let html = text.trim();
  
  // LaTeX 블록 수식: $$...$$ (먼저 처리해야 함)
  html = html.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: true, throwOnError: false });
    } catch (e) {
      return match; // 파싱 실패 시 원본 반환
    }
  });
  
  // LaTeX 인라인 수식: $...$ (블록 수식 이후 처리)
  html = html.replace(/\$([^$\n]+)\$/g, (match, formula) => {
    try {
      return katex.renderToString(formula.trim(), { displayMode: false, throwOnError: false });
    } catch (e) {
      return match; // 파싱 실패 시 원본 반환
    }
  });
  
  // Strikeline: ~~text~~
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  
  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic: *text* (bold이 아닌 경우만)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Underline: __text__
  html = html.replace(/__([^_]+)__/g, '<u>$1</u>');
  
  // Headings: # ## ###
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // 줄바꿈 처리
  html = html.replace(/\n/g, '<br>');

  html = html.replace(/<\/h([1-3])>\s*<br>/g, '</h$1>');
  
  // XSS 방지: DOMPurify 기본 HTML + MathML 프로필 사용
  // KaTeX가 생성하는 MathML 구조를 그대로 살리기 위해 ALLOWED_TAGS를 직접 제한하지 않고,
  // USE_PROFILES로 html + mathml만 활성화
  return DOMPurify.sanitize(html, {
    USE_PROFILES: {
      html: true,
      mathml: true,
    },
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
