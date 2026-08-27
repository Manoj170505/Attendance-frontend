import React from 'react';
import {
  Building2,
  Cpu,
  Radio,
  RefreshCw,
  Zap,
  HelpCircle,
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
  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-dark-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-teal-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">BioMax <span className="text-brand-500">ADMS</span> Cloud</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-medium border border-brand-500/20">
                  Multi-Tenant
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">eSSL & BioMax Push Biometric Engine</p>
            </div>
          </div>

          {/* Tenant Switcher & Quick Actions */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Multi-Tenant Company Selector */}
            <div className="flex items-center space-x-2 bg-dark-850 border border-slate-700/80 rounded-lg px-3 py-1.5 shadow-inner">
              <Building2 className="w-4 h-4 text-brand-400" />
              <select
                value={selectedCompanyId || ''}
                onChange={(e) => onSelectCompany(e.target.value || null)}
                className="bg-transparent text-sm text-slate-200 focus:outline-none cursor-pointer font-medium pr-2"
              >
                <option value="" className="bg-dark-900 text-slate-300">All Tenants (Global View)</option>
                {companies.map((comp) => (
                  <option key={comp.id} value={comp.id} className="bg-dark-900 text-slate-100">
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
                  ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
                  : 'bg-dark-850 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAutoRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{isAutoRefreshing ? 'Live' : 'Paused'}</span>
            </button>

            {/* Quick Refresh */}
            <button
              onClick={onRefresh}
              title="Manual Refresh"
              className="p-2 rounded-lg bg-dark-850 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Hardware Bridge / Connection Modal Button */}
            <button
              onClick={onOpenConfigGuide}
              className="flex items-center space-x-1.5 text-xs bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-3 py-2 rounded-lg font-medium transition shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Connect Device</span>
            </button>

            {/* Device Push Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center space-x-1.5 text-xs bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 px-3 py-2 rounded-lg font-medium transition shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Simulate Punch</span>
            </button>

            {/* Register Device Button */}
            <button
              onClick={onOpenRegisterDevice}
              className="flex items-center space-x-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white px-3.5 py-2 rounded-lg font-medium transition shadow-md shadow-brand-600/30"
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
