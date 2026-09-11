import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Product, Batch } from '../types/pharmacy';
import {
  Calendar,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Undo2,
  Search,
  Filter,
  PackageX,
  X,
} from 'lucide-react';

interface FlatBatchItem {
  product: Product;
  batch: Batch;
  daysRemaining: number;
  status: 'EXPIRED' | 'CRITICAL_30' | 'WARNING_60' | 'NOTICE_90' | 'SAFE';
  lossValue: number;
}

export const ExpiryBatchView: React.FC = () => {
  const {
    products,
    getDaysUntilExpiry,
    adjustStock,
    currentStaff,
    formatCurrency,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHorizon, setFilterHorizon] = useState<'ALL' | 'EXPIRED' | '30' | '60' | '90'>('ALL');

  // Quarantine & Disposal Modal
  const [quarantineTarget, setQuarantineTarget] = useState<FlatBatchItem | null>(null);
  const [disposalReason, setDisposalReason] = useState('Expired past safe shelf-life date');
  const [disposalFeedback, setDisposalFeedback] = useState<string | null>(null);

  // Flatten all batches across all products
  const flatBatches: FlatBatchItem[] = [];
  products.forEach((prod) => {
    (prod.batches || []).forEach((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      let status: FlatBatchItem['status'] = 'SAFE';
      if (days <= 0) status = 'EXPIRED';
      else if (days <= 30) status = 'CRITICAL_30';
      else if (days <= 60) status = 'WARNING_60';
      else if (days <= 90) status = 'NOTICE_90';

      flatBatches.push({
        product: prod,
        batch: b,
        daysRemaining: days,
        status,
        lossValue: b.quantity * b.costPrice,
      });
    });
  });

  // Calculate horizon counts
  const expiredCount = flatBatches.filter((b) => b.daysRemaining <= 0).length;
  const critical30Count = flatBatches.filter((b) => b.daysRemaining > 0 && b.daysRemaining <= 30).length;
  const warning60Count = flatBatches.filter((b) => b.daysRemaining > 30 && b.daysRemaining <= 60).length;
  const notice90Count = flatBatches.filter((b) => b.daysRemaining > 60 && b.daysRemaining <= 90).length;
  const totalFinancialExposure = flatBatches
    .filter((b) => b.daysRemaining <= 60)
    .reduce((acc, b) => acc + b.lossValue, 0);

  // Filtered List
  const filteredBatches = flatBatches.filter((item) => {
    const matchesSearch =
      item.product.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.batch.batchNumber.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterHorizon === 'EXPIRED') return item.daysRemaining <= 0;
    if (filterHorizon === '30') return item.daysRemaining <= 30;
    if (filterHorizon === '60') return item.daysRemaining <= 60;
    if (filterHorizon === '90') return item.daysRemaining <= 90;
    return true;
  });

  // Sort batches: expired first, then nearest expiry
  filteredBatches.sort((a, b) => a.daysRemaining - b.daysRemaining);

  const handleExecuteQuarantine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quarantineTarget) return;

    const res = adjustStock({
      productId: quarantineTarget.product.id,
      adjustmentType: 'EXPIRY_DISPOSAL',
      batchNumber: quarantineTarget.batch.batchNumber,
      quantity: quarantineTarget.batch.quantity,
      reason: `Quarantine/Disposal Batch ${quarantineTarget.batch.batchNumber}: ${disposalReason}`,
    });

    if (res.success) {
      setDisposalFeedback(res.message);
      setTimeout(() => {
        setDisposalFeedback(null);
        setQuarantineTarget(null);
      }, 1200);
    } else {
      setDisposalFeedback(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. HORIZON SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div
          onClick={() => setFilterHorizon('EXPIRED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterHorizon === 'EXPIRED'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired Batches</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">{expiredCount}</div>
          <span className="text-[10px] text-rose-600 font-semibold">Strict sales block active</span>
        </div>

        <div
          onClick={() => setFilterHorizon('30')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterHorizon === '30'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">&le; 30 Days Notice</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">{critical30Count}</div>
          <span className="text-[10px] text-amber-600 font-semibold">Urgent clearance or return</span>
        </div>

        <div
          onClick={() => setFilterHorizon('60')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterHorizon === '60'
              ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-100'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">&le; 60 Days Notice</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-800">{warning60Count}</div>
          <span className="text-[10px] text-slate-500 font-semibold">Prioritize FIFO dispensing</span>
        </div>

        <div
          onClick={() => setFilterHorizon('90')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterHorizon === '90'
              ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-100'
              : 'bg-white border-slate-200/80 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">&le; 90 Days Notice</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700">{notice90Count}</div>
          <span className="text-[10px] text-slate-500 font-semibold">Monitor quarterly trend</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">At-Risk Value</span>
            <PackageX className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">
            {formatCurrency(totalFinancialExposure)}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">Batches &le; 60 days</span>
        </div>
      </div>

      {/* 2. SEARCH & CONTROLS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by drug name or batch lot code..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterHorizon('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterHorizon === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Batches ({flatBatches.length})
          </button>
          <button
            onClick={() => setFilterHorizon('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterHorizon === 'EXPIRED'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            onClick={() => setFilterHorizon('30')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterHorizon === '30'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            &le; 30 Days ({critical30Count})
          </button>
          <button
            onClick={() => setFilterHorizon('60')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterHorizon === '60'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            &le; 60 Days ({warning60Count})
          </button>
        </div>
      </div>

      {/* 3. BATCH INVENTORY MONITOR TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Medication & Strength</th>
                <th className="py-3 px-3">Batch / Lot #</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-3">Remaining Shelf-Life</th>
                <th className="py-3 px-3 text-center">Batch Stock</th>
                <th className="py-3 px-3 text-right">Cost Value</th>
                <th className="py-3 px-3">Regulatory Status</th>
                <th className="py-3 px-4 text-right">Quarantine Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    No batches match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((item, idx) => {
                  const { product, batch, daysRemaining, status, lossValue } = item;
                  const isExpired = daysRemaining <= 0;

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isExpired
                          ? 'bg-rose-50/40 hover:bg-rose-50/80'
                          : daysRemaining <= 30
                          ? 'bg-amber-50/30 hover:bg-amber-50/60'
                          : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{product.brandName}</div>
                        <p className="text-[10px] text-slate-500">{product.genericName} • {product.strength}</p>
                      </td>

                      <td className="py-3 px-3 font-mono font-bold text-slate-800">
                        {batch.batchNumber}
                      </td>

                      <td className="py-3 px-3 font-mono text-emerald-800">
                        {product.shelfLocation}
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-700 font-semibold">
                        {batch.expiryDate}
                      </td>

                      {/* Shelf Life Bar & Countdown */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              isExpired
                                ? 'text-rose-700'
                                : daysRemaining <= 30
                                ? 'text-amber-700'
                                : daysRemaining <= 60
                                ? 'text-amber-600'
                                : 'text-slate-700'
                            }`}
                          >
                            {isExpired ? 'Expired' : `${daysRemaining} days`}
                          </span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isExpired
                                ? 'bg-rose-600 w-full'
                                : daysRemaining <= 30
                                ? 'bg-rose-500'
                                : daysRemaining <= 60
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: isExpired ? '100%' : `${Math.min(100, (daysRemaining / 365) * 100)}%`,
                            }}
                          ></div>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                        {batch.quantity} units
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        {formatCurrency(lossValue)}
                      </td>

                      <td className="py-3 px-3">
                        {isExpired ? (
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                            Quarantine Mandatory
                          </span>
                        ) : daysRemaining <= 30 ? (
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                            Urgent Clearance
                          </span>
                        ) : daysRemaining <= 60 ? (
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                            Warning 60D
                          </span>
                        ) : (
                          <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                            Active Safe
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setQuarantineTarget(item)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-lg text-[11px] flex items-center gap-1 ml-auto transition-colors"
                        >
                          <PackageX className="w-3.5 h-3.5" />
                          <span>Dispose / Quarantine</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPOSAL & QUARANTINE MODAL */}
      {quarantineTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setQuarantineTarget(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">
                  Quarantine & Dispose Batch
                </h3>
              </div>
              <button
                onClick={() => setQuarantineTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {disposalFeedback && (
              <div className="my-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                {disposalFeedback}
              </div>
            )}

            <form onSubmit={handleExecuteQuarantine} className="py-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800">
                  {quarantineTarget.product.brandName} ({quarantineTarget.product.strength})
                </div>
                <div className="text-slate-500 text-[11px]">
                  Lot: <strong className="font-mono text-slate-700">{quarantineTarget.batch.batchNumber}</strong> • Expiry: {quarantineTarget.batch.expiryDate}
                </div>
                <div className="text-slate-700 font-semibold pt-1">
                  Deducting: <span className="font-mono text-rose-700 font-bold">{quarantineTarget.batch.quantity} units</span> ({formatCurrency(quarantineTarget.lossValue)} write-off)
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Disposal / Quarantine Reason
                </label>
                <select
                  value={disposalReason}
                  onChange={(e) => setDisposalReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="Expired past safe shelf-life date">Expired past safe shelf-life date</option>
                  <option value="Broken cold chain storage excursion">Broken cold chain storage excursion</option>
                  <option value="Pharmacovigilance manufacturer recall">Pharmacovigilance manufacturer recall</option>
                  <option value="Physical discoloration or precipitation">Physical discoloration or precipitation</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Disposing Clinical Staff
                </label>
                <input
                  type="text"
                  value={currentStaff.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuarantineTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Quarantine & Write Off
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
