import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import StatCards from './components/StatCards';
import AttendanceFeed from './components/AttendanceFeed';
import DeviceManager from './components/DeviceManager';
import EmployeeList from './components/EmployeeList';
import DeviceSimulatorModal from './components/DeviceSimulatorModal';
import HardwareBridgeModal from './components/HardwareBridgeModal';
import {
  companyApi,
  deviceApi,
  employeeApi,
  attendanceApi
} from './services/api';
import {
  Activity,
  Building,
  HardDrive,
  Users,
  Clock,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'feed' | 'devices' | 'employees' | 'companies'
  const [activeTab, setActiveTab] = useState('feed');

  // Modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  // Auto-polling state
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  // Fetch all initial or updated data
  const fetchData = useCallback(async () => {
    try {
      const [compRes, devRes, empRes, logsRes, statsRes] = await Promise.all([
        companyApi.getAll(),
        deviceApi.getAll(selectedCompanyId),
        employeeApi.getAll(selectedCompanyId),
        attendanceApi.getLogs({
          companyId: selectedCompanyId || undefined,
          limit: 100
        }),
        attendanceApi.getStats(selectedCompanyId)
      ]);

      if (compRes.success) {
        const availableCompanies = compRes.data || [];
        setCompanies(availableCompanies);
        // If current selected company no longer exists, reset to all
        if (selectedCompanyId && !availableCompanies.some(c => c.id === selectedCompanyId)) {
          setSelectedCompanyId(null);
        }
      }
      if (devRes.success) setDevices(devRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
      if (logsRes.success) setAttendanceLogs(logsRes.data || []);
      if (statsRes.success) setStats(statsRes.data || null);
    } catch (error) {
      console.error('[FetchData Error]', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-polling interval (every 5 seconds for real-time punch streaming)
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      // Refresh logs, stats, and device status quietly
      Promise.all([
        attendanceApi.getLogs({
          companyId: selectedCompanyId || undefined,
          limit: 100
        }),
        attendanceApi.getStats(selectedCompanyId),
        deviceApi.getAll(selectedCompanyId)
      ]).then(([logsRes, statsRes, devRes]) => {
        if (logsRes.success) setAttendanceLogs(logsRes.data || []);
        if (statsRes.success) setStats(statsRes.data || null);
        if (devRes.success) setDevices(devRes.data || []);
      }).catch(err => console.error('[Polling error]', err));
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, selectedCompanyId]);

  const handleRegisterDevice = async (data) => {
    await deviceApi.register(data);
    fetchData();
  };

  const handleUpdateDevice = async (id, data) => {
    await deviceApi.update(id, data);
    fetchData();
  };

  const handleDeleteDevice = async (id) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      await deviceApi.delete(id);
      fetchData();
    }
  };

  const handleCreateEmployee = async (data) => {
    await employeeApi.create(data);
    fetchData();
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Delete this employee record?')) {
      await employeeApi.delete(id);
      fetchData();
    }
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  return (
    <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100">
      {/* Top Navigation */}
      <Navbar
        companies={companies}
        selectedCompanyId={selectedCompanyId}
        onSelectCompany={setSelectedCompanyId}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenConfigGuide={() => setIsGuideOpen(true)}
        onOpenRegisterDevice={() => {
          setActiveTab('devices');
          setIsDeviceModalOpen(true);
        }}
        isAutoRefreshing={isAutoRefreshing}
        setIsAutoRefreshing={setIsAutoRefreshing}
        onRefresh={fetchData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Overview Cards */}
        <StatCards
          stats={stats}
          selectedCompany={selectedCompany}
          devices={devices}
        />

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'feed'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Live Attendance Feed</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-500/20 text-brand-300">
              {attendanceLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'devices'
                ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>Biometric Terminals</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300">
              {devices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
              activeTab === 'employees'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Enrolled Staff</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300">
              {employees.length}
            </span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'feed' && (
          <AttendanceFeed
            logs={attendanceLogs}
            loading={loading}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'devices' && (
          <DeviceManager
            devices={devices}
            companies={companies}
            onRegisterDevice={handleRegisterDevice}
            onUpdateDevice={handleUpdateDevice}
            onDeleteDevice={handleDeleteDevice}
            isOpen={isDeviceModalOpen}
            onClose={() => setIsDeviceModalOpen(false)}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeList
            employees={employees}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onCreateEmployee={handleCreateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 bg-dark-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            BioMax & eSSL ADMS Protocol Engine • Multi-Tenant MongoDB Atlas & Prisma
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-brand-400 hover:underline"
            >
              Device Connection Guide
            </button>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-amber-400 hover:underline"
            >
              Simulator
            </button>
          </div>
        </div>
      </footer>

      {/* Simulator Modal */}
      <DeviceSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        devices={devices}
        employees={employees}
        onSimulateSuccess={fetchData}
      />

      {/* Hardware Bridge Connection Modal (Cloud ADMS & Local Agent Modes) */}
      <HardwareBridgeModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        devices={devices}
        companies={companies}
      />
    </div>
  );
}
