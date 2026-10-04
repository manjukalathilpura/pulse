import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  StaffMember,
  AttendanceRecord,
  DutyAssignment,
  DutyStatus,
  LeaveRequest,
  LeaveStatus,
  Client,
  FollowUpNote,
  PayrollRecord,
} from '../types';
import {
  INITIAL_STAFF,
  INITIAL_CLIENTS,
  INITIAL_DUTIES,
  INITIAL_ATTENDANCE,
  INITIAL_LEAVES,
  INITIAL_PAYROLL,
} from '../data/mockData';
import { calculateDistanceMeters } from '../utils/geoUtils';

export type ActiveTab = 'dashboard' | 'attendance' | 'duties' | 'clients' | 'hr_payroll';

interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
  timestamp: number;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentStaffId: string;
  setCurrentStaffId: (id: string) => void;
  currentStaff: StaffMember;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isPhoneFrame: boolean;
  setIsPhoneFrame: (val: boolean | ((prev: boolean) => boolean)) => void;

  staffList: StaffMember[];
  clientsList: Client[];
  dutiesList: DutyAssignment[];
  attendanceList: AttendanceRecord[];
  leavesList: LeaveRequest[];
  payrollList: PayrollRecord[];

  // Attendance actions
  markAttendance: (params: {
    latitude: number;
    longitude: number;
    locationName: string;
    selfieUrl?: string;
    notes?: string;
    targetDutyId?: string;
  }) => { success: boolean; record: AttendanceRecord };
  checkOutAttendance: (recordId: string) => void;

  // Duty actions
  createDuty: (duty: Omit<DutyAssignment, 'id' | 'staffName' | 'clientName'>) => void;
  updateDutyStatus: (dutyId: string, status: DutyStatus, notes?: string) => void;
  deleteDuty: (dutyId: string) => void;

  // Client actions
  createClient: (client: Omit<Client, 'id' | 'followUpHistory' | 'assignedStaffName'>) => void;
  updateClient: (client: Client) => void;
  logFollowUp: (clientId: string, note: Omit<FollowUpNote, 'id'>) => void;

  // Leave actions
  submitLeaveRequest: (leave: Omit<LeaveRequest, 'id' | 'staffId' | 'staffName' | 'status' | 'appliedAt'>) => void;
  reviewLeaveRequest: (leaveId: string, status: LeaveStatus, reviewNotes?: string) => void;

  // Payroll actions
  generatePayrollRun: (month: string, year: number) => void;
  updatePayrollStatus: (payrollId: string, status: 'draft' | 'approved' | 'paid') => void;

  // System
  resetToDemoData: () => void;
  toasts: ToastNotification[];
  dismissToast: (id: string) => void;
  addToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  STAFF: 'fieldpulse_staff_v1',
  CLIENTS: 'fieldpulse_clients_v1',
  DUTIES: 'fieldpulse_duties_v1',
  ATTENDANCE: 'fieldpulse_attendance_v1',
  LEAVES: 'fieldpulse_leaves_v1',
  PAYROLL: 'fieldpulse_payroll_v1',
  ROLE: 'fieldpulse_role_v1',
  ACTIVE_STAFF: 'fieldpulse_active_staff_v1',
  PHONE_FRAME: 'fieldpulse_phone_frame_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Role & selection
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return saved === 'field_staff' ? 'field_staff' : 'manager';
  });

  const [currentStaffId, setCurrentStaffIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAFF) || 'staff-1';
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isPhoneFrame, setIsPhoneFrameState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PHONE_FRAME);
    // Default to true on wide screens to show mobile preview, false if screen is already small mobile
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setToasts((prev) => [...prev, { id, type, message, timestamp: Date.now() }]);
    setTimeout(() => {
      dismissToast(id);
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // State collections with localStorage persistence
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    return saved ? JSON.parse(saved) : INITIAL_STAFF;
  });

  const [clientsList, setClientsList] = useState<Client[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [dutiesList, setDutiesList] = useState<DutyAssignment[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DUTIES);
    return saved ? JSON.parse(saved) : INITIAL_DUTIES;
  });

  const [attendanceList, setAttendanceList] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [leavesList, setLeavesList] = useState<LeaveRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LEAVES);
    return saved ? JSON.parse(saved) : INITIAL_LEAVES;
  });

  const [payrollList, setPayrollList] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYROLL);
    return saved ? JSON.parse(saved) : INITIAL_PAYROLL;
  });

  // Sync state to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  }, [role]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_STAFF, currentStaffId);
  }, [currentStaffId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PHONE_FRAME, String(isPhoneFrame));
  }, [isPhoneFrame]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clientsList));
  }, [clientsList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DUTIES, JSON.stringify(dutiesList));
  }, [dutiesList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendanceList));
  }, [attendanceList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leavesList));
  }, [leavesList]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PAYROLL, JSON.stringify(payrollList));
  }, [payrollList]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    addToast(`Switched view to ${newRole === 'manager' ? 'Operations Manager' : 'Field Staff'}`, 'info');
  };

  const setCurrentStaffId = (id: string) => {
    setCurrentStaffIdState(id);
    const staff = staffList.find((s) => s.id === id);
    if (staff) {
      addToast(`Active staff: ${staff.name}`, 'info');
    }
  };

  const setIsPhoneFrame = (val: boolean | ((prev: boolean) => boolean)) => {
    setIsPhoneFrameState(val);
  };

  const currentStaff = staffList.find((s) => s.id === currentStaffId) || staffList[0];

  // Attendance marking
  const markAttendance = ({
    latitude,
    longitude,
    locationName,
    selfieUrl,
    notes,
    targetDutyId,
  }: {
    latitude: number;
    longitude: number;
    locationName: string;
    selfieUrl?: string;
    notes?: string;
    targetDutyId?: string;
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    // Check if staff has assigned duty today to calculate geofence distance
    let geofenceDistance = 35;
    let verified = true;

    if (targetDutyId) {
      const duty = dutiesList.find((d) => d.id === targetDutyId);
      if (duty) {
        geofenceDistance = calculateDistanceMeters(latitude, longitude, duty.latitude, duty.longitude);
        verified = geofenceDistance <= 250;
      }
    }

    const currentHour = new Date().getHours();
    const status: AttendanceRecord['status'] = currentHour >= 10 ? 'late' : 'present';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      date: today,
      checkInTime: nowIso,
      latitude,
      longitude,
      locationName: locationName || 'Client Field Location',
      selfieUrl,
      status,
      geofenceVerified: verified,
      geofenceDistanceMeters: geofenceDistance,
      notes,
    };

    setAttendanceList((prev) => [newRecord, ...prev]);

    // Update staff's current location pin
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === currentStaff.id
          ? {
              ...s,
              currentLocation: {
                latitude,
                longitude,
                address: locationName,
                lastUpdated: 'Just now',
              },
            }
          : s
      )
    );

    addToast(
      `Attendance marked for ${currentStaff.name} (${verified ? 'Geofence Verified' : 'Outside site radius'})`,
      verified ? 'success' : 'warning'
    );

    return { success: true, record: newRecord };
  };

  const checkOutAttendance = (recordId: string) => {
    const nowIso = new Date().toISOString();
    setAttendanceList((prev) =>
      prev.map((rec) => {
        if (rec.id === recordId) {
          const checkIn = new Date(rec.checkInTime).getTime();
          const checkOut = new Date(nowIso).getTime();
          const diffHours = Math.round(((checkOut - checkIn) / (1000 * 60 * 60)) * 10) / 10;
          return {
            ...rec,
            checkOutTime: nowIso,
            totalHoursWorked: Math.max(diffHours, 0.5),
          };
        }
        return rec;
      })
    );
    addToast('Shift ended successfully. Check-out recorded with GPS timestamp.', 'success');
  };

  // Duties
  const createDuty = (dutyData: Omit<DutyAssignment, 'id' | 'staffName' | 'clientName'>) => {
    const staff = staffList.find((s) => s.id === dutyData.assignedStaffId);
    const client = clientsList.find((c) => c.id === dutyData.clientId);

    const newDuty: DutyAssignment = {
      ...dutyData,
      id: `duty-${Date.now()}`,
      staffName: staff?.name || 'Assigned Staff',
      clientName: client?.companyName || 'Target Client',
    };

    setDutiesList((prev) => [newDuty, ...prev]);
    addToast(`New duty assigned to ${newDuty.staffName}`, 'success');
  };

  const updateDutyStatus = (dutyId: string, status: DutyStatus, notes?: string) => {
    const nowIso = new Date().toISOString();
    setDutiesList((prev) =>
      prev.map((d) => {
        if (d.id === dutyId) {
          return {
            ...d,
            status,
            completionNotes: notes || d.completionNotes,
            completedAt: status === 'completed' ? nowIso : d.completedAt,
          };
        }
        return d;
      })
    );
    addToast(`Duty status updated to "${status.replace('_', ' ')}"`, 'success');
  };

  const deleteDuty = (dutyId: string) => {
    setDutiesList((prev) => prev.filter((d) => d.id !== dutyId));
    addToast('Duty assignment removed.', 'info');
  };

  // Clients
  const createClient = (clientData: Omit<Client, 'id' | 'followUpHistory' | 'assignedStaffName'>) => {
    const staff = staffList.find((s) => s.id === clientData.assignedStaffId);
    const newClient: Client = {
      ...clientData,
      id: `client-${Date.now()}`,
      assignedStaffName: staff?.name || 'Operations Lead',
      followUpHistory: [
        {
          id: `fu-${Date.now()}`,
          date: new Date().toISOString(),
          channel: 'call',
          summary: 'Client profile registered in field CRM.',
          nextActionDate: clientData.nextFollowUpDate,
          loggedBy: staff?.name || 'Manager',
        },
      ],
    };

    setClientsList((prev) => [newClient, ...prev]);
    addToast(`New client "${newClient.companyName}" added`, 'success');
  };

  const updateClient = (updatedClient: Client) => {
    setClientsList((prev) => prev.map((c) => (c.id === updatedClient.id ? updatedClient : c)));
    addToast(`Client "${updatedClient.companyName}" updated`, 'info');
  };

  const logFollowUp = (clientId: string, noteData: Omit<FollowUpNote, 'id'>) => {
    const newNote: FollowUpNote = {
      ...noteData,
      id: `fu-${Date.now()}`,
    };

    setClientsList((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          return {
            ...c,
            lastContactDate: new Date().toISOString().split('T')[0],
            nextFollowUpDate: noteData.nextActionDate,
            followUpHistory: [newNote, ...c.followUpHistory],
          };
        }
        return c;
      })
    );
    addToast(`Follow-up logged via ${noteData.channel.toUpperCase()}`, 'success');
  };

  // Leaves
  const submitLeaveRequest = (
    leaveData: Omit<LeaveRequest, 'id' | 'staffId' | 'staffName' | 'status' | 'appliedAt'>
  ) => {
    const newLeave: LeaveRequest = {
      ...leaveData,
      id: `leave-${Date.now()}`,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    setLeavesList((prev) => [newLeave, ...prev]);
    addToast(`Leave request submitted for ${currentStaff.name}`, 'success');
  };

  const reviewLeaveRequest = (leaveId: string, status: LeaveStatus, reviewNotes?: string) => {
    const reviewer = staffList.find((s) => s.role === 'manager')?.name || 'Sarah Jenkins';
    const nowIso = new Date().toISOString();

    setLeavesList((prev) =>
      prev.map((l) => {
        if (l.id === leaveId) {
          return {
            ...l,
            status,
            reviewedBy: reviewer,
            reviewNotes: reviewNotes || l.reviewNotes,
            reviewedAt: nowIso,
          };
        }
        return l;
      })
    );

    // If approved, update staff balance
    if (status === 'approved') {
      const leave = leavesList.find((l) => l.id === leaveId);
      if (leave) {
        setStaffList((prev) =>
          prev.map((s) => {
            if (s.id === leave.staffId) {
              const currentBal = s.leaveBalance[leave.leaveType as keyof typeof s.leaveBalance] || 0;
              return {
                ...s,
                leaveBalance: {
                  ...s.leaveBalance,
                  [leave.leaveType]: Math.max(0, currentBal - leave.daysCount),
                },
              };
            }
            return s;
          })
        );
      }
    }

    addToast(`Leave request marked as ${status.toUpperCase()}`, status === 'approved' ? 'success' : 'warning');
  };

  // Payroll
  const generatePayrollRun = (month: string, year: number) => {
    const generated: PayrollRecord[] = staffList.map((staff) => {
      // Calculate attendance hours logged
      const staffAtt = attendanceList.filter((a) => a.staffId === staff.id);
      const totalHours = staffAtt.reduce((acc, curr) => acc + (curr.totalHoursWorked || 8), 0) || 160;
      const regularHours = Math.min(totalHours, 160);
      const overtimeHours = Math.max(0, totalHours - 160);
      const overtimePay = Math.round(overtimeHours * staff.hourlyRate * 1.5);
      const allowances = { transport: 260, meal: 160 };
      const gross = staff.monthlyBaseSalary + overtimePay + allowances.transport + allowances.meal;
      const deductions = {
        tax: Math.round(gross * 0.12),
        pf: Math.round(gross * 0.05),
        other: 50,
      };
      const totalDeductions = deductions.tax + deductions.pf + deductions.other;
      const net = gross - totalDeductions;

      return {
        id: `pay-${staff.id}-${month.replace(/\s+/g, '')}`,
        staffId: staff.id,
        staffName: staff.name,
        month,
        year,
        baseSalary: staff.monthlyBaseSalary,
        regularHours,
        overtimeHours,
        hourlyRate: staff.hourlyRate,
        overtimePay,
        paidLeavesDays: 1,
        allowances,
        deductions,
        grossSalary: gross,
        netSalary: net,
        status: 'draft',
        generatedAt: new Date().toISOString(),
      };
    });

    setPayrollList(generated);
    addToast(`Payroll generated for ${month} (${generated.length} employees)`, 'success');
  };

  const updatePayrollStatus = (payrollId: string, status: 'draft' | 'approved' | 'paid') => {
    setPayrollList((prev) =>
      prev.map((p) =>
        p.id === payrollId
          ? {
              ...p,
              status,
              paymentDate: status === 'paid' ? new Date().toISOString().split('T')[0] : p.paymentDate,
            }
          : p
      )
    );
    addToast(`Payslip marked as ${status.toUpperCase()}`, 'success');
  };

  const resetToDemoData = () => {
    setStaffList(INITIAL_STAFF);
    setClientsList(INITIAL_CLIENTS);
    setDutiesList(INITIAL_DUTIES);
    setAttendanceList(INITIAL_ATTENDANCE);
    setLeavesList(INITIAL_LEAVES);
    setPayrollList(INITIAL_PAYROLL);
    addToast('Demo database reset to factory state.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentStaffId,
        setCurrentStaffId,
        currentStaff,
        activeTab,
        setActiveTab,
        isPhoneFrame,
        setIsPhoneFrame,
        staffList,
        clientsList,
        dutiesList,
        attendanceList,
        leavesList,
        payrollList,
        markAttendance,
        checkOutAttendance,
        createDuty,
        updateDutyStatus,
        deleteDuty,
        createClient,
        updateClient,
        logFollowUp,
        submitLeaveRequest,
        reviewLeaveRequest,
        generatePayrollRun,
        updatePayrollStatus,
        resetToDemoData,
        toasts,
        dismissToast,
        addToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
