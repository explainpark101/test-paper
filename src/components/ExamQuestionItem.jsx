import React, { useState, useRef, useEffect } from 'react';
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
  const [showPopover, setShowPopover] = useState(false);
  const [isPopoverVisible, setIsPopoverVisible] = useState(false);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);
  const blurTimeoutRef = useRef(null);

  useEffect(() => {
    if (showPopover) {
      // 나타나는 애니메이션 - 약간의 지연을 두어 DOM에 먼저 추가된 후 애니메이션 시작
      requestAnimationFrame(() => {
        setIsPopoverVisible(true);
      });
    } else {
      // 사라지는 애니메이션
      setIsPopoverVisible(false);
    }
  }, [showPopover]);

  const handleInputFocus = () => {
    if (question.type === 'input' && (!question.userAnswer || question.userAnswer.length <= 1)) {
      setShowPopover(true);
    }
  };

  const handleInputBlur = (e) => {
    // 팝오버로 포커스가 이동하는 경우 blur를 무시
    if (popoverRef.current && popoverRef.current.contains(e.relatedTarget)) {
      return;
    }
    
    // 약간의 지연을 두어 팝오버 클릭 이벤트가 처리되도록 함
    blurTimeoutRef.current = setTimeout(() => {
      // 팝오버 내부가 활성화되어 있지 않은 경우에만 숨김
      const activeElement = document.activeElement;
      if (!popoverRef.current?.contains(activeElement) && activeElement !== inputRef.current) {
        setIsPopoverVisible(false);
        // 애니메이션 완료 후 DOM에서 제거
        setTimeout(() => {
          setShowPopover(false);
        }, 200);
      }
    }, 150);
  };

  const handlePopoverMouseDown = (e) => {
    // 팝오버 클릭 시 input이 blur되지 않도록 함
    e.preventDefault();
    e.stopPropagation();
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    // input에 포커스를 유지
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    onUpdateAnswer(index, value);
    if (value.length > 1) {
      setIsPopoverVisible(false);
      // 애니메이션 완료 후 DOM에서 제거
      setTimeout(() => {
        setShowPopover(false);
      }, 200);
    }
  };

  const handlePopoverOptionSelect = (option) => {
    onUpdateAnswer(index, option);
    // 팝오버를 닫지 않고 유지
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

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
        <div className="relative">
          <input 
            ref={inputRef}
            className="q-input w-full border-b-2 border-gray-100 dark:border-gray-700 py-3 px-1 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none transition-all text-lg bg-transparent dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            value={question.userAnswer}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={(e) => e.key === 'Enter' && focusNextInput(index)}
            placeholder="답변을 입력하세요..."
          />
          {showPopover && (
            <div 
              ref={popoverRef}
              className={`absolute top-full mt-2 left-0 md:top-0 md:left-auto md:right-full md:mr-2 md:mt-0 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 transition-all duration-200 ease-out origin-top-left md:origin-top-right ${
                isPopoverVisible 
                  ? 'opacity-100 scale-100 translate-y-0 md:translate-x-0' 
                  : 'opacity-0 scale-95 translate-y-2 md:translate-y-0 md:translate-x-2 pointer-events-none'
              }`}
              onMouseDown={handlePopoverMouseDown}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  {['1', '2', '3', '4', '5'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePopoverOptionSelect(option)}
                      className={`
                        w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer
                        ${question.userAnswer === option
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  {['a', 'b', 'c', 'd', 'e'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handlePopoverOptionSelect(option)}
                      className={`
                        w-7 h-7 rounded-md font-bold text-xs transition-all cursor-pointer
                        ${question.userAnswer === option
                          ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }
                      `}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
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
