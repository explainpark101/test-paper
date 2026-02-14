import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const PRESETS = [5, 10, 20];

function RangeSizeSelect({ value, onChange, max = 9999 }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState(String(value));
  const containerRef = useRef(null);

  const isPreset = PRESETS.includes(value);

  // 직접 입력 모드일 때 부모 value와 입력값 동기화
  useEffect(() => {
    if (!isPreset) setCustomInput(String(value));
  }, [value, isPreset]);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handlePresetClick = (n) => {
    onChange(n);
    setIsOpen(false);
  };

  const handleCustomClick = () => {
    if (isPreset) {
      onChange(10);
      setCustomInput('10');
    }
    // 드롭다운은 유지해서 입력 가능
  };

  const handleCustomInputChange = (e) => {
    const v = e.target.value;
    setCustomInput(v);
    if (v === '') return;
    const n = parseInt(v, 10);
    if (!isNaN(n) && n >= 1) {
      onChange(Math.min(max, n));
    }
  };

  const handleCustomInputBlur = () => {
    const n = parseInt(customInput, 10);
    if (isNaN(n) || n < 1) {
      setCustomInput(String(value));
    } else {
      setCustomInput(String(Math.min(max, Math.max(1, n))));
      onChange(Math.min(max, Math.max(1, n)));
    }
  };

  const displayLabel = isPreset ? `${value}개 단위` : `${value}개 단위`;

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* 트리거 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-1.5 min-w-28 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-indigo-300 hover:bg-gray-50 transition-colors text-left cursor-pointer"
      >
        <span className="flex-1 font-medium text-gray-700">{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-56 py-1 rounded-xl bg-white border border-gray-200 shadow-lg">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handlePresetClick(n)}
              className={`w-full px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                isPreset && value === n
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {n}개 단위
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <div
              className={`flex items-center gap-2 px-3 py-2.5 ${
                !isPreset ? 'bg-indigo-50' : 'hover:bg-gray-100'
              }`}
            >
              <button
                type="button"
                onClick={handleCustomClick}
                className={`text-left text-sm font-medium flex-1 ${
                  !isPreset ? 'text-indigo-700' : 'text-gray-700'
                }`}
              >
                직접 입력
              </button>
              <input
                type="number"
                min={1}
                max={max}
                value={customInput}
                onChange={handleCustomInputChange}
                onBlur={handleCustomInputBlur}
                onClick={(e) => e.stopPropagation()}
                className="w-14 text-sm border border-gray-200 rounded-lg px-2 py-1 text-center focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="구간 크기"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RangeSizeSelect;
