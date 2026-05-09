import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddVisitPage from '../../src/app/add-visit/page';
import { useRouter } from 'next/navigation';
import { addVisit } from '../../src/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the API client
jest.mock('../../src/lib/api', () => ({
  addVisit: jest.fn(),
}));

describe('AddVisitPage', () => {
  const mockPush = jest.fn();
  
  beforeEach(() => {
    (useRouter as jest.fn()).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<AddVisitPage />);
    
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/customer name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bill amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/send review sms/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save visit/i })).toBeInTheDocument();
  });

  it('disables submit button when phone number is less than 10 digits', () => {
    render(<AddVisitPage />);
    const submitButton = screen.getByRole('button', { name: /save visit/i });
    const phoneInput = screen.getByLabelText(/phone number/i);

    fireEvent.change(phoneInput, { target: { value: '123456789' } });
    expect(submitButton).toBeDisabled();

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    expect(submitButton).not.toBeDisabled();
  });

  it('successfully submits the form and shows success message', async () => {
    (addVisit as jest.fn()).mockResolvedValue({ sms_status: 'sent' });
    
    render(<AddVisitPage />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    const nameInput = screen.getByLabelText(/customer name/i);
    const amountInput = screen.getByLabelText(/bill amount/i);
    const submitButton = screen.getByRole('button', { name: /save visit/i });

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(amountInput, { target: { value: '50.00' } });
    
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/processing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(addVisit).toHaveBeenCalledWith({
        phone_number: '1234567890',
        name: 'John Doe',
        amount: 50.00,
        send_sms: true,
      });
    });

    expect(screen.getByText(/visit recorded/i)).toBeInTheDocument();
    expect(screen.getByText(/sms status: sent/i)).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    (addVisit as jest.fn()).mockRejectedValue(new Error('Network Error'));
    
    render(<AddVisitPage />);
    
    const phoneInput = screen.getByLabelText(/phone number/i);
    const submitButton = screen.getByRole('button', { name: /save visit/i });

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('toggles the SMS switch when clicked', () => {
    render(<AddVisitPage />);
    const smsSwitch = screen.getByRole('switch', { name: /send review sms/i });
    
    expect(smsSwitch).toHaveAttribute('aria-checked', 'true');
    
    fireEvent.click(smsSwitch);
    expect(smsSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('navigates back to dashboard when back button is clicked', () => {
    render(<AddVisitPage />);
    const backButton = screen.getByText(/back to dashboard/i);
    
    fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
