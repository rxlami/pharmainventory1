import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { NavigationTab, ProductCategory, DosageForm, PaymentMethod, CashCategory } from '../types/pharmacy';
import { hasActionPermission, getCanonicalRole } from '../utils/permissions';
import {
  X,
  PlusCircle,
  Receipt,
  ShoppingCart,
  Pill,
  Wallet,
  AlertOctagon,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
} from 'lucide-react';

interface QuickActionModalProps {
  isOpen?: boolean;
  initialTab?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT';
  initialAction?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT';
  onClose: () => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export const QuickActionModal: React.FC<QuickActionModalProps> = ({
  isOpen = true,
  initialTab,
  initialAction,
  onClose,
  onNavigate,
}) => {
  const effectiveInitial = initialAction || initialTab || 'INFLOW';
  const {
    products,
    suppliers,
    recordStockInflow,
    recordExpense,
    addProduct,
    adjustStock,
    currentStaff,
    formatCurrency,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT'>(
    effectiveInitial === 'SALE' ? 'INFLOW' : effectiveInitial
  );

  const canInflow = hasActionPermission(currentStaff.role, 'INFLOW');
  const canProduct = hasActionPermission(currentStaff.role, 'PRODUCT');
  const canExpense = hasActionPermission(currentStaff.role, 'EXPENSE');
  const canAdjustment = hasActionPermission(currentStaff.role, 'ADJUSTMENT');

  useEffect(() => {
    const nextTab = initialAction || initialTab || 'INFLOW';
    const target = nextTab === 'SALE' ? 'INFLOW' : nextTab;
    if (target === 'INFLOW' && canInflow) setActiveTab('INFLOW');
    else if (target === 'PRODUCT' && canProduct) setActiveTab('PRODUCT');
    else if (target === 'EXPENSE' && canExpense) setActiveTab('EXPENSE');
    else if (target === 'ADJUSTMENT' && canAdjustment) setActiveTab('ADJUSTMENT');
    else if (canInflow) setActiveTab('INFLOW');
    else if (canProduct) setActiveTab('PRODUCT');
    else if (canAdjustment) setActiveTab('ADJUSTMENT');
    else if (canExpense) setActiveTab('EXPENSE');
  }, [initialAction, initialTab, canInflow, canProduct, canExpense, canAdjustment]);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Inflow Form State
  const [inflowSupplierId, setInflowSupplierId] = useState(suppliers[0]?.id || '');
  const [inflowInvoice, setInflowInvoice] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [inflowProductId, setInflowProductId] = useState(products[0]?.id || '');
  const [inflowQty, setInflowQty] = useState(20);
  const [inflowCostPrice, setInflowCostPrice] = useState(2400);
  const [inflowSellingPrice, setInflowSellingPrice] = useState(3500);
  const [inflowBatchNum, setInflowBatchNum] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [inflowExpiry, setInflowExpiry] = useState('2027-12-31');
  const [inflowPaymentMethod, setInflowPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [inflowAmountPaid, setInflowAmountPaid] = useState(48000);

  // Expense Form State
  const [expCategory, setExpCategory] = useState<CashCategory>('OPERATING_EXPENSE');
  const [expAmount, setExpAmount] = useState<number>(15000);
  const [expDesc, setExpDesc] = useState('');
  const [expMethod, setExpMethod] = useState<PaymentMethod>('CASH');

  // Add Product Form State
  const [prodBrand, setProdBrand] = useState('');
  const [prodGeneric, setProdGeneric] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('Antibiotics');
  const [prodForm, setProdForm] = useState<DosageForm>('Tablet');
  const [prodStrength, setProdStrength] = useState('500mg');
  const [prodUnit, setProdUnit] = useState('Box of 100');
  const [prodCost, setProdCost] = useState(2500);
  const [prodPrice, setProdPrice] = useState(3800);
  const [prodReorder, setProdReorder] = useState(20);
  const [prodShelf, setProdShelf] = useState('Shelf A-01');
  const [prodNafdac, setProdNafdac] = useState('');
  const [prodRx, setProdRx] = useState(false);
  const [prodInitStock, setProdInitStock] = useState(50);
  const [prodBatchNum, setProdBatchNum] = useState(`BAT-${new Date().getFullYear()}-01`);
  const [prodExpiry, setProdExpiry] = useState('2028-06-30');

  // Adjustment Form State
  const [adjProdId, setAdjProdId] = useState(products[0]?.id || '');
  const [adjType, setAdjType] = useState<'DAMAGE' | 'EXPIRY_DISPOSAL' | 'SUPPLIER_RETURN' | 'INVENTORY_ADJUSTMENT'>('DAMAGE');
  const [adjQty, setAdjQty] = useState(1);
  const [adjReason, setAdjReason] = useState('Damaged packaging / seal broken during handling');

  if (isOpen === false) return null;

  // Auto-sync product pricing when selected in Inflow
  const handleInflowProductChange = (productId: string) => {
    setInflowProductId(productId);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      setInflowCostPrice(prod.costPrice);
      setInflowSellingPrice(prod.sellingPrice);
      setInflowAmountPaid(Number((inflowQty * prod.costPrice).toFixed(2)));
    }
  };

  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === inflowProductId);
    const sup = suppliers.find((s) => s.id === inflowSupplierId);
    if (!prod || !sup) {
      setFeedback({ type: 'error', message: 'Please select a valid product and supplier.' });
      return;
    }

