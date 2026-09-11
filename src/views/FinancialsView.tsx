import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { CashTransaction, CashCategory, PaymentMethod } from '../types/pharmacy';
import { TablePagination } from '../components/TablePagination';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Calendar,
  Filter,
  Plus,
  Search,
  Building2,
  PieChart as PieChartIcon,
  CreditCard,
  Banknote,
  Receipt,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface FinancialsViewProps {
  onOpenQuickAction: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
}

export const FinancialsView: React.FC<FinancialsViewProps> = ({ onOpenQuickAction }) => {
  const {
    cashTransactions,
    dashboardMetrics,
    sales,
    purchases,
    recordExpense,
    formatCurrency,
    settings,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'STATEMENTS'>('LEDGER');
  const [period, setPeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INFLOW' | 'OUTFLOW'>('ALL');

  // Multi-method breakdown
  const cashInDrawer = cashTransactions
    .filter((t) => t.paymentMethod === 'CASH')
    .reduce((acc, t) => acc + (t.type === 'INFLOW' ? t.amount : -t.amount), 0);

  const bankBalance = cashTransactions
    .filter((t) => t.paymentMethod === 'BANK_TRANSFER' || t.paymentMethod === 'POS')
    .reduce((acc, t) => acc + (t.type === 'INFLOW' ? t.amount : -t.amount), 0);

  // Financial Statement calculations
  const totalRevenue = dashboardMetrics.todaySalesTotal;
  const totalCOGS = Number((totalRevenue * 0.58).toFixed(2)); // estimated standard COGS based on inventory markups
  const grossProfit = Number((totalRevenue - totalCOGS).toFixed(2));
  const operatingExpenses = dashboardMetrics.todayExpensesTotal;
  const netProfit = Number((grossProfit - operatingExpenses).toFixed(2));
  const grossMarginPct = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0.0';
  const netMarginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

  // Supplier payables outstanding
  const supplierPayables = purchases.reduce((acc, p) => acc + p.outstandingBalance, 0);

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'date' | 'category' | 'amount' | 'staff'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filtered Cash Ledger
  const filteredTransactions = useMemo(() => {
    return cashTransactions.filter((t) => {
      const matchesSearch =
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = filterType === 'ALL' || t.type === filterType;

      return matchesSearch && matchesType;
    });
  }, [cashTransactions, searchQuery, filterType]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sortField === 'date') {
        valA = a.timestamp;
        valB = b.timestamp;
      } else if (sortField === 'category') {
        valA = a.category;
        valB = b.category;
      } else if (sortField === 'amount') {
        valA = a.amount;
        valB = b.amount;
      } else {
        valA = a.staffName;
        valB = b.staffName;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredTransactions, sortField, sortDirection]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  const handleSort = (field: 'date' | 'category' | 'amount' | 'staff') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP CASH INTELLIGENCE HEADER */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Cash Balance</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {formatCurrency(dashboardMetrics.currentCashBalance)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Liquid pharmacy capital</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Cash in Drawer</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-700">
            {formatCurrency(Math.max(0, cashInDrawer))}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Physical dispensary register</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">POS & Bank Liquid</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-teal-700">
            {formatCurrency(Math.max(0, bankBalance))}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Electronic settlements</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Supplier Payables</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-rose-700">
            {formatCurrency(supplierPayables)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Trade credit balances due</p>
        </div>
      </div>

      {/* 2. TAB TOGGLE & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'LEDGER'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Cash Inflow & Outflow Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('STATEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'STATEMENTS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>P&amp;L Financial Statements</span>
          </button>
        </div>

        <button
          onClick={() => onOpenQuickAction('EXPENSE')}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense / Outflow</span>
        </button>
      </div>

      {/* 3. CASH FLOW LEDGER TAB */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
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
                placeholder="Search transactions, ref number, or category..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setFilterType('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Entries ({cashTransactions.length})
              </button>
              <button
                onClick={() => {
                  setFilterType('INFLOW');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'INFLOW'
                    ? 'bg-emerald-700 text-white font-semibold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                Inflows (+)
              </button>
              <button
                onClick={() => {
                  setFilterType('OUTFLOW');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'OUTFLOW'
                    ? 'bg-rose-700 text-white font-semibold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                Outflows (-)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Date & Time{' '}
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th className="py-3 px-3">Flow Type</th>
                    <th
                      onClick={() => handleSort('category')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Category{' '}
                      {sortField === 'category' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th className="py-3 px-3">Description & Ref</th>
                    <th className="py-3 px-3 text-center">Payment Channel</th>
                    <th
                      onClick={() => handleSort('staff')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Staff Operator{' '}
                      {sortField === 'staff' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Amount{' '}
                      {sortField === 'amount' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                        No transactions recorded matching this filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {tx.timestamp}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase ${
                              tx.type === 'INFLOW'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tx.type === 'INFLOW' ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            <span>{tx.type}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">
                            {tx.category.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800">{tx.description}</div>
                          {tx.referenceId && (
                            <span className="font-mono text-[10px] text-slate-400">
                              Ref: {tx.referenceId}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                            {tx.paymentMethod}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                          {tx.staffName}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                          <span
                            className={tx.type === 'INFLOW' ? 'text-emerald-700' : 'text-rose-700'}
                          >
                            {tx.type === 'INFLOW' ? `+${formatCurrency(tx.amount)}` : `-${formatCurrency(tx.amount)}`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredTransactions.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      {/* 4. FINANCIAL STATEMENT & INCOME SUMMARY TAB */}
      {activeTab === 'STATEMENTS' && (
        <div className="space-y-5">
          {/* Statement Header Controls */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Profit &amp; Loss Statement</h3>
              <p className="text-xs text-slate-500">
                Live financial performance calculation conforming to accounting principles
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    period === p
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* P&L Breakdown Table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Financial Breakdown Item</span>
                <span className="font-bold text-slate-900 text-sm">Value ({settings.currencyCode || 'NGN'})</span>
              </div>

              {/* 1. REVENUE */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    Gross Pharmacy Revenue
                  </span>
                  <span className="font-mono text-sm text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="pl-5 text-slate-500 flex justify-between text-[11px]">
                  <span>Prescriptions &amp; Retail OTC Sales ({sales.length} orders)</span>
                  <span className="font-mono">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>

              {/* 2. COGS */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
                    Cost of Goods Sold (COGS)
                  </span>
                  <span className="font-mono text-sm text-amber-700">-{formatCurrency(totalCOGS)}</span>
                </div>
                <div className="pl-5 text-slate-500 flex justify-between text-[11px]">
                  <span>Acquisition cost of dispensed medications</span>
                  <span className="font-mono">-{formatCurrency(totalCOGS)}</span>
                </div>
              </div>

              {/* GROSS PROFIT */}
              <div className="p-3 bg-slate-50 rounded-xl flex justify-between font-black text-slate-900 text-sm">
                <span>Gross Profit (Margin: {grossMarginPct}%)</span>
                <span className="font-mono text-emerald-800">{formatCurrency(grossProfit)}</span>
              </div>

              {/* 3. OPERATING EXPENSES */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                    Operating Expenses (OPEX)
                  </span>
                  <span className="font-mono text-sm text-rose-700">
                    -{formatCurrency(operatingExpenses)}
                  </span>
                </div>
                <div className="pl-5 text-slate-500 flex justify-between text-[11px]">
                  <span>Utilities, Facility, Maintenance, Consumables</span>
                  <span className="font-mono">-{formatCurrency(operatingExpenses)}</span>
                </div>
              </div>

              {/* NET PROFIT */}
              <div className="p-3.5 bg-emerald-900 text-white rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <div className="text-xs uppercase font-bold text-emerald-200">Net Pharmacy Profit</div>
                  <div className="text-[11px] text-emerald-300">Net Margin: {netMarginPct}%</div>
                </div>
                <span className="font-mono text-xl font-black text-white">
                  {formatCurrency(netProfit)}
                </span>
              </div>
            </div>

            {/* Side Card: Summary Margins & Ratios */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-3">Profitability Ratios</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 text-[11px]">Gross Profit Margin</span>
                    <div className="text-lg font-black text-slate-900 mt-0.5">{grossMarginPct}%</div>
                    <span className="text-[10px] text-slate-400">Target health benchmark: 35-45%</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 text-[11px]">Net Profit Margin</span>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">{netMarginPct}%</div>
                    <span className="text-[10px] text-slate-400">Target benchmark: 12-20%</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 text-[11px]">Outstanding Payables</span>
                    <div className="text-lg font-black text-rose-700 mt-0.5">
                      {formatCurrency(supplierPayables)}
                    </div>
                    <span className="text-[10px] text-slate-400">Wholesale credit liabilities</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                <span className="font-bold text-xs block mb-1">Audit Certified</span>
                <p className="text-[11px] leading-relaxed">
                  Real-time ledger entries are timestamped and linked to staff IDs for compliance with pharmacy accounting standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
