import React from 'react';
import { Check } from 'lucide-react';

const VARIANT_UNCHECKED = 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700';
const VARIANT_CHECKED = {
  default: 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500',
  green: 'border-green-600 bg-green-600 dark:border-green-500 dark:bg-green-500',
  red: 'border-red-600 bg-red-600 dark:border-red-500 dark:bg-red-500',
  gray: 'border-gray-500 bg-gray-500 dark:border-gray-400 dark:bg-gray-400'
};
const FOCUS_RING = {
  default: 'peer-focus-visible:ring-indigo-500 dark:peer-focus-visible:ring-indigo-400',
  green: 'peer-focus-visible:ring-green-500 dark:peer-focus-visible:ring-green-400',
  red: 'peer-focus-visible:ring-red-500 dark:peer-focus-visible:ring-red-400',
  gray: 'peer-focus-visible:ring-gray-400 dark:peer-focus-visible:ring-gray-500'
};

/**
 * 커스텀 체크박스. variant: default | green | red | gray
 */
function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  name,
  id,
  variant = 'default',
  className = '',
  labelClassName = ''
}) {
  const uid = id || (name ? `checkbox-${name}` : `checkbox-${Math.random().toString(36).slice(2)}`);
  const checkedClasses = (VARIANT_CHECKED[variant] ?? VARIANT_CHECKED.default);
  const focusRing = FOCUS_RING[variant] ?? FOCUS_RING.default;

  return (
    <label
      className={`inline-flex items-center gap-2 cursor-pointer select-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      htmlFor={uid}
    >
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          id={uid}
          name={name}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-hidden
        />
        <span
          aria-hidden
          className={`
            inline-flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-200
            peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 dark:peer-focus-visible:ring-offset-gray-800
            peer-disabled:opacity-50 peer-disabled:pointer-events-none
            ${checked ? checkedClasses : VARIANT_UNCHECKED}
            ${focusRing}
          `}
        >
          {checked && <Check className="w-3 h-3 text-white stroke-3" />}
        </span>
      </span>
      {label != null && <span className={labelClassName}>{label}</span>}
    </label>
  );
}

export default Checkbox;
