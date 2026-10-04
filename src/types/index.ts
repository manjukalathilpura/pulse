export type UserRole = 'manager' | 'field_staff';

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'field_agent' | 'technician' | 'sales_rep' | 'supervisor' | 'manager';
  department: string;
  avatarUrl: string;
  hourlyRate: number;
  monthlyBaseSalary: number;
  leaveBalance: {
    sick: number;
    casual: number;
    paid: number;
  };
  currentLocation?: {
    latitude: number;
    longitude: number;
    address: string;
    lastUpdated: string;
  };
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO string
  checkOutTime?: string; // ISO string
  latitude: number;
  longitude: number;
  locationName: string;
  selfieUrl?: string;
  status: 'present' | 'late' | 'half_day' | 'on_duty';
  geofenceVerified: boolean;
  geofenceDistanceMeters?: number;
  totalHoursWorked?: number;
  notes?: string;
}

export type DutyStatus = 'assigned' | 'en_route' | 'on_site' | 'completed' | 'cancelled';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent';

export interface DutyAssignment {
  id: string;
  title: string;
  description: string;
  assignedStaffId: string;
  staffName: string;
  clientId: string;
  clientName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: DutyStatus;
  priority: PriorityLevel;
  siteAddress: string;
  latitude: number;
  longitude: number;
  completionNotes?: string;
  completedAt?: string;
}

export type LeaveType = 'sick' | 'casual' | 'paid' | 'emergency';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: LeaveType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  appliedAt: string;
  reviewedAt?: string;
}

export type ClientStage = 'lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'active_client';

export interface FollowUpNote {
  id: string;
  date: string; // ISO
  channel: 'whatsapp' | 'email' | 'call' | 'visit';
  summary: string;
  nextActionDate: string; // YYYY-MM-DD
  loggedBy: string;
}

export interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  stage: ClientStage;
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  assignedStaffId: string;
  assignedStaffName: string;
  followUpHistory: FollowUpNote[];
  dealValue?: number;
}

export interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  month: string; // e.g. "October 2026"
  year: number;
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimePay: number;
  paidLeavesDays: number;
  allowances: {
    transport: number;
    meal: number;
  };
  deductions: {
    tax: number;
    pf: number;
    other: number;
  };
  grossSalary: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  generatedAt: string;
  paymentDate?: string;
}
