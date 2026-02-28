import React, { useState, useEffect } from 'react';
import { MdPreview, config } from 'md-editor-rt';
// import 'md-editor-rt/lib/preview.css';
import "@/styles/preview.css";
import KO_KR from '@vavt/cm-extension/dist/locale/ko-KR';

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

/**
 * 메모 마크다운 미리보기 전용. 클릭 시 부모에서 포커스(에디터)로 전환하도록 onFocus 요청.
 */
function MemoViewer({ value, theme, editorId, className = '', onFocus }) {
  const systemTheme = usePrefersColorScheme();
  const resolvedTheme = theme ?? systemTheme;
  const isEmpty = !value || String(value).trim() === '';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`memo-viewer-wrap ${className}`}
      onClick={onFocus}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onFocus?.();
        }
      }}
      aria-label="메모 보기, 클릭하여 편집"
    >
      {isEmpty ? (
        <span className="text-gray-400 dark:text-gray-500 text-sm py-2 block">메모</span>
      ) : (
        <MdPreview
          id={editorId}
          modelValue={value}
          theme={resolvedTheme}
          language="ko-KR"
        />
      )}
    </div>
  );
}

export default MemoViewer;
