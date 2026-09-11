import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { StockMovementType } from '../types/pharmacy';
import { TablePagination } from '../components/TablePagination';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  PackageX,
  RotateCcw,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const StockMovementsView: React.FC = () => {
  const { stockMovements, products } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'timestamp' | 'product' | 'change' | 'newStock' | 'staff'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredMovements = useMemo(() => {
    return stockMovements.filter((m) => {
      const matchesSearch =
        m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.staffName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'ALL' || m.movementType === filterType;

      return matchesSearch && matchesType;
    });
  }, [stockMovements, searchQuery, filterType]);

  const sortedMovements = useMemo(() => {
    return [...filteredMovements].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'timestamp') {
        valA = a.timestamp;
        valB = b.timestamp;
      } else if (sortField === 'product') {
        valA = a.productName;
        valB = b.productName;
      } else if (sortField === 'change') {
        valA = a.quantityChange;
        valB = b.quantityChange;
      } else if (sortField === 'newStock') {
        valA = a.newStock;
        valB = b.newStock;
      } else {
        valA = a.staffName;
        valB = b.staffName;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredMovements, sortField, sortDirection]);

  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMovements.slice(start, start + pageSize);
  }, [sortedMovements, currentPage, pageSize]);

  const handleSort = (field: 'timestamp' | 'product' | 'change' | 'newStock' | 'staff') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Analytics on movements
  const totalInflowUnits = stockMovements
    .filter((m) => m.quantityChange > 0)
    .reduce((acc, m) => acc + m.quantityChange, 0);

  const totalOutflowUnits = stockMovements
    .filter((m) => m.quantityChange < 0)
    .reduce((acc, m) => acc + Math.abs(m.quantityChange), 0);

  const damagedUnits = stockMovements
    .filter((m) => m.movementType === 'DAMAGE')
    .reduce((acc, m) => acc + Math.abs(m.quantityChange), 0);

  const expiredDisposedUnits = stockMovements
    .filter((m) => m.movementType === 'EXPIRY_DISPOSAL')
    .reduce((acc, m) => acc + Math.abs(m.quantityChange), 0);

  return (
    <div className="space-y-5">
      {/* 1. MOVEMENT SUMMARY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stock Inflow</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            +{totalInflowUnits}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Purchases &amp; returns restocked</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Stock Outflow</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">
            -{totalOutflowUnits}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Prescriptions, OTC, write-offs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Damaged Units</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            {damagedUnits}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Broken vials / damaged packs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expired Disposals</span>
            <PackageX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">
            {expiredDisposedUnits}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Quarantined from dispensary</p>
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search movements by medicine, reference ID, or reason..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => {
              setFilterType('ALL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Movements ({stockMovements.length})
          </button>
          <button
            onClick={() => {
              setFilterType('PURCHASE_INFLOW');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'PURCHASE_INFLOW'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Inflow
          </button>
          <button
            onClick={() => {
              setFilterType('SALE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'SALE'
                ? 'bg-emerald-700 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Sales Outflow
          </button>
          <button
            onClick={() => {
              setFilterType('DAMAGE');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'DAMAGE'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Damage
          </button>
          <button
            onClick={() => {
              setFilterType('EXPIRY_DISPOSAL');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap ${
              filterType === 'EXPIRY_DISPOSAL'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Expired
          </button>
        </div>
      </div>

      {/* 3. MOVEMENTS AUDIT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th
                  onClick={() => handleSort('timestamp')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Timestamp{' '}
                  {sortField === 'timestamp' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                  )}
                </th>
                <th className="py-3 px-3">Type</th>
                <th
                  onClick={() => handleSort('product')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Medication{' '}
                  {sortField === 'product' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                  )}
                </th>
                <th className="py-3 px-3">Reason / Context</th>
                <th className="py-3 px-3">Reference / Docket</th>
                <th className="py-3 px-3 text-center">Previous</th>
                <th
                  onClick={() => handleSort('change')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Change{' '}
                  {sortField === 'change' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                  )}
                </th>
                <th
                  onClick={() => handleSort('newStock')}
                  className="py-3 px-3 text-center cursor-pointer hover:text-slate-900 transition-colors"
                >
                  New Stock{' '}
                  {sortField === 'newStock' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                  )}
                </th>
                <th
                  onClick={() => handleSort('staff')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                >
                  Staff Operator{' '}
                  {sortField === 'staff' ? (
                    sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No stock movement events match this filter.
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((m) => {
                  const isInflow = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {m.timestamp}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block font-bold text-[9px] px-2 py-0.5 rounded-full uppercase ${
                            isInflow
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.movementType === 'SALE'
                              ? 'bg-blue-100 text-blue-800'
                              : m.movementType === 'DAMAGE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {m.movementType.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {m.productName}
                      </td>

                      <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                        {m.reason}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        {m.referenceId}
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        {m.previousStock}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold ${
                            isInflow ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isInflow ? `+${m.quantityChange}` : m.quantityChange}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {m.newStock}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-600 font-medium">
                        {m.staffName}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={currentPage}
          totalItems={filteredMovements.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
};
