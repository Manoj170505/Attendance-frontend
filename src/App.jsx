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
  Clock,
  HardDrive,
  Users
} from 'lucide-react';

export default function App() {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [devices, setDevices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active view tab: 'feed' | 'devices' | 'employees'
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
        if (!selectedCompanyId && availableCompanies.length > 0) {
          setSelectedCompanyId(availableCompanies[0].id);
        } else if (selectedCompanyId && !availableCompanies.some(c => c.id === selectedCompanyId)) {
          setSelectedCompanyId(availableCompanies.length > 0 ? availableCompanies[0].id : null);
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

  // Auto-polling interval
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
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

  const handleUpdateEmployee = async (id, data) => {
    await employeeApi.update(id, data);
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
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
        <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'feed'
                ? 'bg-brand-50 text-brand-700 border border-brand-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Live Attendance Feed</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-brand-100 text-brand-800 font-bold">
              {attendanceLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'devices'
                ? 'bg-sky-50 text-sky-700 border border-sky-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <HardDrive className="w-4 h-4 text-sky-600" />
            <span>Biometric Terminals</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 text-sky-800 font-bold">
              {devices.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('employees')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'employees'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Staff Directory</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-800 font-bold">
              {employees.length}
            </span>
          </button>
        </div>

        {/* Tab Views */}
        {activeTab === 'feed' && (
          <AttendanceFeed
            logs={attendanceLogs}
            loading={loading}
            companies={companies}
            selectedCompanyId={selectedCompanyId}
            onSelectCompany={setSelectedCompanyId}
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
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-4 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            BioMax & eSSL ADMS Protocol Engine • Multi-Tenant MongoDB Atlas & Prisma
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-brand-600 font-semibold hover:underline"
            >
              Device Connection Hub
            </button>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="text-amber-700 font-semibold hover:underline"
            >
              Hardware Simulator
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
