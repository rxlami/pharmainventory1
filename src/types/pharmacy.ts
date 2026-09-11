export type ProductCategory =
  | 'Antimalarials'
  | 'Antibiotics'
  | 'Analgesics & Pain Relief'
  | 'Cardiovascular'
  | 'Antidiabetics'
  | 'Gastrointestinal'
  | 'Pediatric & Infant Care'
  | 'Respiratory'
  | 'Antihistamines'
  | 'Vitamins & Supplements'
  | 'Dermatology & Topicals'
  | 'Injectables & Infusions'
  | 'Eye & Ear Drops'
  | 'Surgical & Medical Supplies';

export type DosageForm =
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Suspension'
  | 'Injection'
  | 'Ointment / Cream'
  | 'Inhaler'
  | 'Drops'
  | 'Suppository'
  | 'Solution'
  | 'Medical Device';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  initialQuantity: number;
  expiryDate: string; // YYYY-MM-DD
  receivedDate: string;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  nafdacRegNo?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  brandName: string;
  genericName: string;
  category: ProductCategory;
  dosageForm: DosageForm;
  strength: string; // e.g. "500mg", "10ml"
  unit: string; // "Box of 100", "Bottle", "Strip of 10", "Piece"
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  optimalStock: number;
  shelfLocation: string; // e.g. "Rack A-3"
  requiresPrescription: boolean;
  storageCondition: 'Room Temp (15-25°C)' | 'Refrigerated (2-8°C)' | 'Cool & Dry' | 'Controlled Substance Safe';
  supplierId: string;
  supplierName: string;
  batches: Batch[];
  nafdacRegNo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType =
  | 'PURCHASE_RECEIVE'
  | 'SALE'
  | 'DAMAGE'
  | 'EXPIRY_DISPOSAL'
  | 'SUPPLIER_RETURN'
  | 'INVENTORY_ADJUSTMENT'
  | 'TRANSFER';

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  batchNumber: string;
  movementType: StockMovementType;
  quantityChange: number; // positive for inflow, negative for outflow
  previousStock: number;
  newStock: number;
  unitCost: number;
  totalValue: number;
  referenceType: 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'DISPOSAL' | 'RETURN';
  referenceId: string;
  reason: string;
  staffId: string;
  staffName: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  genericName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  unitCost: number;
  sellingPrice: number;
  totalCost: number;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'PENDING';
export type PaymentMethod = 'CASH' | 'POS' | 'BANK_TRANSFER' | 'CREDIT';

export interface PurchaseOrder {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  dateReceived: string;
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  staffResponsible: string;
  status: 'RECEIVED' | 'PENDING' | 'CANCELLED';
  notes?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  genericName: string;
  batchNumber: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage or fixed
  subtotal: number;
  total: number;
}

export interface Sale {
  id: string;
  receiptNumber: string;
  customerName?: string;
  customerPhone?: string;
  prescriptionNumber?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeGiven: number;
  staffId: string;
  staffName: string;
  timestamp: string;
  status: 'COMPLETED' | 'REFUNDED';
  notes?: string;
}

export type CashTransactionType = 'CASH_IN' | 'CASH_OUT';
export type CashCategory =
  | 'SALE_REVENUE'
  | 'PURCHASE_PAYMENT'
  | 'OPERATING_EXPENSE'
  | 'UTILITY_BILL'
  | 'SALARY_PAYROLL'
  | 'SUPPLIER_PAYOUT'
  | 'WASTE_DISPOSAL'
  | 'OPENING_FLOAT'
  | 'MISCELLANEOUS';

export interface CashTransaction {
  id: string;
  timestamp: string;
  date: string;
  type: CashTransactionType;
  category: CashCategory;
  amount: number;
  description: string;
  referenceId?: string;
  paymentMethod: PaymentMethod;
  staffName: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  paymentTerms: 'Immediate' | 'Net 15' | 'Net 30' | 'Net 60' | string;
  leadTimeDays: number;
  balanceOwed?: number;
  outstandingBalance: number;
  status?: 'ACTIVE' | 'INACTIVE';
  isActive?: boolean;
  suppliedCategories: ProductCategory[];
  productsSupplied?: string[]; // Medication products supplied
  createdAt: string;
}

