import React, { useRef, useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { parseMarkdown } from '../utils/markdownParser';

function ScoreQuestionItem({ 
  question, 
  displayNumber, 
  originalIndex, 
  isDiff, 
  questionState, 
  onUpdateCorrectAnswer, 
  onUpdateMemo,
  onToggleStar,
  scoreInputIndex
}) {
  const memoRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (memoRef.current && !isFocused) {
      // 포커스가 없을 때만 높이 조정
      memoRef.current.style.height = 'auto';
      memoRef.current.style.height = `${memoRef.current.scrollHeight}px`;
    }
  }, [question.memo, isFocused]);

  const handleMemoFocus = () => {
    setIsFocused(true);
    // 포커스 시 텍스트로 변경
    if (memoRef.current) {
      memoRef.current.innerText = question.memo || '';
    }
  };

  const handleMemoBlur = () => {
    setIsFocused(false);
    memoRef.current?.querySelectorAll('b').forEach(b => {
      b.outerHTML = `**${b.innerText}**`;
    });
    const text = memoRef.current?.innerText || '';
    onUpdateMemo(originalIndex, text);
  };

  const handleMemoInput = (e) => {
    // Auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleMemoPaste = (e) => {
    // HTML 붙여넣기 방지, 순수 텍스트만 허용
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleMemoKeyDown = (e) => {
    if (!memoRef.current) return;

    // Ctrl+Enter: 다음 메모로 이동
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const memos = document.querySelectorAll('.q-memo-input');
      const next = memos[scoreInputIndex + 1];
      if (next instanceof HTMLElement) {
        next.focus();
      }
      return;
    }
  };

  return (
    <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-4 items-stretch">
      <div className="flex flex-col items-center justify-center gap-1 w-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
            {questionState && (
              <span className={`block text-xs font-bold px-2 py-0.5 rounded mt-1 ${
                questionState === 'AO' || questionState === 'BO' || questionState === 'CO'
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : questionState === 'AX' || questionState === 'BX' || questionState === 'CX'
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {questionState}
              </span>
            )}
            {
              <span className='flex gap-1 items-baseline'>
                <span>Question</span> <span className="text-2xl font-black text-indigo-500 dark:text-indigo-400">{displayNumber}</span>
              </span>
            }
          </span>
          <button
            onClick={() => onToggleStar(originalIndex)}
            className="p-1 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded transition-colors cursor-pointer"
            title={question.starred ? '별표 제거' : '별표 추가'}
          >
            <Star className={`w-3.5 h-3.5 ${question.starred ? 'fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500'}`} />
          </button>
        </div>
        
      </div>
      <div className={`p-5 rounded-2xl text-sm whitespace-pre-wrap flex items-center transition-all ${isDiff ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-800 text-red-900 dark:text-red-200 shadow-inner' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
        {question.userAnswer || <span className="text-gray-300 dark:text-gray-600 italic">입력 없음</span>}
      </div>
      <textarea 
        className={`q-score-input w-full p-5 rounded-2xl border-2 outline-none text-sm transition-all min-h-[60px] resize-none ${isDiff ? 'border-red-400 dark:border-red-500 bg-white dark:bg-gray-800 text-red-600 dark:text-red-300 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/50' : 'border-gray-100 dark:border-gray-700 focus:border-green-500 dark:focus:border-green-400 bg-white dark:bg-gray-800 dark:text-gray-100'}`}
        value={question.correctAnswer}
        onChange={(e) => onUpdateCorrectAnswer(originalIndex, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const next = document.querySelectorAll('.q-score-input')[scoreInputIndex + 1];
            if (next) next.focus();
          }
        }}
        placeholder="정답 입력 (Enter: 다음)..."
      />
      <div
        ref={memoRef}
        className={`q-memo-input w-full p-5 rounded-2xl border-2 outline-none text-sm transition-all min-h-[60px] resize-none bg-white dark:bg-gray-800 overflow-hidden dark:text-gray-100 ${
          isFocused ? 'border-indigo-500 dark:border-indigo-400' : 'border-gray-100 dark:border-gray-700'
        }`}
        contentEditable
        suppressContentEditableWarning
        onFocus={handleMemoFocus}
        onBlur={handleMemoBlur}
        onInput={handleMemoInput}
        onPaste={handleMemoPaste}
        onKeyDown={handleMemoKeyDown}
        style={{ 
          minHeight: '60px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
        data-placeholder="메모"
        dangerouslySetInnerHTML={isFocused ? undefined : { __html: parseMarkdown(question.memo || '') }}
      >
        {isFocused ? question.memo || '' : undefined}
      </div>
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .dark [contenteditable][data-placeholder]:empty:before {
          color: #6b7280;
        }
        [contenteditable]:not(:focus) h1 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; display: block; }
        [contenteditable]:not(:focus) h2 { font-size: 1.3em; font-weight: bold; margin: 0.4em 0; display: block; }
        [contenteditable]:not(:focus) h3 { font-size: 1.1em; font-weight: bold; margin: 0.3em 0; display: block; }
        [contenteditable]:not(:focus) strong { font-weight: bold; }
        [contenteditable]:not(:focus) em { font-style: italic; }
        [contenteditable]:not(:focus) u { text-decoration: underline; }
        [contenteditable]:not(:focus) del { text-decoration: line-through; }
      `}</style>
    </div>
  );
}

export default ScoreQuestionItem;
