import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Product, StockMovementType } from '../types/pharmacy';
import {
  PackageX,
  AlertTriangle,
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  X,
  FileText,
} from 'lucide-react';

export const ReturnsDamagedView: React.FC = () => {
  const {
    products,
    stockMovements,
    adjustStock,
    currentStaff,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'DAMAGED' | 'EXPIRED' | 'RETURNS'>('DAMAGED');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Form State for new entry
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [entryType, setEntryType] = useState<'DAMAGE' | 'EXPIRY_DISPOSAL' | 'SUPPLIER_RETURN'>('DAMAGE');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('Broken seal during unboxing or shelf transit');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Filter stock movements
  const damagedList = stockMovements.filter((m) => m.movementType === 'DAMAGE');
  const expiredList = stockMovements.filter((m) => m.movementType === 'EXPIRY_DISPOSAL');
  const returnsList = stockMovements.filter((m) => m.movementType === 'SUPPLIER_RETURN');

  const selectedList =
    activeTab === 'DAMAGED'
      ? damagedList
      : activeTab === 'EXPIRED'
      ? expiredList
      : returnsList;

  const filteredItems = selectedList.filter((item) =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.referenceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Financial Loss estimations
  const totalDamagedUnits = damagedList.reduce((acc, i) => acc + Math.abs(i.quantityChange), 0);
  const totalExpiredUnits = expiredList.reduce((acc, i) => acc + Math.abs(i.quantityChange), 0);
  const totalReturnedUnits = returnsList.reduce((acc, i) => acc + Math.abs(i.quantityChange), 0);

  const handleRecordEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const res = adjustStock({
      productId: prod.id,
      adjustmentType: entryType,
      quantity,
      reason,
    });

    if (res.success) {
      setFeedback(res.message);
      setTimeout(() => {
        setFeedback(null);
        setIsLogModalOpen(false);
      }, 1000);
    } else {
      setFeedback(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP LOSS & DISPOSAL SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Damaged Stock</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">{totalDamagedUnits} Units</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Physical breaks & leaking vials</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Expired Disposals</span>
            <PackageX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">{totalExpiredUnits} Units</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Biohazard destruction waste</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Supplier Returns</span>
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700">{totalReturnedUnits} Units</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Wholesaler recall / credit claims</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Audit Compliance</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">100% Logged</div>
          <p className="text-[10px] text-slate-400 mt-0.5">PCN / NAFDAC compliant</p>
        </div>
      </div>

      {/* 2. TABS & CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('DAMAGED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'DAMAGED'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Damaged Goods ({damagedList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPIRED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'EXPIRED'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <PackageX className="w-4 h-4" />
            <span>Expired Disposals ({expiredList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('RETURNS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'RETURNS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Supplier Returns ({returnsList.length})</span>
          </button>
        </div>

        <button
          onClick={() => setIsLogModalOpen(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Outflow / Write-off</span>
        </button>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search write-off events..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
          />
        </div>
      </div>

      {/* 4. ITEMS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Medication</th>
                <th className="py-3 px-3">Reason / Nature of Loss</th>
                <th className="py-3 px-3">Docket / Reference</th>
                <th className="py-3 px-3 text-center">Previous Stock</th>
                <th className="py-3 px-3 text-center">Deduction</th>
                <th className="py-3 px-3 text-center">New Stock</th>
                <th className="py-3 px-4 text-right">Reporting Pharmacist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No records found in this category.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {item.timestamp}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {item.productName}
                    </td>

                    <td className="py-3 px-3 text-slate-600 max-w-[220px] truncate">
                      {item.reason}
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                      {item.referenceId}
                    </td>

                    <td className="py-3 px-3 text-center font-mono text-slate-500">
                      {item.previousStock}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-rose-700">
                        {item.quantityChange} units
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                      {item.newStock}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-600 font-medium">
                      {item.staffName}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOG WRITE-OFF MODAL */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setIsLogModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <PackageX className="w-4 h-4 text-rose-600" />
                <span>Log Stock Outflow & Write-off</span>
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
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

            <form onSubmit={handleRecordEntry} className="py-4 space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medication</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brandName} ({p.strength}) - Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Outflow Type</label>
                <select
                  value={entryType}
                  onChange={(e) => setEntryType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="DAMAGE">Damaged / Broken Packaging</option>
                  <option value="EXPIRY_DISPOSAL">Expired Medication Disposal</option>
                  <option value="SUPPLIER_RETURN">Supplier Recall / Return Claim</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantity Units</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Clinical Audit Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Responsible Staff</label>
                <input
                  type="text"
                  value={currentStaff.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
