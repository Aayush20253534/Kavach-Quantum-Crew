import React, { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export function ScrollableSelect({
  value,
  onChange,
  options,
  placeholder,
  error,
  searchable = false,
  searchPlaceholder = 'Search...',
  optionValue = (option) => (typeof option === 'string' ? option : option.value),
  optionLabel = (option) => (typeof option === 'string' ? option : option.label),
  optionPrefix = () => null,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchInputRef = useRef(null);

  const selected = options.find((option) => optionValue(option) === value);

  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((option) =>
      String(optionLabel(option)).toLowerCase().includes(normalizedQuery),
    );
  }, [options, optionLabel, query, searchable]);

  const setDropdownOpen = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setQuery('');
      return;
    }

    if (searchable) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) setDropdownOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setDropdownOpen(!open)}
        className={`h-10 w-full rounded-md border bg-white px-3 text-left text-xs outline-none transition flex items-center justify-between gap-3 ${
          error ? 'border-red-500' : 'border-slate-200'
        } focus:border-red-500 focus:ring-1 focus:ring-red-500`}
      >
        <span
          className={`min-w-0 flex items-center gap-2 truncate ${
            selected ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {selected && optionPrefix(selected) ? (
            <span className="shrink-0 text-base leading-none" aria-hidden="true">
              {optionPrefix(selected)}
            </span>
          ) : null}
          <span className="truncate">{selected ? optionLabel(selected) : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white shadow-xl">
          {searchable && (
            <div className="border-b border-slate-100 p-2">
              <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 focus-within:border-red-400 focus-within:ring-1 focus-within:ring-red-100">
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="h-full min-w-0 flex-1 bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div role="listbox" className="max-h-48 overflow-y-auto overscroll-contain py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const itemValue = optionValue(option);
                const label = optionLabel(option);
                const active = itemValue === value;
                const prefix = optionPrefix(option);

                return (
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    key={itemValue}
                    onClick={() => {
                      onChange(itemValue);
                      setDropdownOpen(false);
                    }}
                    className={`min-h-10 w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-3 ${
                      active
                        ? 'bg-red-50 text-red-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="min-w-0 flex items-center gap-2">
                      {prefix ? (
                        <span className="shrink-0 text-base leading-none" aria-hidden="true">
                          {prefix}
                        </span>
                      ) : null}
                      <span className="truncate">{label}</span>
                    </span>
                    {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-slate-400">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
