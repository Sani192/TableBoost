import React, { useEffect, useRef } from 'react';

interface MobileNumberInputProps {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}

const MobileNumberInput: React.FC<MobileNumberInputProps> = ({ value, onChange, autoFocus }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const val = e.target.value.replace(/\D/g, '');
    onChange(val);
  };

  return (
    <div className="w-full">
      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number
      </label>
      <input
        ref={inputRef}
        type="tel"
        id="phone"
        placeholder="Enter 10-digit number"
        value={value}
        onChange={handleChange}
        className="block w-full px-4 py-4 text-2xl font-semibold tracking-wider text-gray-900 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
        maxLength={10}
        required
      />
    </div>
  );
};

export default MobileNumberInput;
