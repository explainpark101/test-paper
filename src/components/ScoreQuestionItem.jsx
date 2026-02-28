import React, { useState } from 'react';
import { Star } from 'lucide-react';
import MemoEditor from './MemoEditor';
import MemoViewer from './MemoViewer';

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
  const [isFocused, setIsFocused] = useState(false);
  const memoEditorId = `memo-${scoreInputIndex}-${question.id}`;

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
        className={`q-memo-input w-full rounded-2xl border-2 outline-none text-sm transition-all min-h-[60px] overflow-hidden bg-white dark:bg-gray-800 dark:text-gray-100 ${
          isFocused ? 'border-indigo-500 dark:border-indigo-400' : 'border-gray-100 dark:border-gray-700'
        }`}
      >
        {isFocused ? (
          <MemoEditor
            editorId={memoEditorId}
            value={question.memo || ''}
            onChange={(v) => onUpdateMemo(originalIndex, v)}
            onBlur={() => setIsFocused(false)}
            className="min-h-[60px] [&_.md-editor]:min-h-[60px] [&_.md-editor-content]:min-h-[60px]"
            placeholder="메모"
          />
        ) : (
          <MemoViewer
            editorId={memoEditorId}
            value={question.memo || ''}
            onFocus={() => setIsFocused(true)}
            className="p-5 min-h-[60px] cursor-text [&_.md-editor-preview]:p-0! [&_.md-editor-preview-wrapper]:p-0!"
          />
        )}
      </div>
    </div>
  );
}

export default ScoreQuestionItem;
