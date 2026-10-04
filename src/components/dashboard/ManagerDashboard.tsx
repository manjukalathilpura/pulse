import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  MapPin,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Clock,
  Compass,
  ArrowRight,
  MessageSquare,
  Navigation,
  FileCheck,
  ShieldAlert,
  FileText,
  Download,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { formatCoordinates } from '../../utils/geoUtils';
import { generateWhatsAppUrl } from '../../utils/commUtils';
import { PdfExportModal } from './PdfExportModal';
import { exportAttendancePdf, exportPayrollPdf } from '../../utils/pdfExportUtils';

export const ManagerDashboard: React.FC = () => {
  const {
    role,
    currentStaff,
    staffList,
    clientsList,
    dutiesList,
    attendanceList,
    leavesList,
    payrollList,
    setActiveTab,
    addToast,
  } = useApp();

  const [showPdfModal, setShowPdfModal] = useState<boolean>(false);
  const [pdfInitialType, setPdfInitialType] = useState<'attendance' | 'payroll'>('attendance');

  const todayStr = new Date().toISOString().split('T')[0];

  // Attendance metrics
  const activeStaffCount = staffList.filter((s) => s.isActive).length;
  const todayAttendance = attendanceList.filter((a) => a.date === todayStr);
  const checkedInCount = todayAttendance.length;
  const attendanceRate = activeStaffCount > 0 ? Math.round((checkedInCount / activeStaffCount) * 100) : 0;

  // Duties metrics
  const todayDuties = dutiesList.filter((d) => d.date === todayStr);
  const completedDutiesCount = todayDuties.filter((d) => d.status === 'completed').length;
  const inProgressDutiesCount = todayDuties.filter(
    (d) => d.status === 'en_route' || d.status === 'on_site'
  ).length;

  // Clients & Follow-ups metrics
  const overdueClients = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate < todayStr
  );
  const dueTodayClients = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate === todayStr
  );
  const totalPipelineValue = clientsList.reduce((acc, curr) => acc + (curr.dealValue || 0), 0);

  // Pending leaves
  const pendingLeaves = leavesList.filter((l) => l.status === 'pending');

  // Employee specific data
  const myTodayDuties = dutiesList.filter(
    (d) => d.assignedStaffId === currentStaff.id && d.date === todayStr
  );
  const myTodayRecord = attendanceList.find(
    (a) => a.staffId === currentStaff.id && a.date === todayStr
  );
  const nextDuty = myTodayDuties.find((d) => d.status !== 'completed');

  const handleQuickAttendancePdf = () => {
    exportAttendancePdf(attendanceList, staffList);
    addToast(`Generated Attendance PDF with ${attendanceList.length} shift logs.`, 'success');
  };

  const handleQuickPayrollPdf = () => {
    exportPayrollPdf(payrollList, staffList);
    addToast(`Generated Payroll Ledger PDF for ${payrollList.length} staff.`, 'success');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Greeting */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-lg border border-slate-700/60 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block font-mono">
              {role === 'manager' ? 'Executive Operations Cockpit' : 'Field Operations Terminal'}
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Welcome back, {role === 'manager' ? 'Operations Manager' : currentStaff.name}
            </h2>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>·</span>
              <span className="font-mono">{todayStr}</span>
            </p>
          </div>

          {/* Quick status pill & PDF Export CTA */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {role === 'manager' && (
              <button
                type="button"
                onClick={() => {
                  setPdfInitialType('attendance');
                  setShowPdfModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-colors cursor-pointer"
                title="Export Attendance and Payroll data into official PDF documents"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export PDF</span>
              </button>
            )}

            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl px-3.5 py-2">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Today's Presence</div>
              <div className="text-sm font-bold font-mono text-emerald-400 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {role === 'manager' ? `${attendanceRate}% Team Attendance` : myTodayRecord ? 'Shift Active' : 'Not Checked In'}
              </div>
            </div>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-blue-600/10 pointer-events-none" />
      </div>

      {/* ================= MANAGER EXECUTIVE COCKPIT ================= */}
      {role === 'manager' ? (
        <div className="space-y-4">
          {/* Key KPI Metric Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* KPI 1: Attendance */}
            <div
              onClick={() => setActiveTab('attendance')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-[11px] uppercase">Attendance</span>
                <Compass className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {checkedInCount} <span className="text-xs font-normal text-slate-400">/ {activeStaffCount}</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>{attendanceRate}% present rate</span>
              </div>
            </div>

            {/* KPI 2: Active Duties */}
            <div
              onClick={() => setActiveTab('duties')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-blue-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-[11px] uppercase">Daily Duties</span>
                <CalendarCheck className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {todayDuties.length} <span className="text-xs font-normal text-slate-400">total</span>
              </div>
              <div className="text-[11px] text-purple-700 font-medium mt-0.5">
                {inProgressDutiesCount} active · {completedDutiesCount} done
              </div>
            </div>

            {/* KPI 3: Overdue Client Follow-ups */}
            <div
              onClick={() => setActiveTab('clients')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-amber-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-[11px] uppercase">Follow-Up Alert</span>
                <AlertTriangle className={`w-4 h-4 ${overdueClients.length > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {overdueClients.length} <span className="text-xs font-normal text-slate-400">overdue</span>
              </div>
              <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                {dueTodayClients.length} touches due today
              </div>
            </div>

            {/* KPI 4: Pending Leaves */}
            <div
              onClick={() => setActiveTab('hr_payroll')}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs cursor-pointer hover:border-emerald-400 transition-all"
            >
              <div className="flex items-center justify-between text-slate-500 text-xs">
                <span className="font-semibold text-[11px] uppercase">Leave Queue</span>
                <FileCheck className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {pendingLeaves.length} <span className="text-xs font-normal text-slate-400">pending</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Pipelines: ${(totalPipelineValue / 1000).toFixed(0)}k val
              </div>
            </div>
          </div>

          {/* Quick Action Dock with PDF Export */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Manager Fast Actions
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                onClick={() => setActiveTab('duties')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 min-h-[40px] cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                <span>Assign Duty</span>
              </button>

              <button
                onClick={() => setActiveTab('clients')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 min-h-[40px] cursor-pointer"
              >
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Add Client</span>
              </button>

              <button
                onClick={() => setActiveTab('attendance')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 min-h-[40px] cursor-pointer"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Field Radar</span>
              </button>

              <button
                onClick={() => setActiveTab('hr_payroll')}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 min-h-[40px] cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-amber-600" />
                <span>Payroll Run</span>
              </button>

              <button
                onClick={() => {
                  setPdfInitialType('attendance');
                  setShowPdfModal(true);
                }}
                className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs min-h-[40px] cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Official PDF Document Generation Hub */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Executive Audit & PDF Report Generation
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Export high-resolution PDF documents with verified GPS coordinates and financial calculations
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Custom Export</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Card 1: Attendance PDF */}
              <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-blue-600" />
                      Attendance & GPS Audit PDF
                    </span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                      {attendanceList.length} logs
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Shift check-in/out timestamps, GPS coordinates, geofence radius audit, and working hours per worker.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleQuickAttendancePdf}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPdfInitialType('attendance');
                      setShowPdfModal(true);
                    }}
                    className="h-9 px-3 flex items-center justify-center text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Configure</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Payroll PDF */}
              <div className="p-3.5 rounded-xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                      Payroll & Compensation Ledger PDF
                    </span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-mono px-1.5 py-0.5 rounded font-semibold">
                      {payrollList.length} statements
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Monthly base pay, 1.5x overtime hours, transport/meal allowances, statutory tax/PF deductions, and net disbursements.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleQuickPayrollPdf}
                    className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPdfInitialType('payroll');
                      setShowPdfModal(true);
                    }}
                    className="h-9 px-3 flex items-center justify-center text-xs font-medium bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Configure</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Urgent Items & Radar Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Urgent Client Follow-Ups */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Priority Client Touches ({overdueClients.length})
                </h3>
                <button
                  onClick={() => setActiveTab('clients')}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  View All
                </button>
              </div>

              {overdueClients.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  All scheduled client follow-ups are up to date!
                </div>
              ) : (
                <div className="space-y-2">
                  {overdueClients.slice(0, 3).map((client) => {
                    const waUrl = generateWhatsAppUrl(client.whatsappNumber, 'urgent_reminder', {
                      clientName: client.companyName,
                      contactPerson: client.contactPerson,
                      companyName: client.companyName,
                      staffName: 'Operations Lead',
                    });

                    return (
                      <div
                        key={client.id}
                        className="p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-900 block truncate">
                            {client.companyName}
                          </span>
                          <span className="text-[11px] text-rose-600 font-medium">
                            Overdue since {client.nextFollowUpDate}
                          </span>
                        </div>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Staff Location Radar Overview */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-blue-600" />
                  Field Agent Radar ({activeStaffCount} Active)
                </h3>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="text-[11px] text-blue-600 font-semibold hover:underline"
                >
                  Radar Map
                </button>
              </div>

              <div className="space-y-2">
                {staffList.slice(0, 3).map((staff) => (
                  <div
                    key={staff.id}
                    className="p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">{staff.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {staff.currentLocation?.address || 'Site Area'}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 font-mono">
                      {staff.currentLocation ? formatCoordinates(staff.currentLocation.latitude, staff.currentLocation.longitude) : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= FIELD STAFF PERSONAL VIEW ================= */
        <div className="space-y-4">
          {/* Today's Next Duty Card */}
          {nextDuty ? (
            <div className="bg-white rounded-3xl p-5 border-2 border-blue-500 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  Current Target Duty
                </span>
                <span className="font-mono text-slate-500">
                  {nextDuty.startTime} - {nextDuty.endTime}
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900">{nextDuty.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{nextDuty.clientName}</p>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">{nextDuty.siteAddress}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${nextDuty.latitude},${nextDuty.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Start Navigation</span>
                </a>

                <button
                  onClick={() => setActiveTab('attendance')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span>GPS Check-In</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-xs space-y-2">
              <CalendarCheck className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900">All Today's Duties Completed!</h3>
              <p className="text-xs text-slate-500">
                You have fulfilled all scheduled client assignments for today.
              </p>
            </div>
          )}

          {/* Quick Shortcuts for Field Worker */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setActiveTab('attendance')}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-left hover:border-blue-400 transition-all space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Attendance & GPS</span>
                <span className="text-[11px] text-slate-500">
                  {myTodayRecord ? 'Shift in progress' : 'Mark today’s check-in'}
                </span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs text-left hover:border-emerald-400 transition-all space-y-2"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Client Contacts</span>
                <span className="text-[11px] text-slate-500">1-Tap WhatsApp outreach</span>
              </div>
            </button>
          </div>

          {/* Leave Quota snapshot */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                My Available Leave Balances
              </h4>
              <button
                onClick={() => setActiveTab('hr_payroll')}
                className="text-[11px] text-blue-600 font-semibold hover:underline"
              >
                Apply Leave
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Sick</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {currentStaff.leaveBalance.sick} d
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Casual</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {currentStaff.leaveBalance.casual} d
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <span className="text-[10px] text-slate-400 block uppercase">Paid PTO</span>
                <span className="font-bold font-mono text-slate-900 text-sm">
                  {currentStaff.leaveBalance.paid} d
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager PDF Export Modal */}
      {showPdfModal && (
        <PdfExportModal
          initialType={pdfInitialType}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  );
};
