import React, { useState } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { Product, ProductCategory, StockStatus, Batch } from '../types/pharmacy';
import { TablePagination } from '../components/TablePagination';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  AlertTriangle,
  Clock,
  Layers,
  SlidersHorizontal,
  History,
  AlertOctagon,
  X,
  CheckCircle2,
  PackagePlus,
  ArrowDownLeft,
} from 'lucide-react';

interface InventoryViewProps {
  onOpenQuickAction: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onOpenQuickAction }) => {
  const {
    products,
    getProductStockStatus,
    getDaysUntilExpiry,
    adjustStock,
    stockMovements,
    formatCurrency,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStockStatus, setSelectedStockStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'VALUE' | 'EXPIRY'>('NAME');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals
  const [activeBatchModalProduct, setActiveBatchModalProduct] = useState<Product | null>(null);
  const [activeAdjustModalProduct, setActiveAdjustModalProduct] = useState<Product | null>(null);
  const [activeHistoryModalProduct, setActiveHistoryModalProduct] = useState<Product | null>(null);

  // Adjustment State
  const [adjType, setAdjType] = useState<'DAMAGE' | 'EXPIRY_DISPOSAL' | 'SUPPLIER_RETURN' | 'INVENTORY_ADJUSTMENT'>('DAMAGE');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjReason, setAdjReason] = useState('Damaged during dispensing or customer return');
  const [adjFeedback, setAdjFeedback] = useState<string | null>(null);

  // Categories list including Nigerian specific categories
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
    'Injectables & Infusions',
    'Eye & Ear Drops',
  ];

  // Filtering
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.shelfLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

    const status = getProductStockStatus(p);
    const matchesStatus =
      selectedStockStatus === 'ALL' ||
      (selectedStockStatus === 'IN_STOCK' && status === 'IN_STOCK') ||
      (selectedStockStatus === 'LOW_STOCK' && status === 'LOW_STOCK') ||
      (selectedStockStatus === 'OUT_OF_STOCK' && status === 'OUT_OF_STOCK') ||
      (selectedStockStatus === 'EXPIRING_SOON' && status === 'EXPIRING_SOON') ||
      (selectedStockStatus === 'EXPIRED' && status === 'EXPIRED');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'NAME') return a.brandName.localeCompare(b.brandName);
    if (sortBy === 'STOCK_ASC') return a.currentStock - b.currentStock;
    if (sortBy === 'STOCK_DESC') return b.currentStock - a.currentStock;
    if (sortBy === 'VALUE') return b.currentStock * b.costPrice - a.currentStock * a.costPrice;
    if (sortBy === 'EXPIRY') {
      const aDays = a.batches?.[0] ? getDaysUntilExpiry(a.batches[0].expiryDate) : 9999;
      const bDays = b.batches?.[0] ? getDaysUntilExpiry(b.batches[0].expiryDate) : 9999;
      return aDays - bDays;
    }
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdjustModalProduct) return;

    const res = adjustStock({
      productId: activeAdjustModalProduct.id,
      adjustmentType: adjType,
      quantity: adjQty,
      reason: adjReason,
    });

    if (res.success) {
      setAdjFeedback(res.message);
      setTimeout(() => {
        setAdjFeedback(null);
        setActiveAdjustModalProduct(null);
      }, 1200);
    } else {
      setAdjFeedback(res.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Controls: Search, Filters & Action */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter by medicine, active ingredient, barcode, SKU..."
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQuickAction('INFLOW')}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Receive Stock</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('PRODUCT')}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Medicine</span>
            </button>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Category Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Therapeutic Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-medium"
            >
              <option value="ALL">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock & Expiry Status Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Stock / Expiry Status</label>
            <select
              value={selectedStockStatus}
              onChange={(e) => {
                setSelectedStockStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-medium"
            >
              <option value="ALL">All Inventory Statuses</option>
              <option value="IN_STOCK">In Stock (Healthy)</option>
              <option value="LOW_STOCK">Low Stock (Needs Reorder)</option>
              <option value="OUT_OF_STOCK">Out of Stock (Zero)</option>
              <option value="EXPIRING_SOON">Expiring Soon (&lt;60 days)</option>
              <option value="EXPIRED">Expired (Quarantine Required)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort Inventory</label>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 font-medium"
            >
              <option value="NAME">Name (Alphabetical)</option>
              <option value="STOCK_ASC">Stock Level: Lowest First</option>
              <option value="STOCK_DESC">Stock Level: Highest First</option>
              <option value="VALUE">Total Stock Value: Highest First</option>
              <option value="EXPIRY">Nearest Expiry Date First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Showing <strong className="text-slate-800">{sortedProducts.length}</strong> of{' '}
            <strong>{products.length}</strong> medicines
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                <th className="py-3 px-4">Medication & Formulation</th>
                <th className="py-3 px-3">SKU / Barcode</th>
                <th className="py-3 px-3">Category & Shelf</th>
                <th className="py-3 px-3 text-center">In Stock</th>
                <th className="py-3 px-3 text-center">Reorder / Opt</th>
                <th className="py-3 px-3 text-right">Cost Price</th>
                <th className="py-3 px-3 text-right">Selling Price</th>
                <th className="py-3 px-3 text-right">Stock Value</th>
                <th className="py-3 px-3">Status / Expiry</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                    No medications match your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  const status = getProductStockStatus(prod);
                  const nearestBatch = prod.batches?.[0];
                  const daysToExpiry = nearestBatch ? getDaysUntilExpiry(nearestBatch.expiryDate) : null;
                  const totalValue = prod.currentStock * prod.costPrice;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Form */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{prod.brandName}</span>
                          {prod.requiresPrescription && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 font-mono">
                              Rx
                            </span>
                          )}
                          {prod.nafdacRegNo && (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {prod.nafdacRegNo}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{prod.genericName}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span>{prod.dosageForm}</span>
                          <span>•</span>
                          <span className="font-semibold text-slate-600">{prod.strength}</span>
                          <span>•</span>
                          <span>{prod.unit}</span>
                        </div>
                      </td>

                      {/* SKU / Barcode */}
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-600">
                        <div>{prod.sku}</div>
                        <div className="text-[10px] text-slate-400">{prod.barcode}</div>
                      </td>

                      {/* Category & Shelf */}
                      <td className="py-3 px-3">
                        <span className="text-slate-800 font-medium">{prod.category}</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Loc: <span className="font-mono font-semibold text-emerald-800">{prod.shelfLocation}</span>
                        </div>
                      </td>

                      {/* Stock Quantity */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono font-bold text-sm ${
                            prod.currentStock <= 0
                              ? 'text-rose-600'
                              : prod.currentStock <= prod.reorderLevel
                              ? 'text-amber-600'
                              : 'text-slate-800'
                          }`}
                        >
                          {prod.currentStock}
                        </span>
                      </td>

                      {/* Reorder / Optimal */}
                      <td className="py-3 px-3 text-center font-mono text-slate-500">
                        <span>{prod.reorderLevel}</span> / <span className="text-slate-400">{prod.optimalStock}</span>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(prod.costPrice)}
                      </td>

                      {/* Selling */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                        {formatCurrency(prod.sellingPrice)}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                        {formatCurrency(totalValue)}
                      </td>

                      {/* Status / Expiry */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            status === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'LOW_STOCK'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800'
                              : status === 'EXPIRING_SOON'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                        {nearestBatch && (
                          <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                            Exp: {nearestBatch.expiryDate}{' '}
                            {daysToExpiry !== null && (
                              <span className={daysToExpiry <= 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                                ({daysToExpiry <= 0 ? 'Expired' : `${daysToExpiry}d`})
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveBatchModalProduct(prod)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="View Batches"
                          >
                            <Layers className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveAdjustModalProduct(prod)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Adjust Stock (Damage / Disposal / Correction)"
                          >
                            <AlertOctagon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveHistoryModalProduct(prod)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Movement Audit History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
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
          totalItems={sortedProducts.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* BATCH INSPECTION MODAL */}
      {activeBatchModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setActiveBatchModalProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Batch & Lot Breakdown: {activeBatchModalProduct.brandName}
                </h3>
                <p className="text-xs text-slate-500">{activeBatchModalProduct.genericName}</p>
              </div>
              <button
                onClick={() => setActiveBatchModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-72 overflow-y-auto">
              {(!activeBatchModalProduct.batches || activeBatchModalProduct.batches.length === 0) ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  No active batches recorded for this medicine.
                </div>
              ) : (
                activeBatchModalProduct.batches.map((batch) => {
                  const days = getDaysUntilExpiry(batch.expiryDate);
                  return (
                    <div
                      key={batch.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-800">Lot: {batch.batchNumber}</span>
                          <span className="text-[10px] text-slate-500">
                            Rec: {batch.receivedDate || 'N/A'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Supplier: {batch.supplierName || 'Primary Distributor'} • Invoice: {batch.invoiceNumber || 'N/A'}
                          {batch.nafdacRegNo && <span> • NAFDAC: {batch.nafdacRegNo}</span>}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600 mt-0.5">
                          Cost: {formatCurrency(batch.costPrice)} | Selling: {formatCurrency(batch.sellingPrice)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-bold font-mono text-slate-900">
                          {batch.quantity} units
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            days <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : days <= 60
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {days <= 0 ? 'Expired' : `${days} Days Left`}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveBatchModalProduct(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK ADJUSTMENT MODAL */}
      {activeAdjustModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setActiveAdjustModalProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Stock Outflow / Adjustment: {activeAdjustModalProduct.brandName}
                </h3>
                <p className="text-xs text-slate-500">Current Stock: {activeAdjustModalProduct.currentStock} units</p>
              </div>
              <button
                onClick={() => setActiveAdjustModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {adjFeedback && (
              <div className="my-3 p-2.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-medium">
                {adjFeedback}
              </div>
            )}

            <form onSubmit={handleApplyAdjustment} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Adjustment Type</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="DAMAGE">Damaged Medication (Broken bottle / vial)</option>
                  <option value="EXPIRY_DISPOSAL">Expired Stock Disposal / Quarantine</option>
                  <option value="SUPPLIER_RETURN">Return to Wholesaler</option>
                  <option value="INVENTORY_ADJUSTMENT">Physical Audit Correction</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantity to Deduct</label>
                <input
                  type="number"
                  min="1"
                  max={activeAdjustModalProduct.currentStock}
                  value={adjQty}
                  onChange={(e) => setAdjQty(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono font-bold"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Remaining after deduction: {Math.max(0, activeAdjustModalProduct.currentStock - adjQty)} units.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Audit Reason</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAdjustModalProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm"
                >
                  Confirm Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOVEMENT HISTORY MODAL */}
      {activeHistoryModalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setActiveHistoryModalProduct(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Stock Movement Trail: {activeHistoryModalProduct.brandName}
                </h3>
                <p className="text-xs text-slate-500">Audit trail of all inflows and outflows</p>
              </div>
              <button
                onClick={() => setActiveHistoryModalProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {stockMovements.filter((m) => m.productId === activeHistoryModalProduct.id).length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  No recorded stock movements for this item yet.
                </div>
              ) : (
                stockMovements
                  .filter((m) => m.productId === activeHistoryModalProduct.id)
                  .map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                              m.quantityChange > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {m.movementType.replace(/_/g, ' ')}
                          </span>
                          <span className="font-mono text-slate-500">{m.timestamp}</span>
                        </div>
                        <p className="text-slate-700 mt-1 font-medium">{m.reason}</p>
                        <p className="text-[10px] text-slate-400">
                          Ref: {m.referenceId} • Operator: {m.staffName}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-mono font-bold text-sm ${
                            m.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {m.quantityChange > 0 ? `+${m.quantityChange}` : m.quantityChange} units
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {m.previousStock} → {m.newStock}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveHistoryModalProduct(null)}
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
