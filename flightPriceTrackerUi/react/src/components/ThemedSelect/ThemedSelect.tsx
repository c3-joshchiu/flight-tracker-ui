import React, { useCallback, useEffect, useRef, useState } from 'react';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
  id?: string;
  placeholder?: string;
}

export default function ThemedSelect({ value, onChange, options, className = '', id, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const enabledOptions = options.filter((o) => !o.disabled);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) {
      const idx = enabledOptions.findIndex((o) => o.value === value);
      setHighlightIdx(idx >= 0 ? idx : 0);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !listRef.current) return;
    const active = listRef.current.children[highlightIdx] as HTMLElement;
    active?.scrollIntoView({ block: 'nearest' });
  }, [highlightIdx, open]);

  const select = useCallback(
    (opt: Option) => {
      if (opt.disabled) return;
      onChange(opt.value);
      setOpen(false);
    },
    [onChange],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, enabledOptions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (enabledOptions[highlightIdx]) select(enabledOptions[highlightIdx]);
        break;
      case 'Escape':
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        id={id}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between border bg-[var(--c3-style-formFieldBackgroundColor)] border-[var(--c3-style-formFieldBorderColor)] px-[var(--spacing-04)] py-[var(--spacing-02)] text-sm text-primary transition-colors hover:border-[var(--c3-style-formFieldHoverBorderColor)]"
      >
        <span className={selectedOption ? '' : 'text-secondary'}>
          {selectedOption?.label || placeholder || 'Select...'}
        </span>
        <svg
          className={`ml-2 h-4 w-4 shrink-0 text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-activedescendant={enabledOptions[highlightIdx] ? `${id}-opt-${highlightIdx}` : undefined}
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto border border-weak bg-primary shadow-lg"
        >
          {enabledOptions.map((opt, i) => (
            <li
              key={opt.value}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={opt.value === value}
              onMouseDown={() => select(opt)}
              onMouseEnter={() => setHighlightIdx(i)}
              className={`flex cursor-pointer items-center px-3 py-2 text-sm ${
                i === highlightIdx ? 'bg-accent text-inverse' : 'text-primary'
              }`}
            >
              {opt.value === value && (
                <svg className="mr-2 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {opt.value !== value && <span className="mr-2 w-4 shrink-0" />}
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
