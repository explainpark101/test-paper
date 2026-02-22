import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const DROPDOWN_DURATION_MS = 200;

/**
 * options: Array<{ value: string, label: string }>
 * value: currently selected value
 * onChange: (value: string) => void
 */
function SelectDropdown({ value, options = [], onChange, disabled = false, placeholder = '선택', ariaLabel = '선택' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [filterText, setFilterText] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder;

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes((filterText || '').trim().toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setFilterText('');
      setShouldRender(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isVisible && shouldRender) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [isVisible, shouldRender]);

  useEffect(() => {
    if (!isVisible && shouldRender) {
      const t = setTimeout(() => setShouldRender(false), DROPDOWN_DURATION_MS);
      return () => clearTimeout(t);
    }
  }, [isVisible, shouldRender]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (filterText) setFilterText('');
      else setIsOpen(false);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={`
          flex items-center gap-1.5 min-w-[120px] text-left text-sm border rounded-lg px-3 py-1.5
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100
          border-gray-200 dark:border-gray-600
          focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:border-gray-300 dark:hover:border-gray-500
        `}
      >
        <span className="flex-1 truncate">{label}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {shouldRender && (
        <div
          role="listbox"
          className={`
            absolute top-full left-0 mt-1 min-w-full max-h-60 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg z-50 flex flex-col
            transition-all duration-200 ease-out origin-top
            ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-1 scale-[0.98]'}
          `}
        >
          <div className="p-1.5 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-gray-50 dark:bg-gray-700/80">
              <Search className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="검색..."
                className="flex-1 min-w-0 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
                aria-label="목록 검색"
              />
            </div>
          </div>
          <div className="overflow-auto py-1 min-h-0">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">목록 없음</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">검색 결과 없음</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full text-left px-3 py-2 text-sm
                    ${opt.value === value
                      ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-medium'
                      : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'}
                  `}
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SelectDropdown;
