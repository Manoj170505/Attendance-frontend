import React, { useState } from 'react';
import {
  HardDrive,
  Plus,
  Trash2,
  Edit2,
  Building,
  AlertCircle,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DeviceManager({
  devices = [],
  companies = [],
  onRegisterDevice,
  onUpdateDevice,
  onDeleteDevice,
  isOpen,
  onClose
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    serialNumber: '',
    name: '',
    companyId: '',
    model: 'BioMax / eSSL ADMS'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenCreate = () => {
    setEditingDevice(null);
    setFormData({
      serialNumber: '',
      name: '',
      companyId: companies[0]?.id || '',
      model: 'BioMax N-BM2000 Pro'
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (device) => {
    setEditingDevice(device);
    setFormData({
      serialNumber: device.serialNumber,
      name: device.name,
      companyId: device.companyId || '',
      model: device.model || 'BioMax / eSSL ADMS'
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serialNumber) {
      setError('Serial Number is required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingDevice) {
        await onUpdateDevice(editingDevice.id, formData);
      } else {
        await onRegisterDevice(formData);
      }
      setIsFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 mb-8 bg-white border border-slate-200 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <HardDrive className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Biometric Device Terminals (ADMS Push & Port 4370)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical BioMax and eSSL biometric machines registered to tenant companies
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center space-x-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-2 rounded-lg font-semibold transition shadow-sm shadow-brand-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Device</span>
        </button>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
        {devices.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-500">
            <HardDrive className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No biometric devices registered yet</p>
            <button
              onClick={handleOpenCreate}
              className="mt-2 text-xs text-brand-600 font-semibold hover:underline"
            >
              + Register your first terminal
            </button>
          </div>
        ) : (
          devices.map((device) => {
            const isOnline = device.computedStatus === 'ONLINE' || device.status === 'ONLINE';

            return (
              <div
                key={device.id}
                className="rounded-xl bg-slate-50 border border-slate-200 p-4 hover:border-slate-300 hover:shadow-xs transition relative group"
              >
                {/* Status Pill */}
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    ></span>
                    <span>{isOnline ? 'Online (Connected)' : 'Offline'}</span>
                  </span>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleOpenEdit(device)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200 rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteDevice(device.id)}
                      className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Device Title & Model */}
                <div className="mt-3">
                  <h4 className="font-bold text-sm text-slate-900 truncate">{device.name}</h4>
                  <p className="text-[11px] text-slate-500">{device.model || 'BioMax / eSSL Terminal'}</p>
                </div>

                {/* Device Serial Number */}
                <div className="mt-3 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Device SN:</span>
                  <span className="font-mono text-xs font-bold text-brand-700">{device.serialNumber}</span>
                </div>

                {/* Tenant Association */}
                <div className="mt-2.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 flex items-center font-medium">
                    <Building className="w-3 h-3 mr-1 text-slate-400" />
                    Company:
                  </span>
                  <span className={`font-semibold ${device.company ? 'text-slate-800' : 'text-amber-700'}`}>
                    {device.company?.name || '⚠️ Unassigned'}
                  </span>
                </div>

                {/* Last Heartbeat */}
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                    Heartbeat:
                  </span>
                  <span className="font-medium">
                    {device.lastHeartbeat
                      ? formatDistanceToNow(new Date(device.lastHeartbeat), { addSuffix: true })
                      : 'Never'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Register / Edit Device Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-5 h-5 text-brand-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editingDevice ? 'Edit Device Terminal' : 'Register Biometric Device'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Device Serial Number (SN) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. BMX-10928374 or NFZ8235301513"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  disabled={!!editingDevice}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-brand-500 disabled:opacity-60"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Found on the back sticker or on machine screen: Menu &gt; System Info
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Device Name / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Reception Main Gate or Factory Entry"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assign to Company / Client</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="">-- Leave Unassigned (Demo/Staging) --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Device Model / Type</label>
                <input
                  type="text"
                  placeholder="e.g. BioMax SpeedFace or eSSL K30 / X 2008"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-semibold transition shadow-sm shadow-brand-600/30 flex items-center space-x-1"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>{editingDevice ? 'Save Changes' : 'Register Terminal'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
