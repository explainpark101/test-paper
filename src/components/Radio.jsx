import React from 'react';

/**
 * 커스텀 라디오 인디케이터. 라벨은 자식으로 감싸서 사용.
 */
function Radio({ checked = false, onChange, disabled = false, name, value, id, className = '' }) {
  const uid = id || (name && value ? `radio-${name}-${value}` : `radio-${Math.random().toString(36).slice(2)}`);

  return (
    <span className={`inline-flex shrink-0 ${className}`}>
      <input
        type="radio"
        id={uid}
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange?.(value)}
        disabled={disabled}
        className="sr-only peer"
        aria-hidden
      />
      <span
        aria-hidden
        className={`
          inline-flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-200
          bg-white dark:bg-gray-700
          peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 dark:peer-focus-visible:ring-indigo-400 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-gray-800
          peer-disabled:opacity-50 peer-disabled:pointer-events-none
          ${checked
            ? 'border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}
        `}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
      </span>
    </span>
  );
}

export default Radio;
