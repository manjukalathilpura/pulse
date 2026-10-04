import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Download,
  Printer,
  X,
  Calendar,
  Users,
  Compass,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Building,
} from 'lucide-react';
import { exportAttendancePdf, exportPayrollPdf } from '../../utils/pdfExportUtils';

interface PdfExportModalProps {
  onClose: () => void;
  initialType?: 'attendance' | 'payroll';
}

export const PdfExportModal: React.FC<PdfExportModalProps> = ({
  onClose,
  initialType = 'attendance',
}) => {
  const { staffList, attendanceList, payrollList, addToast } = useApp();

  const [reportType, setReportType] = useState<'attendance' | 'payroll'>(initialType);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [attendanceRange, setAttendanceRange] = useState<'all' | 'today' | 'last7' | 'month'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculate filtered attendance
  const filteredAttendance = attendanceList.filter((a) => {
    if (selectedStaffId !== 'all' && a.staffId !== selectedStaffId) return false;
    if (attendanceRange === 'today') return a.date === todayStr;
    if (attendanceRange === 'last7') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return a.date >= d.toISOString().split('T')[0];
    }
    return true;
  });

  // Calculate filtered payroll
  const filteredPayroll = payrollList.filter((p) => {
    if (selectedStaffId !== 'all' && p.staffId !== selectedStaffId) return false;
    if (selectedMonth !== 'all' && p.month !== selectedMonth) return false;
    return true;
  });

  const handleDownload = () => {
    if (reportType === 'attendance') {
      if (filteredAttendance.length === 0) {
        addToast('No attendance records found matching current filters.', 'warning');
        return;
      }
      exportAttendancePdf(filteredAttendance, staffList, {
        staffId: selectedStaffId,
      });
      addToast(
        `Generated Attendance PDF with ${filteredAttendance.length} verified shift logs.`,
        'success'
      );
    } else {
      if (filteredPayroll.length === 0) {
        addToast('No payroll statements found matching current filters.', 'warning');
        return;
      }
      exportPayrollPdf(filteredPayroll, staffList, {
        staffId: selectedStaffId,
        month: selectedMonth,
      });
      addToast(
        `Generated Payroll Ledger PDF for ${filteredPayroll.length} workforce members.`,
        'success'
      );
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalGross = filteredPayroll.reduce((acc, curr) => acc + curr.grossSalary, 0);
  const totalNet = filteredPayroll.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalHours = filteredAttendance.reduce((acc, curr) => acc + (curr.totalHoursWorked || 8), 0);
  const verifiedCount = filteredAttendance.filter((a) => a.geofenceVerified).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Export Manager PDF Reports
              </h3>
              <p className="text-xs text-slate-500">
                Official documents with verified GPS coordinates, timestamps, and audit signatures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Configuration & Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Document Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              1. Select Report Document Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReportType('attendance')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  reportType === 'attendance'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    reportType === 'attendance'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Attendance & Location Audit
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Shift check-in/out timestamps, GPS coordinates, geofence radius check, hours logged
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setReportType('payroll')}
                className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  reportType === 'payroll'
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    reportType === 'payroll'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    Workforce Payroll Ledger
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Base wages, regular/overtime hours, allowances, tax/PF deductions, net payables
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Filter Bar: Personnel & Date Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            {/* Personnel Filter */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Personnel Scope</span>
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-blue-600"
              >
                <option value="all">All Workforce Members ({staffList.length} staff)</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Specific Time Filter */}
            {reportType === 'attendance' ? (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Timeframe</span>
                </label>
                <select
                  value={attendanceRange}
                  onChange={(e) => setAttendanceRange(e.target.value as 'all' | 'today' | 'last7' | 'month')}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-blue-600"
                >
                  <option value="all">All Recorded Shifts ({attendanceList.length} logs)</option>
                  <option value="today">Today's Shifts Only ({todayStr})</option>
                  <option value="last7">Past 7 Days</option>
                </select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Pay Cycle Month</span>
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs font-medium p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-blue-600"
                >
                  <option value="all">All Generated Payroll Runs</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                </select>
              </div>
            )}
          </div>

          {/* Document Preview Box (Formatted as official report sheet) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                2. Live PDF Document Sheet Preview
              </span>
              <span className="text-slate-500 font-mono">
                {reportType === 'attendance'
                  ? `${filteredAttendance.length} records ready`
                  : `${filteredPayroll.length} statements ready`}
              </span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs font-sans text-slate-900 text-xs space-y-4">
              {/* Document Header in Preview */}
              <div className="border-b border-slate-200 pb-3 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      FIELDPULSE ENTERPRISE
                    </span>
                    <span className="text-[10px] bg-slate-900 text-white font-mono px-1.5 py-0.2 rounded">
                      OFFICIAL AUDIT
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-blue-900">
                    {reportType === 'attendance'
                      ? 'Workforce Attendance & Location Tracking Report'
                      : 'Workforce Payroll & Compensation Ledger'}
                  </h4>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Generated: {new Date().toLocaleDateString()} · Status: Certified by Manager
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Document Ref</div>
                  <div className="font-mono text-xs font-bold text-slate-800">
                    FP-{reportType === 'attendance' ? 'ATT' : 'PAY'}-{Date.now().toString().slice(-6)}
                  </div>
                </div>
              </div>

              {/* KPI Strip */}
              {reportType === 'attendance' ? (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Total Shifts
                    </span>
                    <strong className="text-sm text-slate-900">{filteredAttendance.length}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Total Hours
                    </span>
                    <strong className="text-sm text-blue-600">{totalHours.toFixed(1)} h</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Geofence Verified
                    </span>
                    <strong className="text-sm text-emerald-600">
                      {verifiedCount} / {filteredAttendance.length}
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Gross Wages
                    </span>
                    <strong className="text-sm text-slate-900">${totalGross.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Net Disbursable
                    </span>
                    <strong className="text-sm text-emerald-600">${totalNet.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">
                      Headcount
                    </span>
                    <strong className="text-sm text-blue-600">{filteredPayroll.length} Staff</strong>
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="overflow-x-auto max-h-52 border border-slate-100 rounded-xl">
                {reportType === 'attendance' ? (
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Employee</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">In/Out</th>
                        <th className="p-2">Hours</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Location</th>
                        <th className="p-2">Geofence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAttendance.slice(0, 8).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 font-mono text-[10px]">
                          <td className="p-2 font-sans font-semibold text-slate-900">{r.staffName}</td>
                          <td className="p-2 text-slate-600">{r.date}</td>
                          <td className="p-2 text-slate-600">
                            {r.checkInTime.split('T')[1]?.slice(0, 5)} -{' '}
                            {r.checkOutTime ? r.checkOutTime.split('T')[1]?.slice(0, 5) : 'In Progress'}
                          </td>
                          <td className="p-2 font-bold text-slate-900">{r.totalHoursWorked || 8}h</td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded font-sans text-[9px] uppercase font-bold ${
                                r.status === 'present'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-2 font-sans text-slate-600 truncate max-w-[120px]">
                            {r.locationName}
                          </td>
                          <td className="p-2">
                            {r.geofenceVerified ? (
                              <span className="text-emerald-700 font-sans font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            ) : (
                              <span className="text-rose-600 font-sans font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Outside
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Employee</th>
                        <th className="p-2">Base Salary</th>
                        <th className="p-2">Hours</th>
                        <th className="p-2">Overtime (1.5x)</th>
                        <th className="p-2">Allowances</th>
                        <th className="p-2">Net Payable</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                      {filteredPayroll.slice(0, 8).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-2 font-sans font-semibold text-slate-900">{p.staffName}</td>
                          <td className="p-2">${p.baseSalary.toLocaleString()}</td>
                          <td className="p-2">{p.regularHours}h</td>
                          <td className="p-2 text-blue-700 font-bold">
                            ${p.overtimePay} ({p.overtimeHours}h)
                          </td>
                          <td className="p-2">
                            ${p.allowances.transport + p.allowances.meal}
                          </td>
                          <td className="p-2 font-bold text-emerald-700 text-xs">
                            ${p.netSalary.toLocaleString()}
                          </td>
                          <td className="p-2 font-sans">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-800">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Signature Block */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-4 text-[10px] text-slate-500 font-sans">
                <div>
                  <div className="w-32 border-b border-slate-300 pb-1 mb-1 font-mono text-[9px]">
                    Sarah Jenkins
                  </div>
                  <div>Supervisor / Operations Lead</div>
                </div>
                <div className="text-right">
                  <div className="w-32 ml-auto border-b border-slate-300 pb-1 mb-1 font-mono text-[9px]">
                    APPROVED
                  </div>
                  <div>HR Compliance & Audit Stamp</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            Document format: A4 Landscape · Ready for digital download or print
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-300 dark:border-slate-700 transition-colors shadow-xs cursor-pointer min-h-[42px]"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Print Preview</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer min-h-[42px]"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
