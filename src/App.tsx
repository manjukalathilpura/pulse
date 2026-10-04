/**
 * FieldPulse - Cloud Mobile Operations & Workforce Management System
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { BiometricProvider } from './context/BiometricContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { DeviceFrame } from './components/common/DeviceFrame';
import { ToastContainer } from './components/common/ToastContainer';
import { ManagerDashboard } from './components/dashboard/ManagerDashboard';
import { AttendanceView } from './components/attendance/AttendanceView';
import { DutiesView } from './components/duties/DutiesView';
import { ClientsView } from './components/clients/ClientsView';
import { LeavesPayrollView } from './components/leaves_payroll/LeavesPayrollView';

const MainContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="p-3 sm:p-4 flex-1">
        {activeTab === 'dashboard' && <ManagerDashboard />}
        {activeTab === 'attendance' && <AttendanceView />}
        {activeTab === 'duties' && <DutiesView />}
        {activeTab === 'clients' && <ClientsView />}
        {activeTab === 'hr_payroll' && <LeavesPayrollView />}
      </div>
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BiometricProvider>
        <div className="min-h-screen bg-slate-100 flex flex-col text-slate-900">
          <Header />
          <ToastContainer />
          <main className="flex-1 flex justify-center items-start">
            <DeviceFrame>
              <MainContent />
            </DeviceFrame>
          </main>
        </div>
      </BiometricProvider>
    </AppProvider>
  );
}
