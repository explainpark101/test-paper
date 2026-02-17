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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">
            Question <span className="text-2xl font-black text-indigo-500">{index + 1}</span>
          </span>
          <button
            onClick={() => onToggleStar(index)}
            className="p-1 hover:bg-yellow-50 rounded transition-colors cursor-pointer"
            title={question.starred ? '별표 제거' : '별표 추가'}
          >
            <Star className={`w-4 h-4 ${question.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`} />
          </button>
        </div>
        <button 
          onClick={() => onToggleType(index)}
          className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 hover:text-indigo-500 transition-colors"
        >
          {question.type === 'input' ? <ToggleLeft className="w-4 h-4" /> : <ToggleRight className="w-4 h-4 text-indigo-500" />}
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
          className="q-input w-full border-b-2 border-gray-100 py-3 px-1 focus:border-indigo-500 outline-none transition-all text-lg"
          value={question.userAnswer}
          onChange={(e) => onUpdateAnswer(index, e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && focusNextInput(index)}
          placeholder="답변을 입력하세요..."
        />
      ) : (
        <textarea 
          className="q-input w-full border-2 border-gray-100 rounded-xl p-4 focus:border-indigo-500 outline-none transition-all h-32 text-lg resize-none"
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
