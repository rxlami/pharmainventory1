import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { NavigationTab } from '../types/pharmacy';
import {
  AlertTriangle,
  ShieldAlert,
  CalendarX,
  Clock,
  ArrowDownLeft,
  PackageX,
  CheckCircle2,
  Bell,
  Search,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export interface AlertItem {
  id: string;
  type: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY';
  productId: string;
  productName: string;
  batchNumber?: string;
  currentStock: number;
  reorderLevel: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  daysRemaining?: number;
  shelfLocation: string;
  supplierName: string;
  timestamp: string;
}

interface AlertsViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenQuickAction: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ onNavigate, onOpenQuickAction }) => {
  const { settings, products, getDaysUntilExpiry } = usePharmacy();
  const [filterType, setFilterType] = useState<'ALL' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRED' | 'NEAR_EXPIRY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  // Compute live alerts directly from the inventory
  const generatedAlerts: AlertItem[] = [];

  products.forEach((p) => {
    // 1. Stock level checks
    if (p.currentStock === 0) {
      generatedAlerts.push({
        id: `oos_${p.id}`,
        type: 'OUT_OF_STOCK',
        productId: p.id,
        productName: p.brandName,
        currentStock: 0,
        reorderLevel: p.reorderLevel,
        severity: 'CRITICAL',
        message: `${p.brandName} (${p.genericName}) is completely OUT OF STOCK at shelf location ${p.shelfLocation}. Immediate restock required.`,
        shelfLocation: p.shelfLocation,
        supplierName: p.supplierName,
        timestamp: 'Real-time monitor',
      });
    } else if (p.currentStock <= p.reorderLevel) {
      generatedAlerts.push({
        id: `low_${p.id}`,
        type: 'LOW_STOCK',
        productId: p.id,
        productName: p.brandName,
        currentStock: p.currentStock,
        reorderLevel: p.reorderLevel,
        severity: 'WARNING',
        message: `${p.brandName} has fallen to ${p.currentStock} units (reorder threshold is ${p.reorderLevel}). Order from ${p.supplierName}.`,
        shelfLocation: p.shelfLocation,
        supplierName: p.supplierName,
        timestamp: 'Real-time monitor',
      });
    }

    // 2. Batch expiry checks
    (p.batches || []).forEach((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      if (days <= 0) {
        generatedAlerts.push({
          id: `exp_${b.id}`,
          type: 'EXPIRED',
          productId: p.id,
          productName: p.brandName,
          batchNumber: b.batchNumber,
          currentStock: b.quantity,
          reorderLevel: p.reorderLevel,
          severity: 'CRITICAL',
          message: `Lot #${b.batchNumber} EXPIRED on ${b.expiryDate}. Contains ${b.quantity} units. Strict dispensing block is active.`,
          daysRemaining: days,
          shelfLocation: p.shelfLocation,
          supplierName: p.supplierName,
          timestamp: 'Shelf-life check',
        });
      } else if (days <= settings.nearExpiryWarningDays) {
        generatedAlerts.push({
          id: `near_${b.id}`,
          type: 'NEAR_EXPIRY',
          productId: p.id,
          productName: p.brandName,
          batchNumber: b.batchNumber,
          currentStock: b.quantity,
          reorderLevel: p.reorderLevel,
          severity: 'WARNING',
          message: `Lot #${b.batchNumber} expires in ${days} days (${b.expiryDate}). Contains ${b.quantity} units. Prioritize FIFO dispensing.`,
          daysRemaining: days,
          shelfLocation: p.shelfLocation,
          supplierName: p.supplierName,
          timestamp: 'Shelf-life check',
        });
      }
    });
  });

  const activeAlerts = generatedAlerts.filter((a) => !dismissedIds.includes(a.id));

