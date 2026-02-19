import React from 'react';

function RadioToggle({ value, onChange, options = ['A', 'B', 'C'] }) {
  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(value === option ? null : option)}
          className={`
            w-10 h-10 rounded-lg font-bold text-sm transition-all cursor-pointer
            ${value === option
              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default RadioToggle;
