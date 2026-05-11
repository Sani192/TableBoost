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

export interface CustomerListResponse {
  id: number;
  phone_number: string;
  name: string | null;
  created_at: string;
  total_visits: number;
  last_visit: string | null;
  total_spent: number | null;
}

export interface CustomerDetailResponse extends CustomerListResponse {}

export const getCustomerVisits = async (id: number, params: { skip?: number; limit?: number } = {}): Promise<VisitDetail[]> => {
  const response = await api.get<VisitDetail[]>(`/api/customers/${id}/visits`, { params });
  return response.data;
};

export interface MessageLogResponse {
  id: number;
  customer_id: number;
  customer_name: string | null;
  phone_number: string;
  message_text: string;
  type: string;
  status: string;
  sent_at: string;
}

export interface CampaignCreateRequest {
  message: string;
  audience_type: string;
  inactive_days?: number;
}

export const getCustomers = async (params: { skip?: number; limit?: number; search?: string; min_visits?: number; max_visits?: number; min_spent?: number; max_spent?: number } = {}): Promise<CustomerListResponse[]> => {
  const response = await api.get<CustomerListResponse[]>('/api/customers/', { params });
  return response.data;
};

export const getCustomerDetail = async (id: number): Promise<CustomerDetailResponse> => {
  const response = await api.get<CustomerDetailResponse>(`/api/customers/${id}`);
  return response.data;
};

export const getMessageLogs = async (params: { skip?: number; limit?: number; search?: string; type?: string; status?: string; start_date?: string; end_date?: string } = {}): Promise<MessageLogResponse[]> => {
  const response = await api.get<MessageLogResponse[]>('/api/messages/', { params });
  return response.data;
};

export const createCampaign = async (payload: CampaignCreateRequest): Promise<{ sent_count: number; failed_count: number; total: number }> => {
  const response = await api.post('/api/messages/campaign', payload);
  return response.data;
};

export interface SettingsResponse {
  review_message_template: string;
  auto_send_sms: boolean;
  campaign_inactive_days: number;
}

export interface SettingsUpdate {
  review_message_template?: string;
  auto_send_sms?: boolean;
  campaign_inactive_days?: number;
}

export const getSettings = async (): Promise<SettingsResponse> => {
  const response = await api.get<SettingsResponse>('/api/settings/');
  return response.data;
};

export const updateSettings = async (payload: SettingsUpdate): Promise<SettingsResponse> => {
  const response = await api.post<SettingsResponse>('/api/settings/', payload);
  return response.data;
};
