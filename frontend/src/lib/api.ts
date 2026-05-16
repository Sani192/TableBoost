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
  total_redeemed: number;
  celebrations: {
    birthdays: number;
    anniversaries: number;
  };
  recent_visits: {
    customer_name?: string;
    phone_number: string;
    visited_at: string;
    amount?: number;
  }[];
  revenue: {
    daily_trends: { date: string; revenue: number; visits: number }[];
    avg_ticket: number;
    revenue_split: Record<string, number>;
    weekly_total: number;
    monthly_total: number;
    repeat_rate: number;
    rewards_stats: {
      total_redeemed: number;
      recent_redeemed: number;
    };
  };
  segments: {
    vips_count: number;
    at_risk_count: number;
    near_rewards_count: number;
  };
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
  birthday?: string | null;
  anniversary?: string | null;
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

export const getCustomers = async (params: { 
  skip?: number; 
  limit?: number; 
  search?: string; 
  min_visits?: number; 
  max_visits?: number; 
  min_spent?: number; 
  max_spent?: number;
  birthday_month?: number;
  birthday_day?: number;
  anniversary_month?: number;
  anniversary_day?: number;
  is_celebrating_today?: boolean;
  is_vip?: boolean;
  is_at_risk?: boolean;
  is_reward_near?: boolean;
} = {}): Promise<CustomerListResponse[]> => {
  const response = await api.get<CustomerListResponse[]>('/api/customers/', { params });
  return response.data;
};

export const getCustomerDetail = async (id: number): Promise<CustomerDetailResponse> => {
  const response = await api.get<CustomerDetailResponse>(`/api/customers/${id}`);
  return response.data;
};

export const updateCustomer = async (id: number, payload: Partial<CustomerDetailResponse>): Promise<CustomerDetailResponse> => {
  const response = await api.patch<CustomerDetailResponse>(`/api/customers/${id}`, payload);
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

// Loyalty System Evolution
export interface LoyaltyReward {
  id: number;
  name: string;
  description: string | null;
  required_visits: number;
  reward_type: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomerRewardStatus {
  reward_id: number;
  name: string;
  description: string | null;
  required_visits: number;
  reward_type: string;
  is_eligible: boolean;
  is_redeemed: boolean;
}

export interface LoyaltyStatusResponse {
  customer_id: number;
  lifetime_visits: number;
  rewards: CustomerRewardStatus[];
}

export interface RewardRedemptionResponse {
  id: number;
  reward_id: number | null;
  reward_name: string;
  visits_threshold: number;
  redeemed_at: string;
}

export const getLoyaltyRewards = async (): Promise<LoyaltyReward[]> => {
  const response = await api.get<LoyaltyReward[]>('/api/loyalty/rewards');
  return response.data;
};

export const createLoyaltyReward = async (payload: Omit<LoyaltyReward, 'id' | 'created_at'>): Promise<LoyaltyReward> => {
  const response = await api.post<LoyaltyReward>('/api/loyalty/rewards', payload);
  return response.data;
};

export const updateLoyaltyReward = async (id: number, payload: Partial<LoyaltyReward>): Promise<LoyaltyReward> => {
  const response = await api.patch<LoyaltyReward>(`/api/loyalty/rewards/${id}`, payload);
  return response.data;
};

export const getLoyaltyStatus = async (customerId: number): Promise<LoyaltyStatusResponse> => {
  const response = await api.get<LoyaltyStatusResponse>(`/api/loyalty/status/${customerId}`);
  return response.data;
};

export const redeemReward = async (customerId: number, rewardId: number): Promise<RewardRedemptionResponse> => {
  const response = await api.post<RewardRedemptionResponse>(`/api/loyalty/redeem/${customerId}/${rewardId}`);
  return response.data;
};

export const getRedemptionHistory = async (customerId: number): Promise<RewardRedemptionResponse[]> => {
  const response = await api.get<RewardRedemptionResponse[]>(`/api/loyalty/history/${customerId}`);
  return response.data;
};

// Automation
export interface AutomationConfig {
  automation_type: string;
  is_enabled: boolean;
  message_template: string;
  settings?: Record<string, any>;
}

export const getAutomationConfigs = async (): Promise<AutomationConfig[]> => {
  const response = await api.get<AutomationConfig[]>('/api/automation/');
  return response.data;
};

export const updateAutomationConfig = async (payload: Partial<AutomationConfig>): Promise<AutomationConfig> => {
  const response = await api.post<AutomationConfig>('/api/automation/', payload);
  return response.data;
};

// Intelligence
export interface GrowthDashboardResponse {
  health: Record<string, number>;
  net_new_customers: number;
  latest_summary?: {
    period_type: string;
    metrics: Record<string, any>;
    trends?: Record<string, any>;
    highlights?: string[];
    created_at: string;
  };
  recommendations: Array<{
    id: number;
    rule_id: string;
    message: string;
    priority: string;
    action_type?: string;
    action_params?: Record<string, any>;
  }>;
  loyalty_impact: {
    reward_influenced_revenue: number;
    avg_revisit_rate: number;
  };
  top_automation?: {
    type: string;
    revisit_rate: number;
    revenue: number;
  };
}

export interface CustomerIntelligenceResponse {
  customer_id: number;
  clv_score: number;
  clv_tier: string;
  total_spent: number;
  visit_count: number;
  avg_visit_gap_days?: number;
  last_visit_at?: string;
  health_status: string;
  health_score: number;
  spend_trend?: string;
  computed_at?: string;
}

export const getGrowthDashboard = async (): Promise<GrowthDashboardResponse> => {
  const response = await api.get<GrowthDashboardResponse>('/api/intelligence/growth');
  return response.data;
};

export const getCustomerIntelligence = async (customerId: number): Promise<CustomerIntelligenceResponse> => {
  const response = await api.get<CustomerIntelligenceResponse>(`/api/intelligence/customer/${customerId}`);
  return response.data;
};

export const dismissRecommendation = async (recId: number): Promise<{ status: string }> => {
  const response = await api.post<{ status: string }>(`/api/intelligence/recommendations/${recId}/dismiss`);
  return response.data;
};

export const getCampaignRoi = async (): Promise<any[]> => {
  const response = await api.get<any[]>('/api/intelligence/campaigns');
  return response.data;
};

export const getRewardEffectiveness = async (): Promise<any[]> => {
  const response = await api.get<any[]>('/api/intelligence/rewards');
  return response.data;
};
