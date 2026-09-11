import { StaffRole, NavigationTab } from '../types/pharmacy';

export type CanonicalRole = 'Owner/Admin' | 'Pharmacist' | 'Pharmacy Technician' | 'Cashier';

export interface RoleDefinition {
  id: CanonicalRole;
  title: string;
  badgeColor: string;
  description: string;
  allowedTabs: NavigationTab[];
  canManageStaff: boolean;
  canManageSettings: boolean;
  canViewFinancials: boolean;
  canPerformInflow: boolean;
  canPerformDisposal: boolean;
  canEditCatalog: boolean;
  canChangePrice: boolean;
  canDispenseSale: boolean;
}

export const ROLE_DEFINITIONS: Record<CanonicalRole, RoleDefinition> = {
  'Owner/Admin': {
    id: 'Owner/Admin',
    title: 'Owner / Superintendent Pharmacist',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Full administrative, financial, operational, and clinical access across all pharmacy modules.',
    allowedTabs: [
      'dashboard',
      'inventory',
      'purchases',
      'sales',
      'finance',
      'expiry',
      'alerts',
      'stock-movements',
      'suppliers',
      'returns-damaged',
      'reports',
      'activity',
      'staff',
      'settings',
    ],
    canManageStaff: true,
    canManageSettings: true,
    canViewFinancials: true,
    canPerformInflow: true,
    canPerformDisposal: true,
    canEditCatalog: true,
    canChangePrice: true,
    canDispenseSale: true,
  },
  'Pharmacist': {
    id: 'Pharmacist',
    title: 'Licensed Staff Pharmacist',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Access to inventory, sales, purchases, reports, expiry control, and operational dispensary functions.',
    allowedTabs: [
      'dashboard',
      'inventory',
      'purchases',
      'sales',
      'expiry',
      'alerts',
      'stock-movements',
      'suppliers',
      'returns-damaged',
      'reports',
      'activity',
    ],
    canManageStaff: false,
    canManageSettings: false,
    canViewFinancials: false,
    canPerformInflow: true,
    canPerformDisposal: true,
    canEditCatalog: true,
    canChangePrice: true,
    canDispenseSale: true,
  },
  'Pharmacy Technician': {
    id: 'Pharmacy Technician',
    title: 'Pharmacy Technician',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Operational inventory access: stock receiving, batch verification, shelf audits, and quarantine checks.',
    allowedTabs: [
      'dashboard',
      'inventory',
      'purchases',
      'expiry',
      'alerts',
      'stock-movements',
      'returns-damaged',
    ],
    canManageStaff: false,
    canManageSettings: false,
    canViewFinancials: false,
    canPerformInflow: true,
    canPerformDisposal: true,
    canEditCatalog: false,
    canChangePrice: false,
    canDispenseSale: false,
  },
  'Cashier': {
    id: 'Cashier',
    title: 'Dispensary Cashier',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Sales and payment-related access: POS checkout, patient receipt issuance, and stock price verification.',
    allowedTabs: [
      'sales',
      'inventory',
    ],
    canManageStaff: false,
    canManageSettings: false,
    canViewFinancials: false,
    canPerformInflow: false,
    canPerformDisposal: false,
    canEditCatalog: false,
    canChangePrice: false,
    canDispenseSale: true,
  },
};

export const getCanonicalRole = (role: StaffRole | string): CanonicalRole => {
  const normalized = (role || '').toUpperCase();
  if (
    normalized === 'OWNER_ADMIN' ||
    normalized === 'SUPER_ADMIN' ||
    normalized === 'OWNER' ||
    normalized === 'ADMIN' ||
    normalized === 'CHIEF_PHARMACIST'
  ) {
    return 'Owner/Admin';
  }
  if (
    normalized === 'PHARMACIST' ||
    normalized === 'STAFF_PHARMACIST' ||
    normalized === 'SUPERINTENDENT'
  ) {
    return 'Pharmacist';
  }
  if (
    normalized === 'PHARMACY_TECHNICIAN' ||
    normalized === 'PHARMACY_TECH' ||
    normalized === 'TECH'
  ) {
    return 'Pharmacy Technician';
  }
  return 'Cashier';
};

export const hasTabPermission = (role: StaffRole | string, tab: NavigationTab): boolean => {
  const canonical = getCanonicalRole(role);
  const def = ROLE_DEFINITIONS[canonical];
  if (!def) return false;
  if (tab === 'products') return def.allowedTabs.includes('inventory');
  return def.allowedTabs.includes(tab);
};

export const getAccessibleTabs = (role: StaffRole | string): NavigationTab[] => {
  const canonical = getCanonicalRole(role);
  return ROLE_DEFINITIONS[canonical]?.allowedTabs || ['sales'];
};

export const hasActionPermission = (
  role: StaffRole | string,
  action: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT' | 'MANAGE_STAFF' | 'CHANGE_PRICE'
): boolean => {
  const canonical = getCanonicalRole(role);
  const def = ROLE_DEFINITIONS[canonical];
  if (!def) return false;

  switch (action) {
    case 'SALE':
      return def.canDispenseSale;
    case 'INFLOW':
      return def.canPerformInflow;
    case 'PRODUCT':
      return def.canEditCatalog;
    case 'EXPENSE':
      return def.canViewFinancials; // Only Owner/Admin can record direct financial payouts
    case 'ADJUSTMENT':
      return def.canPerformDisposal;
    case 'MANAGE_STAFF':
      return def.canManageStaff;
    case 'CHANGE_PRICE':
      return def.canChangePrice;
    default:
      return false;
  }
};
