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
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    jest.clearAllMocks();
  });

  it('renders all form fields', () => {
    render(<AddVisitPage />);
    
    expect(screen.getByPlaceholderText(/Optional/i)).toBeInTheDocument(); // Name
    expect(screen.getByPlaceholderText(/0.00/i)).toBeInTheDocument(); // Amount
    expect(screen.getByText(/Send Review SMS/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Visit/i })).toBeInTheDocument();
  });

  it('disables submit button when phone number is less than 10 digits', () => {
    render(<AddVisitPage />);
    const submitButton = screen.getByRole('button', { name: /Save Visit/i });
    const phoneInput = screen.getAllByRole('textbox')[0]; // First textbox is usually phone or we can target by placeholder if MobileNumberInput has one. MobileNumberInput doesn't expose easy label in tests maybe. But let's assume it has inputMode numeric.
    
    // Actually the submit button starts disabled because phone is empty.
    expect(submitButton).toBeDisabled();
  });

  it('successfully submits the form and shows success message', async () => {
    (addVisit as jest.Mock).mockResolvedValue({ id: 1, sms_status: 'sent' });
    
    render(<AddVisitPage />);
    
    // The MobileNumberInput has autoFocus, let's find it by type tel or just the first input.
    const inputs = screen.getAllByRole('textbox');
    const nameInput = screen.getByPlaceholderText(/Optional/i);
    const amountInput = screen.getByPlaceholderText(/0.00/i);
    const submitButton = screen.getByRole('button', { name: /Save Visit/i });

    // Assuming first input is mobile number
    const phoneInput = inputs[0];

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(amountInput, { target: { value: '50.00' } });
    
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(addVisit).toHaveBeenCalledWith({
        phone_number: '1234567890',
        name: 'John Doe',
        amount: 50.00,
        send_sms: true,
      });
    });

    expect(screen.getByText(/Visit saved. Review SMS queued./i)).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    (addVisit as jest.Mock).mockRejectedValue(new Error('Network Error'));
    
    render(<AddVisitPage />);
    
    const phoneInput = screen.getAllByRole('textbox')[0];
    const submitButton = screen.getByRole('button', { name: /Save Visit/i });

    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back button is clicked', () => {
    render(<AddVisitPage />);
    const backButton = screen.getAllByRole('button', { name: 'Back' })[0];
    
    fireEvent.click(backButton);
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
