import React, { useState, useEffect, useRef } from 'react';
import { MdEditor, config } from 'md-editor-rt';
// import 'md-editor-rt/lib/style.css';
import "@/styles/style.css";
import KO_KR from '@vavt/cm-extension/dist/locale/ko-KR';

/**
 * 메모용 마크다운 에디터. 이미지/테이블/풀스크린 등은 비활성화.
 * toolbars: 표시할 툴바만 지정 (bold, italic, underline, quote, code, link, 목록, revoke/next)
 */
const ALLOWED_TOOLBARS = [
  'bold',
  'underline',
  'italic',
  'strikeThrough',
  'title',
  'quote',
  'unorderedList',
  'orderedList',
  'codeRow',
  'code',
  'link',
  'revoke',
  'next',
  '-', // 구분선
];
config({
  editorConfig: {
    languageUserDefined: {
      'ko-KR': KO_KR
    }
  }
});

function usePrefersColorScheme() {
  const [prefersDark, setPrefersDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handle = (e) => setPrefersDark(e.matches);
    mq.addEventListener('change', handle);
    return () => mq.removeEventListener('change', handle);
  }, []);
  return prefersDark ? 'dark' : 'light';
}

function MemoEditor({ value, onChange, onBlur, theme, editorId, className = '', placeholder = '메모' }) {
  const systemTheme = usePrefersColorScheme();
  const resolvedTheme = theme ?? systemTheme;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const focusEditor = () => {
      const el = containerRef.current?.querySelector('.cm-content[contenteditable="true"]') ?? containerRef.current?.querySelector('.cm-editor');
      if (el) {
        el.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    };
    const t = setTimeout(focusEditor, 0);
    const t2 = setTimeout(focusEditor, 50);
    return () => {
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, [editorId]);

  return (
    <div ref={containerRef} className={className}>
      <MdEditor
        id={editorId}
        modelValue={value}
        onChange={onChange}
        onBlur={onBlur}
        theme={resolvedTheme}
        toolbars={ALLOWED_TOOLBARS}
        noUploadImg
        preview={false}
        placeholder={placeholder}
        language="ko-KR"
      />
    </div>
  );
}

export default MemoEditor;
