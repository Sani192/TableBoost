import axios from 'axios';

export interface AddVisitPayload {
  phone_number: string;
  name?: string;
  amount?: number;
  send_sms?: boolean;
}

export interface AddVisitResponse {
  id: number;
  customer_id: number;
  amount?: string | number | null;
  visited_at: string;
  sms_status?: string | null;
}

export interface DashboardResponse {
  total_customers: number;
  total_visits: number;
  repeat_customers: number;
  recent_visits: {
    customer_name?: string;
    phone_number: string;
    visited_at: string;
    amount?: number;
  }[];
}

export interface VisitDetail {
  id: number;
  customer_id: number;
  customer_name?: string;
  phone_number: string;
  amount?: number;
  visited_at: string;
  sms_status?: string | null;
}

export interface GetVisitsParams {
  skip?: number;
  limit?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  sort_by?: 'name' | 'amount' | 'visited_at';
  sort_order?: 'asc' | 'desc';
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 8000,
});

export const addVisit = async (payload: AddVisitPayload): Promise<AddVisitResponse> => {
  const response = await api.post<AddVisitResponse>('/api/visits/', payload);
  return response.data;
};

export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await api.get<DashboardResponse>('/api/dashboard/');
  return response.data;
};

export const getVisits = async (params: GetVisitsParams = {}): Promise<VisitDetail[]> => {
  const response = await api.get<VisitDetail[]>('/api/visits/', { params });
  return response.data;
};
