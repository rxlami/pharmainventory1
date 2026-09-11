import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Supplier, PurchaseOrder, PaymentMethod } from '../types/pharmacy';
import {
  Truck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  X,
  CreditCard,
  ShoppingBag,
  ArrowDownLeft,
  Receipt,
  Package,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

interface SuppliersViewProps {
  onOpenQuickAction: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onOpenQuickAction }) => {
  const { suppliers, addSupplier, updateSupplier, settleSupplierBalance, purchases, formatCurrency } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplierForHistory, setSelectedSupplierForHistory] = useState<Supplier | null>(null);
  const [settleModalSupplier, setSettleModalSupplier] = useState<Supplier | null>(null);

  // Settlement Form State
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlePaymentMethod, setSettlePaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [settleNotes, setSettleNotes] = useState<string>('');
  const [settleFeedback, setSettleFeedback] = useState<string | null>(null);

  // New Supplier Form State
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id' | 'createdAt'>>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    paymentTerms: 'Net 30',
    leadTimeDays: 2,
    suppliedCategories: ['Antibiotics'],
    productsSupplied: [],
    outstandingBalance: 0,
    balanceOwed: 0,
    isActive: true,
  });

  const [productsSuppliedInput, setProductsSuppliedInput] = useState('Amoxicillin 500mg, Augmentin 625mg, Paracetamol 500mg');
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      (s.productsSupplied && s.productsSupplied.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const totalOutstanding = suppliers.reduce((acc, s) => acc + (s.outstandingBalance ?? s.balanceOwed ?? 0), 0);
  const totalPurchaseVolume = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name) return;

    const parsedProducts = productsSuppliedInput
      .split(',')
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    addSupplier({
      ...newSupplier,
      productsSupplied: parsedProducts.length > 0 ? parsedProducts : ['General Pharmaceuticals'],
      balanceOwed: newSupplier.outstandingBalance,
    });

    setFormFeedback('Supplier profile successfully registered.');
    setTimeout(() => {
      setFormFeedback(null);
      setIsAddModalOpen(false);
      setNewSupplier({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        paymentTerms: 'Net 30',
        leadTimeDays: 2,
        suppliedCategories: ['Antibiotics'],
        productsSupplied: [],
        outstandingBalance: 0,
        balanceOwed: 0,
        isActive: true,
      });
      setProductsSuppliedInput('Amoxicillin 500mg, Augmentin 625mg, Paracetamol 500mg');
    }, 1000);
  };

  const handleOpenSettleModal = (supplier: Supplier) => {
    setSettleModalSupplier(supplier);
    setSettleAmount(supplier.outstandingBalance ?? supplier.balanceOwed ?? 0);
    setSettleNotes(`Payment to ${supplier.name} for invoice settlement.`);
    setSettleFeedback(null);
  };

  const handleConfirmSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settleModalSupplier || settleAmount <= 0) return;

    const res = settleSupplierBalance(
      settleModalSupplier.id,
      settleAmount,
      settlePaymentMethod,
      settleNotes
    );

    if (res.success) {
      setSettleFeedback(res.message);
      setTimeout(() => {
        setSettleFeedback(null);
        setSettleModalSupplier(null);
      }, 1200);
    } else {
      setSettleFeedback(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. SUPPLIER PERFORMANCE METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Registered Suppliers</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">{suppliers.length}</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Approved pharma distributors</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Purchases</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-blue-700">{purchases.length} Orders</div>
          <p className="text-[10px] text-slate-400 mt-0.5">Vol: {formatCurrency(totalPurchaseVolume)}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Outstanding Due</span>
            <DollarSign className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-700">
            {formatCurrency(totalOutstanding)}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Accounts payable balance</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Wholesalers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-700">
            {suppliers.filter((s) => s.isActive).length}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Active trading partners</p>
        </div>
      </div>

      {/* 2. SEARCH & ACTIONS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by supplier name, contact person, product, or phone..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Supplier</span>
        </button>
      </div>

      {/* 3. SUPPLIER CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((supplier) => {
          const supplierPurchases = purchases.filter((p) => p.supplierId === supplier.id || p.supplierName.toLowerCase() === supplier.name.toLowerCase());
          const balance = supplier.outstandingBalance ?? supplier.balanceOwed ?? 0;
          const productsList = supplier.productsSupplied && supplier.productsSupplied.length > 0
            ? supplier.productsSupplied
            : supplier.suppliedCategories || ['Pharmaceuticals'];

          return (
            <div
              key={supplier.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-all text-xs"
            >
              <div>
                {/* Header: Name and Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{supplier.name}</h3>
                    <p className="text-slate-500 font-medium">Contact: {supplier.contactPerson}</p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      supplier.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Contact details */}
                <div className="mt-3 space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{supplier.address}</span>
                  </div>
                </div>

                {/* Products Supplied */}
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Products Supplied ({productsList.length}):
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {productsList.map((prod, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10px] font-medium"
                      >
                        {prod}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Terms, Balance & Purchase History */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Payment Terms:</span>
                  <span className="font-semibold text-slate-800">{supplier.paymentTerms}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Delivery Lead Time:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {supplier.leadTimeDays} Days
                  </span>
                </div>

                {/* Outstanding Balance */}
                <div className="flex justify-between items-center font-bold text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-700">Outstanding Balance:</span>
                  <div className="text-right">
                    <span
                      className={`font-mono text-sm ${
                        balance > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>

                {/* Actions: View Purchase History & Settle Balance */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setSelectedSupplierForHistory(supplier)}
                    className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <Receipt className="w-3.5 h-3.5 text-slate-500" />
                    <span>Purchase History ({supplierPurchases.length})</span>
                  </button>

                  <button
                    onClick={() => handleOpenSettleModal(supplier)}
                    className="py-2 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors text-[11px]"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-rose-600" />
                    <span>Settle Balance</span>
                  </button>
                </div>

                <button
                  onClick={() => onOpenQuickAction('INFLOW')}
                  className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors text-xs"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Receive Stock Shipment</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DISPLAY SUPPLIER PURCHASE HISTORY MODAL */}
      {selectedSupplierForHistory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedSupplierForHistory(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 border border-slate-200 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  <span>Purchase History: {selectedSupplierForHistory.name}</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Contact: {selectedSupplierForHistory.contactPerson} ({selectedSupplierForHistory.phone}) • Outstanding Balance:{' '}
                  <span className="font-bold font-mono text-rose-700">
                    {formatCurrency(selectedSupplierForHistory.outstandingBalance ?? selectedSupplierForHistory.balanceOwed ?? 0)}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplierForHistory(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Products Supplied Summary */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-700 block mb-1.5">
                Authorized Products Supplied:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(selectedSupplierForHistory.productsSupplied || selectedSupplierForHistory.suppliedCategories || []).map(
                  (p, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white border border-slate-200 text-slate-800 font-medium rounded-lg text-xs"
                    >
                      {p}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Invoices and Purchase Orders List */}
            <div className="mt-4 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Invoices &amp; Inward Receipts
              </h4>

              {(() => {
                const history = purchases.filter(
                  (p) =>
                    p.supplierId === selectedSupplierForHistory.id ||
                    p.supplierName.toLowerCase() === selectedSupplierForHistory.name.toLowerCase()
                );

                if (history.length === 0) {
                  return (
                    <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-medium">No purchase invoices recorded yet for this supplier.</p>
                      <button
                        onClick={() => {
                          setSelectedSupplierForHistory(null);
                          onOpenQuickAction('INFLOW');
                        }}
                        className="mt-3 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                      >
                        Record Stock Inflow
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <th className="py-2.5 px-3">Invoice #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Items Received</th>
                          <th className="py-2.5 px-3">Total Amount</th>
                          <th className="py-2.5 px-3">Amount Paid</th>
                          <th className="py-2.5 px-3">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              #{order.invoiceNumber}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{order.orderDate}</td>
                            <td className="py-2.5 px-3 text-slate-700">
                              <div className="space-y-0.5">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="text-[11px]">
                                    <span className="font-semibold text-slate-800">{item.productName}</span>{' '}
                                    <span className="text-slate-500">
                                      ({item.quantity} units @ {formatCurrency(item.unitCost)})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                              {formatCurrency(order.totalAmount)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-emerald-700 font-semibold">
                              {formatCurrency(order.amountPaid)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  order.paymentStatus === 'PAID'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : order.paymentStatus === 'PARTIAL'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {order.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-5">
              <button
                type="button"
                onClick={() => setSelectedSupplierForHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTLE SUPPLIER BALANCE MODAL */}
      {settleModalSupplier && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setSettleModalSupplier(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Settle Supplier Balance</span>
              </h3>
              <button
                onClick={() => setSettleModalSupplier(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {settleFeedback && (
              <div className="my-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{settleFeedback}</span>
              </div>
            )}

            <form onSubmit={handleConfirmSettlement} className="py-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500 text-[11px]">Supplier:</div>
                <div className="font-bold text-slate-900 text-sm">{settleModalSupplier.name}</div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-xs">
                  <span className="text-slate-600">Current Outstanding:</span>
                  <span className="font-mono font-bold text-rose-700">
                    {formatCurrency(settleModalSupplier.outstandingBalance ?? settleModalSupplier.balanceOwed ?? 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount to Settle (₦)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-sm font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
                <select
                  value={settlePaymentMethod}
                  onChange={(e) => setSettlePaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  <option value="CASH">Cash Drawer Outflow</option>
                  <option value="POS">POS / Card Debit</option>
                  <option value="OTHER">Bank Cheque / Draft</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Transaction Reference</label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="e.g. NIBSS / GTBank Ref #948291"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSettleModalSupplier(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm"
                >
                  Confirm &amp; Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGISTER NEW SUPPLIER MODAL */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-xs my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Register Pharmaceutical Supplier</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formFeedback && (
              <div className="my-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>{formFeedback}</span>
              </div>
            )}

            <form onSubmit={handleCreateSupplier} className="py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Company / Supplier Name</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    placeholder="e.g. Fidson Healthcare Plc / Emzor Pharmaceuticals"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    placeholder="Account Representative"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    placeholder="+234 802 345 6789"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    placeholder="orders@supplier.ng"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Standard Payment Terms</label>
                  <select
                    value={newSupplier.paymentTerms}
                    onChange={(e) => setNewSupplier({ ...newSupplier, paymentTerms: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 60">Net 60 Days</option>
                    <option value="Immediate / COD">Immediate (Cash on Delivery)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lead Time (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newSupplier.leadTimeDays}
                    onChange={(e) => setNewSupplier({ ...newSupplier, leadTimeDays: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Initial Outstanding Balance (₦)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newSupplier.outstandingBalance}
                    onChange={(e) => setNewSupplier({ ...newSupplier, outstandingBalance: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Products Supplied (comma separated)</label>
                  <input
                    type="text"
                    value={productsSuppliedInput}
                    onChange={(e) => setProductsSuppliedInput(e.target.value)}
                    placeholder="e.g. Amoxicillin, Augmentin, Paracetamol, Coartem"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">List the key pharmaceuticals and products supplied by this vendor</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Distribution Center Address</label>
                  <input
                    type="text"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    placeholder="Plot 12, Industrial Estate, Ikeja, Lagos"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
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
                  Register Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
