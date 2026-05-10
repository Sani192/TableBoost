import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MobileNumberInput from '../../src/components/MobileNumberInput';

describe('MobileNumberInput Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with the correct label', () => {
    render(<MobileNumberInput value="" onChange={mockOnChange} />);
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
  });

  it('shows the correct placeholder', () => {
    render(<MobileNumberInput value="" onChange={mockOnChange} />);
    expect(screen.getByPlaceholderText(/\(555\) 123-4567/i)).toBeInTheDocument();
  });

  it('calls onChange with only numeric characters when typing', () => {
    render(<MobileNumberInput value="" onChange={mockOnChange} />);
    const input = screen.getByLabelText(/phone number/i);
    
    fireEvent.change(input, { target: { value: '123abc456' } });
    
    // The component should strip non-digits before calling onChange
    expect(mockOnChange).toHaveBeenCalledWith('123456');
  });

  it('limits input to 10 characters', () => {
    render(<MobileNumberInput value="1234567890" onChange={mockOnChange} />);
    const input = screen.getByLabelText(/phone number/i) as HTMLInputElement;
    expect(input.maxLength).toBe(14); // Because of formatting `(123) 456-7890` it has max length 14
  });

  it('applies autoFocus when the prop is true', () => {
    render(<MobileNumberInput value="" onChange={mockOnChange} autoFocus />);
    const input = screen.getByLabelText(/phone number/i);
    expect(input).toHaveFocus();
  });
});
