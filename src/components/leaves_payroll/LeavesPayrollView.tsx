import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRequest, PayrollRecord } from '../../types';
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
  DollarSign,
  Plus,
  X,
  Download,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { BiometricGuard } from '../biometrics/BiometricGuard';
import { exportPayrollPdf } from '../../utils/pdfExportUtils';

export const LeavesPayrollView: React.FC = () => {
  const {
    role,
    currentStaff,
    leavesList,
    payrollList,
    submitLeaveRequest,
    reviewLeaveRequest,
    generatePayrollRun,
    updatePayrollStatus,
    staffList,
    addToast,
  } = useApp();

  // Tab mode
  const [subTab, setSubTab] = useState<'payroll' | 'leaves'>('payroll');

  // Modals
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [inspectPayslip, setInspectPayslip] = useState<PayrollRecord | null>(null);

  // Leave form state
  const [leaveType, setLeaveType] = useState<LeaveType>('casual');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  // Calculate days difference
  const calcDays = () => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    const diff = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
    return isNaN(diff) ? 1 : diff;
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      addToast('Please enter a brief reason for your leave request.', 'warning');
      return;
    }

    const days = calcDays();
    const currentBalance = currentStaff.leaveBalance[leaveType as keyof typeof currentStaff.leaveBalance] || 0;
    if (days > currentBalance) {
      addToast(`Requested ${days} days exceeds your available ${leaveType} balance (${currentBalance} remaining).`, 'warning');
    }

    submitLeaveRequest({
      leaveType,
      startDate,
      endDate,
      daysCount: days,
      reason,
    });

    setShowLeaveModal(false);
    setReason('');
  };

  // Filtered leaves
  const displayedLeaves =
    role === 'field_staff'
      ? leavesList.filter((l) => l.staffId === currentStaff.id)
      : leavesList;

  // Filtered payroll
  const displayedPayroll =
    role === 'field_staff'
      ? payrollList.filter((p) => p.staffId === currentStaff.id)
      : payrollList;

  // Aggregate payroll metrics for manager
  const totalGrossPayroll = payrollList.reduce((acc, curr) => acc + curr.grossSalary, 0);
  const totalNetPayroll = payrollList.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalOvertimeHours = payrollList.reduce((acc, curr) => acc + curr.overtimeHours, 0);

  return (
    <div className="space-y-4">
      {/* Header & Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            {subTab === 'payroll' ? 'Payroll & Compensation Engine' : 'Leave Administration'}
          </h2>
          <p className="text-xs text-slate-500">
            {subTab === 'payroll'
              ? 'Automated salary calculation based on GPS attendance & overtime'
              : 'Leave applications, quotas, and manager approval queues'}
          </p>
        </div>

        {/* Sub-tab Pill Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setSubTab('payroll')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
              subTab === 'payroll'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payroll & Payslips
          </button>
          <button
            onClick={() => setSubTab('leaves')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[32px] ${
              subTab === 'leaves'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Leave Management
          </button>
        </div>
      </div>

      {/* ================= PAYROLL SECTION ================= */}
      {subTab === 'payroll' && (
        <BiometricGuard
          scope="payroll"
          title="Payroll & Wage Ledger"
          description="Access to confidential compensation, overtime records, hourly rates, and employee payslips requires WebAuthn biometric verification."
        >
          <div className="space-y-4">
          {/* Manager Summary KPIs */}
          {role === 'manager' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                  Total Monthly Payroll
                </span>
                <div className="text-2xl font-bold font-mono text-slate-900 mt-0.5">
                  ${totalGrossPayroll.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Net Disbursable: <strong className="text-slate-700">${totalNetPayroll.toLocaleString()}</strong>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                  Overtime Logged
                </span>
                <div className="text-2xl font-bold font-mono text-blue-600 mt-0.5">
                  {totalOvertimeHours} hrs
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Calculated at 1.5x base hourly tier
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Payroll Run Action
                  </span>
                  <div className="text-xs font-medium text-slate-700 mt-1">
                    Recalculate with latest GPS timesheets
                  </div>
                </div>
                <button
                  onClick={() => generatePayrollRun('October 2026', 2026)}
                  className="mt-2 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors text-center"
                >
                  Run Monthly Cycle
                </button>
              </div>
            </div>
          )}

          {/* Payslip Records List */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-900">
                {role === 'field_staff' ? `My Payslips (${currentStaff.name})` : 'Workforce Payroll Ledger'}
              </h3>
              <div className="flex items-center gap-2">
                {role === 'manager' && (
                  <button
                    type="button"
                    onClick={() => {
                      exportPayrollPdf(payrollList, staffList);
                      addToast(`Exported official payroll ledger PDF (${payrollList.length} staff).`, 'success');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                )}
                <span className="text-xs text-slate-500 font-mono">Cycle: September 2026</span>
              </div>
            </div>

            {displayedPayroll.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No payroll statements generated yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedPayroll.map((pay) => (
                  <div key={pay.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{pay.staffName}</span>
                        <span
                          className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md ${
                            pay.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : pay.status === 'approved'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>

                      <div className="text-slate-500 text-[11px] flex items-center gap-2 font-mono">
                        <span>Base: ${pay.baseSalary.toLocaleString()}</span>
                        <span>·</span>
                        <span>Reg: {pay.regularHours}h</span>
                        <span>·</span>
                        <span className="text-blue-600 font-semibold">OT: +{pay.overtimeHours}h (${pay.overtimePay})</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="text-sm font-bold font-mono text-slate-900">
                        ${pay.netSalary.toLocaleString()}
                        <span className="text-[10px] font-sans text-slate-400 font-normal ml-1">NET</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectPayslip(pay)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>View Slip</span>
                        </button>

                        {role === 'manager' && pay.status === 'draft' && (
                          <button
                            onClick={() => updatePayrollStatus(pay.id, 'approved')}
                            className="text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded-md"
                          >
                            Approve
                          </button>
                        )}

                        {role === 'manager' && pay.status === 'approved' && (
                          <button
                            onClick={() => updatePayrollStatus(pay.id, 'paid')}
                            className="text-[11px] font-semibold text-purple-700 hover:bg-purple-50 px-2 py-1 rounded-md"
                          >
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BiometricGuard>
      )}

      {/* ================= LEAVES SECTION ================= */}
      {subTab === 'leaves' && (
        <div className="space-y-4">
          {/* Employee Leave Balance Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Sick Leave
              </span>
              <div className="text-xl font-bold font-mono text-rose-600 mt-0.5">
                {currentStaff.leaveBalance.sick} <span className="text-xs font-sans text-slate-400">days</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Casual Leave
              </span>
              <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                {currentStaff.leaveBalance.casual} <span className="text-xs font-sans text-slate-400">days</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-xs">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Paid Time Off
              </span>
              <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">
                {currentStaff.leaveBalance.paid} <span className="text-xs font-sans text-slate-400">days</span>
              </div>
            </div>
          </div>

          {/* Action Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              {role === 'manager' ? 'All Workforce Leave Applications' : 'My Leave Requests'}
            </h3>

            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-all min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leaves List */}
          <div className="space-y-3">
            {displayedLeaves.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-500">
                No leave requests found.
              </div>
            ) : (
              displayedLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{leave.staffName}</span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 bg-slate-100 rounded text-slate-700">
                          {leave.leaveType} Leave
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {leave.startDate} to {leave.endDate} · <strong>{leave.daysCount} days</strong>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        leave.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : leave.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{leave.reason}"
                  </p>

                  {leave.reviewedBy && (
                    <div className="text-[11px] text-slate-500">
                      Reviewed by {leave.reviewedBy}: {leave.reviewNotes || 'Confirmed'}
                    </div>
                  )}

                  {/* Manager Approval Controls */}
                  {role === 'manager' && leave.status === 'pending' && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() =>
                          reviewLeaveRequest(leave.id, 'rejected', 'Staff coverage unavailable')
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        onClick={() =>
                          reviewLeaveRequest(leave.id, 'approved', 'Approved by manager')
                        }
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Leave</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Printable / Downloadable Payslip Modal */}
      {inspectPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
            {/* Header Voucher */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                  FP
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">FieldPulse Operations</h3>
                  <p className="text-[10px] text-slate-500">Official Monthly Compensation Voucher</p>
                </div>
              </div>

              <button
                onClick={() => setInspectPayslip(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Employee Meta */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Employee Name</span>
                <span className="font-bold text-slate-800">{inspectPayslip.staffName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Pay Period</span>
                <span className="font-semibold text-slate-800">{inspectPayslip.month}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Base Hourly Rate</span>
                <span className="font-mono text-slate-800">${inspectPayslip.hourlyRate}/hr</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Disbursement Status</span>
                <span className="font-semibold uppercase text-emerald-700">{inspectPayslip.status}</span>
              </div>
            </div>

            {/* Earnings Breakdown */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">
                Earnings & Allowances
              </h4>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Base Salary (160 Hours Standard)</span>
                <span className="font-mono font-semibold text-slate-800">
                  ${inspectPayslip.baseSalary.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">
                  Overtime Pay ({inspectPayslip.overtimeHours} hrs @ 1.5x)
                </span>
                <span className="font-mono font-semibold text-blue-600">
                  +${inspectPayslip.overtimePay.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Field Transport Allowance</span>
                <span className="font-mono font-semibold text-slate-800">
                  +${inspectPayslip.allowances.transport.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Meal & Daily Per Diem</span>
                <span className="font-mono font-semibold text-slate-800">
                  +${inspectPayslip.allowances.meal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-slate-100 font-bold">
                <span>Gross Earnings</span>
                <span className="font-mono text-slate-900">${inspectPayslip.grossSalary.toFixed(2)}</span>
              </div>
            </div>

            {/* Deductions Breakdown */}
            <div className="space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1 uppercase tracking-wider text-[10px]">
                Statutory Deductions
              </h4>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Withholding Income Tax (12%)</span>
                <span className="font-mono text-rose-600">-${inspectPayslip.deductions.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Provident Fund / Social Security (5%)</span>
                <span className="font-mono text-rose-600">-${inspectPayslip.deductions.pf.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Professional Insurance</span>
                <span className="font-mono text-rose-600">-${inspectPayslip.deductions.other.toFixed(2)}</span>
              </div>
            </div>

            {/* Net Total Box */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                  Total Net Payable Amount
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ${inspectPayslip.netSalary.toFixed(2)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">USD</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Payslip</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addToast('Payslip downloaded to local records.', 'success');
                  setInspectPayslip(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">Request Leave of Absence</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Leave Category:</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="sick">Sick Leave ({currentStaff.leaveBalance.sick} days left)</option>
                  <option value="casual">Casual Leave ({currentStaff.leaveBalance.casual} days left)</option>
                  <option value="paid">Paid Time Off ({currentStaff.leaveBalance.paid} days left)</option>
                  <option value="emergency">Emergency Absence</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Start Date:</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">End Date:</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="text-[11px] text-blue-700 font-semibold bg-blue-50 p-2 rounded-lg">
                Calculated duration: {calcDays()} calendar day(s)
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Reason for Absence:</label>
                <textarea
                  rows={3}
                  placeholder="Provide context for manager review..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
