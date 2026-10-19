export interface User {
  user_id: number;
  full_name: string;
  email: string;
  user_role: 'STUDENT' | 'FACULTY' | 'ADMIN';
  account_status: 'ACTIVE' | 'SUSPENDED' | 'CLOSED';
  created_at?: string;
  profile_type?: string;
  institutional_id?: string;
  programme?: string;
  study_year?: number;
  staff_category?: string;
  department?: string;
  average_rating?: number;
  total_reviews?: number;
}

export interface RouteFare {
  route_id: number;
  pickup_location: string;
  destination: string;
  estimated_fare: number;
  estimated_duration_minutes: number;
  is_active: string;
}

export interface RideRequest {
  request_id: number;
  requester_id: number;
  requester_name?: string;
  request_type: 'LOOKING_FOR_COMPANIONS' | 'VEHICLE_ARRANGED';
  pickup_location: string;
  destination: string;
  departure_time: string;
  request_status: 'OPEN' | 'MATCHED' | 'CANCELLED' | 'CLOSED';
  created_at: string;
}

export interface GroupMember {
  membership_id: number;
  group_id: number;
  user_id: number;
  full_name: string;
  email: string;
  user_role: string;
  member_role: 'COORDINATOR' | 'PASSENGER';
  membership_status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'LEFT';
  joined_at: string;
  confirmation_status?: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'EXPIRED';
  confirmed_at?: string;
  share_amount?: number;
  payment_status?: 'PENDING' | 'PAID' | 'FAILED' | 'DISPUTED';
}

export interface RideGroup {
  group_id: number;
  request_id: number;
  request_type: string;
  pickup_location: string;
  destination: string;
  departure_time: string;
  group_status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'CLOSED';
  estimated_fare?: number;
  actual_fare?: number;
  confirmation_deadline?: string;
  created_at: string;
  coordinator_id: number;
  coordinator_name: string;
  coordinator_email: string;
  estimated_duration_minutes: number;
  active_member_count: number;
  confirmed_member_count: number;
  members?: GroupMember[];
}

export interface Notification {
  notification_id: number;
  user_id: number;
  group_id?: number;
  notification_type: string;
  message: string;
  is_read: 'Y' | 'N';
  created_at: string;
}

export interface AdminReview {
  review_id: number;
  review_reason: string;
  review_status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  created_at: string;
  group_id?: number;
  cancellation_id?: number;
  report_id?: number;
  assigned_admin_id?: number;
  assigned_admin_name?: string;
  outcome_note?: string;
  reviewed_at?: string;
  report_reason?: string;
  report_description?: string;
  reporter_name?: string;
  reported_user_name?: string;
  cancellation_type?: string;
  cancellation_reason?: string;
  cancelled_by_name?: string;
}

export interface DashboardStats {
  total_users: number;
  active_groups: number;
  completed_rides: number;
  pending_admin_reviews: number;
  total_routes: number;
}
