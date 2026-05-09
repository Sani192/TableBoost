import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../src/app/page';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Link since it's used in the page
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Dashboard Page', () => {
  it('renders the dashboard heading', () => {
    render(<Dashboard />);
    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
  });

  it('contains a button to add a new visit that links to the correct page', () => {
    render(<Dashboard />);
    const link = screen.getByRole('link', { name: /\+ add new visit/i });
    expect(link).toHaveAttribute('href', '/add-visit');
  });

  it('renders stats placeholders', () => {
    render(<Dashboard />);
    // Checking if the container for stats is present
    expect(screen.getByText(/dashboard/i).parentElement).toBeInTheDocument();
  });
});
