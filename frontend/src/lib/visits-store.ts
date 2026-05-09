export interface StoredVisit {
  id: string;
  phoneNumber: string;
  name?: string;
  amount?: number;
  visitedAt: string;
  smsStatus?: string;
}

export interface VisitStats {
  totalCustomers: number;
  totalVisits: number;
  repeatCustomers: number;
}

const STORAGE_KEY = 'tableboost.visits';

export const getStoredVisits = (): StoredVisit[] => {
  if (typeof window === 'undefined') return [];

  const rawVisits = window.localStorage.getItem(STORAGE_KEY);
  if (!rawVisits) return [];

  try {
    const visits = JSON.parse(rawVisits) as StoredVisit[];
    return visits.sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  } catch {
    return [];
  }
};

export const saveStoredVisit = (visit: StoredVisit) => {
  if (typeof window === 'undefined') return;

  const visits = [visit, ...getStoredVisits()].slice(0, 50);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
};

export const calculateVisitStats = (visits: StoredVisit[]): VisitStats => {
  const countsByPhone = visits.reduce<Record<string, number>>((acc, visit) => {
    acc[visit.phoneNumber] = (acc[visit.phoneNumber] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalCustomers: Object.keys(countsByPhone).length,
    totalVisits: visits.length,
    repeatCustomers: Object.values(countsByPhone).filter((count) => count > 1).length,
  };
};
