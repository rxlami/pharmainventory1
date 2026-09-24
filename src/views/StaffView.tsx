import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { StaffMember, StaffRole } from '../types/pharmacy';
import { getCanonicalRole, ROLE_DEFINITIONS, CanonicalRole } from '../utils/permissions';
import {
  Users,
  Shield,
  Plus,
  Search,
  CheckCircle2,
  Mail,
  Phone,
  FileCheck,
  UserCheck,
  X,
  Lock,
  Activity,
  Award,
  Check,
  ArrowRight,
} from 'lucide-react';

export const StaffView: React.FC = () => {
  const { staff, currentStaff, setCurrentStaff, addStaff, activityLogs } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('STAFF_PHARMACIST');
  const [newLicense, setNewLicense] = useState('');
  const [newShift, setNewShift] = useState<
    'Morning (08:00 - 16:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 08:00)' | 'General Full-Time'
  >('Morning (08:00 - 16:00)');
  const [feedback, setFeedback] = useState<string | null>(null);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const res = addStaff({
      name: newName,
      email: newEmail,
      phone: newPhone,
      role: newRole,
      licenseNumber: newLicense,
      shift: newShift,
      status: 'ACTIVE',
      lastActive: 'Just registered',
    });

    setFeedback(res.message);
    setTimeout(() => {
      setFeedback(null);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewLicense('');
    }, 1000);
  };

  const getRoleBadge = (role: StaffRole) => {
    const canonical = getCanonicalRole(role);
    switch (canonical) {
      case 'Owner/Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Pharmacist':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Pharmacy Technician':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Cashier':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP ROSTER OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{staff.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Dispensary team members</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Licensed Pharmacists</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black font-mono text-teal-700">
            {staff.filter((s) => s.role.includes('PHARMACIST') || s.role === 'SUPER_ADMIN').length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Authorized Rx dispensers</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Currently Logged In</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base font-bold text-blue-800 truncate mt-1">
            {currentStaff.name}
          </div>
          <p className="text-[10px] text-slate-500 font-medium">{getCanonicalRole(currentStaff.role)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">RBAC Status</span>
            <Shield className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-700">4 Active Roles</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Strict role-based access control</p>
        </div>
      </div>

      {/* 2. ROLE-BASED ACCESS CONTROL (RBAC) MATRIX */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Role-Based Access Control (RBAC) Hierarchy</span>
            </h3>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Users must only see and perform actions permitted by their designated role.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-semibold text-[10px] uppercase border border-emerald-200">
            Enforced Globally
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(['Owner/Admin', 'Pharmacist', 'Pharmacy Technician', 'Cashier'] as CanonicalRole[]).map((roleKey) => {
            const def = ROLE_DEFINITIONS[roleKey];
            const isUserRole = getCanonicalRole(currentStaff.role) === roleKey;

            return (
              <div
                key={roleKey}
                className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-all ${
                  isUserRole ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-100' : 'border-slate-200/80 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${def.badgeColor}`}>
                      {roleKey}
                    </span>
                    {isUserRole && (
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                        Your Role
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                    {def.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 space-y-1.5 text-[10px]">
                  <div className="font-bold text-slate-700 uppercase tracking-wider">Permitted Modules:</div>
                  <div className="flex flex-wrap gap-1">
                    {def.allowedTabs.slice(0, 6).map((tab) => (
                      <span key={tab} className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-700 font-mono">
                        {tab}
                      </span>
                    ))}
                    {def.allowedTabs.length > 6 && (
                      <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 font-mono">
                        +{def.allowedTabs.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SEARCH & ACTIONS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, email, or role..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* 4. STAFF CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredStaff.map((s) => {
          const isCurrent = s.id === currentStaff.id;
          const canonical = getCanonicalRole(s.role);

          return (
            <div
              key={s.id}
              className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 text-xs transition-all ${
                isCurrent ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-sm border border-slate-200">
                    {s.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getRoleBadge(
                      s.role
                    )}`}
                  >
                    {canonical}
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                  <div className="text-slate-500 text-[11px] mt-0.5 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {s.licenseNumber && (
                      <div className="flex items-center gap-1.5 text-emerald-800 font-mono font-medium">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>PCN: {s.licenseNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <div className="text-[10px] text-slate-400 mb-2 font-mono">
                  Shift: {s.shift}
                </div>

                {isCurrent ? (
                  <div className="w-full py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-center font-bold text-[11px] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Session</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setCurrentStaff(s)}
                    className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-center font-semibold text-[11px] transition-colors flex items-center justify-center gap-1"
                  >
                    <span>Switch to this user</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. RECENT ATTRIBUTED STAFF AUDIT ACTIVITIES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-600" />
          <span>Attributed Operational Activity Stream</span>
        </h3>
        <p className="text-slate-500">Live system audit events directly traced to staff credentials</p>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {activityLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800">{log.user || log.staffName}</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 uppercase">
                    {log.action}
                  </span>
                  {log.transactionReference && (
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-50 px-1 rounded border border-slate-200">
                      {log.transactionReference}
                    </span>
                  )}
                </div>
                <p className="text-slate-600 mt-0.5">{log.details}</p>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{log.timestamp}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Add Dispensary Staff Account</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {feedback && (
              <div className="my-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{feedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="py-4 space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Pharm. Ifeanyi Olayemi Audu / Chioma Folashade Amina"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ifeanyi.audu@emabpharmacy.ng"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="08012345678"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Assigned Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as StaffRole)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="SUPER_ADMIN">Owner/Admin — Full access (system, finance &amp; clinical)</option>
                  <option value="STAFF_PHARMACIST">Pharmacist — Inventory, sales, purchases, reports &amp; operations</option>
                  <option value="PHARMACY_TECH">Pharmacy Technician — Operational receiving &amp; inventory</option>
                  <option value="CASHIER">Cashier — Sales and payment-related access</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Shift Schedule</label>
                <select
                  value={newShift}
                  onChange={(e) => setNewShift(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="Morning (08:00 - 16:00)">Morning (08:00 - 16:00)</option>
                  <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                  <option value="Night (22:00 - 08:00)">Night (22:00 - 08:00)</option>
                  <option value="General Full-Time">General Full-Time</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  PCN License # (For Registered Pharmacists)
                </label>
                <input
                  type="text"
                  value={newLicense}
                  onChange={(e) => setNewLicense(e.target.value)}
                  placeholder="e.g. PCN/RPh/29481"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
