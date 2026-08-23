import React, { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export function ScrollableSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  optionValue = (option) => (typeof option === 'string' ? option : option.value),
  optionLabel = (option) => (typeof option === 'string' ? option : option.label),
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selected = options.find((option) => optionValue(option) === value);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`h-10 w-full rounded-md border bg-white px-3 text-left text-xs outline-none transition flex items-center justify-between gap-3 ${
          error ? 'border-red-500' : 'border-slate-200'
        } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-400'}>
          {selected ? optionLabel(selected) : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto overscroll-contain rounded-md border border-slate-200 bg-white shadow-xl"
        >
          {options.map((option) => {
            const itemValue = optionValue(option);
            const label = optionLabel(option);
            const active = itemValue === value;

            return (
              <button
                type="button"
                role="option"
                aria-selected={active}
                key={itemValue}
                onClick={() => {
                  onChange(itemValue);
                  setOpen(false);
                }}
                className={`min-h-10 w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 ${
                  active ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
