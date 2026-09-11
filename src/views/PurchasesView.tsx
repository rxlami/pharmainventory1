import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { PurchaseOrder, PaymentMethod, PaymentStatus, Product } from '../types/pharmacy';
import { TablePagination } from '../components/TablePagination';
import {
  Plus,
  ShoppingCart,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Truck,
  Trash2,
  X,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

export const PurchasesView: React.FC = () => {
  const {
    products,
    suppliers,
    purchases,
    recordStockInflow,
    currentStaff,
    formatCurrency,
    settings,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'RECEIVE_FORM'>('ORDERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL');
  const [sortField, setSortField] = useState<'date' | 'total' | 'balance' | 'supplier' | 'invoice'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Multi-line Intake Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-5)}`);
  const [dateReceived, setDateReceived] = useState(new Date().toISOString().substring(0, 10));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [notes, setNotes] = useState('');

  // Line items for the receiving batch
  interface LineItem {
    productId: string;
    productName: string;
    genericName: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    sellingPrice: number;
  }

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      productId: products[0]?.id || '',
      productName: products[0]?.brandName || '',
      genericName: products[0]?.genericName || '',
      batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      expiryDate: '2028-06-30',
      quantity: 50,
      unitCost: products[0]?.costPrice || 10,
      sellingPrice: products[0]?.sellingPrice || 18,
    },
  ]);

  const [amountPaid, setAmountPaid] = useState<number>(50000);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal for viewing purchase details
  const [viewingPurchase, setViewingPurchase] = useState<PurchaseOrder | null>(null);

  // Total calculation
  const totalPurchaseCost = lineItems.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const outstandingBalance = Math.max(0, totalPurchaseCost - amountPaid);

  const handleProductSelection = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const updated = [...lineItems];
    updated[index] = {
      ...updated[index],
      productId: prod.id,
      productName: prod.brandName,
      genericName: prod.genericName,
      unitCost: prod.costPrice,
      sellingPrice: prod.sellingPrice,
    };
    setLineItems(updated);
  };

  const handleAddLineItem = () => {
    const defaultProd = products[0];
    setLineItems([
      ...lineItems,
      {
        productId: defaultProd?.id || '',
        productName: defaultProd?.brandName || '',
        genericName: defaultProd?.genericName || '',
        batchNumber: `LOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        expiryDate: '2028-06-30',
        quantity: 50,
        unitCost: defaultProd?.costPrice || 2500,
        sellingPrice: defaultProd?.sellingPrice || 3500,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) {
      setFormFeedback({ type: 'error', message: 'Please select a valid supplier.' });
      return;
    }

    if (lineItems.length === 0) {
      setFormFeedback({ type: 'error', message: 'Please add at least one medication line.' });
      return;
    }

    const res = recordStockInflow({
      supplierId: sup.id,
      supplierName: sup.name,
      invoiceNumber,
      dateReceived,
      paymentMethod,
      paymentStatus: amountPaid >= totalPurchaseCost ? 'PAID' : amountPaid > 0 ? 'PARTIAL' : 'PENDING',
      amountPaid,
      notes,
      items: lineItems,
    });

    if (res.success) {
      setFormFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setFormFeedback(null);
        setActiveTab('ORDERS');
        // Reset form
        setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
      }, 1400);
    } else {
      setFormFeedback({ type: 'error', message: res.message });
    }
  };

  // Filtered orders
  const filteredPurchases = purchases.filter((po) => {
    const matchesSearch =
      po.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.items.some((item) => item.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSupplier = filterSupplier === 'ALL' || po.supplierId === filterSupplier;
    const matchesPayment = filterPayment === 'ALL' || po.paymentStatus === filterPayment;

    return matchesSearch && matchesSupplier && matchesPayment;
  });

  const sortedPurchases = useMemo(() => {
    return [...filteredPurchases].sort((a, b) => {
      let valA: any;
      let valB: any;
      if (sortField === 'date') {
        valA = a.dateReceived;
        valB = b.dateReceived;
      } else if (sortField === 'total') {
        valA = a.totalAmount;
        valB = b.totalAmount;
      } else if (sortField === 'balance') {
        valA = a.outstandingBalance;
        valB = b.outstandingBalance;
      } else if (sortField === 'supplier') {
        valA = a.supplierName;
        valB = b.supplierName;
      } else {
        valA = a.invoiceNumber;
        valB = b.invoiceNumber;
      }

      if (typeof valA === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredPurchases, sortField, sortDirection]);

  const paginatedPurchases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPurchases.slice(start, start + pageSize);
  }, [sortedPurchases, currentPage, pageSize]);

  const handleSort = (field: 'date' | 'total' | 'balance' | 'supplier' | 'invoice') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="purchases-tab-orders"
            onClick={() => setActiveTab('ORDERS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'ORDERS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Purchases Ledger ({purchases.length})</span>
          </button>

          <button
            id="purchases-tab-receive"
            onClick={() => setActiveTab('RECEIVE_FORM')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'RECEIVE_FORM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Receive Stock Inflow</span>
          </button>
        </div>

        {activeTab === 'ORDERS' && (
          <div className="text-xs text-slate-500 font-medium">
            Total Spend on Restocks:{' '}
            <strong className="text-slate-900 font-mono">
              {formatCurrency(purchases.reduce((acc, p) => acc + p.totalAmount, 0))}
            </strong>
          </div>
        )}
      </div>

      {/* 1. ORDERS / PURCHASES LEDGER TAB */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search invoice #, supplier, or product..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-800"
              />
            </div>

            <div>
              <select
                value={filterSupplier}
                onChange={(e) => {
                  setFilterSupplier(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 font-medium"
              >
                <option value="ALL">All Wholesalers & Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterPayment}
                onChange={(e) => {
                  setFilterPayment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-slate-700 font-medium"
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PENDING">Pending Payment</option>
              </select>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    <th
                      onClick={() => handleSort('date')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Invoice # & Date{' '}
                      {sortField === 'date' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('supplier')}
                      className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Supplier{' '}
                      {sortField === 'supplier' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th className="py-3 px-3">Items Received</th>
                    <th
                      onClick={() => handleSort('total')}
                      className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Total Cost{' '}
                      {sortField === 'total' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th className="py-3 px-3 text-right">Amount Paid</th>
                    <th
                      onClick={() => handleSort('balance')}
                      className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                    >
                      Balance Due{' '}
                      {sortField === 'balance' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                      )}
                    </th>
                    <th className="py-3 px-3 text-center">Payment Status</th>
                    <th className="py-3 px-3">Staff In-Charge</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                        No purchase records match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedPurchases.map((po) => (
                      <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-slate-900">{po.invoiceNumber}</div>
                          <span className="text-[10px] text-slate-500">{po.dateReceived}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-800">{po.supplierName}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="text-slate-700 font-medium">
                            {po.items.length} product{po.items.length > 1 ? 's' : ''}
                          </span>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {po.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </p>
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(po.totalAmount)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(po.amountPaid)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatCurrency(po.outstandingBalance)}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              po.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.paymentStatus === 'PARTIAL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {po.paymentStatus}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                          {po.staffResponsible}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setViewingPurchase(po)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Purchase Order Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <TablePagination
              currentPage={currentPage}
              totalItems={filteredPurchases.length}
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

      {/* 2. RECEIVE STOCK INFLOW FORM TAB */}
      {activeTab === 'RECEIVE_FORM' && (
        <form onSubmit={handleSubmitIntake} className="space-y-5">
          {formFeedback && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
                formFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{formFeedback.message}</span>
            </div>
          )}

          {/* Supplier & Header Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <span>Supplier & Intake Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Pharmaceutical Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium text-slate-800"
                  required
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Terms: {s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice / Delivery Docket #</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Date Received</label>
                <input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receiving Pharmacist</label>
                <input
                  type="text"
                  value={currentStaff.name}
                  disabled
                  className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Medications Received in Shipment</h3>
                <p className="text-slate-500">Every item received automatically updates inventory and batch records</p>
              </div>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Medication Line</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, idx) => {
                const lineTotal = item.quantity * item.unitCost;
                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    {/* Select Medication */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Medication ({idx + 1})
                      </label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleProductSelection(idx, e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-slate-800"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.brandName} ({p.strength}) - Current: {p.currentStock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Number */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Lot / Batch #
                      </label>
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => {
                          const upd = [...lineItems];
                          upd[idx].batchNumber = e.target.value;
                          setLineItems(upd);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                        required
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => {
                          const upd = [...lineItems];
                          upd[idx].expiryDate = e.target.value;
                          setLineItems(upd);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5"
                        required
                      />
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const upd = [...lineItems];
                          upd[idx].quantity = Number(e.target.value);
                          setLineItems(upd);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-bold"
                        required
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Cost ({settings.currencySymbol || '₦'})
                      </label>
                      <input
                        type="number"
                        step="50"
                        value={item.unitCost}
                        onChange={(e) => {
                          const upd = [...lineItems];
                          upd[idx].unitCost = Number(e.target.value);
                          setLineItems(upd);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                        required
                      />
                    </div>

                    {/* Selling Price */}
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Sell ({settings.currencySymbol || '₦'})
                      </label>
                      <input
                        type="number"
                        step="50"
                        value={item.sellingPrice}
                        onChange={(e) => {
                          const upd = [...lineItems];
                          upd[idx].sellingPrice = Number(e.target.value);
                          setLineItems(upd);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono"
                        required
                      />
                    </div>

                    {/* Total & Delete Action */}
                    <div className="sm:col-span-1 text-right flex items-center justify-end gap-2 pt-3 sm:pt-0">
                      <div className="font-mono font-bold text-slate-800">
                        {formatCurrency(lineTotal)}
                      </div>
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Financial Settlement */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
              >
                <option value="BANK_TRANSFER">Bank Wire / Electronic Transfer</option>
                <option value="POS">Corporate Debit / Credit Card</option>
                <option value="CASH">Dispensary Cash</option>
                <option value="CREDIT">Supplier Trade Credit (Pay Later)</option>
              </select>

              <label className="block text-slate-700 font-semibold mt-3 mb-1">Receiving Notes</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cold chain temperature verified at 3.8°C upon unboxing"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                Cost Calculation
              </span>
              <div className="flex justify-between text-slate-700">
                <span>Total Items Count:</span>
                <span className="font-mono font-bold">
                  {lineItems.reduce((acc, i) => acc + i.quantity, 0)} units
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Purchase Cost:</span>
                <span className="font-mono text-emerald-800 text-base">
                  {formatCurrency(totalPurchaseCost)}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Formula: Total Cost = Quantity × Cost Price across all batch items.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-between">
              <div>
                <label className="block text-emerald-950 font-bold mb-1">
                  Amount Paid Today ({settings.currencySymbol || '₦'})
                </label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(Number(e.target.value))}
                  className="w-full bg-white border border-emerald-300 rounded-lg p-2 font-mono text-base font-bold text-slate-900"
                />
                <div className="mt-2 flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Outstanding Balance:</span>
                  <span
                    className={`font-mono ${
                      outstandingBalance > 0 ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'
                    }`}
                  >
                    {formatCurrency(outstandingBalance)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Inflow & Update Inventory</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW PURCHASE MODAL */}
      {viewingPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setViewingPurchase(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Invoice #{viewingPurchase.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Supplier: {viewingPurchase.supplierName} • Received {viewingPurchase.dateReceived}
                </p>
              </div>
              <button
                onClick={() => setViewingPurchase(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-2 text-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-100">
                Items Received
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {viewingPurchase.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-slate-50 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{item.productName}</p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Batch: {item.batchNumber} • Exp: {item.expiryDate}
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-900">
                        {item.quantity} × {formatCurrency(item.unitCost)}
                      </div>
                      <div className="text-emerald-700 font-bold">{formatCurrency(item.totalCost)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Invoice Amount:</span>
                  <span className="font-mono font-bold">{formatCurrency(viewingPurchase.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(viewingPurchase.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-bold">
                  <span>Balance Outstanding:</span>
                  <span className="font-mono">{formatCurrency(viewingPurchase.outstandingBalance)}</span>
                </div>
                {viewingPurchase.notes && (
                  <div className="pt-2 text-[11px] text-slate-500 italic">
                    Notes: {viewingPurchase.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingPurchase(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
