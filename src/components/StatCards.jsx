import React from 'react';
import {
  Users,
  HardDrive,
  Clock,
  Building,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function StatCards({ stats, selectedCompany, devices = [] }) {
  const onlineDevices = devices.filter(d => d.computedStatus === 'ONLINE' || d.status === 'ONLINE').length;
  const totalDevices = devices.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Today's Punches */}
      <div className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats?.totalTodayPunches || 0}
              <span className="text-xs font-normal text-slate-500 ml-1.5">punches</span>
            </h3>
            <p className="text-xs text-brand-700 font-medium mt-2 flex items-center">
              <Activity className="w-3.5 h-3.5 mr-1 text-brand-600" />
              Live Ingestion Active
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-teal-400"></div>
      </div>

      {/* Biometric Devices */}
      <div className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Biometric Terminals</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {onlineDevices} / {totalDevices}
              <span className="text-xs font-normal text-slate-500 ml-1.5">online</span>
            </h3>
            <div className="flex items-center space-x-2 mt-2">
              <span className="inline-flex items-center text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-ping"></span>
                {onlineDevices} Live
              </span>
              {totalDevices - onlineDevices > 0 && (
                <span className="text-xs text-slate-500">
                  • {totalDevices - onlineDevices} Offline
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-blue-500"></div>
      </div>

      {/* Enrolled Employees */}
      <div className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Enrolled Staff</p>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {stats?.totalEmployees || 0}
              <span className="text-xs font-normal text-slate-500 ml-1.5">users</span>
            </h3>
            <p className="text-xs text-indigo-700 font-medium mt-2 flex items-center">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-indigo-600" />
              Synced across terminals
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
      </div>

      {/* Tenant Context */}
      <div className="glass-panel glass-panel-hover rounded-xl p-5 relative overflow-hidden bg-white border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tenant Isolation</p>
            <h3 className="text-lg font-extrabold text-slate-900 mt-1 truncate max-w-[170px]">
              {selectedCompany ? selectedCompany.name : 'Global View'}
            </h3>
            <p className="text-xs text-amber-800 font-semibold mt-2 font-mono">
              {selectedCompany ? `CODE: ${selectedCompany.code}` : `${stats?.totalCompanies || 0} Active Companies`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Building className="w-6 h-6" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
      </div>
    </div>
  );
}
