# FieldPulse: Cloud Mobile Workforce & Client Operations Management

A secure, cloud-based mobile application designed for field staff and operations managers. It unifies GPS attendance marking, live shift/duty dispatch, leave administration, automated payroll calculation, client relationship follow-ups (with 1-tap WhatsApp and email triggers), and executive reporting dashboards.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The app is architected with dual-persona switching (Manager Dashboard vs. Field Staff Portal), real-time browser Geolocation API with mock site geofence verification, instant WhatsApp (`wa.me`) & Mailto outreach dispatchers, and persistent cloud-ready data models.

- **Dual-Persona Switcher**: Seamless toggle between **Field Staff** (mobile-first thumb interface for check-in, assigned duties, personal payslips, leave requests) and **Operations Manager** (duty scheduler, live attendance radar, leave approval inbox, payroll generation, client CRM, executive reports).
- **Attendance & Location Protocol**: Native HTML5 Geolocation with site distance calculation, camera-based selfie photo verification, and shift breadcrumbs.
- **Client Follow-Up Dispatcher**: Instant deep-links to WhatsApp and Email with customized prefilled templates (e.g., Quotation follow-up, Visit confirmation, Overdue reminder).
- **Backend & Cloud Persistence**: Firestore cloud database blueprint with immediate offline fallback so the app works seamlessly even in low-connectivity field environments.

---

## 1. Overview & Core Concept

### What It Does
FieldPulse is an enterprise-grade mobile operations suite for distributed teams, field service engineers, sales representatives, and site supervisors. Employees log in, mark attendance with verified GPS coordinates and selfie stamps, view assigned client visits or duties, request leaves, and inspect payslips. Managers manage duty rosters, monitor live team attendance on a map, track client follow-up pipelines with overdue alerts, approve leaves, and compute monthly payroll with exportable reports.

### Target Audience & Personas
1. **Field Staff / Service Agents**: On-the-go workers needing fast, single-thumb check-ins, clear daily routes, task instructions, and direct client call/message triggers.
2. **Operations Managers & Supervisors**: Leaders who require real-time visibility into who is on duty, client follow-up SLAs, team scheduling, and payroll ledger accuracy.

### Key Value
Eliminates fragmented spreadsheets, manual WhatsApp check-in messages, and paper attendance sheets by combining workforce compliance, scheduling, client communication, and payroll calculation into one mobile-first cloud application.

---

## 2. User Experience & Visual Design

### Key User Flows

#### A. Field Worker Daily Flow
1. **Morning Check-In**: Opens app on mobile -> Views assigned duty location -> Taps "Mark Attendance" -> Browser captures GPS coordinates & accuracy -> Captures live selfie verification -> System confirms geofence validation -> Shift timer starts.
2. **Duty Execution**: Taps "Duties" tab -> Sees today's client visits ordered by priority and time -> Taps "Navigate / View Details" -> Updates status (En Route -> On Site -> Completed) with visit notes.
3. **Client Follow-Up**: Taps client card -> One-tap "Open WhatsApp" opens WhatsApp with pre-filled message template -> Taps "Log Status" to set follow-up reminder date.
4. **Shift Checkout & Personal HR**: Checks out at end of day with final location ping -> Checks leave balance or submits leave request -> Views monthly payslip breakups.

#### B. Manager Supervision Flow
1. **Executive Morning Radar**: Views live KPI tiles (Total Staff, Present, On Leave, Late, Active Shifts) -> Taps "Field Map Radar" to see staff locations vs assigned client sites.
2. **Duty Assignment**: Taps "+ Assign Duty" -> Selects staff member, client, duty type, start/end time, and special instructions -> Pushes assignment to field worker's feed.
3. **Client Follow-Up Management**: Inspects CRM pipeline (Lead, Contacted, Proposal, Follow-up, Closed) -> Filters clients with overdue reminders -> Dispatches WhatsApp/Email follow-up.
4. **Payroll & Leave Approvals**: Reviews pending leave requests -> 1-tap Approve/Reject with balance auto-deduction -> Reviews monthly payroll sheet with gross pay, overtime, deductions, and net payouts.

