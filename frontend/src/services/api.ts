import { 
  User, RouteFare, RideRequest, RideGroup, 
  Notification, AdminReview, DashboardStats 
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('synride_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      errorMsg = data.detail || data.message || errorMsg;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export const api = {
  // Auth
  async register(data: any) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async verifyOtp(email: string, otp: string) {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    return handleResponse<any>(res);
  },

  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<any>(res);
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User>(res);
  },

  // Rides & Routes
  async getRoutes(): Promise<RouteFare[]> {
    const res = await fetch(`${API_BASE}/rides/routes`);
    return handleResponse<RouteFare[]>(res);
  },

  async createRideRequest(data: any): Promise<RideRequest> {
    const res = await fetch(`${API_BASE}/rides/requests`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<RideRequest>(res);
  },

  async getMyRequests(): Promise<RideRequest[]> {
    const res = await fetch(`${API_BASE}/rides/requests/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<RideRequest[]>(res);
  },

  async findMatches(pickup: string, destination: string, departureTime: string): Promise<any[]> {
    const res = await fetch(`${API_BASE}/rides/match`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        pickup_location: pickup,
        destination: destination,
        departure_time: departureTime,
      }),
    });
    return handleResponse<any[]>(res);
  },

  // Groups
  async createGroup(requestId: number, departureTime: string, estimatedFare?: number): Promise<RideGroup> {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        request_id: requestId,
        departure_time: departureTime,
        estimated_fare: estimatedFare,
      }),
    });
    return handleResponse<RideGroup>(res);
  },

  async getGroups(): Promise<RideGroup[]> {
    const res = await fetch(`${API_BASE}/groups`);
    return handleResponse<RideGroup[]>(res);
  },

  async getMyGroups(): Promise<RideGroup[]> {
    const res = await fetch(`${API_BASE}/groups/me`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<RideGroup[]>(res);
  },

  async getGroupDetails(groupId: number): Promise<RideGroup> {
    const res = await fetch(`${API_BASE}/groups/${groupId}`);
    return handleResponse<RideGroup>(res);
  },

  async joinGroup(groupId: number) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async cancelParticipation(groupId: number, reason: string) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    return handleResponse<any>(res);
  },

  async completeRide(groupId: number) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/complete`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Confirmations
  async setDeadline(groupId: number) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/deadline`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async confirmParticipation(membershipId: number, groupId: number) {
    const res = await fetch(`${API_BASE}/confirmations/${membershipId}/confirm?group_id=${groupId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async declineParticipation(membershipId: number) {
    const res = await fetch(`${API_BASE}/confirmations/${membershipId}/decline`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  // Fares
  async recordActualFare(groupId: number, actualFare: number) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/fare`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ actual_fare: actualFare }),
    });
    return handleResponse<any>(res);
  },

  async getFareBreakdown(groupId: number) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/fare`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  async updatePayment(membershipId: number, status: string) {
    const res = await fetch(`${API_BASE}/fares/${membershipId}/payment`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ payment_status: status }),
    });
    return handleResponse<any>(res);
  },

  // Ratings
  async submitRating(groupId: number, reviewedMembershipId: number, rating: number, reviewText?: string) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/ratings`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        reviewed_membership_id: reviewedMembershipId,
        rating,
        review_text: reviewText,
      }),
    });
    return handleResponse<any>(res);
  },

  async getUserRatings(userId: number) {
    const res = await fetch(`${API_BASE}/users/${userId}/ratings`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any[]>(res);
  },

  // Reports
  async submitReport(data: any) {
    const res = await fetch(`${API_BASE}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<Notification[]>(res);
  },

  async markNotificationRead(id: number) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(res);
  },

  async getEmailPreference(): Promise<{ email_enabled: boolean }> {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<{ email_enabled: boolean }>(res);
  },

  async updateEmailPreference(enabled: boolean) {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ email_enabled: enabled }),
    });
    return handleResponse<any>(res);
  },

  // Admin
  async getAdminDashboard(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<DashboardStats>(res);
  },

  async getAdminReviews(): Promise<AdminReview[]> {
    const res = await fetch(`${API_BASE}/admin/reviews`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminReview[]>(res);
  },

  async resolveAdminReview(reviewId: number, status: string, outcomeNote: string) {
    const res = await fetch(`${API_BASE}/admin/reviews/${reviewId}/resolve`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, outcome_note: outcomeNote }),
    });
    return handleResponse<any>(res);
  },

  async upsertRoute(data: any) {
    const res = await fetch(`${API_BASE}/admin/routes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<any>(res);
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<User[]>(res);
  },
};
