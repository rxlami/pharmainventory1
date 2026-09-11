import React, { useState, useEffect } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { NavigationTab } from './types/pharmacy';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickActionModal } from './components/QuickActionModal';
import { hasTabPermission, getAccessibleTabs, getCanonicalRole, ROLE_DEFINITIONS } from './utils/permissions';
import { ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react';

// Views
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { PurchasesView } from './views/PurchasesView';
import { SalesPOSView } from './views/SalesPOSView';
import { FinancialsView } from './views/FinancialsView';
import { ExpiryBatchView } from './views/ExpiryBatchView';
import { AlertsView } from './views/AlertsView';
import { StockMovementsView } from './views/StockMovementsView';
import { SuppliersView } from './views/SuppliersView';
import { ReturnsDamagedView } from './views/ReturnsDamagedView';
import { StaffView } from './views/StaffView';
import { ReportsView } from './views/ReportsView';
import { AuditTrailView } from './views/AuditTrailView';
import { SettingsView } from './views/SettingsView';

const MainLayout: React.FC = () => {
  const { currentStaff } = usePharmacy();
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [quickActionType, setQuickActionType] = useState<
    'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT'
  >('INFLOW');

  // Role-based Access Control: If user's current role does not have access to activeTab,
  // automatically route to their primary allowed view (e.g. Cashier -> sales, Tech -> inventory)
  useEffect(() => {
    if (!hasTabPermission(currentStaff.role, activeTab)) {
      const allowed = getAccessibleTabs(currentStaff.role);
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [currentStaff.role, activeTab]);

  const handleOpenQuickAction = (
    actionType: 'SALE' | 'INFLOW' | 'PRODUCT' | 'EXPENSE' | 'ADJUSTMENT' = 'INFLOW'
  ) => {
    if (actionType === 'SALE') {
      setActiveTab('sales');
      return;
    }
    setQuickActionType(actionType);
    setIsQuickActionOpen(true);
  };

  const renderActiveView = () => {
    // RBAC Security Gate: verify active view permission
    if (!hasTabPermission(currentStaff.role, activeTab)) {
      const canonical = getCanonicalRole(currentStaff.role);
      const roleDef = ROLE_DEFINITIONS[canonical];
      const accessibleTabs = getAccessibleTabs(currentStaff.role);

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-8 max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Access Restricted by Role</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your designated role as <strong>{canonical}</strong> does not have permission to view or manage the{' '}
                <span className="font-mono font-semibold text-slate-800 uppercase">{activeTab}</span> module.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Role Scope: {roleDef.title}</span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{roleDef.description}</p>
            </div>

            <button
              onClick={() => setActiveTab(accessibleTabs[0] || 'dashboard')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <span>Return to Permitted View ({accessibleTabs[0] || 'Dispensary'})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenQuickAction={handleOpenQuickAction}
          />
        );
      case 'inventory':
      case 'products':
        return <InventoryView onOpenQuickAction={handleOpenQuickAction} />;
      case 'purchases':
        return <PurchasesView />;
      case 'sales':
        return <SalesPOSView />;
      case 'finance':
        return <FinancialsView onOpenQuickAction={handleOpenQuickAction} />;
      case 'expiry':
        return <ExpiryBatchView />;
      case 'alerts':
        return (
          <AlertsView
            onNavigate={setActiveTab}
            onOpenQuickAction={handleOpenQuickAction}
          />
        );
      case 'stock-movements':
        return <StockMovementsView />;
      case 'suppliers':
        return <SuppliersView onOpenQuickAction={handleOpenQuickAction} />;
      case 'returns-damaged':
        return <ReturnsDamagedView />;
      case 'staff':
        return <StaffView />;
      case 'reports':
        return <ReportsView />;
      case 'activity':
        return <AuditTrailView />;
      case 'settings':
        return <SettingsView />;
      default:
        return (
          <DashboardView
            onNavigate={setActiveTab}
            onOpenQuickAction={handleOpenQuickAction}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-100 text-slate-900 font-sans antialiased overflow-hidden">
      {/* PERSISTENT CLINICAL SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenQuickAction={handleOpenQuickAction}
      />

      {/* MAIN VIEWPORT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOP HEADER */}
        <Header
          currentTab={activeTab}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={setActiveTab}
          onOpenQuickAction={handleOpenQuickAction}
        />

        {/* SCROLLABLE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <div className="max-w-7xl mx-auto">{renderActiveView()}</div>
        </main>
      </div>

      {/* GLOBAL QUICK ACTION MODAL */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        initialAction={quickActionType}
        onNavigate={setActiveTab}
      />
    </div>
  );
};

export default function App() {
  return (
    <PharmacyProvider>
      <MainLayout />
    </PharmacyProvider>
  );
}
