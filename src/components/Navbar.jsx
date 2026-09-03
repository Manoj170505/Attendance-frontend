import React from 'react';
import {
  Building2,
  Cpu,
  Radio,
  RefreshCw,
  Zap,
  Plus
} from 'lucide-react';

export default function Navbar({
  companies,
  selectedCompanyId,
  onSelectCompany,
  onOpenSimulator,
  onOpenConfigGuide,
  onOpenRegisterDevice,
  isAutoRefreshing,
  setIsAutoRefreshing,
  onRefresh
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">BioMax <span className="text-brand-600 font-extrabold">ADMS</span> Cloud</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-semibold border border-brand-200">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Universal Biometric Attendance & Sync Hub</p>
            </div>
          </div>

          {/* Tenant Switcher & Quick Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Multi-Tenant Company Selector */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-lg px-3 py-1.5 transition">
              <Building2 className="w-4 h-4 text-brand-600" />
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => onSelectCompany(e.target.value || null)}
                className="bg-transparent text-xs sm:text-sm text-slate-800 focus:outline-none cursor-pointer font-medium pr-1"
              >
                <option value="">All Companies (Global View)</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    🏢 {comp.name} ({comp.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setIsAutoRefreshing(!isAutoRefreshing)}
              title={isAutoRefreshing ? 'Live Auto-Polling Active (5s)' : 'Auto-Polling Paused'}
              className={`p-2 rounded-lg border transition-all flex items-center space-x-1.5 text-xs font-medium ${
                isAutoRefreshing
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
              <span className="hidden md:inline">{isAutoRefreshing ? 'Live' : 'Paused'}</span>
            </button>

            {/* Quick Manual Refresh */}
            <button
              onClick={onRefresh}
              title="Manual Refresh"
              className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-2xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Hardware Bridge / Connection Modal Button */}
            <button
              onClick={onOpenConfigGuide}
              className="flex items-center space-x-1.5 text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-3 py-2 rounded-lg font-semibold transition shadow-2xs"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-600" />
              <span>Connect Device</span>
            </button>

            {/* Device Push Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg font-semibold transition shadow-2xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Simulate Punch</span>
            </button>

            {/* Register Device Button */}
            <button
              onClick={onOpenRegisterDevice}
              className="flex items-center space-x-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg font-semibold transition shadow-sm shadow-brand-600/20"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Device</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
