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
    <div className="space-y-2">
      <label htmlFor="phone" className="block text-sm font-bold text-slate-800">
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
        className="block min-h-[66px] w-full rounded-3xl border border-brand-200 bg-white px-5 py-4 text-[1.7rem] font-black leading-none tracking-tight text-slate-950 shadow-sm outline-none transition placeholder:text-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
        maxLength={14}
        required
      />
      <p className="text-xs font-semibold text-slate-500">Numbers only. Review SMS triggers after saving.</p>
    </div>
  );
};

export default MobileNumberInput;
