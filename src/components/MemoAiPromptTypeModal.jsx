import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const PROMPT_TYPES = [
  { id: 'bullet', label: '외우기 좋은 형태 (단조체 · bullet)', description: 'bullet point 형태로 변환' },
  { id: 'narrative', label: '부연설명 (서술체)', description: '더 자세한 내용을 서술체로 작성' }
];

function MemoAiPromptTypeModal({ isOpen, onClose, onSelect, loading = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [selected, setSelected] = useState('bullet');

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setSelected('bullet');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (shouldRender) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [shouldRender]);

  if (!shouldRender) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  const handleRun = () => {
    onSelect?.(selected);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`absolute inset-0 bg-black/50 dark:bg-black/70 transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${
          isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
        }`}
      >
        <button
          onClick={() => !loading && onClose()}
          disabled={loading}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 pr-8 mb-4">
          AI 변환 유형 선택
        </h3>

        <div className="space-y-2 mb-6">
          {PROMPT_TYPES.map((t) => (
            <label
              key={t.id}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selected === t.id
                  ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                name="promptType"
                value={t.id}
                checked={selected === t.id}
                onChange={() => setSelected(t.id)}
                disabled={loading}
                className="mt-0.5"
              />
              <div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{t.label}</span>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-medium disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleRun}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                처리 중…
              </>
            ) : (
              '실행'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MemoAiPromptTypeModal;
export { PROMPT_TYPES };
