import React from 'react';
import { useApp } from '../../context/AppContext';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { isPhoneFrame } = useApp();

  if (!isPhoneFrame) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 py-4 min-h-[calc(100vh-60px)] pb-24">
        {children}
      </div>
    );
  }

  return (
    <div className="py-6 px-2 flex justify-center items-start min-h-[calc(100vh-60px)] bg-slate-200/70">
      {/* Smartphone Chassis */}
      <div className="relative w-full max-w-[420px] bg-white rounded-[44px] shadow-2xl border-[9px] border-slate-900 overflow-hidden flex flex-col ring-1 ring-slate-900/10 min-h-[820px] max-h-[92vh]">
        {/* Dynamic Island & Mobile Status Bar */}
        <div className="shrink-0 bg-white pt-2.5 px-6 pb-1.5 flex items-center justify-between text-slate-800 text-xs font-semibold select-none border-b border-slate-100">
          <span className="font-mono text-[11px] tracking-tight">09:41</span>

          {/* Dynamic Island Pill */}
          <div className="w-24 h-4 bg-slate-950 rounded-full flex items-center justify-end px-2 gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-slate-800" />
          </div>

          <div className="flex items-center gap-1.5 text-slate-700">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <BatteryMedium className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Scrollable Mobile Screen Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-slate-50 relative pb-4">
          {children}
        </div>

        {/* Bottom Home Indicator Bar */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md pt-1 pb-2 flex justify-center items-center pointer-events-none border-t border-slate-100">
          <div className="w-32 h-1 bg-slate-400/80 rounded-full" />
        </div>
      </div>
    </div>
  );
};
