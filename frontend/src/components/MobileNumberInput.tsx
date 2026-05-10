import React, { useEffect, useRef } from 'react';

interface MobileNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  const first = digits.slice(0, 3);
  const middle = digits.slice(3, 6);
  const last = digits.slice(6, 10);

  if (digits.length > 6) return `(${first}) ${middle}-${last}`;
  if (digits.length > 3) return `(${first}) ${middle}`;
  if (digits.length > 0) return `(${first}`;
  return '';
};

const MobileNumberInput: React.FC<MobileNumberInputProps> = ({ value, onChange, autoFocus }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    onChange(val);
  };

  return (
    <div className="space-y-1.5">
      <label htmlFor="phone" className="block text-sm font-semibold text-stone-700">
        Phone Number <span className="text-brand-600">*</span>
      </label>
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        id="phone"
        placeholder="(555) 123-4567"
        value={formatPhone(value)}
        onChange={handleChange}
        className="block min-h-[56px] w-full rounded-2xl border border-stone-200 bg-white px-4 py-3.5 text-2xl font-bold tracking-tight text-stone-900 outline-none transition-all duration-150 placeholder:text-stone-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        maxLength={14}
        required
      />
      <p className="text-xs font-medium text-stone-500">Numbers only. Review SMS triggers after saving.</p>
    </div>
  );
};

export default MobileNumberInput;
