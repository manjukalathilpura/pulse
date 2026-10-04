import React from 'react';
import { useApp, ActiveTab } from '../context/AppContext';
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  CreditCard,
} from 'lucide-react';

interface TabItem {
  id: ActiveTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, clientsList, dutiesList, currentStaff, role } = useApp();

  // Compute pending duty count for current user
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingDutiesCount =
    role === 'field_staff'
      ? dutiesList.filter(
          (d) => d.assignedStaffId === currentStaff.id && d.status !== 'completed' && d.date === todayStr
        ).length
      : dutiesList.filter((d) => d.status !== 'completed' && d.date === todayStr).length;

  // Compute overdue follow-ups
  const overdueClients = clientsList.filter(
    (c) => c.nextFollowUpDate && c.nextFollowUpDate <= todayStr
  ).length;

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'attendance',
      label: 'GPS & CheckIn',
      icon: MapPin,
    },
    {
      id: 'duties',
      label: 'Duties',
      icon: CalendarCheck,
      badge: pendingDutiesCount > 0 ? pendingDutiesCount : undefined,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Users,
      badge: overdueClients > 0 ? overdueClients : undefined,
    },
    {
      id: 'hr_payroll',
      label: 'HR & Pay',
      icon: CreditCard,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-xs">
      <div className="max-w-md mx-auto grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all min-h-[48px] select-none ${
                isActive
                  ? 'text-blue-600 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-600' : ''}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center border-2 border-white tabular-nums">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 whitespace-nowrap leading-none">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1 animate-in fade-in zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
