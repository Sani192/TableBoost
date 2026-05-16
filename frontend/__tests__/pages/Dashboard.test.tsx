import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Dashboard from '../../src/app/page';
import { useRouter } from 'next/navigation';
import { getDashboard } from '../../src/lib/api';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../src/lib/api', () => ({
  getDashboard: jest.fn(),
}));

// Mock Link since it's used in the page
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('Dashboard Page', () => {
  beforeEach(() => {
    (getDashboard as jest.Mock).mockResolvedValue({
      total_customers: 10,
      total_visits: 15,
      repeat_customers: 5,
      recent_visits: [],
      revenue: {
        repeat_rate: 50,
        weekly_total: 1000,
        monthly_total: 4000,
        avg_ticket: 50,
        daily_trends: []
      },
      segments: {
        vips_count: 2,
        at_risk_count: 3,
        near_rewards_count: 1
      }
    });
  });

  it('renders the dashboard heading', async () => {
    render(<Dashboard />);
    expect(await screen.findByRole('heading', { name: /Revenue Dashboard/i })).toBeInTheDocument();
  });

  it('contains a link to add a new visit that links to the correct page', async () => {
    render(<Dashboard />);
    const link = await screen.findByRole('link', { name: /Add Visit/i });
    expect(link).toHaveAttribute('href', '/add-visit');
  });

  it('renders stats from API', async () => {
    render(<Dashboard />);
    expect(await screen.findByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});
