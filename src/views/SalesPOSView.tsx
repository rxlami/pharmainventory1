import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Product, Sale, PaymentMethod, ProductCategory } from '../types/pharmacy';
import { ReceiptModal } from '../components/ReceiptModal';
import { TablePagination } from '../components/TablePagination';
import confetti from 'canvas-confetti';
import {
  Search,
  ShoppingCart,
  Receipt,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  CreditCard,
  Building2,
  ShieldCheck,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Printer,
  History,
  AlertCircle,
  Pill,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface CartItem {
  productId: string;
  productName: string;
  genericName: string;
  batchNumber: string;
  availableStock: number;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const SalesPOSView: React.FC = () => {
  const {
    products,
    sales,
    processSale,
    settings,
    currentStaff,
    getProductStockStatus,
    formatCurrency,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>('POS');

  // Search & Filters in Catalog
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Active Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [prescriptionNumber, setPrescriptionNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const [saleNotes, setSaleNotes] = useState('');

  // Receipt Modal State
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // History search, sorting & pagination
  const [historySearch, setHistorySearch] = useState('');
  const [historySortField, setHistorySortField] = useState<'date' | 'receipt' | 'customer' | 'total'>('date');
  const [historySortDirection, setHistorySortDirection] = useState<'asc' | 'desc'>('desc');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(10);

  const filteredSales = useMemo(() => {
    return sales.filter(
      (s) =>
        s.receiptNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(historySearch.toLowerCase())) ||
        s.items.some((i) => i.productName.toLowerCase().includes(historySearch.toLowerCase()))
    );
  }, [sales, historySearch]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (historySortField === 'date') {
        valA = a.timestamp;
        valB = b.timestamp;
      } else if (historySortField === 'receipt') {
        valA = a.receiptNumber;
        valB = b.receiptNumber;
      } else if (historySortField === 'customer') {
        valA = a.customerName || '';
        valB = b.customerName || '';
      } else {
        valA = a.grandTotal;
        valB = b.grandTotal;
      }

      if (typeof valA === 'string') {
        return historySortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return historySortDirection === 'asc' ? valA - valB : valB - valA;
    });
  }, [filteredSales, historySortField, historySortDirection]);

  const paginatedSales = useMemo(() => {
    const start = (historyCurrentPage - 1) * historyPageSize;
    return sortedSales.slice(start, start + historyPageSize);
  }, [sortedSales, historyCurrentPage, historyPageSize]);

  const handleHistorySort = (field: 'date' | 'receipt' | 'customer' | 'total') => {
    if (historySortField === field) {
      setHistorySortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setHistorySortField(field);
      setHistorySortDirection('desc');
    }
  };

  const categories: ProductCategory[] = [
    'Antimalarials',
    'Antibiotics',
    'Analgesics & Pain Relief',
    'Pediatric & Infant Care',
    'Cardiovascular',
    'Antidiabetics',
    'Gastrointestinal',
    'Respiratory',
    'Antihistamines',
    'Vitamins & Supplements',
  ];

  // Filtered Catalog
  const catalogProducts = products.filter((p) => {
    const matchesSearch =
      p.brandName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.genericName.toLowerCase().includes(catalogSearch.toLowerCase()) ||
      p.barcode.includes(catalogSearch) ||
      p.sku.toLowerCase().includes(catalogSearch.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Cart Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountTotal = cart.reduce((acc, item) => acc + (item.discount || 0), 0);
  const taxableAmount = Math.max(0, subtotal - discountTotal);
  const taxRate = settings.taxRate || 0;
  const taxTotal = Number((taxableAmount * (taxRate / 100)).toFixed(2));
  const grandTotal = Number((taxableAmount + taxTotal).toFixed(2));
  const changeDue = Math.max(0, amountTendered - grandTotal);

  // Add Item to Cart
  const handleAddToCart = (product: Product) => {
    setErrorMessage(null);
    if (product.currentStock <= 0) {
      setErrorMessage(`Cannot add "${product.brandName}". Item is currently out of stock.`);
      return;
    }

    const existingIdx = cart.findIndex((i) => i.productId === product.id);
    if (existingIdx >= 0) {
      const currentQty = cart[existingIdx].quantity;
      if (currentQty >= product.currentStock) {
        setErrorMessage(`Only ${product.currentStock} units available in inventory.`);
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      const primaryBatch = product.batches?.find((b) => b.quantity > 0) || product.batches?.[0];
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: `${product.brandName} (${product.strength})`,
          genericName: product.genericName,
          batchNumber: primaryBatch ? primaryBatch.batchNumber : 'DEFAULT-LOT',
          availableStock: product.currentStock,
          quantity: 1,
          unitPrice: product.sellingPrice,
          discount: 0,
        },
      ]);
    }
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setErrorMessage(null);
    const item = cart[index];
    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      handleRemoveFromCart(index);
      return;
    }

    if (newQty > item.availableStock) {
      setErrorMessage(`Cannot exceed available stock of ${item.availableStock} units.`);
      return;
    }

    const updated = [...cart];
    updated[index].quantity = newQty;
    setCart(updated);
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleUpdateItemDiscount = (index: number, discount: number) => {
    const updated = [...cart];
    updated[index].discount = Math.max(0, discount);
    setCart(updated);
  };

  // Checkout Execution
  const handleCompleteSale = () => {
    setErrorMessage(null);
    if (cart.length === 0) {
      setErrorMessage('Please add items to cart before completing sale.');
      return;
    }

    if (paymentMethod === 'CASH' && amountTendered < grandTotal) {
      setErrorMessage(`Amount tendered (${formatCurrency(amountTendered)}) is less than total due (${formatCurrency(grandTotal)}).`);
      return;
    }

    const result = processSale({
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      prescriptionNumber: prescriptionNumber.trim() || undefined,
      items: cart.map((c) => ({
        productId: c.productId,
        productName: c.productName,
        genericName: c.genericName,
        batchNumber: c.batchNumber,
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        discount: c.discount,
      })),
      paymentMethod,
      amountTendered: paymentMethod === 'CASH' ? amountTendered : grandTotal,
      notes: saleNotes,
    });

    if (result.success && result.sale) {
      // Confetti burst for successful dispense
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });

      // Show receipt modal
      setActiveReceiptSale(result.sale);

      // Reset cart
      setCart([]);
      setCustomerName('Walk-in Customer');
      setCustomerPhone('');
      setPrescriptionNumber('');
      setAmountTendered(0);
      setSaleNotes('');
    } else {
      setErrorMessage(result.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('POS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'POS'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Point of Sale Terminal</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Dispensing History ({sales.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Cashier: <strong className="text-slate-800">{currentStaff.name}</strong></span>
        </div>
      </div>

      {/* POS TERMINAL VIEW */}
      {activeTab === 'POS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 Columns: Product Selection Catalog */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="pos-catalog-search-input"
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Scan barcode or type medication / ingredient name..."
                  className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-slate-800"
                />
              </div>

              {/* Category Pills Filter */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-900 text-white font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-700 text-white font-semibold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-1">
              {catalogProducts.map((prod) => {
                const isOutOfStock = prod.currentStock <= 0;
                const status = getProductStockStatus(prod);

                return (
                  <div
                    key={prod.id}
                    onClick={() => !isOutOfStock && handleAddToCart(prod)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isOutOfStock
                        ? 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-slate-200/90 hover:border-emerald-500 hover:shadow-md cursor-pointer group'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                          {prod.brandName}
                        </span>
                        {prod.requiresPrescription && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-mono">
                            Rx
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{prod.genericName}</p>
                      <div className="text-[10px] text-slate-400 mt-1">
                        {prod.dosageForm} • {prod.strength} • {prod.shelfLocation}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold font-mono text-emerald-800">
                          {formatCurrency(prod.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Stock: {prod.currentStock}
                        </span>
                      </div>

                      <button
                        disabled={isOutOfStock}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isOutOfStock
                            ? 'bg-slate-200 text-slate-500'
                            : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right 5 Columns: Active Dispensing Cart & Settlement */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4">
            {/* Cart Header */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Current Dispensing Order</h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {cart.length} item{cart.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Patient / Prescription Quick Input */}
              <div className="grid grid-cols-2 gap-2 pt-3 text-xs">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Customer / Patient
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Patient Name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Prescription # (Rx)
                  </label>
                  <input
                    type="text"
                    value={prescriptionNumber}
                    onChange={(e) => setPrescriptionNumber(e.target.value)}
                    placeholder="e.g. RX-4981"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs text-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mt-2.5 p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1 text-xs">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>Cart is empty</p>
                  <p className="text-[11px] text-slate-400">Click medicines on the left to dispense</p>
                </div>
              ) : (
                cart.map((item, idx) => {
                  const lineTotal = item.quantity * item.unitPrice - (item.discount || 0);
                  return (
                    <div key={idx} className="py-2.5 space-y-1.5">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800">{item.productName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Lot: {item.batchNumber} • In Stock: {item.availableStock}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">
                            {formatCurrency(lineTotal)}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            className="text-slate-400 hover:text-rose-600 ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </div>
                      </div>

                      {/* Quantity Selector & Item Discount */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                          <button
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <span className="font-mono font-bold text-slate-900 w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Plus className="w-3 h-3 text-slate-600" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>Disc ({settings.currencySymbol || '₦'}):</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={item.discount || ''}
                            placeholder="0"
                            onChange={(e) => handleUpdateItemDiscount(idx, Number(e.target.value))}
                            className="w-16 bg-slate-50 border border-slate-200 rounded p-1 text-right font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Settlement Calculations & Payment */}
            <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono">-{formatCurrency(discountTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Tax ({settings.taxRate}%):</span>
                <span className="font-mono">{formatCurrency(taxTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-800 text-lg">{formatCurrency(grandTotal)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('CASH');
                      setAmountTendered(grandTotal);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('POS');
                      setAmountTendered(grandTotal);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'POS'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>POS / Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod('BANK_TRANSFER');
                      setAmountTendered(grandTotal);
                    }}
                    className={`py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Transfer</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered & Change Computation */}
              {paymentMethod === 'CASH' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Amount Tendered ({settings.currencySymbol || '₦'})
                    </label>
                    <input
                      type="number"
                      step="100"
                      value={amountTendered || ''}
                      onChange={(e) => setAmountTendered(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg p-1.5 font-mono text-sm font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Change Due
                    </label>
                    <div className="p-1.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800 font-mono font-bold text-sm">
                      {formatCurrency(changeDue)}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                id="pos-complete-sale-btn"
                type="button"
                disabled={cart.length === 0}
                onClick={handleCompleteSale}
                className={`w-full py-3 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-all mt-2 ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-99'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Dispense & Print Receipt ({formatCurrency(grandTotal)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPENSING & SALES HISTORY TAB */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setHistoryCurrentPage(1);
                }}
                placeholder="Search by receipt #, customer, or medication..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs"
              />
            </div>
            <div className="text-xs text-slate-500">
              Total Revenue Generated:{' '}
              <strong className="text-emerald-800 font-mono font-bold">
                {formatCurrency(sales.reduce((acc, s) => acc + s.grandTotal, 0))}
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <th
                    onClick={() => handleHistorySort('date')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    Receipt # & Date{' '}
                    {historySortField === 'date' ? (
                      historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                    )}
                  </th>
                  <th
                    onClick={() => handleHistorySort('customer')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    Patient / Customer{' '}
                    {historySortField === 'customer' ? (
                      historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                    )}
                  </th>
                  <th className="py-3 px-3">Rx Ref</th>
                  <th className="py-3 px-3">Items Dispensed</th>
                  <th
                    onClick={() => handleHistorySort('total')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
                  >
                    Grand Total{' '}
                    {historySortField === 'total' ? (
                      historySortDirection === 'asc' ? <ChevronUp className="w-3 h-3 inline text-emerald-600" /> : <ChevronDown className="w-3 h-3 inline text-emerald-600" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 inline text-slate-400 opacity-60" />
                    )}
                  </th>
                  <th className="py-3 px-3 text-center">Payment</th>
                  <th className="py-3 px-3">Dispensing Pharmacist</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      No sales records match your search criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900">{sale.receiptNumber}</div>
                        <span className="text-[10px] text-slate-500">{sale.timestamp}</span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-800">{sale.customerName || 'Walk-in'}</span>
                        {sale.customerPhone && (
                          <div className="text-[10px] text-slate-400">{sale.customerPhone}</div>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-[11px] text-emerald-800">
                        {sale.prescriptionNumber || 'OTC'}
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-slate-700 font-medium">
                          {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </p>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatCurrency(sale.grandTotal)}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {sale.paymentMethod}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600 truncate max-w-[120px]">
                        {sale.staffName}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setActiveReceiptSale(sale)}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-semibold flex items-center gap-1 transition-colors text-[11px]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={historyCurrentPage}
            totalItems={filteredSales.length}
            pageSize={historyPageSize}
            onPageChange={setHistoryCurrentPage}
            onPageSizeChange={(size) => {
              setHistoryPageSize(size);
              setHistoryCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* Official Receipt Modal */}
      {activeReceiptSale && (
        <ReceiptModal
          sale={activeReceiptSale}
          settings={settings}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}
    </div>
  );
};