export type StaffRole =
  | 'OWNER_ADMIN'
  | 'PHARMACIST'
  | 'PHARMACY_TECHNICIAN'
  | 'CASHIER'
  | 'SUPER_ADMIN'
  | 'CHIEF_PHARMACIST'
  | 'STAFF_PHARMACIST'
  | 'PHARMACY_TECH';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  licenseNumber: string;
  shift: 'Morning (08:00 - 16:00)' | 'Evening (14:00 - 22:00)' | 'Night (22:00 - 08:00)' | 'General Full-Time';
  status: 'ACTIVE' | 'INACTIVE';
  lastActive: string;
}

export type AuditModule = 'INVENTORY' | 'SALES' | 'PURCHASES' | 'FINANCE' | 'STAFF' | 'SETTINGS' | 'SYSTEM' | 'SECURITY';

export interface ActivityLog {
  id: string;
  timestamp: string; // ISO / Formatted string
  date: string; // e.g. "2026-09-11"
  time: string; // e.g. "14:32:05"
  user: string; // Attributed user name e.g. "John", "Mary", "Pharm. Chinedu"
  action: string; // e.g. "Added Stock", "Recorded Sale", "Adjusted Stock", "Changed Selling Price"
  module: AuditModule; // Module identifier
  previousValue?: string | number; // State before action
  newValue?: string | number; // State after action
  transactionReference?: string; // Transaction reference e.g. "REC-2026-1088", "INV-EMZ-1150"
  details: string; // Formatted statement e.g. "John added 50 units of Amoxicillin."
  staffId: string;
  staffName: string; // Alias to user
  role: string;
  category?: AuditModule; // Backward compatibility alias to module
  referenceId?: string; // Backward compatibility alias to transactionReference
}

export interface PharmacySettings {
  pharmacyName: string;
  branchName: string;
  licenseNumber: string; // e.g. PCN Premises License: PCN/LA/2024/09842
  pcnPremisesNumber?: string;
  pharmacistInCharge: string; // Superintendent Pharmacist
  superintendentPcnLicense?: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email: string;
  taxRate: number; // e.g. 7.5 for 7.5% VAT
  currencySymbol: string; // "₦"
  currencyCode: string; // "NGN"
  nearExpiryWarningDays: number; // e.g. 60 or 90 days
  receiptHeader: string;
  receiptFooter: string;
  operatingHours: string;
}

export type NavigationTab =
  | 'dashboard'
  | 'inventory'
  | 'purchases'
  | 'sales'
  | 'finance'
  | 'products'
  | 'suppliers'
  | 'expiry'
  | 'alerts'
  | 'stock-movements'
  | 'returns-damaged'
  | 'staff'
  | 'reports'
  | 'activity'
  | 'settings';

export type NotificationType =
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRING_PRODUCT'
  | 'EXPIRED_PRODUCT'
  | 'UNUSUAL_ADJUSTMENT'
  | 'FINANCIAL_EVENT';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  actionLabel: string;
  actionDestination: NavigationTab;
  actionPayload?: {
    actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT';
    productId?: string;
    supplierId?: string;
    referenceId?: string;
  };
}

export type ReportCategory = 'INVENTORY' | 'SALES' | 'PURCHASES' | 'FINANCIAL';

export type ReportType =
  // Inventory Reports
  | 'CURRENT_STOCK'
  | 'STOCK_VALUATION'
  | 'STOCK_MOVEMENT'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'EXPIRY_REPORT'
  | 'EXPIRED_STOCK'
  | 'DAMAGED_STOCK'
  // Sales Reports
  | 'DAILY_SALES'
  | 'WEEKLY_SALES'
  | 'MONTHLY_SALES'
  | 'PRODUCT_SALES'
  | 'STAFF_SALES'
  | 'PAYMENT_METHOD_SUMMARY'
  // Purchase Reports
  | 'PURCHASES'
  | 'SUPPLIER_PURCHASES'
  | 'OUTSTANDING_SUPPLIER_PAYMENTS'
  // Financial Reports
  | 'REVENUE'
  | 'EXPENSES'
  | 'CASH_FLOW'
  | 'GROSS_PROFIT'
  | 'NET_MOVEMENT';
