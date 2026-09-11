import React, { useState, useRef, useEffect } from 'react';
import { NavigationTab, Product } from '../types/pharmacy';
import { usePharmacy } from '../context/PharmacyContext';
import {
  Menu,
  Bell,
  Plus,
  Search,
  UserCheck,
  ChevronDown,
  AlertTriangle,
  Clock,
  Pill,
  ExternalLink,
  Shield,
  CheckCheck,
  Check,
  Trash2,
  ArrowRight,
  X,
  Wallet,
  AlertOctagon,
  ArrowDownLeft,
} from 'lucide-react';

interface HeaderProps {
  currentTab?: NavigationTab;
  onOpenMobileNav?: () => void;
  onToggleMobileSidebar?: () => void;
  onOpenQuickAction: (actionType?: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT') => void;
  onNavigate: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab = 'dashboard',
  onOpenMobileNav,
  onToggleMobileSidebar,
  onOpenQuickAction,
  onNavigate,
}) => {
  const {
    products,
    staff,
    currentStaff,
    setCurrentStaff,
    dashboardMetrics,
    getProductStockStatus,
    getDaysUntilExpiry,
    notifications,
    unreadNotificationsCount,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
    clearAllNotifications,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [notifTab, setNotifTab] = useState<'ALL' | 'STOCK' | 'EXPIRY' | 'ADJUSTMENT' | 'FINANCE'>('ALL');

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const staffRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (staffRef.current && !staffRef.current.contains(e.target as Node)) {
        setShowStaffDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Title mappings
  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    dashboard: { title: 'Operational Command Center', subtitle: 'Real-time pharmacy metrics, stock movement & financial overview' },
    inventory: { title: 'Master Inventory Management', subtitle: 'View, filter, sort and adjust active medications and clinical stock' },
    purchases: { title: 'Purchases & Stock Inflow', subtitle: 'Stock receiving, supplier invoice intake, and batch registration' },
    sales: { title: 'Pharmacy POS & Sales Outflow', subtitle: 'Fast dispensing terminal, prescription sales, and official receipts' },
    finance: { title: 'Cash & Financial Ledger', subtitle: 'Cash inflows, outflows, operating expenses and register reconciliation' },
    products: { title: 'Medication & Product Catalog', subtitle: 'Therapeutic categories, strengths, formulations, and regulatory tags' },
    suppliers: { title: 'Pharmaceutical Suppliers', subtitle: 'Wholesalers, lead times, trade payment terms, and open balances' },
    expiry: { title: 'Expiry Control & Quarantine', subtitle: 'Clinical safety, near-expiry alerts, quarantine, and disposal records' },
    alerts: { title: 'Automated Stock Alerts', subtitle: 'Critical low-stock, out-of-stock items, and automated reorder engine' },
    staff: { title: 'Pharmacy Staff & Access Roles', subtitle: 'Pharmacists, technicians, dispensary cashiers, and shifts' },
    reports: { title: 'Reports & Business Intelligence', subtitle: 'Inventory valuation, sales summary, profit & loss, and audit exports' },
    'stock-movements': { title: 'Stock Ledger & Movements', subtitle: 'Complete audit trail of all inventory inflows, outflows, and adjustments' },
    'returns-damaged': { title: 'Returns & Damaged Goods', subtitle: 'Quarantine, supplier returns, expired stock disposal, and write-offs' },
    activity: { title: 'Immutable Audit Trail', subtitle: 'Complete log of stock movements, cashier sales, and administrative actions' },
    settings: { title: 'Pharmacy Settings & Profile', subtitle: 'Licensing, branch details, tax rates, warning thresholds, and backups' },
  };

  // Filtered products for quick search
  const searchResults: Product[] = searchQuery.trim()
    ? products.filter(
        (p) =>
          p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.barcode.includes(searchQuery) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.batches.some((b) => b.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 6)
    : [];

  // Filtered actionable notifications
  const filteredNotifications = notifications.filter((n) => {
    if (notifTab === 'ALL') return true;
    if (notifTab === 'STOCK') return n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK';
    if (notifTab === 'EXPIRY') return n.type === 'EXPIRING_PRODUCT' || n.type === 'EXPIRED_PRODUCT';
    if (notifTab === 'ADJUSTMENT') return n.type === 'UNUSUAL_ADJUSTMENT';
    if (notifTab === 'FINANCE') return n.type === 'FINANCIAL_EVENT';
    return true;
  });

  const totalAlerts = unreadNotificationsCount;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left Section: Mobile Menu & View Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          id="mobile-nav-toggle"
          onClick={() => {
            if (onOpenMobileNav) onOpenMobileNav();
            else if (onToggleMobileSidebar) onToggleMobileSidebar();
          }}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
            {titles[currentTab]?.title || 'Pharmacy Management'}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block truncate">
            {titles[currentTab]?.subtitle || ''}
          </p>
        </div>
      </div>

      {/* Middle Section: Universal Medication Search */}
      <div ref={searchRef} className="relative hidden md:block flex-1 max-w-md mx-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="global-product-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search medicine, generic, barcode, lot #..."
            className="w-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchResults && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 duration-150">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between">
              <span>Matching Medications ({searchResults.length})</span>
              <span className="text-slate-400 font-normal">Press Esc to close</span>
            </div>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No medication matching &quot;{searchQuery}&quot; found.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((prod) => {
                  const status = getProductStockStatus(prod);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                        onNavigate('inventory');
                      }}
                      className="p-2.5 hover:bg-emerald-50/50 cursor-pointer flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-xs text-slate-800 truncate">
                            {prod.brandName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {prod.strength}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{prod.genericName}</p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Loc: {prod.shelfLocation}</span>
                          <span>•</span>
                          <span>Barcode: {prod.barcode}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-slate-800">
                          {prod.currentStock} {prod.unit}
                        </div>
                        <span
                          className={`inline-block text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                            status === 'IN_STOCK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'LOW_STOCK'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Quick Action Button, Alerts, Active Staff */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Action Button */}
        <button
          id="header-quick-action-btn"
          onClick={() => onOpenQuickAction()}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 sm:px-4 py-2 rounded-xl text-xs font-semibold shadow-xs shadow-emerald-700/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Action</span>
          <span className="sm:hidden">Action</span>
        </button>

        {/* Notifications Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            id="header-notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors relative"
            title="Operational Alerts"
            aria-label="Operational Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white animate-pulse">
                {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col">
              {/* Header */}
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900">Notifications & Alerts</h4>
                    {unreadNotificationsCount > 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-full">
                        {unreadNotificationsCount} unread
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Real-time operational alerts requiring clinical or management action
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="p-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[10px]">Read all</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={() => clearAllNotifications()}
                      className="p-1 text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Clear notifications"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="px-3 pt-2 pb-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-100 bg-slate-50/70">
                {(
                  [
                    { key: 'ALL', label: 'All' },
                    { key: 'STOCK', label: 'Stock' },
                    { key: 'EXPIRY', label: 'Expiry' },
                    { key: 'ADJUSTMENT', label: 'Adjustments' },
                    { key: 'FINANCE', label: 'Finance' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setNotifTab(tab.key)}
                    className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all whitespace-nowrap ${
                      notifTab === tab.key
                        ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Actionable Notification Items */}
              <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <Check className="w-6 h-6 text-emerald-500 bg-emerald-50 p-1 rounded-full" />
                    <span>No notifications in this category. System operations normal.</span>
                  </div>
                ) : (
                  filteredNotifications.map((notif) => {
                    const isCrit = notif.severity === 'CRITICAL';
                    const isWarn = notif.severity === 'WARNING';

                    return (
                      <div
                        key={notif.id}
                        className={`p-3 transition-colors flex items-start gap-3 text-xs ${
                          !notif.read ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`p-1.5 rounded-lg shrink-0 ${
                            isCrit
                              ? 'bg-rose-100 text-rose-700'
                              : isWarn
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isCrit ? (
                            <AlertOctagon className="w-4 h-4" />
                          ) : isWarn ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : notif.type === 'FINANCIAL_EVENT' ? (
                            <Wallet className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <div>
                              <div className="flex items-center gap-1.5">
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                                )}
                                <span className="font-bold text-slate-800 leading-tight">
                                  {notif.title}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {notif.timestamp}
                              </span>
                            </div>

                            <button
                              onClick={() => dismissNotification(notif.id)}
                              className="text-slate-300 hover:text-slate-500 p-0.5 rounded transition-colors"
                              title="Dismiss"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>

                          {/* Action Button */}
                          <div className="mt-2 flex items-center justify-between">
                            <button
                              onClick={() => {
                                markNotificationRead(notif.id);
                                setShowNotifications(false);
                                if (notif.actionPayload?.actionType) {
                                  onOpenQuickAction(notif.actionPayload.actionType);
                                }
                                onNavigate(notif.actionDestination);
                              }}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-2xs transition-all ${
                                isCrit
                                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                  : isWarn
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <span>{notif.actionLabel}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            {!notif.read && (
                              <button
                                onClick={() => markNotificationRead(notif.id)}
                                className="text-[10px] text-slate-400 hover:text-slate-600"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Links */}
              <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-medium">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('expiry');
                  }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  Expiry Tracker
                </button>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('stock-movements');
                  }}
                  className="hover:text-emerald-700 transition-colors"
                >
                  Movement Audit
                </button>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigate('reports');
                  }}
                  className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                >
                  View Reports
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Staff Switcher Dropdown */}
        <div ref={staffRef} className="relative">
          <button
            id="header-staff-dropdown-btn"
            onClick={() => setShowStaffDropdown(!showStaffDropdown)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-100/80 transition-all text-xs"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 font-bold flex items-center justify-center text-[10px]">
              {currentStaff.name[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="font-semibold text-slate-800 leading-tight truncate max-w-[110px]">
                {currentStaff.name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-slate-400 leading-none">
                {currentStaff.role === 'CHIEF_PHARMACIST'
                  ? 'Chief RPh'
                  : currentStaff.role === 'STAFF_PHARMACIST'
                  ? 'Staff RPh'
                  : currentStaff.role.replace(/_/g, ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showStaffDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-3 py-1.5 border-b border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Operator
                </p>
                <p className="text-[11px] text-slate-500">
                  Select who is currently operating the POS / inventory
                </p>
              </div>
              <div className="py-1 space-y-0.5">
                {staff.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setCurrentStaff(member);
                      setShowStaffDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors hover:bg-slate-50 ${
                      currentStaff.id === member.id
                        ? 'bg-emerald-50/80 text-emerald-900 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="leading-tight">{member.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        {member.role.replace(/_/g, ' ')} • {member.licenseNumber}
                      </p>
                    </div>
                    {currentStaff.id === member.id && (
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                    )}
                  </button>
                ))}
              </div>
              <div className="px-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowStaffDropdown(false);
                    onNavigate('staff');
                  }}
                  className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1"
                >
                  Manage All Staff & Shifts →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