    const res = recordStockInflow({
      supplierId: sup.id,
      supplierName: sup.name,
      invoiceNumber: inflowInvoice,
      dateReceived: new Date().toISOString().substring(0, 10),
      paymentMethod: inflowPaymentMethod,
      paymentStatus: inflowAmountPaid >= inflowQty * inflowCostPrice ? 'PAID' : 'PARTIAL',
      amountPaid: inflowAmountPaid,
      items: [
        {
          productId: prod.id,
          productName: prod.brandName,
          genericName: prod.genericName,
          batchNumber: inflowBatchNum,
          expiryDate: inflowExpiry,
          quantity: Number(inflowQty),
          unitCost: Number(inflowCostPrice),
          sellingPrice: Number(inflowSellingPrice),
        },
      ],
    });

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim()) {
      setFeedback({ type: 'error', message: 'Please provide an expense description.' });
      return;
    }
    const res = recordExpense({
      category: expCategory,
      amount: Number(expAmount),
      description: expDesc,
      paymentMethod: expMethod,
    });
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodBrand.trim() || !prodGeneric.trim()) {
      setFeedback({ type: 'error', message: 'Brand name and generic name are required.' });
      return;
    }

    const sup = suppliers[0];
    const res = addProduct(
      {
        sku: `${prodCategory.slice(0, 3).toUpperCase()}-${prodBrand.slice(0, 3).toUpperCase()}-${prodStrength.replace(/\D/g, '') || '100'}`,
        barcode: `${Math.floor(1000000000000 + Math.random() * 9000000000000)}`,
        brandName: prodBrand,
        genericName: prodGeneric,
        category: prodCategory,
        dosageForm: prodForm,
        strength: prodStrength,
        unit: prodUnit,
        costPrice: Number(prodCost),
        sellingPrice: Number(prodPrice),
        currentStock: Number(prodInitStock),
        reorderLevel: Number(prodReorder),
        optimalStock: Number(prodReorder * 2.5),
        shelfLocation: prodShelf,
        requiresPrescription: prodRx,
        storageCondition: 'Room Temp (15-25°C)',
        supplierId: sup ? sup.id : 'sup-1',
        supplierName: sup ? sup.name : 'Primary Distributor',
        nafdacRegNo: prodNafdac.trim() || undefined,
      },
      prodInitStock > 0
        ? {
            batchNumber: prodBatchNum,
            costPrice: Number(prodCost),
            sellingPrice: Number(prodPrice),
            quantity: Number(prodInitStock),
            initialQuantity: Number(prodInitStock),
            expiryDate: prodExpiry,
            receivedDate: new Date().toISOString().substring(0, 10),
            supplierId: sup?.id,
            supplierName: sup?.name,
            nafdacRegNo: prodNafdac.trim() || undefined,
          }
        : undefined
    );

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adjustStock({
      productId: adjProdId,
      adjustmentType: adjType,
      quantity: Number(adjQty),
      reason: adjReason,
    });
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => onClose(), 1200);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  return (
    <div
      id="quick-action-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="quick-action-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm sm:text-base">Pharmacy Quick Operations</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto">
          {canInflow && (
            <button
              onClick={() => setActiveTab('INFLOW')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'INFLOW'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
              <span>Receive Stock (Inflow)</span>
            </button>
          )}
          {canProduct && (
            <button
              onClick={() => setActiveTab('PRODUCT')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'PRODUCT'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              <span>Add Medication</span>
            </button>
          )}
          {canExpense && (
            <button
              onClick={() => setActiveTab('EXPENSE')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'EXPENSE'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-600" />
              <span>Record Expense (Cash Out)</span>
            </button>
          )}
          {canAdjustment && (
            <button
              onClick={() => setActiveTab('ADJUSTMENT')}
              className={`pb-3 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap ${
                activeTab === 'ADJUSTMENT'
                  ? 'border-emerald-600 text-emerald-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              <span>Stock Outflow / Damage</span>
            </button>
          )}

          {!canInflow && !canProduct && !canExpense && !canAdjustment && (
            <div className="py-2 text-xs text-slate-500 italic">
              Dispensary Cashier Mode: Sales POS terminal is your designated operational workspace.
            </div>
          )}
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* 1. STOCK INFLOW FORM */}
          {activeTab === 'INFLOW' && (
            <form onSubmit={handleReceiveStockSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Supplier</label>
                  <select
                    value={inflowSupplierId}
                    onChange={(e) => setInflowSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Invoice / Reference #</label>
                  <input
                    type="text"
                    value={inflowInvoice}
                    onChange={(e) => setInflowInvoice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Medication to Receive</label>
                <select
                  value={inflowProductId}
                  onChange={(e) => handleInflowProductChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brandName} ({p.strength}) - Current Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={inflowQty}
                    onChange={(e) => {
                      const q = Number(e.target.value);
                      setInflowQty(q);
                      setInflowAmountPaid(Number((q * inflowCostPrice).toFixed(2)));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cost Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inflowCostPrice}
                    onChange={(e) => {
                      const cp = Number(e.target.value);
                      setInflowCostPrice(cp);
                      setInflowAmountPaid(Number((inflowQty * cp).toFixed(2)));
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={inflowSellingPrice}
                    onChange={(e) => setInflowSellingPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Batch / Lot Number</label>
                  <input
                    type="text"
                    value={inflowBatchNum}
                    onChange={(e) => setInflowBatchNum(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={inflowExpiry}
                    onChange={(e) => setInflowExpiry(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              {/* Automatic Total Calculation Box */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-700 block">Total Purchase Cost</span>
                  <span className="text-base font-bold text-emerald-900 font-mono">
                    {formatCurrency(inflowQty * inflowCostPrice)}
                  </span>
                  <span className="text-[10px] text-emerald-600 block">
                    {inflowQty} units × {formatCurrency(inflowCostPrice)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                    Amount Paid Today (₦)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={inflowAmountPaid}
                    onChange={(e) => setInflowAmountPaid(Number(e.target.value))}
                    className="w-28 bg-white border border-slate-300 rounded-lg p-1.5 font-mono text-right font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Confirm Inflow & Update Stock</span>
                </button>
              </div>
            </form>
          )}

          {/* 2. ADD PRODUCT FORM */}
          {activeTab === 'PRODUCT' && (
            <form onSubmit={handleAddProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Augmentin"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Amoxicillin / Clavulanate"
                    value={prodGeneric}
                    onChange={(e) => setProdGeneric(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics & Pain Relief">Analgesics & Pain</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetics">Antidiabetics</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Antihistamines">Antihistamines</option>
                    <option value="Vitamins & Supplements">Vitamins</option>
                    <option value="Injectables & Infusions">Injectables</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Dosage Form</label>
                  <select
                    value={prodForm}
                    onChange={(e) => setProdForm(e.target.value as DosageForm)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Inhaler">Inhaler</option>
                    <option value="Drops">Drops</option>
                    <option value="Ointment / Cream">Ointment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 625mg"
                    value={prodStrength}
                    onChange={(e) => setProdStrength(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cost Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodCost}
                    onChange={(e) => setProdCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={prodInitStock}
                    onChange={(e) => setProdInitStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={prodReorder}
                    onChange={(e) => setProdReorder(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  NAFDAC Registration Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. A4-0192 or B4-2918"
                  value={prodNafdac}
                  onChange={(e) => setProdNafdac(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>

              {prodInitStock > 0 && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Initial Batch #</label>
                    <input
                      type="text"
                      value={prodBatchNum}
                      onChange={(e) => setProdBatchNum(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Batch Expiry Date</label>
                    <input
                      type="date"
                      value={prodExpiry}
                      onChange={(e) => setProdExpiry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="prod-rx-toggle"
                  checked={prodRx}
                  onChange={(e) => setProdRx(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="prod-rx-toggle" className="text-slate-700 font-medium">
                  Requires Physician Prescription (Rx Legend Drug)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Pill className="w-4 h-4" />
                  <span>Save to Product Catalog</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. RECORD EXPENSE FORM */}
          {activeTab === 'EXPENSE' && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expense Category</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value as CashCategory)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="OPERATING_EXPENSE">Operating Expense (Supplies, labels)</option>
                    <option value="UTILITY_BILL">Utility Bill (Electricity, cooling)</option>
                    <option value="WASTE_DISPOSAL">Biohazard & Waste Disposal</option>
                    <option value="SALARY_PAYROLL">Staff Salary / Relief Pharmacist</option>
                    <option value="SUPPLIER_PAYOUT">Supplier Direct Payout</option>
                    <option value="MISCELLANEOUS">Miscellaneous Operational</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-base font-bold text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Memo</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Purchased thermal receipt rolls and clinical antiseptic spray"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={expMethod}
                  onChange={(e) => setExpMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="CASH">Cash (From Dispensary Register)</option>
                  <option value="POS">POS / Corporate Card</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Deduct Cash & Record Expense</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. STOCK OUTFLOW & ADJUSTMENT FORM */}
          {activeTab === 'ADJUSTMENT' && (
            <form onSubmit={handleAdjustStockSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs">
                <strong>Regulatory Compliance:</strong> Every non-sale stock reduction (damage, expiry disposal, return) is permanently recorded in the audit trail. Stock will never be allowed to go negative.
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Medicine</label>
                <select
                  value={adjProdId}
                  onChange={(e) => setAdjProdId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.brandName} ({p.strength}) - In Stock: {p.currentStock}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Outflow Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  >
                    <option value="DAMAGE">Damaged Stock (Broken vial/strip)</option>
                    <option value="EXPIRY_DISPOSAL">Expired Stock Disposal / Quarantine</option>
                    <option value="SUPPLIER_RETURN">Return to Wholesaler</option>
                    <option value="INVENTORY_ADJUSTMENT">Physical Audit Reconciliation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity to Deduct</label>
                  <input
                    type="number"
                    min="1"
                    value={adjQty}
                    onChange={(e) => setAdjQty(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Reason / Justification</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Seal compromised during transport or batch recall"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>Apply Stock Deduction</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Shortcut Links */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">Need to make a sale?</span>
          <button
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate('sales');
              }
            }}
            className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Launch Sales POS Terminal →</span>
          </button>
        </div>
      </div>
    </div>
  );
};
