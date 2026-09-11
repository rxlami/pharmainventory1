import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { PharmacySettings } from '../types/pharmacy';
import {
  Settings,
  Building2,
  Sliders,
  DollarSign,
  Receipt,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Database,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToSeedData } = usePharmacy();
  const [formData, setFormData] = useState<PharmacySettings>({ ...settings });

  useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveFeedback('System settings updated successfully.');
    setTimeout(() => setSaveFeedback(null), 2000);
  };

  const handleResetData = () => {
    resetToSeedData();
    setResetConfirm(false);
    setSaveFeedback('Database restored to clean clinical demo seed state.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {saveFeedback && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveFeedback}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5 text-xs">
        {/* 1. PHARMACY IDENTITY & SAAS TENANT INFO */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Pharmacy &amp; Branch Identity</h3>
              <p className="text-slate-500 text-[11px]">Primary organization metadata printed on patient receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Pharmacy Name</label>
              <input
                type="text"
                value={formData.pharmacyName}
                onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Branch / Facility</label>
              <input
                type="text"
                value={formData.branchName}
                onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">PCN Premises License Number</label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value, pcnPremisesNumber: e.target.value })}
                placeholder="e.g. PCN/LA/2024/09842"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Superintendent Pharmacist</label>
              <input
                type="text"
                value={formData.pharmacistInCharge || ''}
                onChange={(e) => setFormData({ ...formData, pharmacistInCharge: e.target.value })}
                placeholder="Pharm. Name, MPSN"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Superintendent PCN License #</label>
              <input
                type="text"
                value={formData.superintendentPcnLicense || ''}
                onChange={(e) => setFormData({ ...formData, superintendentPcnLicense: e.target.value })}
                placeholder="e.g. PCN/REG/44912"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Primary Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">City / State</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.city || 'Ikeja'}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City (e.g. Ikeja)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
                <input
                  type="text"
                  value={formData.state || 'Lagos State'}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State (e.g. Lagos)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Dispensary Physical Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                required
              />
            </div>
          </div>
        </div>

        {/* 2. CLINICAL THRESHOLDS & INVENTORY RULES */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Clinical Monitoring &amp; Alert Rules</h3>
              <p className="text-slate-500 text-[11px]">System-wide expiry and stock thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Near-Expiry Alert Horizon (Days)
              </label>
              <input
                type="number"
                min="15"
                max="180"
                value={formData.nearExpiryWarningDays}
                onChange={(e) =>
                  setFormData({ ...formData, nearExpiryWarningDays: Number(e.target.value) })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Default: 60 days. Triggers yellow shelf-life warnings.
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol || '₦'}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Dispensary currency symbol (₦)
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Currency ISO Code</label>
              <input
                type="text"
                value={formData.currencyCode || 'NGN'}
                onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Financial ISO standard (NGN)
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">VAT / Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="30"
                step="0.1"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                required
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Standard Nigerian VAT is 7.5%
              </p>
            </div>
          </div>
        </div>

        {/* 3. RECEIPT CUSTOMIZATION */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="w-4 h-4 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Receipt Legal Disclaimers &amp; Header</h3>
              <p className="text-slate-500 text-[11px]">Printed at the top and bottom of patient dispensing receipts</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Receipt Header / Subtitle</label>
            <input
              type="text"
              value={formData.receiptHeader || ''}
              onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
              placeholder="e.g. PCN Licensed Community Pharmacy & Dispensary"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Receipt Footer Disclaimer</label>
            <textarea
              rows={2}
              value={formData.receiptFooter || ''}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>

      {/* 4. DEMO DATA RESET ZONE */}
      <div className="bg-white p-5 rounded-2xl border border-rose-200/80 shadow-xs space-y-3 text-xs">
        <div className="flex items-center gap-2 text-rose-800">
          <Database className="w-4 h-4 text-rose-600" />
          <h3 className="font-bold text-sm">Dispensary Demo Data Management</h3>
        </div>
        <p className="text-slate-500">
          Reset all current localStorage records back to the fresh clinical demo state with full sample medications, batches, suppliers, and transactions.
        </p>

        {!resetConfirm ? (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl border border-rose-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Demo Seed Data</span>
          </button>
        ) : (
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-300 flex items-center justify-between gap-3">
            <span className="text-rose-900 font-semibold">
              Are you sure? This will wipe your locally entered modifications and reload pristine seed records.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setResetConfirm(false)}
                className="px-3 py-1.5 bg-white text-slate-700 font-medium rounded-lg border border-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-3 py-1.5 bg-rose-700 text-white font-bold rounded-lg shadow-xs"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
