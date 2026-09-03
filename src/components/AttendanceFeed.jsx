import React, { useState, useMemo } from 'react';
import {
  Search,
  Fingerprint,
  ScanFace,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Building2,
  HardDrive,
  Info,
  Calendar,
  Filter,
  ArrowUpDown,
  Download,
  LogIn,
  LogOut,
  Coffee,
  X
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

export default function AttendanceFeed({
  logs = [],
  loading,
  companies = [],
  selectedCompanyId,
  onSelectCompany,
  onRefresh
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [feedCompanyFilter, setFeedCompanyFilter] = useState(selectedCompanyId || '');
  const [stateFilter, setStateFilter] = useState('');
  const [dateFilterMode, setDateFilterMode] = useState('ALL'); // 'ALL' | 'TODAY' | 'YESTERDAY' | 'THIS_WEEK' | 'CUSTOM'
  const [customDate, setCustomDate] = useState('');
  const [sortBy, setSortBy] = useState('timestamp_desc'); // 'timestamp_desc' | 'timestamp_asc' | 'name_asc' | 'name_desc' | 'pin_asc' | 'pin_desc'
  const [selectedRawLog, setSelectedRawLog] = useState(null);

  // Sync external selectedCompanyId when changed from navbar
  React.useEffect(() => {
    if (selectedCompanyId) {
      setFeedCompanyFilter(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  // Filter and Sort Logs
  const filteredAndSortedLogs = useMemo(() => {
    return logs
      .filter((log) => {
        // 1. Search filter
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch = !query ||
          (log.employee?.name && log.employee.name.toLowerCase().includes(query)) ||
          (log.employeeId && log.employeeId.toLowerCase().includes(query)) ||
          (log.deviceSerial && log.deviceSerial.toLowerCase().includes(query)) ||
          (log.company?.name && log.company.name.toLowerCase().includes(query)) ||
          (log.employee?.department && log.employee.department.toLowerCase().includes(query));

        // 2. Company Filter
        const matchesCompany = feedCompanyFilter
          ? (log.companyId === feedCompanyFilter || log.company?.id === feedCompanyFilter)
          : true;

        // 3. Punch State Filter
        const matchesState = stateFilter ? log.state === stateFilter : true;

        // 4. Date Filter
        let matchesDate = true;
        if (log.timestamp) {
          const logDate = new Date(log.timestamp);
          if (!isNaN(logDate.getTime())) {
            if (dateFilterMode === 'TODAY') {
              matchesDate = isToday(logDate);
            } else if (dateFilterMode === 'YESTERDAY') {
              matchesDate = isYesterday(logDate);
            } else if (dateFilterMode === 'THIS_WEEK') {
              matchesDate = isThisWeek(logDate);
            } else if (dateFilterMode === 'CUSTOM' && customDate) {
              const logDateStr = format(logDate, 'yyyy-MM-dd');
              matchesDate = logDateStr === customDate;
            }
          }
        }

        return matchesSearch && matchesCompany && matchesState && matchesDate;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime() || 0;
        const timeB = new Date(b.timestamp).getTime() || 0;
        const nameA = (a.employee?.name || `Employee #${a.employeeId}`).toLowerCase();
        const nameB = (b.employee?.name || `Employee #${b.employeeId}`).toLowerCase();
        const pinA = Number(a.employeeId) || 0;
        const pinB = Number(b.employeeId) || 0;

        switch (sortBy) {
          case 'timestamp_asc':
            return timeA - timeB;
          case 'timestamp_desc':
            return timeB - timeA;
          case 'name_asc':
            return nameA.localeCompare(nameB);
          case 'name_desc':
            return nameB.localeCompare(nameA);
          case 'pin_asc':
            return pinA - pinB;
          case 'pin_desc':
            return pinB - pinA;
          default:
            return timeB - timeA;
        }
      });
  }, [logs, searchTerm, feedCompanyFilter, stateFilter, dateFilterMode, customDate, sortBy]);

  // Export filtered logs to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedLogs.length === 0) {
      alert('No attendance records to export.');
      return;
    }

    const headers = ['Employee Name', 'PIN / User ID', 'Company', 'Timestamp', 'Date', 'Time', 'Punch State', 'Auth Type', 'Device Serial'];
    const rows = filteredAndSortedLogs.map(log => {
      const d = new Date(log.timestamp);
      return [
        `"${(log.employee?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${log.employeeId}"`,
        `"${(log.company?.name || 'N/A').replace(/"/g, '""')}"`,
        `"${d.toISOString()}"`,
        `"${!isNaN(d.getTime()) ? format(d, 'yyyy-MM-dd') : ''}"`,
        `"${!isNaN(d.getTime()) ? format(d, 'hh:mm:ss a') : ''}"`,
        `"${log.state}"`,
        `"${log.punchType || 'FINGERPRINT'}"`,
        `"${log.deviceSerial}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getPunchTypeIcon = (type) => {
    switch (type) {
      case 'FACE_RECOGNITION':
        return <ScanFace className="w-4 h-4 text-purple-600" title="Face Recognition" />;
      case 'CARD_RFID':
        return <CreditCard className="w-4 h-4 text-sky-600" title="Card / RFID" />;
      case 'PIN_PASSWORD':
        return <KeyRound className="w-4 h-4 text-amber-600" title="PIN / Password" />;
      case 'FINGERPRINT':
      default:
        return <Fingerprint className="w-4 h-4 text-emerald-600" title="Fingerprint" />;
    }
  };

  const getStateBadge = (state) => {
    switch (state) {
      case 'CHECK_IN':
      case '0':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <LogIn className="w-3 h-3 mr-1" />
            Check In
          </span>
        );
      case 'CHECK_OUT':
      case '1':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <LogOut className="w-3 h-3 mr-1" />
            Check Out
          </span>
        );
      case 'BREAK_OUT':
      case '2':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Coffee className="w-3 h-3 mr-1" />
            Break Out
          </span>
        );
      case 'BREAK_IN':
      case '3':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <LogIn className="w-3 h-3 mr-1" />
            Break In
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {state || 'PUNCH'}
          </span>
        );
    }
  };

  const activeCompanyName = companies.find(c => c.id === feedCompanyFilter)?.name;

  return (
    <div className="glass-panel rounded-xl overflow-hidden mb-8 bg-white border border-slate-200 shadow-sm">
      {/* Header & Comprehensive Filter Bar */}
      <div className="p-5 border-b border-slate-200 bg-white space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Live Attendance Feed</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                Live Stream
              </span>
              {activeCompanyName && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  🏢 {activeCompanyName}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time biometric attendance streams with instant company-wise filtering & multi-column sorting
            </p>
          </div>

          {/* Action Tools: CSV Export & Result Count */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
              Showing {filteredAndSortedLogs.length} of {logs.length} Punches
            </span>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 text-xs font-semibold transition shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-1">
          {/* 1. Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Name, PIN, SN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Company Filter Dropdown */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-brand-500">
            <Building2 className="w-4 h-4 text-brand-600 flex-shrink-0" />
            <select
              value={feedCompanyFilter}
              onChange={(e) => {
                setFeedCompanyFilter(e.target.value);
                if (onSelectCompany) onSelectCompany(e.target.value || null);
              }}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Date Filter Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-brand-500">
            <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <select
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">📅 Today Only</option>
              <option value="YESTERDAY">📅 Yesterday</option>
              <option value="THIS_WEEK">📅 This Week</option>
              <option value="CUSTOM">📅 Custom Date...</option>
            </select>
          </div>

          {/* 4. Punch State Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-brand-500">
            <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="">All Punch States</option>
              <option value="CHECK_IN">Check In</option>
              <option value="CHECK_OUT">Check Out</option>
              <option value="BREAK_OUT">Break Out</option>
              <option value="BREAK_IN">Break In</option>
            </select>
          </div>

          {/* 5. Sort By Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus-within:border-brand-500">
            <ArrowUpDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
            >
              <option value="timestamp_desc">Time: Newest First</option>
              <option value="timestamp_asc">Time: Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="pin_asc">PIN: Low to High</option>
              <option value="pin_desc">PIN: High to Low</option>
            </select>
          </div>
        </div>

        {/* Custom Date Input (when CUSTOM mode is active) */}
        {dateFilterMode === 'CUSTOM' && (
          <div className="flex items-center space-x-2 pt-1">
            <span className="text-xs font-semibold text-slate-600">Pick Date:</span>
            <input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
            />
            {customDate && (
              <button
                onClick={() => setCustomDate('')}
                className="text-xs text-rose-600 hover:underline"
              >
                Clear date
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Employee / User PIN</th>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-5 py-3.5">Punch State</th>
              <th className="px-5 py-3.5">Auth Method</th>
              <th className="px-5 py-3.5">Terminal / Device SN</th>
              <th className="px-5 py-3.5">Company</th>
              <th className="px-5 py-3.5 text-right">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-normal">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-medium">Loading live attendance records...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedLogs.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-5 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Fingerprint className="w-8 h-8 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-700">No attendance punches match your filters</p>
                    <p className="text-xs text-slate-400">
                      Try clearing your search keyword, company, or date filter.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSortedLogs.map((log) => {
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
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {/* Employee Info */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center font-bold text-brand-700 text-xs">
                          {log.employee?.name ? log.employee.name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {log.employee?.name || `Employee #${log.employeeId}`}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700 font-semibold">
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
                      <div className="font-semibold text-slate-800">{formattedTime}</div>
                      <div className="text-[11px] text-slate-500">{formattedDate}</div>
                    </td>

                    {/* Punch State */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {getStateBadge(log.state)}
                    </td>

                    {/* Punch Type / Biometric verification */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getPunchTypeIcon(log.punchType)}
                        <span className="text-slate-700 capitalize text-xs font-medium">
                          {log.punchType ? log.punchType.toLowerCase().replace('_', ' ') : 'Fingerprint'}
                        </span>
                      </div>
                    </td>

                    {/* Terminal Device */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-slate-800">
                        <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{log.device?.name || 'Device'}</span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {log.deviceSerial}
                      </div>
                    </td>

                    {/* Company */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-slate-700">
                        <Building2 className="w-3 h-3 text-brand-600" />
                        <span className="font-semibold text-[11px]">{log.company?.name || 'Unknown'}</span>
                      </div>
                    </td>

                    {/* Audit Info / Raw Payload inspector */}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedRawLog(log)}
                        title="View Raw ADMS Protocol Payload"
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">ADMS Raw Punch Audit Log</h3>
              </div>
              <button
                onClick={() => setSelectedRawLog(null)}
                className="text-slate-400 hover:text-slate-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Log ID:</span>
                <span className="font-mono text-slate-900">{selectedRawLog.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Device Serial:</span>
                <span className="font-mono text-brand-700 font-bold">{selectedRawLog.deviceSerial}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Company / Tenant:</span>
                <span className="font-bold text-slate-900">{selectedRawLog.company?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Employee PIN:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRawLog.employeeId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-semibold">Timestamp:</span>
                <span className="text-slate-900">{new Date(selectedRawLog.timestamp).toLocaleString()}</span>
              </div>

              <div className="mt-3">
                <label className="block text-slate-600 mb-1 font-semibold">Raw Protocol Line (ATTLOG / Agent):</label>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                  {selectedRawLog.rawData || 'No raw payload recorded'}
                </pre>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedRawLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
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
