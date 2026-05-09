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

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000',
  timeout: 8000,
});

export const addVisit = async (payload: AddVisitPayload): Promise<AddVisitResponse> => {
  const response = await api.post<AddVisitResponse>('/api/visits/', payload);
  return response.data;
};
