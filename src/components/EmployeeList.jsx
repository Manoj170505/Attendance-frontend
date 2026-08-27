import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Building,
  UserCheck,
  CreditCard,
  Briefcase
} from 'lucide-react';

export default function EmployeeList({
  employees = [],
  companies = [],
  selectedCompanyId,
  onCreateEmployee,
  onDeleteEmployee
}) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    companyId: selectedCompanyId || companies[0]?.id || '',
    department: 'Operations',
    designation: 'Staff'
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAdd = () => {
    setFormData({
      employeeId: '',
      name: '',
      companyId: selectedCompanyId || companies[0]?.id || '',
      department: 'Operations',
      designation: 'Staff'
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.name || !formData.companyId) {
      setError('Company, Device User ID, and Name are required');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onCreateEmployee(formData);
      setIsFormOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel rounded-xl p-5 mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Staff & Biometric PIN Directory</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Employees enrolled across biometric terminals mapped by Device User ID
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center space-x-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg font-medium transition shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs">
          <thead className="bg-dark-900/60 text-slate-400 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Device User ID (PIN)</th>
              <th className="px-4 py-3">Employee Name</th>
              <th className="px-4 py-3">Tenant Company</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Designation</th>
              <th className="px-4 py-3">Total Punches</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {employees.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                  No employee records found for this tenant.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-4 py-3">
                    <span className="font-mono bg-dark-850 px-2 py-1 rounded text-brand-400 font-bold border border-slate-700">
                      #{emp.employeeId}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-100 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                      {emp.name.charAt(0)}
                    </div>
                    <span>{emp.name}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div className="flex items-center space-x-1">
                      <Building className="w-3 h-3 text-slate-500" />
                      <span>{emp.company?.name || 'Assigned'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{emp.department || 'Operations'}</td>
                  <td className="px-4 py-3 text-slate-300">{emp.designation || 'Staff'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                      {emp._count?.attendanceLogs || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDeleteEmployee(emp.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Delete Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-xl p-6 border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Add Enrolled Employee</h3>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Company / Tenant</label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Device User ID / PIN <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 101, 102, 1001"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-[10px] text-slate-500 mt-1">Must match the User ID registered in the BioMax machine</p>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full bg-dark-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition shadow-md shadow-indigo-600/30"
                >
                  {submitting ? 'Adding...' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
