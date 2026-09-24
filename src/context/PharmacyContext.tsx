import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Batch,
  Supplier,
  StaffMember,
  PurchaseOrder,
  PurchaseItem,
  Sale,
  SaleItem,
  CashTransaction,
  CashCategory,
  ActivityLog,
  AuditModule,
  PharmacySettings,
  StockMovement,
  StockMovementType,
  PaymentMethod,
  PaymentStatus,
  StockStatus,
  AppNotification,
  NotificationType,
} from '../types/pharmacy';
import {
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  INITIAL_STAFF,
  INITIAL_PURCHASES,
  INITIAL_SALES,
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_SETTINGS,
  INITIAL_STOCK_MOVEMENTS,
} from '../data/seedData';

interface ReceiveStockInput {
  supplierId: string;
  supplierName: string;
  invoiceNumber: string;
  dateReceived: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    genericName: string;
    batchNumber: string;
    expiryDate: string;
    quantity: number;
    unitCost: number;
    sellingPrice: number;
  }[];
}

interface ProcessSaleInput {
  customerName?: string;
  customerPhone?: string;
  prescriptionNumber?: string;
  items: {
    productId: string;
    productName: string;
    genericName: string;
    batchNumber: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }[];
  paymentMethod: PaymentMethod;
  amountTendered: number;
  notes?: string;
}

interface StockAdjustmentInput {
  productId: string;
  batchNumber?: string;
  adjustmentType: 'DAMAGE' | 'EXPIRY_DISPOSAL' | 'SUPPLIER_RETURN' | 'INVENTORY_ADJUSTMENT';
  quantity: number;
  reason: string;
  notes?: string;
}

interface RecordExpenseInput {
  category: CashCategory;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
}

interface PharmacyContextType {
  products: Product[];
  suppliers: Supplier[];
  staff: StaffMember[];
  currentStaff: StaffMember;
  purchases: PurchaseOrder[];
  sales: Sale[];
  cashTransactions: CashTransaction[];
  stockMovements: StockMovement[];
  activityLogs: ActivityLog[];
  auditLogs: ActivityLog[];
  settings: PharmacySettings;
  setCurrentStaff: (staff: StaffMember) => void;
  // Core Actions
  recordStockInflow: (input: ReceiveStockInput) => { success: boolean; message: string; purchaseOrder?: PurchaseOrder };
  processSale: (input: ProcessSaleInput) => { success: boolean; message: string; sale?: Sale };
  adjustStock: (input: StockAdjustmentInput) => { success: boolean; message: string };
  recordExpense: (input: RecordExpenseInput) => { success: boolean; message: string };
  recordCashExpense: (input: RecordExpenseInput) => { success: boolean; message: string };
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'batches'>, initialBatch?: Omit<Batch, 'id' | 'productId'>) => { success: boolean; message: string; product?: Product };
  updateProduct: (id: string, updates: Partial<Product>) => { success: boolean; message: string };
  deleteProduct: (id: string) => { success: boolean; message: string };
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateSupplier: (id: string, updates: Partial<Supplier>) => { success: boolean; message: string };
  settleSupplierBalance: (supplierId: string, amount: number, paymentMethod: PaymentMethod, notes?: string) => { success: boolean; message: string };
  addStaff: (staffMember: Omit<StaffMember, 'id'>) => { success: boolean; message: string };
  updateStaff: (id: string, updates: Partial<StaffMember>) => { success: boolean; message: string };
  updateSettings: (newSettings: Partial<PharmacySettings>) => void;
  logActivity: (
    actionOrOptions: string | {
      user?: string;
      action: string;
      module?: AuditModule;
      category?: AuditModule;
      details: string;
      previousValue?: string | number;
      newValue?: string | number;
      transactionReference?: string;
      referenceId?: string;
      staffId?: string;
      role?: string;
    },
    categoryOrModule?: AuditModule,
    detailsArg?: string,
    referenceIdArg?: string
  ) => void;
  // Helpers & Stats
  getProductStockStatus: (product: Product) => StockStatus;
  getDaysUntilExpiry: (expiryDate: string) => number;
  dashboardMetrics: {
    totalInventoryValue: number;
    todaySalesTotal: number;
    todayExpensesTotal: number;
    todayProfit: number;
    currentCashBalance: number;
    totalProductsCount: number;
    lowStockCount: number;
    outOfStockCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    todayTransactionsCount: number;
  };
  formatCurrency: (amount: number | undefined | null, includeDecimals?: boolean) => string;
  formatNaira: (amount: number | undefined | null, includeDecimals?: boolean) => string;
  // In-app Notifications
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDemoData: () => void;
  resetToSeedData: () => void;
  exportDatabaseJSON: () => string;
}

const PharmacyContext = createContext<PharmacyContextType | null>(null);