### Visual Identity & Theme
- **Aesthetic Direction**: High-density, utilitarian mobile operations interface inspired by modern field logistics software. Clean structural layouts, large touch targets, tactile action sheets, and crisp contrast for outdoor mobile use.
- **Color Palette**:
  - Neutral Canvas: Crisp light background (`#f8fafc` / Slate-50) with elevated white card surfaces (`#ffffff`).
  - Dark Mode / Slate Elements: Deep midnight slate (`#0f172a`) for primary headers, navigation bars, and emphasis text.
  - Primary Brand Accent: International Cobalt Blue (`#2563eb` / `#1d4ed8`) for high-intent actions, check-in buttons, and active tabs.
  - Semantic Status Colors: Emerald Green (`#059669`) for Present/On-Site/Won, Amber (`#d97706`) for Pending/Follow-Up, Crimson (`#dc2626`) for Absent/Overdue/Rejected.
- **Typography & Hierarchy**:
  - Primary Typography: `Plus Jakarta Sans` for clean, modern legibility on smartphone screens.
  - Metrics & Telemetry: `tabular-nums font-mono` for GPS coordinates, timestamps, currency amounts, and payroll figures.
  - Zero-Pill Discipline: Metadata (dates, categories, status labels) formatted as clean unboxed text with typographic separators (`·`, `/`) instead of chunky badges.
- **Mobile Ergonomics & Spatial Math**:
  - Fixed compact top bar with brand mark, role switcher, and quick profile.
  - Thumb-zone bottom tab bar (5 main destinations) with $\ge 48\text{px}$ touch hitboxes.
  - Smooth bottom sheets and full-height drawers for creating new clients, assigning duties, and submitting leave requests.
  - Desktop-to-Mobile switchable frame option for reviewers evaluating both mobile phone and wide manager viewports.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Dual-Persona Experience in a Unified App
- **Chosen Approach**: Built-in interactive role switcher (`Manager Suite` vs. `Field Staff Mobile`) accessible directly in the top app bar.
- **Why**: Allows instant evaluation and testing of both end-to-end user workflows without requiring separate devices or manual database re-seeding.
- **Alternatives Considered**: Forcing strict login credentials for two separate apps, which slows down testing and demonstrations.

### Decision 2: Real Geolocation API with Intelligent Fallback
- **Chosen Approach**: Use native browser `navigator.geolocation.getCurrentPosition` with high accuracy. If location permissions are blocked or tested on desktop, seamlessly provides simulated site geofencing with interactive coordinate picking so users never get blocked.
- **Why**: Guarantees authentic device location capture on phones while ensuring 100% testability on desktops and sandboxes.

### Decision 3: WhatsApp & Email Integration via Deep Links
- **Chosen Approach**: Direct universal URL generation (`https://wa.me/{phone}?text={encodedMessage}`) and RFC `mailto:` links with pre-filled subjects and templates.
- **Why**: Works instantly on any mobile phone or desktop without requiring paid 3rd-party WhatsApp Business API gateways or Twilio keys, while giving field agents 1-tap client messaging.

### Decision 4: Automated Payroll Engine
- **Chosen Approach**: Deterministic calculation based on base wage, daily hours logged via attendance check-in/out, overtime multiplier ($1.5\times$), paid leave credits, and tax/PF deductions.
- **Why**: Provides an immediate, transparent breakdown and PDF/Print-ready digital payslips for employees and payroll export for managers.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FieldPulse Mobile App                           │
└────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌───────────────────────┐                         ┌───────────────────────┐
│  Manager Dashboard    │                         │  Field Staff Portal   │
│  - Staff Presence     │                         │  - GPS Check-In/Out   │
│  - Duty Dispatcher    │                         │  - Today's Route/Tasks│
│  - Leave Approvals    │                         │  - Leave Request Form │
│  - Client Pipeline    │                         │  - Personal Payslip   │
│  - Payroll Engine     │                         │  - Client 1-Tap WA    │
│  - Operations Reports │                         │                       │
└───────────────────────┘                         └───────────────────────┘
           │                                                 │
           └────────────────────────┬────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Core Feature Modules                           │
