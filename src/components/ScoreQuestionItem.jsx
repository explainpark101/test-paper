import React from 'react';
import { Star } from 'lucide-react';

function ScoreQuestionItem({ 
  question, 
  displayNumber, 
  originalIndex, 
  isDiff, 
  questionState, 
  onUpdateCorrectAnswer, 
  onToggleStar,
  scoreInputIndex
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_1fr] gap-4 items-stretch">
      <div className="flex flex-col items-center justify-center gap-1 w-20 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
            <span>Question</span> 
            <div class='flex gap-1 items-center'>
              <span className="text-2xl font-black text-indigo-500">{displayNumber}</span>
              {questionState && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  questionState === 'AO' || questionState === 'BO' || questionState === 'CO'
                    ? 'bg-green-100 text-green-700'
                    : questionState === 'AX' || questionState === 'BX' || questionState === 'CX'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {questionState}
                </span>
              )}
            </div>
          </span>
          <button
            onClick={() => onToggleStar(originalIndex)}
            className="p-1 hover:bg-yellow-50 rounded transition-colors cursor-pointer"
            title={question.starred ? '별표 제거' : '별표 추가'}
          >
            <Star className={`w-3.5 h-3.5 ${question.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} />
          </button>
        </div>
        
      </div>
      <div className={`p-5 rounded-2xl text-sm whitespace-pre-wrap flex items-center transition-all ${isDiff ? 'bg-red-50 border-2 border-red-100 text-red-900 shadow-inner' : 'bg-gray-100 text-gray-600'}`}>
        {question.userAnswer || <span className="text-gray-300 italic">입력 없음</span>}
      </div>
      <textarea 
        className={`q-score-input w-full p-5 rounded-2xl border-2 outline-none text-sm transition-all min-h-[60px] resize-none ${isDiff ? 'border-red-400 bg-white text-red-600 focus:ring-2 focus:ring-red-100' : 'border-gray-100 focus:border-green-500 bg-white'}`}
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
    </div>
  );
}

export default ScoreQuestionItem;