const STORAGE_PREFIX = 'pharmapulse_ng_v4_';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_PREFIX + key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    // If settings had the old USD symbol, fallback to new Nigerian settings
    if (key === 'settings' && parsed) {
      if (parsed.currencySymbol === '$' || parsed.currencyCode === 'USD' || !parsed.currencySymbol) {
        parsed.currencySymbol = '₦';
        parsed.currencyCode = 'NGN';
      }
    }
    return parsed;
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => loadFromStorage('products', INITIAL_PRODUCTS));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => loadFromStorage('suppliers', INITIAL_SUPPLIERS));
  const [staff, setStaff] = useState<StaffMember[]>(() => loadFromStorage('staff', INITIAL_STAFF));
  const [currentStaff, setCurrentStaffState] = useState<StaffMember>(() => {
    const saved = loadFromStorage<StaffMember | null>('currentStaff', null);
    return saved || INITIAL_STAFF[0];
  });
  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => loadFromStorage('purchases', INITIAL_PURCHASES));
  const [sales, setSales] = useState<Sale[]>(() => loadFromStorage('sales', INITIAL_SALES));
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(() =>
    loadFromStorage('cashTransactions', INITIAL_CASH_TRANSACTIONS)
  );
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() =>
    loadFromStorage('stockMovements', INITIAL_STOCK_MOVEMENTS)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    loadFromStorage('activityLogs', INITIAL_ACTIVITY_LOGS)
  );
  const [settings, setSettings] = useState<PharmacySettings>(() => loadFromStorage('settings', INITIAL_SETTINGS));

  // Sync state to LocalStorage
  useEffect(() => saveToStorage('products', products), [products]);
  useEffect(() => saveToStorage('suppliers', suppliers), [suppliers]);
  useEffect(() => saveToStorage('staff', staff), [staff]);
  useEffect(() => saveToStorage('currentStaff', currentStaff), [currentStaff]);
  useEffect(() => saveToStorage('purchases', purchases), [purchases]);
  useEffect(() => saveToStorage('sales', sales), [sales]);
  useEffect(() => saveToStorage('cashTransactions', cashTransactions), [cashTransactions]);
  useEffect(() => saveToStorage('stockMovements', stockMovements), [stockMovements]);
  useEffect(() => saveToStorage('activityLogs', activityLogs), [activityLogs]);
  useEffect(() => saveToStorage('settings', settings), [settings]);

  const setCurrentStaff = (selected: StaffMember) => {
    setCurrentStaffState(selected);
    logActivity({
      user: selected.name,
      action: 'Switched Operator',
      module: 'SECURITY',
      previousValue: currentStaff.name,
      newValue: selected.name,
      transactionReference: selected.id,
      details: `Switched active operator to ${selected.name} (${selected.role}).`,
    });
  };

  const logActivity = (
    actionOrOptions:
      | string
      | {
          user?: string;
          action: string;
          module?: AuditModule;
          category?: AuditModule;
          details: string;
          previousValue?: string | number;
          newValue?: string | number;
          transactionReference?: string;
          referenceId?: string;
          staffId?: string;
          role?: string;
          date?: string;
          time?: string;
        },
    categoryOrModule?: AuditModule,
    detailsArg?: string,
    referenceIdArg?: string
  ) => {
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 8);
    const timestampStr = `${dateStr} ${timeStr}`;

    let newLog: ActivityLog;

    if (typeof actionOrOptions === 'object') {
      const opts = actionOrOptions;
      const resolvedModule: AuditModule = opts.module || opts.category || 'SYSTEM';
      const resolvedUser = opts.user || currentStaff.name;
      const resolvedRef = opts.transactionReference || opts.referenceId;
      newLog = {
        id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        timestamp: timestampStr,
        date: opts.date || dateStr,
        time: opts.time || timeStr,
        user: resolvedUser,
        staffId: opts.staffId || currentStaff.id,
        staffName: resolvedUser,
        role: opts.role || currentStaff.role,
        action: opts.action,
        module: resolvedModule,
        category: resolvedModule,
        details: opts.details,
        previousValue: opts.previousValue,
        newValue: opts.newValue,
        transactionReference: resolvedRef,
        referenceId: resolvedRef,
      };
    } else {
      const action = actionOrOptions;
      const resolvedModule: AuditModule = categoryOrModule || 'SYSTEM';
      const resolvedRef = referenceIdArg;
      newLog = {
        id: 'act-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        timestamp: timestampStr,
        date: dateStr,
        time: timeStr,
        user: currentStaff.name,
        staffId: currentStaff.id,
        staffName: currentStaff.name,
        role: currentStaff.role,
        action,
        module: resolvedModule,
        category: resolvedModule,
        details: detailsArg || action,
        transactionReference: resolvedRef,
        referenceId: resolvedRef,
      };
    }

    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Days calculation helper
  const getDaysUntilExpiry = (expiryDate: string): number => {
    if (!expiryDate) return 9999;
    const now = new Date();
    const dateStr = expiryDate.includes('T') ? expiryDate : `${expiryDate}T00:00:00`;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 9999;
    const diffTime = target.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProductStockStatus = (product: Product): StockStatus => {
    if (product.currentStock <= 0) {
      return 'OUT_OF_STOCK';
    }

    // Check batch expiry
    const warningDays = settings.nearExpiryWarningDays || 60;
    let hasExpiredBatch = false;
    let hasNearExpiryBatch = false;

    if (product.batches && product.batches.length > 0) {
      for (const b of product.batches) {
        if (b.quantity > 0) {
          const days = getDaysUntilExpiry(b.expiryDate);
          if (days <= 0) {
            hasExpiredBatch = true;
          } else if (days <= warningDays) {
            hasNearExpiryBatch = true;
          }
        }
      }
    }

    if (hasExpiredBatch) return 'EXPIRED';
    if (hasNearExpiryBatch) return 'EXPIRING_SOON';
    if (product.currentStock <= product.reorderLevel) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  // Record Stock Inflow (Purchase Receiving)
  const recordStockInflow = (input: ReceiveStockInput) => {
    if (!input.items || input.items.length === 0) {
      return { success: false, message: 'No items provided in receiving purchase order' };
    }

    const poId = 'PO-' + Date.now().toString().slice(-6);
    let totalOrderCost = 0;
    const itemsList: PurchaseItem[] = [];
    const newMovements: StockMovement[] = [];
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Calculate total cost and prepare items
    input.items.forEach((item) => {
      const itemTotal = item.quantity * item.unitCost;
      totalOrderCost += itemTotal;
      itemsList.push({
        ...item,
        totalCost: itemTotal,
      });
    });

    const outstanding = Math.max(0, totalOrderCost - input.amountPaid);
    const resolvedPaymentStatus: PaymentStatus =
      outstanding === 0 ? 'PAID' : input.amountPaid > 0 ? 'PARTIAL' : 'PENDING';

    const newPurchase: PurchaseOrder = {
      id: poId,
      invoiceNumber: input.invoiceNumber || `INV-${Date.now().toString().slice(-5)}`,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      dateReceived: input.dateReceived || new Date().toISOString().substring(0, 10),
      items: itemsList,
      totalAmount: totalOrderCost,
      amountPaid: input.amountPaid,
      outstandingBalance: outstanding,
      paymentStatus: resolvedPaymentStatus,
      paymentMethod: input.paymentMethod,
      staffResponsible: currentStaff.name,
      status: 'RECEIVED',
      notes: input.notes,
      createdAt: timestampStr,
    };

    // Update Products & Batches
    setProducts((prev) =>
      prev.map((prod) => {
        const matchingIncoming = input.items.filter((it) => it.productId === prod.id);
        if (matchingIncoming.length === 0) return prod;

        let addedQty = 0;
        const newBatches = [...(prod.batches || [])];

        matchingIncoming.forEach((inItem) => {
          addedQty += inItem.quantity;

          // Check if batch already exists or create new batch
          const existingBatchIdx = newBatches.findIndex((b) => b.batchNumber === inItem.batchNumber);
          if (existingBatchIdx >= 0) {
            newBatches[existingBatchIdx] = {
              ...newBatches[existingBatchIdx],
              quantity: newBatches[existingBatchIdx].quantity + inItem.quantity,
              costPrice: inItem.unitCost,
              sellingPrice: inItem.sellingPrice,
              expiryDate: inItem.expiryDate,
            };
          } else {
            newBatches.push({
              id: 'bat-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
              batchNumber: inItem.batchNumber,
              productId: prod.id,
              costPrice: inItem.unitCost,
              sellingPrice: inItem.sellingPrice,
              quantity: inItem.quantity,
              initialQuantity: inItem.quantity,
              expiryDate: inItem.expiryDate,
              receivedDate: input.dateReceived || new Date().toISOString().substring(0, 10),
              supplierId: input.supplierId,
              supplierName: input.supplierName,
              invoiceNumber: newPurchase.invoiceNumber,
            });
          }

          // Stock movement for this item
          newMovements.push({
            id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            timestamp: timestampStr,
            productId: prod.id,
            productName: `${prod.brandName} (${prod.strength})`,
            batchNumber: inItem.batchNumber,
            movementType: 'PURCHASE_RECEIVE',
            quantityChange: inItem.quantity,
            previousStock: prod.currentStock,
            newStock: prod.currentStock + inItem.quantity,
            unitCost: inItem.unitCost,
            totalValue: inItem.quantity * inItem.unitCost,
            referenceType: 'PURCHASE',
            referenceId: newPurchase.invoiceNumber,
            reason: `Stock Inflow from ${input.supplierName}`,
            staffId: currentStaff.id,
            staffName: currentStaff.name,
          });
        });

        return {
          ...prod,
          currentStock: prod.currentStock + addedQty,
          costPrice: matchingIncoming[0].unitCost || prod.costPrice,
          sellingPrice: matchingIncoming[0].sellingPrice || prod.sellingPrice,
          batches: newBatches,
          updatedAt: timestampStr,
        };
      })
    );

    // Update supplier balance if balance outstanding
    if (outstanding > 0) {
      setSuppliers((prev) =>
        prev.map((sup) => (sup.id === input.supplierId ? { ...sup, balanceOwed: sup.balanceOwed + outstanding } : sup))
      );
    }

    // Record cash outflow if money was paid
    if (input.amountPaid > 0) {
      const cashOut: CashTransaction = {
        id: 'ctx-' + Date.now(),
        timestamp: timestampStr,
        date: timestampStr.substring(0, 10),
        type: 'CASH_OUT',
        category: 'PURCHASE_PAYMENT',
        amount: input.amountPaid,
        description: `Payment for Purchase Invoice #${newPurchase.invoiceNumber} (${input.supplierName})`,
        referenceId: newPurchase.invoiceNumber,
        paymentMethod: input.paymentMethod,
        staffName: currentStaff.name,
      };
      setCashTransactions((prev) => [cashOut, ...prev]);
    }

    setPurchases((prev) => [newPurchase, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    // Record item-level audit log matching user specification: "John added 50 units of Amoxicillin."
    input.items.forEach((item) => {
      const existing = products.find((p) => p.id === item.productId);
      const prevStock = existing ? existing.currentStock : 0;
      const newStock = prevStock + item.quantity;
      logActivity({
        user: currentStaff.name,
        action: 'Added Stock',
        module: 'PURCHASES',
        previousValue: `${prevStock} units`,
        newValue: `${newStock} units`,
        transactionReference: newPurchase.invoiceNumber,
        details: `${currentStaff.name} added ${item.quantity} units of ${item.productName}.`,
      });
    });

    logActivity({
      user: currentStaff.name,
      action: 'Stock Inflow Received',
      module: 'PURCHASES',
      previousValue: 'PO Pending',
      newValue: `₦${totalOrderCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })} Received`,
      transactionReference: newPurchase.invoiceNumber,
      details: `${currentStaff.name} received stock invoice #${newPurchase.invoiceNumber} from ${input.supplierName}. Total: ₦${totalOrderCost.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (${input.items.length} items).`,
    });

    return { success: true, message: `Successfully received stock for invoice #${newPurchase.invoiceNumber}`, purchaseOrder: newPurchase };
  };

  // Process Sales (POS)
  const processSale = (input: ProcessSaleInput) => {
    if (!input.items || input.items.length === 0) {
      return { success: false, message: 'Cart is empty. Please add items to complete sale.' };
    }

    // Check stock availability and ensure stock never becomes negative
    for (const item of input.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) {
        return { success: false, message: `Product "${item.productName}" not found.` };
      }
      if (prod.currentStock < item.quantity) {
        return {
          success: false,
          message: `Insufficient stock for "${prod.brandName}". Available: ${prod.currentStock}, Requested: ${item.quantity}. Cannot allow negative stock.`,
        };
      }
    }

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const receiptNumber = 'REC-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);

    let subtotal = 0;
    let discountTotal = 0;
    const saleItemsList: SaleItem[] = [];
    const newMovements: StockMovement[] = [];

    input.items.forEach((it) => {
      const itemSub = it.quantity * it.unitPrice;
      const itemDisc = it.discount || 0;
      const itemTot = Math.max(0, itemSub - itemDisc);

      subtotal += itemSub;
      discountTotal += itemDisc;

      saleItemsList.push({
        ...it,
        subtotal: itemSub,
        total: itemTot,
      });
    });

    const taxRate = settings.taxRate || 0;
    const taxTotal = Number(((subtotal - discountTotal) * (taxRate / 100)).toFixed(2));
    const grandTotal = Number((subtotal - discountTotal + taxTotal).toFixed(2));

    if (input.paymentMethod === 'CASH' && input.amountTendered < grandTotal) {
      return {
        success: false,
        message: `Amount tendered (₦${input.amountTendered.toLocaleString('en-NG', { minimumFractionDigits: 2 })}) is less than total bill (₦${grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}).`,
      };
    }

    const changeGiven = input.paymentMethod === 'CASH' ? Number(Math.max(0, input.amountTendered - grandTotal).toFixed(2)) : 0;

    const newSale: Sale = {
      id: 'sale-' + Date.now(),
      receiptNumber,
      customerName: input.customerName || 'Walk-in Customer',
      customerPhone: input.customerPhone,
      prescriptionNumber: input.prescriptionNumber,
      items: saleItemsList,
      subtotal,
      discountTotal,
      taxTotal,
      grandTotal,
      paymentMethod: input.paymentMethod,
      amountTendered: input.amountTendered || grandTotal,
      changeGiven,
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      timestamp: timestampStr,
      status: 'COMPLETED',
      notes: input.notes,
    };

    // Deduct stock from products & batches (FIFO approach for batches)
    setProducts((prev) =>
      prev.map((prod) => {
        const itemSold = input.items.find((it) => it.productId === prod.id);
        if (!itemSold) return prod;

        let remainingToDeduct = itemSold.quantity;
        const newBatches = [...(prod.batches || [])].sort(
          (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );

        const updatedBatches = newBatches.map((batch) => {
          if (remainingToDeduct <= 0 || batch.quantity <= 0) return batch;

          const deductFromThis = Math.min(batch.quantity, remainingToDeduct);
          remainingToDeduct -= deductFromThis;

          return {
            ...batch,
            quantity: batch.quantity - deductFromThis,
          };
        });

        // Record stock outflow movement
        newMovements.push({
          id: 'mov-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          timestamp: timestampStr,
          productId: prod.id,
          productName: `${prod.brandName} (${prod.strength})`,
          batchNumber: itemSold.batchNumber || updatedBatches[0]?.batchNumber || 'N/A',
          movementType: 'SALE',
          quantityChange: -itemSold.quantity,
          previousStock: prod.currentStock,
          newStock: Math.max(0, prod.currentStock - itemSold.quantity),
          unitCost: prod.costPrice,
          totalValue: itemSold.quantity * prod.costPrice,
          referenceType: 'SALE',
          referenceId: receiptNumber,
          reason: `Dispensed to ${input.customerName || 'Walk-in customer'}`,
          staffId: currentStaff.id,
          staffName: currentStaff.name,
        });

        return {
          ...prod,
          currentStock: Math.max(0, prod.currentStock - itemSold.quantity),
          batches: updatedBatches,
          updatedAt: timestampStr,
        };
      })
    );

    // Record Cash Inflow
    const cashIn: CashTransaction = {
      id: 'ctx-' + Date.now(),
      timestamp: timestampStr,
      date: timestampStr.substring(0, 10),
      type: 'CASH_IN',
      category: 'SALE_REVENUE',
      amount: grandTotal,
      description: `Sale Receipt #${receiptNumber} (${input.customerName || 'Walk-in'})`,
      referenceId: receiptNumber,
      paymentMethod: input.paymentMethod,
      staffName: currentStaff.name,
    };

    setSales((prev) => [newSale, ...prev]);
    setCashTransactions((prev) => [cashIn, ...prev]);
    setStockMovements((prev) => [...newMovements, ...prev]);

    // Record sale audit log matching user specification: "Mary recorded a sale of ₦25,000."
    logActivity({
      user: currentStaff.name,
      action: 'Recorded Sale',
      module: 'SALES',
      previousValue: '₦0.00',
      newValue: `₦${grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      transactionReference: receiptNumber,
      details: `${currentStaff.name} recorded a sale of ₦${grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })} via ${input.paymentMethod}.`,
    });

    return { success: true, message: `Sale completed successfully! Receipt #${receiptNumber}`, sale: newSale };
  };

  // Stock Adjustment (Damaged, Expired Disposal, Supplier Return, Physical Count Correction)
  const adjustStock = (input: StockAdjustmentInput) => {
    const prod = products.find((p) => p.id === input.productId);
    if (!prod) return { success: false, message: 'Product not found' };

    if (input.quantity <= 0) {
      return { success: false, message: 'Adjustment quantity must be greater than zero' };
    }

    if (prod.currentStock < input.quantity) {
      return {
        success: false,
        message: `Cannot deduct ${input.quantity} units. Current stock is only ${prod.currentStock}. Negative stock is prohibited.`,
      };
    }

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const refCode = 'ADJ-' + Date.now().toString().slice(-6);

    let movementType: StockMovementType = 'INVENTORY_ADJUSTMENT';
    let refType: 'ADJUSTMENT' | 'DISPOSAL' | 'RETURN' = 'ADJUSTMENT';

    if (input.adjustmentType === 'DAMAGE') {
      movementType = 'DAMAGE';
      refType = 'DISPOSAL';
    } else if (input.adjustmentType === 'EXPIRY_DISPOSAL') {
      movementType = 'EXPIRY_DISPOSAL';
      refType = 'DISPOSAL';
    } else if (input.adjustmentType === 'SUPPLIER_RETURN') {
      movementType = 'SUPPLIER_RETURN';
      refType = 'RETURN';
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== input.productId) return p;

        let rem = input.quantity;
        const newBatches = [...(p.batches || [])].map((batch) => {
          if (input.batchNumber && batch.batchNumber !== input.batchNumber) return batch;
          if (rem <= 0 || batch.quantity <= 0) return batch;

          const toDeduct = Math.min(batch.quantity, rem);
          rem -= toDeduct;
          return { ...batch, quantity: batch.quantity - toDeduct };
        });

        return {
          ...p,
          currentStock: p.currentStock - input.quantity,
          batches: newBatches,
          updatedAt: timestampStr,
        };
      })
    );

    const movement: StockMovement = {
      id: 'mov-' + Date.now(),
      timestamp: timestampStr,
      productId: prod.id,
      productName: `${prod.brandName} (${prod.strength})`,
      batchNumber: input.batchNumber || 'ALL',
      movementType,
      quantityChange: -input.quantity,
      previousStock: prod.currentStock,
      newStock: prod.currentStock - input.quantity,
      unitCost: prod.costPrice,
      totalValue: input.quantity * prod.costPrice,
      referenceType: refType,
      referenceId: refCode,
      reason: input.reason || 'Inventory Adjustment',
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      notes: input.notes,
    };

    setStockMovements((prev) => [movement, ...prev]);

    // Record stock adjustment audit log matching user specification: "John adjusted stock from 20 to 18."
    logActivity({
      user: currentStaff.name,
      action: 'Adjusted Stock',
      module: 'INVENTORY',
      previousValue: `${prod.currentStock} units`,
      newValue: `${prod.currentStock - input.quantity} units`,
      transactionReference: refCode,
      details: `${currentStaff.name} adjusted stock of ${prod.brandName} from ${prod.currentStock} to ${prod.currentStock - input.quantity}. Reason: ${input.reason || input.adjustmentType}.`,
    });

    return { success: true, message: `Successfully adjusted stock for ${prod.brandName}. Deducted ${input.quantity} units.` };
  };

  // Record Expense / Cash Outflow
  const recordExpense = (input: RecordExpenseInput) => {
    if (input.amount <= 0) {
      return { success: false, message: 'Expense amount must be greater than zero' };
    }

    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const expId = 'EXP-' + Date.now().toString().slice(-6);

    const newTx: CashTransaction = {
      id: 'ctx-' + Date.now(),
      timestamp: timestampStr,
      date: timestampStr.substring(0, 10),
      type: 'CASH_OUT',
      category: input.category,
      amount: input.amount,
      description: input.description,
      referenceId: expId,
      paymentMethod: input.paymentMethod,
      staffName: currentStaff.name,
    };

    setCashTransactions((prev) => [newTx, ...prev]);

    logActivity({
      user: currentStaff.name,
      action: 'Recorded Expense',
      module: 'FINANCE',
      previousValue: '₦0.00',
      newValue: `₦${input.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      transactionReference: expId,
      details: `${currentStaff.name} recorded an expense of ₦${input.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} (${input.category}) - ${input.description}.`,
    });

    return { success: true, message: `Expense of ₦${input.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} recorded successfully.` };
  };

  // Add Product
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'batches'>,
    initialBatch?: Omit<Batch, 'id' | 'productId'>
  ) => {
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newId = 'prod-' + Date.now();

    const batches: Batch[] = [];
    if (initialBatch && initialBatch.quantity > 0) {
      batches.push({
        id: 'bat-' + Date.now(),
        productId: newId,
        batchNumber: initialBatch.batchNumber || 'BAT-INIT-01',
        costPrice: initialBatch.costPrice || productData.costPrice,
        sellingPrice: initialBatch.sellingPrice || productData.sellingPrice,
        quantity: initialBatch.quantity,
        initialQuantity: initialBatch.quantity,
        expiryDate: initialBatch.expiryDate,
        receivedDate: initialBatch.receivedDate || timestampStr.substring(0, 10),
        supplierId: productData.supplierId,
        supplierName: productData.supplierName,
      });
    }

    const newProd: Product = {
      ...productData,
      id: newId,
      batches,
      currentStock: initialBatch ? initialBatch.quantity : productData.currentStock || 0,
      createdAt: timestampStr,
      updatedAt: timestampStr,
    };

    setProducts((prev) => [newProd, ...prev]);

    if (newProd.currentStock > 0 && initialBatch) {
      const movement: StockMovement = {
        id: 'mov-' + Date.now(),
        timestamp: timestampStr,
        productId: newProd.id,
        productName: `${newProd.brandName} (${newProd.strength})`,
        batchNumber: initialBatch.batchNumber || 'INITIAL',
        movementType: 'PURCHASE_RECEIVE',
        quantityChange: newProd.currentStock,
        previousStock: 0,
        newStock: newProd.currentStock,
        unitCost: newProd.costPrice,
        totalValue: newProd.currentStock * newProd.costPrice,
        referenceType: 'PURCHASE',
        referenceId: 'INIT-STOCK',
        reason: 'Initial Product Inventory Intake',
        staffId: currentStaff.id,
        staffName: currentStaff.name,
      };
      setStockMovements((prev) => [movement, ...prev]);
    }

    logActivity('PRODUCT_ADDED', 'INVENTORY', `Added new product catalog item: ${newProd.brandName} (${newProd.strength})`);

    return { success: true, message: `Product "${newProd.brandName}" created successfully.`, product: newProd };
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const prod = products.find((p) => p.id === id);

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: timestampStr } : p))
    );

    if (prod && updates.sellingPrice !== undefined && updates.sellingPrice !== prod.sellingPrice) {
      logActivity({
        user: currentStaff.name,
        action: 'Changed Selling Price',
        module: 'INVENTORY',
        previousValue: `₦${prod.sellingPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        newValue: `₦${updates.sellingPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
        transactionReference: prod.sku,
        details: `${currentStaff.name} changed selling price of ${prod.brandName} from ₦${prod.sellingPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })} to ₦${updates.sellingPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}.`,
      });
    } else {
      logActivity({
        user: currentStaff.name,
        action: 'Updated Product',
        module: 'INVENTORY',
        transactionReference: prod?.sku || id,
        details: `${currentStaff.name} updated product catalog entry for ${prod?.brandName || id}.`,
      });
    }

    return { success: true, message: 'Product updated successfully.' };
  };

  const deleteProduct = (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (!prod) return { success: false, message: 'Product not found.' };

    if (prod.currentStock > 0) {
      return {
        success: false,
        message: `Cannot delete product with active stock (${prod.currentStock} units). Please adjust stock to 0 first.`,
      };
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    logActivity({
      user: currentStaff.name,
      action: 'Deleted Product',
      module: 'INVENTORY',
      previousValue: `${prod.brandName} (${prod.currentStock} units)`,
      newValue: 'Removed',
      transactionReference: prod.sku,
      details: `${currentStaff.name} deleted product catalog record for ${prod.brandName}.`,
    });
    return { success: true, message: `Product "${prod.brandName}" removed.` };
  };

  const addSupplier = (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newId = 'sup-' + Date.now();
    const newSup: Supplier = {
      ...supplier,
      id: newId,
      outstandingBalance: supplier.outstandingBalance ?? supplier.balanceOwed ?? 0,
      balanceOwed: supplier.balanceOwed ?? supplier.outstandingBalance ?? 0,
      isActive: supplier.isActive ?? true,
      createdAt: new Date().toISOString().substring(0, 10),
    };
    setSuppliers((prev) => [...prev, newSup]);
    logActivity({
      user: currentStaff.name,
      action: 'Registered Supplier',
      module: 'PURCHASES',
      previousValue: 'None',
      newValue: newSup.name,
      transactionReference: newSup.id,
      details: `${currentStaff.name} registered supplier ${newSup.name} (Contact: ${newSup.contactPerson}, Phone: ${newSup.phone}).`,
    });
    return { success: true, message: `Supplier "${newSup.name}" added successfully.` };
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    const existing = suppliers.find((s) => s.id === id);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logActivity({
      user: currentStaff.name,
      action: 'Updated Supplier',
      module: 'PURCHASES',
      previousValue: existing?.name || id,
      newValue: updates.name || existing?.name || id,
      transactionReference: id,
      details: `${currentStaff.name} updated supplier profile for ${existing?.name || id}.`,
    });
    return { success: true, message: 'Supplier updated successfully.' };
  };

  const settleSupplierBalance = (
    supplierId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    notes?: string
  ) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (!supplier) return { success: false, message: 'Supplier not found.' };
    if (amount <= 0) return { success: false, message: 'Payment amount must be greater than zero.' };

    const currentBal = supplier.outstandingBalance ?? supplier.balanceOwed ?? 0;
    const newBal = Math.max(0, currentBal - amount);
    const now = new Date();
    const dateStr = now.toISOString().substring(0, 10);
    const timeStr = now.toTimeString().substring(0, 8);
    const refId = 'SUP-PAY-' + Date.now().toString().slice(-6);

    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId
          ? { ...s, outstandingBalance: newBal, balanceOwed: newBal }
          : s
      )
    );

    // Record cash out transaction
    const cashOut: CashTransaction = {
      id: 'ctx-' + Date.now(),
      timestamp: `${dateStr} ${timeStr}`,
      date: dateStr,
      type: 'CASH_OUT',
      category: 'PURCHASE_PAYMENT',
      amount,
      description: `Supplier payment to ${supplier.name}. ${notes || ''}`.trim(),
      referenceId: refId,
      paymentMethod,
      staffName: currentStaff.name,
    };
    setCashTransactions((prev) => [cashOut, ...prev]);

    logActivity({
      user: currentStaff.name,
      action: 'Settled Supplier Balance',
      module: 'PURCHASES',
      previousValue: `₦${currentBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      newValue: `₦${newBal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`,
      transactionReference: refId,
      details: `${currentStaff.name} recorded payment of ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} to ${supplier.name} via ${paymentMethod}.`,
    });

    return {
      success: true,
      message: `Payment of ₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })} to ${supplier.name} recorded successfully.`,
    };
  };

  const addStaff = (staffMember: Omit<StaffMember, 'id'>) => {
    const newId = 'stf-' + Date.now();
    const newMember: StaffMember = { ...staffMember, id: newId };
    setStaff((prev) => [...prev, newMember]);
    logActivity('STAFF_REGISTERED', 'SECURITY', `Added staff user: ${newMember.name} (${newMember.role})`);
    return { success: true, message: `Staff member "${newMember.name}" registered.` };
  };

  const updateStaff = (id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)));
    logActivity('STAFF_UPDATED', 'SECURITY', `Updated staff record #${id}`);
    return { success: true, message: 'Staff profile updated.' };
  };

  const updateSettings = (newSettings: Partial<PharmacySettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
    logActivity('SETTINGS_UPDATED', 'SETTINGS', 'Updated pharmacy operational profile and system thresholds.');
  };

  const resetToDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setStaff(INITIAL_STAFF);
    setCurrentStaffState(INITIAL_STAFF[0]);
    setPurchases(INITIAL_PURCHASES);
    setSales(INITIAL_SALES);
    setCashTransactions(INITIAL_CASH_TRANSACTIONS);
    setStockMovements(INITIAL_STOCK_MOVEMENTS);
    setActivityLogs(INITIAL_ACTIVITY_LOGS);
    setSettings(INITIAL_SETTINGS);

    // Clear local storage keys
    [
      'products',
      'suppliers',
      'staff',
      'currentStaff',
      'purchases',
      'sales',
      'cashTransactions',
      'stockMovements',
      'activityLogs',
      'settings',
    ].forEach((k) => localStorage.removeItem(STORAGE_PREFIX + k));
  };

  const exportDatabaseJSON = () => {
    const fullDb = {
      exportDate: new Date().toISOString(),
      settings,
      products,
      suppliers,
      staff,
      purchases,
      sales,
      cashTransactions,
      stockMovements,
      activityLogs,
    };
    return JSON.stringify(fullDb, null, 2);
  };

  // Real-time Dashboard Calculations
  const todayStr = new Date().toISOString().substring(0, 10);

  // Total Inventory Value (Cost value: sum of currentStock * costPrice)
  const totalInventoryValue = products.reduce((acc, p) => acc + p.currentStock * p.costPrice, 0);

  // Today's Sales
  const todaySales = sales.filter((s) => s.timestamp.startsWith(todayStr) && s.status === 'COMPLETED');
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);

  // Cost of goods sold today
  let todayCOGS = 0;
  todaySales.forEach((s) => {
    s.items.forEach((item) => {
      const p = products.find((prod) => prod.id === item.productId);
      const unitCost = p ? p.costPrice : item.unitPrice * 0.6;
      todayCOGS += item.quantity * unitCost;
    });
  });

  // Today's Expenses (CASH_OUT transactions today that are not opening float)
  const todayExpenses = cashTransactions.filter(
    (tx) => tx.date === todayStr && tx.type === 'CASH_OUT'
  );
  const todayExpensesTotal = todayExpenses.reduce((acc, tx) => acc + tx.amount, 0);

  // Today's Profit = (Today's Sales Revenue - COGS - Today's Expenses)
  const todayProfit = todaySalesTotal - todayCOGS - todayExpensesTotal;

  // Current Cash Balance: sum of all CASH_IN minus sum of all CASH_OUT
  const currentCashBalance = cashTransactions.reduce((acc, tx) => {
    return tx.type === 'CASH_IN' ? acc + tx.amount : acc - tx.amount;
  }, 0);

  // Stock and Expiry counts
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let expiringSoonCount = 0;
  let expiredCount = 0;

  products.forEach((p) => {
    const status = getProductStockStatus(p);
    if (status === 'OUT_OF_STOCK') outOfStockCount++;
    if (status === 'LOW_STOCK') lowStockCount++;
    if (status === 'EXPIRING_SOON') expiringSoonCount++;
    if (status === 'EXPIRED') expiredCount++;
  });

  const todayTransactionsCount = cashTransactions.filter((tx) => tx.date === todayStr).length;

  const dashboardMetrics = {
    totalInventoryValue,
    todaySalesTotal,
    todayExpensesTotal,
    todayProfit,
    currentCashBalance,
    totalProductsCount: products.length,
    lowStockCount,
    outOfStockCount,
    expiringSoonCount,
    expiredCount,
    todayTransactionsCount,
  };

  // In-app Notification System
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() =>
    loadFromStorage('readNotifIds', [])
  );
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>(() =>
    loadFromStorage('dismissedNotifIds', [])
  );

  useEffect(() => saveToStorage('readNotifIds', readNotifIds), [readNotifIds]);
  useEffect(() => saveToStorage('dismissedNotifIds', dismissedNotifIds), [dismissedNotifIds]);

  // Construct Actionable Notifications
  const generatedNotifications: AppNotification[] = [];

  // 1. Low stock & Out of stock
  products.forEach((p) => {
    if (p.currentStock === 0) {
      const id = `oos-${p.id}`;
      if (!dismissedNotifIds.includes(id)) {
        generatedNotifications.push({
          id,
          type: 'OUT_OF_STOCK',
          title: `Stockout: ${p.brandName}`,
          message: `Zero units on shelf. Dispensing unavailable until stock intake is confirmed.`,
          timestamp: 'Immediate Action Required',
          read: readNotifIds.includes(id),
          severity: 'CRITICAL',
          actionLabel: 'Receive Stock',
          actionDestination: 'purchases',
          actionPayload: { actionType: 'INFLOW', productId: p.id, supplierId: p.supplierId },
        });
      }
    } else if (p.currentStock <= p.reorderLevel) {
      const id = `low-stock-${p.id}`;
      if (!dismissedNotifIds.includes(id)) {
        generatedNotifications.push({
          id,
          type: 'LOW_STOCK',
          title: `Low Stock: ${p.brandName}`,
          message: `${p.currentStock} units remaining (below reorder threshold of ${p.reorderLevel}). Reorder recommended.`,
          timestamp: 'Stock Deficit',
          read: readNotifIds.includes(id),
          severity: 'WARNING',
          actionLabel: 'Reorder Stock',
          actionDestination: 'purchases',
          actionPayload: { actionType: 'INFLOW', productId: p.id, supplierId: p.supplierId },
        });
      }
    }

    // 2. Expiring & Expired Batches
    (p.batches || []).forEach((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      if (days <= 0) {
        const id = `expired-${b.id}`;
        if (!dismissedNotifIds.includes(id)) {
          generatedNotifications.push({
            id,
            type: 'EXPIRED_PRODUCT',
            title: `EXPIRED: ${p.brandName} (${b.batchNumber})`,
            message: `Batch expired on ${b.expiryDate} (${b.quantity} units). Quarantine immediately to ensure patient safety.`,
            timestamp: b.expiryDate,
            read: readNotifIds.includes(id),
            severity: 'CRITICAL',
            actionLabel: 'Quarantine & Dispose',
            actionDestination: 'returns-damaged',
            actionPayload: { productId: p.id },
          });
        }
      } else if (days <= (settings.nearExpiryWarningDays || 60)) {
        const id = `expiring-${b.id}`;
        if (!dismissedNotifIds.includes(id)) {
          generatedNotifications.push({
            id,
            type: 'EXPIRING_PRODUCT',
            title: `Expiring Soon: ${p.brandName} (${b.batchNumber})`,
            message: `Batch expires in ${days} days (${b.expiryDate}) with ${b.quantity} units. Apply FEFO protocol.`,
            timestamp: `${days} days left`,
            read: readNotifIds.includes(id),
            severity: 'WARNING',
            actionLabel: 'Inspect Expiry',
            actionDestination: 'expiry',
            actionPayload: { productId: p.id },
          });
        }
      }
    });
  });

  // 3. Unusual Stock Adjustments
  stockMovements.forEach((m) => {
    const isLarge = Math.abs(m.quantityChange) >= 10;
    const isDamage = m.movementType === 'DAMAGE' || m.movementType === 'EXPIRY_DISPOSAL';
    if (isLarge || isDamage) {
      const id = `unusual-adj-${m.id}`;
      if (!dismissedNotifIds.includes(id)) {
        generatedNotifications.push({
          id,
          type: 'UNUSUAL_ADJUSTMENT',
          title: `Unusual Adjustment: ${m.productName}`,
          message: `${m.movementType} of ${Math.abs(m.quantityChange)} units logged by ${m.staffName} (${m.reason || 'No note'}).`,
          timestamp: m.timestamp.slice(0, 16),
          read: readNotifIds.includes(id),
          severity: isDamage ? 'WARNING' : 'INFO',
          actionLabel: 'Audit Movement',
          actionDestination: 'stock-movements',
          actionPayload: { referenceId: m.referenceId },
        });
      }
    }
  });

  // 4. Important Financial Events
  cashTransactions.forEach((tx) => {
    if (tx.type === 'CASH_OUT' && tx.amount >= 50000) {
      const id = `fin-exp-${tx.id}`;
      if (!dismissedNotifIds.includes(id)) {
        generatedNotifications.push({
          id,
          type: 'FINANCIAL_EVENT',
          title: `High Expense: ${settings.currencySymbol || '₦'}${tx.amount.toLocaleString()}`,
          message: `${tx.category.replace(/_/g, ' ')} payment logged by ${tx.staffName} for "${tx.description}".`,
          timestamp: tx.timestamp,
          read: readNotifIds.includes(id),
          severity: 'INFO',
          actionLabel: 'View Cash Ledger',
          actionDestination: 'finance',
        });
      }
    }
  });

  suppliers.forEach((s) => {
    if (s.outstandingBalance >= 100000) {
      const id = `fin-supp-${s.id}`;
      if (!dismissedNotifIds.includes(id)) {
        generatedNotifications.push({
          id,
          type: 'FINANCIAL_EVENT',
          title: `Outstanding Payable: ${s.name}`,
          message: `Pending invoice balance of ${settings.currencySymbol || '₦'}${s.outstandingBalance.toLocaleString()} on terms "${s.paymentTerms}".`,
          timestamp: 'Payable Overdue',
          read: readNotifIds.includes(id),
          severity: 'WARNING',
          actionLabel: 'Settle Supplier',
          actionDestination: 'suppliers',
          actionPayload: { supplierId: s.id },
        });
      }
    }
  });

  const markNotificationRead = (id: string) => {
    setReadNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const markAllNotificationsRead = () => {
    const allIds = generatedNotifications.map((n) => n.id);
    setReadNotifIds(allIds);
  };

  const dismissNotification = (id: string) => {
    setDismissedNotifIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const clearAllNotifications = () => {
    const allIds = generatedNotifications.map((n) => n.id);
    setDismissedNotifIds((prev) => Array.from(new Set([...prev, ...allIds])));
  };

  const unreadNotificationsCount = generatedNotifications.filter((n) => !n.read).length;

  const formatCurrency = (amount: number | undefined | null, includeDecimals = true): string => {
    const rawSym = settings.currencySymbol || '₦';
    const sym = rawSym === '$' ? '₦' : rawSym;
    if (amount === undefined || amount === null || isNaN(amount)) {
      return `${sym}0.00`;
    }
    return (
      sym +
      amount.toLocaleString('en-NG', {
        minimumFractionDigits: includeDecimals ? 2 : 0,
        maximumFractionDigits: includeDecimals ? 2 : 0,
      })
    );
  };

  const formatNaira = (amount: number | undefined | null, includeDecimals = true): string => {
    return formatCurrency(amount, includeDecimals);
  };

  const resetToSeedData = () => {
    resetToDemoData();
  };

  return (
    <PharmacyContext.Provider
      value={{
        products,
        suppliers,
        staff,
        currentStaff,
        purchases,
        sales,
        cashTransactions,
        stockMovements,
        activityLogs,
        auditLogs: activityLogs,
        settings,
        setCurrentStaff,
        recordStockInflow,
        processSale,
        adjustStock,
        recordExpense,
        recordCashExpense: recordExpense,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        updateSupplier,
        settleSupplierBalance,
        addStaff,
        updateStaff,
        updateSettings,
        logActivity,
        getProductStockStatus,
        getDaysUntilExpiry,
        dashboardMetrics,
        formatCurrency,
        formatNaira,
        notifications: generatedNotifications,
        unreadNotificationsCount,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        clearAllNotifications,
        resetToDemoData,
        resetToSeedData,
        exportDatabaseJSON,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
