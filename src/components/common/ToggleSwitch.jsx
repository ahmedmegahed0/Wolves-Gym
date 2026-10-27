import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Reusable Premium Toggle Switch Component
 * Designed for Wolves Gym Dark Theme
 */
export const ToggleSwitch = ({
  checked = false,
  onChange,
  disabled = false,
  loading = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  activeColor = 'emerald', // 'emerald' | 'amber' | 'purple'
  label,
  activeLabel,
  inactiveLabel,
  showLabel = false,
  labelPosition = 'bottom', // 'bottom' | 'side'
  title = '',
  className = '',
  id,
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    if (disabled || loading) return;
    if (onChange) {
      onChange(!checked);
    }
  };

  // Dimensions based on size
  const sizeConfig = {
    sm: {
      track: 'h-4.5 w-8 p-0.5',
      knob: 'h-3.5 w-3.5',
      translate: 'translate-x-3.5',
      spinner: 'w-2.5 h-2.5',
      text: 'text-[9px]',
    },
    md: {
      track: 'h-6 w-11 p-0.5',
      knob: 'h-5 w-5',
      translate: 'translate-x-5',
      spinner: 'w-3 h-3',
      text: 'text-[10px]',
    },
    lg: {
      track: 'h-7 w-14 p-1',
      knob: 'h-5 w-5',
      translate: 'translate-x-7',
      spinner: 'w-3.5 h-3.5',
      text: 'text-xs',
    },
  }[size] || sizeConfig.md;

  // Active color backgrounds
  const colorConfig = {
    emerald: {
      track: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]',
      text: 'text-emerald-400',
      spinner: 'text-emerald-600',
    },
    amber: {
      track: 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]',
      text: 'text-amber-400',
      spinner: 'text-amber-600',
    },
    purple: {
      track: 'bg-purple-600 shadow-[0_0_12px_rgba(147,51,234,0.3)]',
      text: 'text-purple-400',
      spinner: 'text-purple-600',
    },
  }[activeColor] || colorConfig.emerald;

  const currentLabel = checked
    ? (activeLabel ?? 'مفعّل')
    : (inactiveLabel ?? 'معطّل');

  return (
    <div
      className={`inline-flex ${labelPosition === 'side' ? 'flex-row items-center gap-2' : 'flex-col items-center justify-center gap-1'} ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        disabled={disabled || loading}
        onClick={handleClick}
        dir="ltr"
        className={`relative inline-flex ${sizeConfig.track} shrink-0 cursor-pointer rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
          disabled ? 'opacity-40 cursor-not-allowed' : ''
        } ${
          checked
            ? colorConfig.track
            : 'bg-zinc-800 border border-zinc-700/80 hover:bg-zinc-700'
        }`}
        title={title || currentLabel}
      >
        <span
          className={`pointer-events-none inline-flex items-center justify-center ${sizeConfig.knob} rounded-full bg-white shadow-md transition-transform duration-200 ease-in-out ${
            checked ? sizeConfig.translate : 'translate-x-0'
          }`}
        >
          {loading && (
            <Loader2 className={`${sizeConfig.spinner} ${checked ? colorConfig.spinner : 'text-zinc-600'} animate-spin`} />
          )}
        </span>
      </button>

      {showLabel && (
        <span
          className={`${sizeConfig.text} font-bold transition-colors select-none ${
            checked ? colorConfig.text : 'text-zinc-500'
          }`}
        >
          {currentLabel}
        </span>
      )}
    </div>
  );
};

export default ToggleSwitch;
