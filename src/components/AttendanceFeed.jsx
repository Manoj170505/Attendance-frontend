import React, { useState } from 'react';
import {
  Search,
  Fingerprint,
  ScanFace,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Building,
  HardDrive,
  Info,
  Calendar,
  Filter,
  CheckCircle,
  LogOut,
  LogIn,
  Coffee
} from 'lucide-react';
import { format } from 'date-fns';

export default function AttendanceFeed({ logs = [], loading, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedRawLog, setSelectedRawLog] = useState(null);

  // Filter logs by search keyword and punch state
  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      (log.employee?.name && log.employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.employeeId && log.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.deviceSerial && log.deviceSerial.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.company?.name && log.company.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesState = stateFilter ? log.state === stateFilter : true;

    return matchesSearch && matchesState;
  });

  const getPunchTypeIcon = (type) => {
    switch (type) {
      case 'FACE_RECOGNITION':
        return <ScanFace className="w-4 h-4 text-purple-400" title="Face Recognition" />;
      case 'CARD_RFID':
        return <CreditCard className="w-4 h-4 text-sky-400" title="Card / RFID" />;
      case 'PIN_PASSWORD':
        return <KeyRound className="w-4 h-4 text-amber-400" title="PIN / Password" />;
      case 'FINGERPRINT':
      default:
        return <Fingerprint className="w-4 h-4 text-emerald-400" title="Fingerprint" />;
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'CHECK_IN':
      case '0':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <LogIn className="w-3 h-3 mr-1" />
            Check In
          </span>
        );
      case 'CHECK_OUT':
      case '1':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <LogOut className="w-3 h-3 mr-1" />
            Check Out
          </span>
        );
      case 'BREAK_OUT':
      case '2':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Coffee className="w-3 h-3 mr-1" />
            Break Out
          </span>
        );
      case 'BREAK_IN':
      case '3':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <LogIn className="w-3 h-3 mr-1" />
            Break In
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600">
            {state || 'PUNCH'}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl overflow-hidden mb-8">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Live Attendance Punch Feed</h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
              ● Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time biometric data received via ADMS / iClock Push protocol
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee, PIN, SN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-850 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500 transition"
            />
          </div>

          {/* State Filter */}
          <div className="flex items-center space-x-1.5 bg-dark-850 border border-slate-700/80 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-dark-900">All Punch States</option>
              <option value="CHECK_IN" className="bg-dark-900">Check In</option>
              <option value="CHECK_OUT" className="bg-dark-900">Check Out</option>
              <option value="BREAK_OUT" className="bg-dark-900">Break Out</option>
              <option value="BREAK_IN" className="bg-dark-900">Break In</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900/60 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Employee / User PIN</th>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Punch State</th>
              <th className="px-5 py-3.5">Auth Method</th>
              <th className="px-5 py-3.5">Terminal / Device SN</th>
              <th className="px-5 py-3.5">Tenant Company</th>
              <th className="px-5 py-3.5 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">Loading real-time attendance logs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Fingerprint className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No attendance punches recorded yet</p>
                    <p className="text-xs text-slate-500">
                      Use the "Simulate Punch" button above or push logs from your BioMax machine.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = !isNaN(dateObj.getTime())
                  ? format(dateObj, 'MMM dd, yyyy')
                  : 'Invalid Date';
                const formattedTime = !isNaN(dateObj.getTime())
                  ? format(dateObj, 'hh:mm:ss a')
                  : '--:--';

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Employee Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {log.employee?.name ? log.employee.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-200">
                            {log.employee?.name || `Employee #${log.employeeId}`}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono bg-dark-850 px-1.5 py-0.5 rounded border border-slate-700/60 text-slate-300">
                              PIN: {log.employeeId}
                            </span>
                            {log.employee?.department && (
                              <span>• {log.employee.department}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{formattedTime}</div>
                      <div className="text-[11px] text-slate-400">{formattedDate}</div>
                    </td>

                    {/* Punch State */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStateBadge(log.state)}
                    </td>

                    {/* Punch Type / Biometric verification */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getPunchTypeIcon(log.punchType)}
                        <span className="text-slate-300 capitalize text-xs">
                          {log.punchType ? log.punchType.toLowerCase().replace('_', ' ') : 'Fingerprint'}
                        </span>
                      </div>
                    </td>

                    {/* Terminal Device */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-300">
                        <HardDrive className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium">{log.device?.name || 'Device'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {log.deviceSerial}
                      </div>
                    </td>

                    {/* Tenant Company */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5 bg-dark-850 px-2.5 py-1 rounded-md border border-slate-700/60 text-slate-300">
                        <Building className="w-3 h-3 text-brand-400" />
                        <span className="font-medium text-[11px]">{log.company?.name || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Audit Info / Raw Payload inspector */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRawLog(log)}
                        title="View Raw ADMS Protocol Payload"
                        className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-slate-800 rounded transition"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Raw ADMS Payload Inspector Modal */}
      {selectedRawLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg rounded-xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white">ADMS Raw Punch Audit Log</h3>
              </div>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Log ID:</span>
                <span className="ml-2 font-mono text-slate-200">{selectedRawLog.id}</span>
              </div>
              <div>
                <span className="text-slate-400">Device SN:</span>
                <span className="ml-2 font-mono text-brand-400">{selectedRawLog.deviceSerial}</span>
              </div>
              <div>
                <span className="text-slate-400">Tenant:</span>
                <span className="ml-2 text-slate-200">{selectedRawLog.company?.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Employee PIN:</span>
                <span className="ml-2 font-mono text-slate-200">{selectedRawLog.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-400">Timestamp:</span>
                <span className="ml-2 text-slate-200">{new Date(selectedRawLog.timestamp).toLocaleString()}</span>
              </div>

              <div className="mt-3">
                <label className="block text-slate-400 mb-1 font-semibold">Raw Protocol Line (ATTLOG):</label>
                <pre className="p-3 rounded-lg bg-dark-950 border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                  {selectedRawLog.rawData || 'No raw payload recorded'}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
