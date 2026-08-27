import React, { useState } from 'react';
import {
  Zap,
  HardDrive,
  User,
  Fingerprint,
  ScanFace,
  CreditCard,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { attendanceApi } from '../services/api';

export default function DeviceSimulatorModal({
  isOpen,
  onClose,
  devices = [],
  employees = [],
  onSimulateSuccess
}) {
  if (!isOpen) return null;

  const [selectedSerial, setSelectedSerial] = React.useState(devices[0]?.serialNumber || '');
  const [employeeId, setEmployeeId] = React.useState(employees[0]?.employeeId || '101');
  const [employeeName, setEmployeeName] = React.useState(employees[0]?.name || 'Demo Employee');
  const [punchState, setPunchState] = React.useState('CHECK_IN');
  const [punchType, setPunchType] = React.useState('FINGERPRINT');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [error, setError] = React.useState('');

  const selectedDevice = devices.find(d => d.serialNumber === selectedSerial);

  const handleDeviceChange = (sn) => {
    setSelectedSerial(sn);
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setEmployeeId(emp.employeeId);
      setEmployeeName(emp.name);
    } else {
      setEmployeeId(empId);
    }
  };

  const handleTriggerPush = async (e) => {
    e.preventDefault();
    if (!selectedSerial) {
      setError('Please select a device to simulate');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = {
        serialNumber: selectedSerial,
        punches: [
          {
            employeeId,
            employeeName,
            timestamp: new Date().toISOString(),
            state: punchState,
            punchType
          }
        ]
      };

      const json = await attendanceApi.simulatePush(payload);

      setResult({
        message: `Punch sent! Device '${selectedSerial}' recorded ${punchState} for PIN #${employeeId}`,
        rawLog: json.createdLogs?.[0]
      });

      if (onSimulateSuccess) {
        onSimulateSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to simulate device push');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700 shadow-2xl relative overflow-hidden">
        {/* Glowing banner decoration */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">BioMax ADMS Push Simulator</h3>
              <p className="text-xs text-slate-400">Simulate real-time biometric hardware events</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {/* Status / Error feedback */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold">{result.message}</div>
              <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                Timestamp: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleTriggerPush} className="mt-4 space-y-4 text-xs">
          {/* Select Hardware Device */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <HardDrive className="w-3.5 h-3.5 mr-1 text-amber-400" />
                Target Biometric Device (SN)
              </span>
              {selectedDevice && (
                <span className="text-[11px] text-slate-400">
                  Tenant: {selectedDevice.company?.name || 'Unassigned'}
                </span>
              )}
            </label>
            <select
              value={selectedSerial}
              onChange={(e) => handleDeviceChange(e.target.value)}
              className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-amber-500 cursor-pointer"
              required
            >
              <option value="" disabled>-- Select Device --</option>
              {devices.map((d) => (
                <option key={d.id} value={d.serialNumber}>
                  {d.name} ({d.serialNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Select Employee */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                Device User PIN
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="e.g. 101"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Employee Name</label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Employee Name"
                className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Punch State selection */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Punch Action (State)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'CHECK_IN', label: 'Check In' },
                { id: 'CHECK_OUT', label: 'Check Out' },
                { id: 'BREAK_OUT', label: 'Break Out' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setPunchState(item.id)}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition ${
                    punchState === item.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Method */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Verification Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'FINGERPRINT', label: 'Fingerprint', icon: Fingerprint },
                { id: 'FACE_RECOGNITION', label: 'Face AI', icon: ScanFace },
                { id: 'CARD_RFID', label: 'RFID Card', icon: CreditCard }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setPunchType(item.id)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium flex items-center justify-center space-x-1.5 transition ${
                      punchType === item.id
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !selectedSerial}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-lg transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Push Punch Live</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