├───────────────────┬───────────────────┬──────────────────┬─────────────┤
│ Attendance & GPS  │ Duty & Rostering  │ Leaves & Payroll │ Client CRM  │
│ - Geolocation API │ - Staff Schedule  │ - Leave Balances │ - WhatsApp  │
│ - Selfie Camera   │ - Shift Status    │ - Payslip Calc   │ - Reminders │
│ - Geofence Check  │ - Site Mapping    │ - PDF Generator  │ - Mailto    │
└───────────────────┴───────────────────┴──────────────────┴─────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   State Management & Data Store                        │
│ - React Context / Custom Hooks with persistent LocalStorage / Cloud    │
│ - Pre-seeded operational dataset (5 staff, 8 clients, duties, leaves)   │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Entities & Schema

```typescript
// Core Data Models
interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'field_agent' | 'technician' | 'sales_rep' | 'manager';
  department: string;
  avatarUrl: string;
  hourlyRate: number;
  monthlyBaseSalary: number;
  leaveBalance: { sick: number; casual: number; paid: number };
}

interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // ISO
  checkOutTime?: string;
  latitude: number;
  longitude: number;
  locationName: string;
  selfieUrl?: string;
  status: 'present' | 'late' | 'half_day' | 'on_duty';
  geofenceVerified: boolean;
  totalHoursWorked?: number;
}

interface DutyAssignment {
  id: string;
  title: string;
  description: string;
  assignedStaffId: string;
  clientId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'assigned' | 'en_route' | 'on_site' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  siteAddress: string;
  latitude: number;
  longitude: number;
  completionNotes?: string;
}

interface LeaveRequest {
  id: string;
  staffId: string;
  leaveType: 'sick' | 'casual' | 'paid' | 'emergency';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewNotes?: string;
  appliedAt: string;
}

interface Client {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  address: string;
  latitude: number;
  longitude: number;
  stage: 'lead' | 'contacted' | 'proposal_sent' | 'negotiation' | 'active_client';
  lastContactDate: string;
  nextFollowUpDate: string;
  notes: string;
  assignedStaffId?: string;
}

interface PayrollRecord {
  id: string;
  staffId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  regularHours: number;
  overtimeHours: number;
  overtimePay: number;
  paidLeaves: number;
  deductions: { tax: number; pf: number; other: number };
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  generatedAt: string;
}
```

### Interactive State Transitions & Component Map
1. **Attendance Marking**:
   - `useGeolocation` hook handles active GPS lookup with permission error handling.
   - Live camera viewfinder modal with snapshot capture & fallback file upload.
   - Immediate feedback showing distance to client/site geofence (e.g. "Within 45m of Assigned Site - Verified").
2. **Duty Rostering & Assignment**:
   - Filter duties by staff, date, and status.
   - Quick status update button sheet for field workers ("Start Travel", "Reached Site", "Mark Completed").
   - Manager "+ New Duty" modal with auto-fill from client location database.
3. **Client Follow-Up & Outreach**:
   - Filter by Follow-Up Status ("Due Today", "Overdue", "Upcoming").
   - WhatsApp action button generates `https://wa.me/{phone}?text={template}` and launches WhatsApp app.
   - Email action button generates `mailto:` with subject line and customized greeting.
   - Log activity modal to record conversation outcome and automatically schedule the next reminder.
4. **Leave & Payroll Engine**:
   - Leave submission drawer with date picker, balance calculator, and manager approval buttons.
   - Dynamic monthly payroll calculator with printable payslip popup modal (formatted for standard paper/PDF download).
5. **Manager Analytics & Reports**:
   - Real-time KPI summary (Presenteeism %, Active Field Duties, Overdue Follow-ups, Payroll Total).
   - Staff location radar widget showing live pinned positions.
   - CSV export for attendance logs, client follow-up histories, and payroll sheets.
