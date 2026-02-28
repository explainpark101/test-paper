import React from 'react';

/**
 * 스위치 형태 토글. checked 시 켜짐(indigo).
 */
function Toggle({ checked = false, onChange, disabled = false, label, id, className = '', labelClassName = '' }) {
  const uid = id || `toggle-${Math.random().toString(36).slice(2)}`;

  return (
    <label
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      htmlFor={uid}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          id={uid}
          role="switch"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-hidden
        />
        <span
          aria-hidden
          className={`
            block w-11 h-6 rounded-full transition-colors duration-200
            peer-disabled:opacity-50 peer-disabled:pointer-events-none
            ${checked ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}
          `}
        />
        <span
          aria-hidden
          className={`
            absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow-md
            transition-transform duration-200 ease-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </span>
      {label != null && <span className={`text-sm text-gray-700 dark:text-gray-300 ${labelClassName}`}>{label}</span>}
    </label>
  );
}

export default Toggle;
