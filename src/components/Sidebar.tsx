import React from 'react';
import { NavigationTab } from '../types/pharmacy';
import { usePharmacy } from '../context/PharmacyContext';
import { hasTabPermission, getCanonicalRole } from '../utils/permissions';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Receipt,
  Wallet,
  Pill,
  Truck,
  CalendarX,
  BellRing,
  Users,
  FileBarChart,
  History,
  Settings,
  Building2,
  ChevronRight,
  ShieldCheck,
  X,
  ArrowLeftRight,
  PackageX,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  activeTab?: NavigationTab;
  currentTab?: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileOpen?: boolean;
  mobileOpen?: boolean;
  onCloseMobile: () => void;
  onOpenQuickAction?: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  currentTab,
  onSelectTab,
  isMobileOpen,
  mobileOpen,
  onCloseMobile,
  onOpenQuickAction,
}) => {
  const effectiveTab = activeTab || currentTab || 'dashboard';
  const effectiveMobileOpen = isMobileOpen !== undefined ? isMobileOpen : !!mobileOpen;
  const { dashboardMetrics, settings, currentStaff } = usePharmacy();

  const allNavItems: {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory & Catalog', icon: Package },
    { id: 'purchases', label: 'Purchases & Inflow', icon: ShoppingCart },
    { id: 'sales', label: 'Sales & POS', icon: Receipt },
    { id: 'finance', label: 'Cash & Finance', icon: Wallet },
    { id: 'expiry', label: 'Expiry & Batches', icon: CalendarX, badge: dashboardMetrics.expiredCount + dashboardMetrics.expiringSoonCount, badgeColor: dashboardMetrics.expiredCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white' },
    { id: 'alerts', label: 'Stock Alerts', icon: BellRing, badge: dashboardMetrics.lowStockCount + dashboardMetrics.outOfStockCount, badgeColor: dashboardMetrics.outOfStockCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white' },
    { id: 'suppliers', label: 'Suppliers & Vendors', icon: Truck },
    { id: 'stock-movements', label: 'Stock Movements Ledger', icon: ArrowLeftRight },
    { id: 'returns-damaged', label: 'Returns & Damages', icon: PackageX },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    { id: 'activity', label: 'Audit Trail & Logs', icon: History },
    { id: 'staff', label: 'Staff Roster & Roles', icon: Users },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  // RBAC: Filter navigation items based on the active staff role
  // "Users must only see and perform actions permitted by their role."
  const allowedNavItems = allNavItems.filter((item) => hasTabPermission(currentStaff.role, item.id));
  const canonicalRole = getCanonicalRole(currentStaff.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {effectiveMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          effectiveMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/40">
              <span className="font-black text-xl tracking-tight">Rx</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-base leading-tight tracking-tight">
                PharmaPulse
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] text-emerald-400 font-medium tracking-wide uppercase">
                  Production OS
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch / Facility Indicator */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate font-medium text-slate-300">{settings.branchName}</span>
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
            Lic: {settings.licenseNumber}
          </p>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 flex items-center justify-between text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            <span>Permitted Views ({allowedNavItems.length})</span>
            <span className="text-emerald-400 text-[9px] font-mono lowercase">rbac on</span>
          </div>

          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = effectiveTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span className="tracking-wide">{item.label}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
                      item.badgeColor || 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logged-in Operator Profile Card with Role Badge */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-800 text-emerald-200 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-700">
              {currentStaff.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-100 truncate">{currentStaff.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-[10px] text-emerald-400 font-bold truncate">
                  {canonicalRole}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
