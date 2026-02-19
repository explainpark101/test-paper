import React from 'react';
import { Star, ToggleLeft, ToggleRight } from 'lucide-react';
import RadioToggle from './RadioToggle';

function ExamQuestionItem({ 
  question, 
  index, 
  onUpdateAnswer, 
  onToggleType, 
  onToggleStar, 
  focusNextInput, 
  onUpdateSelectedOption 
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400 dark:text-indigo-300 uppercase tracking-widest">
            Question <span className="text-2xl font-black text-indigo-500 dark:text-indigo-400">{index + 1}</span>
          </span>
          <button
            onClick={() => onToggleStar(index)}
            className="p-1 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded transition-colors cursor-pointer"
            title={question.starred ? '별표 제거' : '별표 추가'}
          >
            <Star className={`w-4 h-4 ${question.starred ? 'fill-yellow-400 dark:fill-yellow-500 text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-500'}`} />
          </button>
        </div>
        <button 
          onClick={() => onToggleType(index)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
        >
          {question.type === 'input' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
          {question.type === 'input' ? '서술형으로 전환' : '단답형으로 전환'}
        </button>
      </div>
      <div className="mb-3">
        <RadioToggle 
          value={question.selectedOption || null}
          onChange={(option) => onUpdateSelectedOption(index, option)}
        />
      </div>
      {question.type === 'input' ? (
        <input 
          className="q-input w-full border-b-2 border-gray-100 dark:border-gray-700 py-3 px-1 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-lg bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          value={question.userAnswer}
          onChange={(e) => onUpdateAnswer(index, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && focusNextInput(index)}
          placeholder="답변을 입력하세요..."
        />
      ) : (
        <textarea 
          className="q-input w-full border-2 border-gray-100 dark:border-gray-700 rounded-xl p-4 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all h-32 text-lg resize-none bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          value={question.userAnswer}
          onChange={(e) => onUpdateAnswer(index, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && focusNextInput(index)}
          placeholder="상세한 답변을 입력하세요 (Ctrl+Enter: 다음으로)..."
        />
      )}
    </div>
  );
}

export default ExamQuestionItem;
