import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('LoginPage', () => {
  it('renders login form and handles submission', () => {
    const mockLogin = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: false,
    });
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    render(<LoginPage />);

    expect(screen.getByText(/Sign in to TableBoost/i)).toBeInTheDocument();
    
    const emailInput = screen.getByPlaceholderText(/Email/i);
    const passInput = screen.getByPlaceholderText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });
    
    fireEvent.click(submitBtn);

    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