  const filteredAlerts = activeAlerts.filter((a) => {
    const matchesFilter = filterType === 'ALL' || a.type === filterType;
    const matchesSearch =
      a.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const outOfStockCount = activeAlerts.filter((a) => a.type === 'OUT_OF_STOCK').length;
  const lowStockCount = activeAlerts.filter((a) => a.type === 'LOW_STOCK').length;
  const expiredCount = activeAlerts.filter((a) => a.type === 'EXPIRED').length;
  const nearExpiryCount = activeAlerts.filter((a) => a.type === 'NEAR_EXPIRY').length;

  const dismissAlert = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
  };

  return (
    <div className="space-y-5">
      {/* 1. TOP METRICS & NOTIFICATION CONTROLS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setFilterType('OUT_OF_STOCK')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'OUT_OF_STOCK'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Out of Stock</span>
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">{outOfStockCount}</div>
          <span className="text-[10px] text-rose-600 font-semibold">Immediate reorder needed</span>
        </div>

        <div
          onClick={() => setFilterType('LOW_STOCK')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'LOW_STOCK'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">{lowStockCount}</div>
          <span className="text-[10px] text-amber-600 font-semibold">Quantity &le; Reorder Level</span>
        </div>

        <div
          onClick={() => setFilterType('EXPIRED')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'EXPIRED'
              ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Expired Batches</span>
            <CalendarX className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">{expiredCount}</div>
          <span className="text-[10px] text-rose-600 font-semibold">Quarantine lock engaged</span>
        </div>

        <div
          onClick={() => setFilterType('NEAR_EXPIRY')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterType === 'NEAR_EXPIRY'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-slate-200/80 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Near Expiry</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">{nearExpiryCount}</div>
          <span className="text-[10px] text-slate-500 font-semibold">
            &le; {settings.nearExpiryWarningDays} days shelf-life
          </span>
        </div>
      </div>

      {/* 2. SEARCH & FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by medication name or condition..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'ALL'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Alerts ({activeAlerts.length})
          </button>
          <button
            onClick={() => setFilterType('OUT_OF_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'OUT_OF_STOCK'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Stockout
          </button>
          <button
            onClick={() => setFilterType('LOW_STOCK')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'LOW_STOCK'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterType('EXPIRED')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'EXPIRED'
                ? 'bg-rose-700 text-white font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Expired
          </button>
          <button
            onClick={() => setFilterType('NEAR_EXPIRY')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filterType === 'NEAR_EXPIRY'
                ? 'bg-amber-700 text-white font-semibold'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            Near Expiry
          </button>
        </div>
      </div>

      {/* 3. ALERTS STREAM LIST */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">Dispensary Stock is Safe</h3>
            <p className="text-xs text-slate-500 mt-1">
              No outstanding inventory warnings match your active filters.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
                  isCritical
                    ? 'bg-rose-50/50 border-rose-300 hover:border-rose-400'
                    : 'bg-amber-50/40 border-amber-300 hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isCritical ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        {alert.productName}
                      </h4>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                        }`}
                      >
                        {alert.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-0.5">{alert.message}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-mono mt-1.5">
                      <span>Stock: <strong className="text-slate-800">{alert.currentStock}</strong></span>
                      {alert.reorderLevel !== undefined && (
                        <span>Reorder Level: <strong>{alert.reorderLevel}</strong></span>
                      )}
                      {alert.daysRemaining !== undefined && (
                        <span>
                          Days Left:{' '}
                          <strong className={alert.daysRemaining <= 0 ? 'text-rose-700' : 'text-amber-700'}>
                            {alert.daysRemaining <= 0 ? 'EXPIRED' : `${alert.daysRemaining} days`}
                          </strong>
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">Triggered: {alert.timestamp}</span>
                    </div>
                  </div>
                </div>

                {/* Response Actions */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  {alert.type === 'EXPIRED' ? (
                    <button
                      onClick={() => onNavigate('expiry')}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <PackageX className="w-3.5 h-3.5" />
                      <span>Quarantine Batch</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpenQuickAction('INFLOW')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-colors"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                      <span>1-Click Reorder</span>
                    </button>
                  )}

                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. CLINICAL THRESHOLD RULES FOOTER */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Sliders className="w-4 h-4 text-emerald-600" />
          <span>
            Active Thresholds: Low-stock triggers at customized per-product minimums • Near-expiry alerts trigger at{' '}
            <strong>{settings.nearExpiryWarningDays} days</strong> horizon.
          </span>
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="text-emerald-700 hover:underline font-semibold flex items-center gap-1 shrink-0"
        >
          <span>Modify Thresholds</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
