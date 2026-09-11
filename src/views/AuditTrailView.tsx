import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { AuditModule, ActivityLog } from '../types/pharmacy';
import { TablePagination } from '../components/TablePagination';
import {
  ShieldCheck,
  Search,
  Filter,
  Clock,
  User,
  Activity,
  FileCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  Hash,
  AlertCircle,
  Tag,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { activityLogs, auditLogs, staff, formatCurrency } = usePharmacy();
  const effectiveLogs: ActivityLog[] = auditLogs || activityLogs || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('ALL');
  const [filterUser, setFilterUser] = useState<string>('ALL');
  const [filterDate, setFilterDate] = useState<string>('');

  // Extract distinct users for the user attribution filter
  const distinctUsers = useMemo(() => {
    const names = new Set<string>();
    effectiveLogs.forEach((l) => {
      const u = l.user || l.staffName;
      if (u) names.add(u);
    });
    staff.forEach((s) => names.add(s.name));
    return Array.from(names);
  }, [effectiveLogs, staff]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return effectiveLogs.filter((log) => {
      const user = (log.user || log.staffName || '').toLowerCase();
      const action = (log.action || '').toLowerCase();
      const details = (log.details || '').toLowerCase();
      const ref = (log.transactionReference || log.referenceId || '').toLowerCase();
      const prevVal = String(log.previousValue || '').toLowerCase();
      const newVal = String(log.newValue || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        !query ||
        user.includes(query) ||
        action.includes(query) ||
        details.includes(query) ||
        ref.includes(query) ||
        prevVal.includes(query) ||
        newVal.includes(query);

      const logMod = log.module || log.category || 'SYSTEM';
      const matchesModule = filterModule === 'ALL' || logMod === filterModule;

      const logUser = log.user || log.staffName;
      const matchesUser = filterUser === 'ALL' || logUser === filterUser;

      const logDate = log.date || (log.timestamp ? log.timestamp.substring(0, 10) : '');
      const matchesDate = !filterDate || logDate === filterDate;

      return matchesSearch && matchesModule && matchesUser && matchesDate;
    });
  }, [effectiveLogs, searchQuery, filterModule, filterUser, filterDate]);

  const getModuleBadgeColor = (mod?: AuditModule | string) => {
    switch (mod) {
      case 'SALES':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'INVENTORY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PURCHASES':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'FINANCE':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'SECURITY':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'SETTINGS':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleExportAuditCSV = () => {
    const headers = [
      'Timestamp',
      'Date',
      'Time',
      'User',
      'Action',
      'Module',
      'Previous Value',
      'New Value',
      'Transaction Reference',
      'Details',
    ];

    const rows = filteredLogs.map((l) => [
      `"${l.timestamp || ''}"`,
      `"${l.date || ''}"`,
      `"${l.time || ''}"`,
      `"${l.user || l.staffName || ''}"`,
      `"${l.action || ''}"`,
      `"${l.module || l.category || ''}"`,
      `"${l.previousValue ?? ''}"`,
      `"${l.newValue ?? ''}"`,
      `"${l.transactionReference || l.referenceId || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pharmapulse_audit_trail_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* 1. AUDIT SECURITY OVERVIEW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Audit Records</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{effectiveLogs.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Immutable clinical event logs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Dispensary Sales</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {effectiveLogs.filter((l) => (l.module || l.category) === 'SALES').length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">POS &amp; receipt logs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stock &amp; Price Audits</span>
            <FileCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700">
            {effectiveLogs.filter((l) => (l.module || l.category) === 'INVENTORY' || (l.module || l.category) === 'PURCHASES').length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Inflow, adjustments &amp; price changes</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Attribution Integrity</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-700">Enforced</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Every action tagged with operator</p>
        </div>
      </div>

      {/* 2. REGULATORY NOTICE & EXAMPLE CALLOUT */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1 text-emerald-900">
            <h4 className="font-bold text-xs uppercase tracking-wide">
              PCN &amp; NAFDAC Clinical Audit Trail Compliance
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Every operation records the <strong>User</strong>, <strong>Action</strong>, <strong>Date</strong>, <strong>Time</strong>, <strong>Module</strong>, <strong>Previous value</strong>, <strong>New value</strong>, and <strong>Transaction reference</strong>. Operators are held strictly accountable with verifiable audit trails for all medication movements and sales.
            </p>
          </div>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by user, action, medicine, or reference (e.g. REC-, INV-)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Operator / User Filter */}
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-medium"
                title="Filter by responsible user"
              >
                <option value="ALL">All Users ({distinctUsers.length})</option>
                {distinctUsers.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-mono"
              />
              {filterDate && (
                <button
                  onClick={() => setFilterDate('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                  title="Clear date"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CSV Export Button */}
            <button
              onClick={handleExportAuditCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Export filtered audit trail to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Module Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 shrink-0">Module:</span>
          {[
            { id: 'ALL', label: 'All Modules' },
            { id: 'INVENTORY', label: 'Inventory' },
            { id: 'SALES', label: 'Sales' },
            { id: 'PURCHASES', label: 'Purchases' },
            { id: 'FINANCE', label: 'Finance' },
            { id: 'SECURITY', label: 'Security' },
            { id: 'SETTINGS', label: 'Settings' },
          ].map((m) => {
            const isSelected = filterModule === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setFilterModule(m.id)}
                className={`px-3 py-1 rounded-lg font-medium text-[11px] whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. AUDIT TRAIL TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4 whitespace-nowrap">User (Operator)</th>
                <th className="py-3 px-3 whitespace-nowrap">Action</th>
                <th className="py-3 px-3 whitespace-nowrap">Date &amp; Time</th>
                <th className="py-3 px-3 whitespace-nowrap">Module</th>
                <th className="py-3 px-4 whitespace-nowrap">Audit Trail Transformation</th>
                <th className="py-3 px-3 whitespace-nowrap">Transaction Ref</th>
                <th className="py-3 px-4">Detailed Audit Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600 text-xs">No audit records found matching the active criteria.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Try clearing your search query or adjusting the module/user filter.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const logDate = log.date || (log.timestamp ? log.timestamp.substring(0, 10) : '—');
                  const logTime = log.time || (log.timestamp && log.timestamp.length >= 16 ? log.timestamp.substring(11, 19) : '—');
                  const user = log.user || log.staffName || 'System';
                  const mod = log.module || log.category || 'SYSTEM';
                  const hasValues = log.previousValue !== undefined || log.newValue !== undefined;
                  const ref = log.transactionReference || log.referenceId || '—';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Column */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[10px] shrink-0 border border-emerald-200">
                            {user[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs">{user}</div>
                            {log.role && (
                              <div className="text-[10px] text-slate-400">
                                {log.role.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 uppercase border border-slate-200">
                          {log.action}
                        </span>
                      </td>

                      {/* Date & Time Column */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-slate-700 font-medium">{logDate}</div>
                        <div className="font-mono text-[10px] text-slate-400">{logTime}</div>
                      </td>

                      {/* Module Column */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getModuleBadgeColor(
                            mod
                          )}`}
                        >
                          {mod}
                        </span>
                      </td>

                      {/* Previous Value -> New Value */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasValues ? (
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                              {log.previousValue !== undefined ? String(log.previousValue) : 'None'}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200">
                              {log.newValue !== undefined ? String(log.newValue) : 'None'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Not applicable</span>
                        )}
                      </td>

                      {/* Transaction Reference */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {ref !== '—' ? (
                          <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100/80 px-2 py-0.5 rounded border border-slate-200">
                            {ref}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Narrative Details */}
                      <td className="py-3 px-4 text-slate-700 text-xs">
                        <p className="font-medium text-slate-800">{log.details}</p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <span>Showing {filteredLogs.length} of {effectiveLogs.length} activity audit events</span>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Cryptographically timestamped &amp; indexed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
