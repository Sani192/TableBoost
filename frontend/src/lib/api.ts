import axios from 'axios';

export interface AddVisitPayload {
  phone_number: string;
  name?: string;
  amount?: number;
  send_sms?: boolean;
  birthday?: string;
  anniversary?: string;
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
    campaign_roi: {
      total_messages: number;
      converted_messages: number;
      conversion_rate: number;
      revenue_generated: number;
    };
  };
  segments: {
    vips_count: number;
    at_risk_count: number;
    near_rewards_count: number;
    lost_count: number;
    new_blood_count: number;
  };
}

export interface VisitDetail {
  id: number;
  customer_id: number;
  customer_name?: string;
  phone_number: string;
  amount?: number;
  status?: string;
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
  baseURL: '',
  timeout: 8000,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const restaurantId = window.localStorage.getItem('tableboost.currentRestaurantId');
    if (restaurantId) {
      config.headers['X-Restaurant-ID'] = restaurantId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Global session expiration handler (401)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('tableboost.currentRestaurantId');
        window.localStorage.removeItem('tableboost.visits');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      const authError = new Error('Session expired. Please log in again.');
      (authError as any).status = 401;
      return Promise.reject(authError);
    }

    // If it's a normalized TableBoost backend error
    if (error.response?.data?.error === true && error.response?.data?.message) {
      const tbError = new Error(error.response.data.message);
      (tbError as any).status = error.response.status;
      (tbError as any).type = error.response.data.type;
      (tbError as any).payload = error.response.data.payload;
      (tbError as any).correlationId = error.response.data.correlation_id || null;
      return Promise.reject(tbError);
    }

    // Fallback for standard Axios network errors
    const fallbackError = new Error(error.message || 'A network error occurred. Please check your connection.');
    (fallbackError as any).status = error.response?.status || 500;
    (fallbackError as any).correlationId = error.response?.headers?.['x-correlation-id'] || null;
    return Promise.reject(fallbackError);
  }
);

export const addVisit = async (payload: AddVisitPayload): Promise<AddVisitResponse> => {
  const response = await api.post<AddVisitResponse>('/api/visits', payload);
  return response.data;
};

export const refundVisit = async (visitId: number): Promise<AddVisitResponse> => {
  const response = await api.post<AddVisitResponse>(`/api/visits/${visitId}/refund`);
  return response.data;
};

export const getDashboard = async (): Promise<DashboardResponse> => {
  const response = await api.get<DashboardResponse>('/api/dashboard');
  return response.data;
};

export const getVisits = async (params: GetVisitsParams = {}): Promise<VisitDetail[]> => {
  const response = await api.get<VisitDetail[]>('/api/visits', { params });
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

export interface CustomerDetailResponse extends CustomerListResponse { }

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
  const response = await api.get<CustomerListResponse[]>('/api/customers', { params });
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
  const response = await api.get<MessageLogResponse[]>('/api/messages', { params });
  return response.data;
};

export const createCampaign = async (payload: CampaignCreateRequest): Promise<{ sent_count: number; failed_count: number; total: number }> => {
  const response = await api.post('/api/messages/campaign', payload);
  return response.data;
};

export const getCampaignAudienceCount = async (audienceType: string, inactiveDays?: number): Promise<{ count: number }> => {
  const response = await api.get('/api/messages/campaign/audience-count', { params: { audience_type: audienceType, inactive_days: inactiveDays } });
  return response.data;
};

export const getCampaignCustomers = async (campaignId: number, skip: number = 0, limit: number = 20): Promise<Array<{ id: number; name: string; phone_number: string; status: string; amount: number; visited_at: string | null }>> => {
  const response = await api.get(`/api/intelligence/campaigns/${campaignId}/customers`, { params: { skip, limit } });
  return response.data;
};

export const getRewardCustomers = async (rewardId: number, skip: number = 0, limit: number = 20): Promise<Array<{ id: number; name: string; phone_number: string; status: string; amount: number; visited_at: string | null }>> => {
  const response = await api.get(`/api/intelligence/rewards/${rewardId}/customers`, { params: { skip, limit } });
  return response.data;
};

export const getAllRewardCustomers = async (skip: number = 0, limit: number = 20): Promise<Array<{ id: number; name: string; phone_number: string; status: string; amount: number; visited_at: string | null }>> => {
  const response = await api.get('/api/intelligence/rewards/customers', { params: { skip, limit } });
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
  const response = await api.get<SettingsResponse>('/api/settings');
  return response.data;
};

export const updateSettings = async (payload: SettingsUpdate): Promise<SettingsResponse> => {
  const response = await api.post<SettingsResponse>('/api/settings', payload);
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
  schedule?: string;
  settings?: Record<string, any>;
}

export const getAutomationConfigs = async (): Promise<AutomationConfig[]> => {
  const response = await api.get<AutomationConfig[]>('/api/automation');
  return response.data;
};

export const updateAutomationConfig = async (payload: Partial<AutomationConfig>): Promise<AutomationConfig> => {
  const response = await api.post<AutomationConfig>('/api/automation', payload);
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

export const getIntelligenceCustomers = async (params: { filter?: string; skip?: number; limit?: number }): Promise<any[]> => {
  const response = await api.get<any[]>('/api/intelligence/customers', { params });
  return response.data;
};

export const changePassword = async (payload: { current_password: string; new_password: string }): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/change-password', payload);
  return response.data;
};

export interface UserProfileResponse {
  id: number;
  user_id: number;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  first_name?: string | null;
  last_name?: string | null;
}

export const getProfile = async (): Promise<UserProfileResponse> => {
  const response = await api.get<UserProfileResponse>('/api/auth/profile');
  return response.data;
};

export const updateProfile = async (payload: UserProfileUpdate): Promise<UserProfileResponse> => {
  const response = await api.put<UserProfileResponse>('/api/auth/profile', payload);
  return response.data;
};

export interface AuditLogItem {
  id: number;
  timestamp: string;
  actor_id: number | null;
  actor_username: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  status: string;
  metadata_json: any | null;
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  pages: number;
}

export interface OperationalLogItem {
  id: number;
  timestamp: string;
  log_type: string;
  event_name: string;
  job_id: string | null;
  status: string;
  message: string | null;
  duration_ms: number | null;
  metadata_json: any | null;
}

export interface PaginatedOperationalLogs {
  items: OperationalLogItem[];
  total: number;
  page: number;
  pages: number;
}

export const getAuditLogs = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  actor_username?: string;
  action?: string;
  entity_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_dir?: string;
}, signal?: AbortSignal): Promise<PaginatedAuditLogs> => {
  const response = await api.get<PaginatedAuditLogs>('/api/governance/audit', { params, signal });
  return response.data;
};

export const getOperationalLogs = async (params: {
  page?: number;
  limit?: number;
  search?: string;
  log_type?: string;
  event_name?: string;
  job_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_dir?: string;
}, signal?: AbortSignal): Promise<PaginatedOperationalLogs> => {
  const response = await api.get<PaginatedOperationalLogs>('/api/governance/operational', { params, signal });
  return response.data;
};
