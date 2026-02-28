import React, { useState, useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { MdEditor, config } from 'md-editor-rt';
// import 'md-editor-rt/lib/style.css';
import "@/styles/style.css";
import KO_KR from '@vavt/cm-extension/dist/locale/ko-KR';
import { useGeminiKey } from '../contexts/GeminiKeyContext';
import { generateMemoContent, buildFullPrompt } from '../utils/geminiApi';
import MemoAiPromptTypeModal, { PROMPT_TYPES } from './MemoAiPromptTypeModal';
import DiffConfirmModal from './DiffConfirmModal';
import ConfirmModal from './ConfirmModal';

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

function MemoEditor({ value, onChange, onBlur, theme, editorId, className = '', placeholder = '메모', onAiFlowOpenChange }) {
  const systemTheme = usePrefersColorScheme();
  const resolvedTheme = theme ?? systemTheme;
  const containerRef = useRef(null);
  const { apiKey: geminiApiKey } = useGeminiKey();
  const [promptTypeModalOpen, setPromptTypeModalOpen] = useState(false);
  const [diffModalOpen, setDiffModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState('');
  const [transformDescription, setTransformDescription] = useState('');
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const goToNextMemo = () => {
      const list = document.querySelectorAll('.q-memo-input');
      const current = container.closest('.q-memo-input');
      if (!list.length || !current) return;
      const idx = Array.from(list).indexOf(current);
      const next = list[idx + 1];
      if (!next) return;
      const nextEditor = next.querySelector('.cm-content[contenteditable="true"]') ?? next.querySelector('.cm-editor');
      if (nextEditor) {
        nextEditor.focus();
        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(nextEditor);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        next.firstElementChild?.click();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key !== 'Enter') return;
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      goToNextMemo();
    };

    const targetRef = { current: null };
    const attach = () => {
      const el = container.querySelector('.cm-content[contenteditable="true"]') ?? container.querySelector('.cm-editor');
      if (el) {
        targetRef.current = el;
        el.addEventListener('keydown', handleKeyDown, true);
        return true;
      }
      return false;
    };

    if (!attach()) {
      const t = setTimeout(() => attach(), 100);
      const t2 = setTimeout(() => attach(), 300);
      return () => {
        clearTimeout(t);
        clearTimeout(t2);
        if (targetRef.current) {
          targetRef.current.removeEventListener('keydown', handleKeyDown, true);
          targetRef.current = null;
        }
      };
    }
    return () => {
      if (targetRef.current) {
        targetRef.current.removeEventListener('keydown', handleKeyDown, true);
        targetRef.current = null;
      }
    };
  }, [editorId]);

  useEffect(() => {
    if (!promptTypeModalOpen && !diffModalOpen && !alertOpen) onAiFlowOpenChange?.(false);
  }, [promptTypeModalOpen, diffModalOpen, alertOpen, onAiFlowOpenChange]);

  const handleBlur = (e) => {
    if (containerRef.current && e?.relatedTarget && containerRef.current.contains(e.relatedTarget)) return;
    onBlur?.();
  };

  const handleAiClick = () => {
    onAiFlowOpenChange?.(true);
    if (!(geminiApiKey || '').trim()) {
      setAlertMessage('Gemini API 키가 없습니다. 설정에서 API 키를 입력해 주세요. (Google AI Studio: https://aistudio.google.com/)');
      setAlertOpen(true);
      return;
    }
    setPromptTypeModalOpen(true);
  };

  const getTransformDescription = (payload) => {
    const { promptType, customPrompt } = payload;
    return promptType === 'custom'
      ? (customPrompt?.trim() ? `커스텀: ${customPrompt.trim().slice(0, 50)}${customPrompt.trim().length > 50 ? '…' : ''}` : '커스텀 프롬프트')
      : PROMPT_TYPES.find((p) => p.id === promptType)?.label ?? promptType;
  };

  const handlePromptTypeSelect = (payload) => {
    const { promptType, customPrompt } = typeof payload === 'string' ? { promptType: payload, customPrompt: undefined } : payload;
    const fullPrompt = buildFullPrompt(promptType, customPrompt, value ?? '');
    if (!fullPrompt.trim()) {
      setAlertMessage('변환할 내용 또는 지시문을 입력하세요.');
      setAlertOpen(true);
      return;
    }

    setLoading(true);
    setTransformDescription(getTransformDescription({ promptType, customPrompt }));

    generateMemoContent(geminiApiKey, promptType, value ?? '', customPrompt)
      .then((text) => {
        setResultText(text);
        setPromptTypeModalOpen(false);
        setDiffModalOpen(true);
      })
      .catch((err) => {
        setLoading(false);
        setAlertMessage(err?.message || 'AI 요청에 실패했습니다.');
        setAlertOpen(true);
      })
      .finally(() => setLoading(false));
  };

  const handleDiffConfirm = () => {
    onChange?.(resultText);
    setResultText('');
  };

  const handleDiffClose = () => {
    setResultText('');
    setTransformDescription('');
    setDiffModalOpen(false);
  };

  return (
    <div ref={containerRef} className={className}>
      <div className="memo-editor-toolbar-top flex items-center justify-end gap-1 pb-1 mb-1 border-b border-gray-100 dark:border-gray-700 [&+.md-editor]:min-h-0">
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onAiFlowOpenChange?.(true);
          }}
          onClick={handleAiClick}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
          title="메모 내용을 AI로 변환 (설정에서 API 키 입력 필요)"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI
        </button>
      </div>
      <MdEditor
        id={editorId}
        modelValue={value}
        onChange={onChange}
        onBlur={handleBlur}
        theme={resolvedTheme}
        toolbars={ALLOWED_TOOLBARS}
        noUploadImg
        preview={false}
        placeholder={placeholder}
        language="ko-KR"
      />

      <MemoAiPromptTypeModal
        isOpen={promptTypeModalOpen}
        onClose={() => !loading && setPromptTypeModalOpen(false)}
        onSelect={handlePromptTypeSelect}
        loading={loading}
      />

      <DiffConfirmModal
        isOpen={diffModalOpen}
        onClose={handleDiffClose}
        onConfirm={handleDiffConfirm}
        oldText={value ?? ''}
        newText={resultText}
        title="메모 내용 적용"
        transformDescription={transformDescription}
        confirmText="적용"
        cancelText="취소"
      />

      <ConfirmModal
        variant="alert"
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        title="알림"
        message={alertMessage}
        confirmText="확인"
      />
    </div>
  );
}

export default MemoEditor;
