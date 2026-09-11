import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../context/PharmacyContext';
import { TablePagination } from '../components/TablePagination';
import {
  FileText,
  Printer,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  Clock,
  DollarSign,
  AlertTriangle,
  ArrowDownToLine,
  CheckCircle2,
  Search,
  RotateCcw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Building2,
  Users,
  ShieldCheck,
  ShoppingBag,
  CreditCard,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ReportCategory, ReportType, PaymentMethod, StockMovementType } from '../types/pharmacy';

export const ReportsView: React.FC = () => {
  const {
    products,
    sales,
    purchases,
    suppliers,
    staff,
    cashTransactions,
    stockMovements,
    dashboardMetrics,
    getDaysUntilExpiry,
    getProductStockStatus,
    settings,
    formatCurrency,
  } = usePharmacy();

  // Active Category & Report Selection
  const [activeCategory, setActiveCategory] = useState<ReportCategory>('INVENTORY');
  const [activeReport, setActiveReport] = useState<ReportType>('CURRENT_STOCK');

  // Unified Filter States
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'LAST_30' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Sorting & Pagination State
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  // Distinct Categories from products
  const productCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Handle category tab change
  const handleCategoryChange = (cat: ReportCategory) => {
    setActiveCategory(cat);
    setCurrentPage(1);
    // Set default report for category
    if (cat === 'INVENTORY') setActiveReport('CURRENT_STOCK');
    else if (cat === 'SALES') setActiveReport('DAILY_SALES');
    else if (cat === 'PURCHASES') setActiveReport('PURCHASES');
    else if (cat === 'FINANCIAL') setActiveReport('REVENUE');
  };

  // Reset Filters
  const handleResetFilters = () => {
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedProductId('ALL');
    setSelectedCategory('ALL');
    setSelectedStaffId('ALL');
    setSelectedSupplierId('ALL');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Date Filter Range Evaluator
  const isDateInRange = (dateStr?: string) => {
    if (!dateStr || datePreset === 'ALL') return true;
    const itemDate = new Date(dateStr.slice(0, 10));
    if (isNaN(itemDate.getTime())) return true;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (datePreset === 'TODAY') {
      return itemDate.getTime() === today.getTime();
    } else if (datePreset === 'THIS_WEEK') {
      const dayOfWeek = today.getDay(); // 0 is Sunday
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      return itemDate >= startOfWeek && itemDate <= today;
    } else if (datePreset === 'THIS_MONTH') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return itemDate >= startOfMonth && itemDate <= today;
    } else if (datePreset === 'LAST_30') {
      const past30 = new Date(today);
      past30.setDate(today.getDate() - 30);
      return itemDate >= past30 && itemDate <= today;
    } else if (datePreset === 'CUSTOM') {
      if (customStartDate && new Date(dateStr.slice(0, 10)) < new Date(customStartDate)) return false;
      if (customEndDate && new Date(dateStr.slice(0, 10)) > new Date(customEndDate)) return false;
      return true;
    }
    return true;
  };

  // --- DATA COMPUTATION PER REPORT ---
  const reportData = useMemo(() => {
    let rows: any[] = [];

    // --- 1. INVENTORY REPORTS ---
    if (activeReport === 'CURRENT_STOCK') {
      rows = products
        .filter((p) => {
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
          if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              p.brandName.toLowerCase().includes(q) ||
              p.genericName.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((p) => ({
          id: p.id,
          name: p.brandName,
          generic: p.genericName,
          sku: p.sku,
          category: p.category,
          shelfLocation: p.shelfLocation || 'Main Store',
          currentStock: p.currentStock,
          reorderLevel: p.reorderLevel,
          status: getProductStockStatus(p),
          costPrice: p.costPrice,
          sellingPrice: p.sellingPrice,
        }));
    } else if (activeReport === 'STOCK_VALUATION') {
      rows = products
        .filter((p) => {
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
          if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              p.brandName.toLowerCase().includes(q) ||
              p.genericName.toLowerCase().includes(q) ||
              p.sku.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((p) => {
          const totalCostVal = p.currentStock * p.costPrice;
          const totalRetailVal = p.currentStock * p.sellingPrice;
          const potentialProfit = totalRetailVal - totalCostVal;
          const margin = totalRetailVal > 0 ? (potentialProfit / totalRetailVal) * 100 : 0;
          return {
            id: p.id,
            name: p.brandName,
            sku: p.sku,
            category: p.category,
            stock: p.currentStock,
            costPrice: p.costPrice,
            sellingPrice: p.sellingPrice,
            totalCostVal,
            totalRetailVal,
            potentialProfit,
            margin,
          };
        });
    } else if (activeReport === 'STOCK_MOVEMENT') {
      rows = stockMovements
        .filter((m) => {
          if (!isDateInRange(m.timestamp)) return false;
          if (selectedProductId !== 'ALL' && m.productId !== selectedProductId) return false;
          if (selectedStaffId !== 'ALL' && m.staffId !== selectedStaffId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              m.productName.toLowerCase().includes(q) ||
              m.referenceId.toLowerCase().includes(q) ||
              (m.reason || '').toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((m) => ({
          id: m.id,
          timestamp: m.timestamp,
          reference: m.referenceId,
          product: m.productName,
          type: m.movementType,
          quantityChange: m.quantityChange,
          balanceAfter: m.balanceAfter,
          staff: m.staffName,
          reason: m.reason || 'Standard transaction',
        }));
    } else if (activeReport === 'LOW_STOCK') {
      rows = products
        .filter((p) => p.currentStock <= p.reorderLevel && p.currentStock > 0)
        .filter((p) => {
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
          if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return p.brandName.toLowerCase().includes(q) || p.genericName.toLowerCase().includes(q);
          }
          return true;
        })
        .map((p) => {
          const supp = suppliers.find((s) => s.id === p.supplierId);
          return {
            id: p.id,
            name: p.brandName,
            generic: p.genericName,
            sku: p.sku,
            category: p.category,
            currentStock: p.currentStock,
            reorderLevel: p.reorderLevel,
            deficit: p.reorderLevel - p.currentStock + 10,
            supplier: supp?.name || 'General Supplier',
            status: 'LOW_STOCK',
          };
        });
    } else if (activeReport === 'OUT_OF_STOCK') {
      rows = products
        .filter((p) => p.currentStock === 0)
        .filter((p) => {
          if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
          if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return p.brandName.toLowerCase().includes(q) || p.genericName.toLowerCase().includes(q);
          }
          return true;
        })
        .map((p) => {
          const supp = suppliers.find((s) => s.id === p.supplierId);
          return {
            id: p.id,
            name: p.brandName,
            generic: p.genericName,
            sku: p.sku,
            category: p.category,
            supplier: supp?.name || 'General Supplier',
            shelfLocation: p.shelfLocation || 'Not Assigned',
            reorderLevel: p.reorderLevel,
            status: 'OUT_OF_STOCK',
          };
        });
    } else if (activeReport === 'EXPIRY_REPORT') {
      const batchRows: any[] = [];
      products.forEach((p) => {
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
        if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return;
        (p.batches || []).forEach((b) => {
          const days = getDaysUntilExpiry(b.expiryDate);
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            if (
              !p.brandName.toLowerCase().includes(q) &&
              !b.batchNumber.toLowerCase().includes(q)
            ) {
              return;
            }
          }
          batchRows.push({
            id: b.id,
            productId: p.id,
            productName: p.brandName,
            genericName: p.genericName,
            batchNumber: b.batchNumber,
            expiryDate: b.expiryDate,
            daysRemaining: days,
            quantity: b.quantity,
            costPrice: b.costPrice,
            totalBatchValue: b.quantity * b.costPrice,
            status: days <= 0 ? 'EXPIRED' : days <= (settings.nearExpiryWarningDays || 60) ? 'EXPIRING_SOON' : 'VALID',
          });
        });
      });
      rows = batchRows;
    } else if (activeReport === 'EXPIRED_STOCK') {
      const expiredBatches: any[] = [];
      products.forEach((p) => {
        if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return;
        if (selectedProductId !== 'ALL' && p.id !== selectedProductId) return;
        (p.batches || []).forEach((b) => {
          const days = getDaysUntilExpiry(b.expiryDate);
          if (days <= 0) {
            if (searchTerm) {
              const q = searchTerm.toLowerCase();
              if (
                !p.brandName.toLowerCase().includes(q) &&
                !b.batchNumber.toLowerCase().includes(q)
              ) {
                return;
              }
            }
            expiredBatches.push({
              id: b.id,
              productName: p.brandName,
              genericName: p.genericName,
              batchNumber: b.batchNumber,
              expiryDate: b.expiryDate,
              daysOverdue: Math.abs(days),
              quantity: b.quantity,
              lossValue: b.quantity * b.costPrice,
              shelfLocation: p.shelfLocation || 'Quarantine',
              actionRequired: 'Quarantine & Dispose',
            });
          }
        });
      });
      rows = expiredBatches;
    } else if (activeReport === 'DAMAGED_STOCK') {
      rows = stockMovements
        .filter((m) => m.movementType === 'DAMAGE' || m.movementType === 'EXPIRY_DISPOSAL')
        .filter((m) => {
          if (!isDateInRange(m.timestamp)) return false;
          if (selectedProductId !== 'ALL' && m.productId !== selectedProductId) return false;
          if (selectedStaffId !== 'ALL' && m.staffId !== selectedStaffId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              m.productName.toLowerCase().includes(q) ||
              (m.reason || '').toLowerCase().includes(q) ||
              m.referenceId.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((m) => {
          const prod = products.find((p) => p.id === m.productId);
          const unitCost = prod ? prod.costPrice : 0;
          const lossValue = Math.abs(m.quantityChange) * unitCost;
          return {
            id: m.id,
            timestamp: m.timestamp,
            reference: m.referenceId,
            productName: m.productName,
            type: m.movementType,
            quantity: Math.abs(m.quantityChange),
            unitCost,
            lossValue,
            staffName: m.staffName,
            reason: m.reason || 'Damaged / Disposed during audit',
          };
        });
    }

    // --- 2. SALES REPORTS ---
    else if (activeReport === 'DAILY_SALES') {
      // Group sales by day
      const dayMap: Record<
        string,
        {
          date: string;
          transactionsCount: number;
          unitsSold: number;
          cashAmount: number;
          transferAmount: number;
          posAmount: number;
          totalRevenue: number;
        }
      > = {};

      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const d = s.date;
        if (!dayMap[d]) {
          dayMap[d] = {
            date: d,
            transactionsCount: 0,
            unitsSold: 0,
            cashAmount: 0,
            transferAmount: 0,
            posAmount: 0,
            totalRevenue: 0,
          };
        }
        dayMap[d].transactionsCount += 1;
        dayMap[d].unitsSold += s.items.reduce((acc, i) => acc + i.quantity, 0);
        dayMap[d].totalRevenue += s.totalAmount;

        if (s.paymentMethod === 'CASH') dayMap[d].cashAmount += s.totalAmount;
        else if (s.paymentMethod === 'BANK_TRANSFER') dayMap[d].transferAmount += s.totalAmount;
        else if (s.paymentMethod === 'POS_CARD') dayMap[d].posAmount += s.totalAmount;
        else {
          dayMap[d].cashAmount += s.totalAmount * 0.5;
          dayMap[d].transferAmount += s.totalAmount * 0.5;
        }
      });

      rows = Object.values(dayMap)
        .filter((r) => {
          if (searchTerm) return r.date.includes(searchTerm);
          return true;
        })
        .map((r) => ({
          ...r,
          averageOrderValue: r.transactionsCount > 0 ? r.totalRevenue / r.transactionsCount : 0,
        }));
    } else if (activeReport === 'WEEKLY_SALES') {
      // Group by calendar week
      const weekMap: Record<string, { week: string; count: number; units: number; revenue: number; cogs: number }> = {};
      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const d = new Date(s.date);
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        const pastDaysOfYear = (d.getTime() - startOfYear.getTime()) / 86400000;
        const weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        const key = `${d.getFullYear()}-W${weekNum < 10 ? '0' + weekNum : weekNum}`;

        if (!weekMap[key]) {
          weekMap[key] = { week: key, count: 0, units: 0, revenue: 0, cogs: 0 };
        }
        weekMap[key].count += 1;
        const units = s.items.reduce((acc, i) => acc + i.quantity, 0);
        weekMap[key].units += units;
        weekMap[key].revenue += s.totalAmount;

        let saleCogs = 0;
        s.items.forEach((it) => {
          const p = products.find((pr) => pr.id === it.productId);
          saleCogs += it.quantity * (p ? p.costPrice : it.unitPrice * 0.6);
        });
        weekMap[key].cogs += saleCogs;
      });

      rows = Object.values(weekMap).map((w) => {
        const grossProfit = w.revenue - w.cogs;
        const margin = w.revenue > 0 ? (grossProfit / w.revenue) * 100 : 0;
        return {
          id: w.week,
          week: w.week,
          orders: w.count,
          units: w.units,
          revenue: w.revenue,
          cogs: w.cogs,
          grossProfit,
          margin,
        };
      });
    } else if (activeReport === 'MONTHLY_SALES') {
      const monthMap: Record<string, { month: string; orders: number; units: number; revenue: number }> = {};
      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const mKey = s.date.slice(0, 7); // YYYY-MM
        if (!monthMap[mKey]) {
          monthMap[mKey] = { month: mKey, orders: 0, units: 0, revenue: 0 };
        }
        monthMap[mKey].orders += 1;
        monthMap[mKey].units += s.items.reduce((acc, i) => acc + i.quantity, 0);
        monthMap[mKey].revenue += s.totalAmount;
      });

      rows = Object.values(monthMap).map((m) => ({
        id: m.month,
        month: m.month,
        orders: m.orders,
        units: m.units,
        revenue: m.revenue,
        avgDailyRevenue: m.revenue / 30,
      }));
    } else if (activeReport === 'PRODUCT_SALES') {
      const prodSalesMap: Record<
        string,
        { productId: string; name: string; category: string; unitsSold: number; revenue: number; cogs: number }
      > = {};

      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        s.items.forEach((item) => {
          if (selectedProductId !== 'ALL' && item.productId !== selectedProductId) return;

          const p = products.find((pr) => pr.id === item.productId);
          if (selectedCategory !== 'ALL' && p && p.category !== selectedCategory) return;

          if (!prodSalesMap[item.productId]) {
            prodSalesMap[item.productId] = {
              productId: item.productId,
              name: item.brandName,
              category: p?.category || 'General',
              unitsSold: 0,
              revenue: 0,
              cogs: 0,
            };
          }
          const itemCost = p ? p.costPrice : item.unitPrice * 0.6;
          prodSalesMap[item.productId].unitsSold += item.quantity;
          prodSalesMap[item.productId].revenue += item.totalPrice;
          prodSalesMap[item.productId].cogs += item.quantity * itemCost;
        });
      });

      rows = Object.values(prodSalesMap)
        .filter((r) => {
          if (searchTerm) return r.name.toLowerCase().includes(searchTerm.toLowerCase());
          return true;
        })
        .map((r) => {
          const profit = r.revenue - r.cogs;
          const margin = r.revenue > 0 ? (profit / r.revenue) * 100 : 0;
          return {
            id: r.productId,
            name: r.name,
            category: r.category,
            unitsSold: r.unitsSold,
            revenue: r.revenue,
            cogs: r.cogs,
            grossProfit: profit,
            margin,
          };
        });
    } else if (activeReport === 'STAFF_SALES') {
      const staffMap: Record<
        string,
        { staffId: string; staffName: string; role: string; count: number; units: number; revenue: number }
      > = {};

      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const st = staff.find((m) => m.id === s.cashierId);
        const name = s.cashierName || st?.name || 'Staff';

        if (!staffMap[s.cashierId]) {
          staffMap[s.cashierId] = {
            staffId: s.cashierId,
            staffName: name,
            role: st?.role || 'CASHIER',
            count: 0,
            units: 0,
            revenue: 0,
          };
        }
        staffMap[s.cashierId].count += 1;
        staffMap[s.cashierId].units += s.items.reduce((acc, i) => acc + i.quantity, 0);
        staffMap[s.cashierId].revenue += s.totalAmount;
      });

      rows = Object.values(staffMap).map((r) => ({
        id: r.staffId,
        staffName: r.staffName,
        role: r.role,
        transactionsCount: r.count,
        unitsSold: r.units,
        totalRevenue: r.revenue,
        avgTicket: r.count > 0 ? r.revenue / r.count : 0,
      }));
    } else if (activeReport === 'PAYMENT_METHOD_SUMMARY') {
      const methodMap: Record<string, { method: string; count: number; totalAmount: number }> = {
        CASH: { method: 'CASH', count: 0, totalAmount: 0 },
        BANK_TRANSFER: { method: 'BANK_TRANSFER', count: 0, totalAmount: 0 },
        POS_CARD: { method: 'POS_CARD', count: 0, totalAmount: 0 },
        SPLIT: { method: 'SPLIT', count: 0, totalAmount: 0 },
        CREDIT: { method: 'CREDIT', count: 0, totalAmount: 0 },
      };

      let grandTotal = 0;
      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const m = s.paymentMethod || 'CASH';
        if (!methodMap[m]) {
          methodMap[m] = { method: m, count: 0, totalAmount: 0 };
        }
        methodMap[m].count += 1;
        methodMap[m].totalAmount += s.totalAmount;
        grandTotal += s.totalAmount;
      });

      rows = Object.values(methodMap)
        .filter((r) => r.count > 0 || r.totalAmount > 0)
        .map((r) => ({
          id: r.method,
          method: r.method.replace(/_/g, ' '),
          count: r.count,
          totalAmount: r.totalAmount,
          percentage: grandTotal > 0 ? (r.totalAmount / grandTotal) * 100 : 0,
        }));
    }

    // --- 3. PURCHASE REPORTS ---
    else if (activeReport === 'PURCHASES') {
      rows = purchases
        .filter((p) => {
          if (!isDateInRange(p.orderDate)) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              p.invoiceNumber.toLowerCase().includes(q) ||
              p.supplierName.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((p) => ({
          id: p.id,
          invoiceNumber: p.invoiceNumber,
          date: p.orderDate,
          supplier: p.supplierName,
          itemsCount: p.items.length,
          totalAmount: p.totalAmount,
          amountPaid: p.amountPaid,
          balance: p.balance,
          paymentStatus: p.paymentStatus,
        }));
    } else if (activeReport === 'SUPPLIER_PURCHASES') {
      const suppMap: Record<
        string,
        { supplierId: string; name: string; contact: string; invoicesCount: number; totalPurchased: number; totalPaid: number; balance: number }
      > = {};

      suppliers.forEach((s) => {
        suppMap[s.id] = {
          supplierId: s.id,
          name: s.name,
          contact: s.contactPerson || s.phone,
          invoicesCount: 0,
          totalPurchased: 0,
          totalPaid: 0,
          balance: s.outstandingBalance || 0,
        };
      });

      purchases.forEach((p) => {
        if (!isDateInRange(p.orderDate)) return;
        if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return;

        if (!suppMap[p.supplierId]) {
          suppMap[p.supplierId] = {
            supplierId: p.supplierId,
            name: p.supplierName,
            contact: 'N/A',
            invoicesCount: 0,
            totalPurchased: 0,
            totalPaid: 0,
            balance: 0,
          };
        }
        suppMap[p.supplierId].invoicesCount += 1;
        suppMap[p.supplierId].totalPurchased += p.totalAmount;
        suppMap[p.supplierId].totalPaid += p.amountPaid;
      });

      rows = Object.values(suppMap)
        .filter((s) => {
          if (selectedSupplierId !== 'ALL' && s.supplierId !== selectedSupplierId) return false;
          if (searchTerm) return s.name.toLowerCase().includes(searchTerm.toLowerCase());
          return true;
        })
        .map((s) => ({
          id: s.supplierId,
          supplierName: s.name,
          contact: s.contact,
          invoicesCount: s.invoicesCount,
          totalPurchased: s.totalPurchased,
          totalPaid: s.totalPaid,
          outstandingBalance: s.balance,
        }));
    } else if (activeReport === 'OUTSTANDING_SUPPLIER_PAYMENTS') {
      rows = purchases
        .filter((p) => p.balance > 0)
        .filter((p) => {
          if (!isDateInRange(p.orderDate)) return false;
          if (selectedSupplierId !== 'ALL' && p.supplierId !== selectedSupplierId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              p.supplierName.toLowerCase().includes(q) ||
              p.invoiceNumber.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((p) => {
          const supp = suppliers.find((s) => s.id === p.supplierId);
          return {
            id: p.id,
            invoiceNumber: p.invoiceNumber,
            date: p.orderDate,
            supplier: p.supplierName,
            paymentTerms: supp?.paymentTerms || 'Net 30 Days',
            totalAmount: p.totalAmount,
            amountPaid: p.amountPaid,
            outstandingBalance: p.balance,
            paymentStatus: p.paymentStatus,
          };
        });
    }

    // --- 4. FINANCIAL REPORTS ---
    else if (activeReport === 'REVENUE') {
      // Inflow cash transactions + sales
      rows = cashTransactions
        .filter((tx) => tx.type === 'CASH_IN')
        .filter((tx) => {
          if (!isDateInRange(tx.date)) return false;
          if (selectedStaffId !== 'ALL' && tx.staffId !== selectedStaffId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              tx.description.toLowerCase().includes(q) ||
              tx.referenceId.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((tx) => ({
          id: tx.id,
          timestamp: tx.timestamp,
          reference: tx.referenceId,
          category: tx.category.replace(/_/g, ' '),
          description: tx.description,
          staffName: tx.staffName,
          amount: tx.amount,
        }));
    } else if (activeReport === 'EXPENSES') {
      rows = cashTransactions
        .filter((tx) => tx.type === 'CASH_OUT')
        .filter((tx) => {
          if (!isDateInRange(tx.date)) return false;
          if (selectedStaffId !== 'ALL' && tx.staffId !== selectedStaffId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              tx.description.toLowerCase().includes(q) ||
              tx.referenceId.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((tx) => ({
          id: tx.id,
          timestamp: tx.timestamp,
          reference: tx.referenceId,
          category: tx.category.replace(/_/g, ' '),
          description: tx.description,
          staffName: tx.staffName,
          amount: tx.amount,
        }));
    } else if (activeReport === 'CASH_FLOW') {
      rows = cashTransactions
        .filter((tx) => {
          if (!isDateInRange(tx.date)) return false;
          if (selectedStaffId !== 'ALL' && tx.staffId !== selectedStaffId) return false;
          if (searchTerm) {
            const q = searchTerm.toLowerCase();
            return (
              tx.description.toLowerCase().includes(q) ||
              tx.referenceId.toLowerCase().includes(q)
            );
          }
          return true;
        })
        .map((tx) => ({
          id: tx.id,
          timestamp: tx.timestamp,
          reference: tx.referenceId,
          type: tx.type,
          category: tx.category.replace(/_/g, ' '),
          description: tx.description,
          staffName: tx.staffName,
          inflowAmount: tx.type === 'CASH_IN' ? tx.amount : 0,
          outflowAmount: tx.type === 'CASH_OUT' ? tx.amount : 0,
          netDelta: tx.type === 'CASH_IN' ? tx.amount : -tx.amount,
        }));
    } else if (activeReport === 'GROSS_PROFIT') {
      // Group sales by date with profit computation
      const dayProfitMap: Record<
        string,
        { date: string; orders: number; revenue: number; cogs: number }
      > = {};

      sales.forEach((s) => {
        if (!isDateInRange(s.date)) return;
        if (selectedStaffId !== 'ALL' && s.cashierId !== selectedStaffId) return;

        const d = s.date;
        if (!dayProfitMap[d]) {
          dayProfitMap[d] = { date: d, orders: 0, revenue: 0, cogs: 0 };
        }
        dayProfitMap[d].orders += 1;
        dayProfitMap[d].revenue += s.totalAmount;

        let saleCost = 0;
        s.items.forEach((item) => {
          const p = products.find((prod) => prod.id === item.productId);
          saleCost += item.quantity * (p ? p.costPrice : item.unitPrice * 0.6);
        });
        dayProfitMap[d].cogs += saleCost;
      });

      rows = Object.values(dayProfitMap).map((d) => {
        const grossProfit = d.revenue - d.cogs;
        const margin = d.revenue > 0 ? (grossProfit / d.revenue) * 100 : 0;
        return {
          id: d.date,
          date: d.date,
          orders: d.orders,
          revenue: d.revenue,
          cogs: d.cogs,
          grossProfit,
          margin,
        };
      });
    } else if (activeReport === 'NET_MOVEMENT') {
      // Monthly or periodic cash delta
      const periodMap: Record<string, { period: string; inflow: number; outflow: number }> = {};
      cashTransactions.forEach((tx) => {
        if (!isDateInRange(tx.date)) return;
        const pKey = tx.date.slice(0, 7); // YYYY-MM
        if (!periodMap[pKey]) {
          periodMap[pKey] = { period: pKey, inflow: 0, outflow: 0 };
        }
        if (tx.type === 'CASH_IN') periodMap[pKey].inflow += tx.amount;
        else periodMap[pKey].outflow += tx.amount;
      });

      rows = Object.values(periodMap).map((p) => {
        const netMovement = p.inflow - p.outflow;
        return {
          id: p.period,
          period: p.period,
          inflow: p.inflow,
          outflow: p.outflow,
          netMovement,
          status: netMovement >= 0 ? 'SURPLUS' : 'DEFICIT',
        };
      });
    }

    return rows;
  }, [
    activeReport,
    products,
    sales,
    purchases,
    suppliers,
    staff,
    cashTransactions,
    stockMovements,
    datePreset,
    customStartDate,
    customEndDate,
    selectedCategory,
    selectedProductId,
    selectedStaffId,
    selectedSupplierId,
    searchTerm,
    getDaysUntilExpiry,
    getProductStockStatus,
    settings.nearExpiryWarningDays,
  ]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sortField) return reportData;
    const sorted = [...reportData].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toString().toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number') {
        return sortDirection === 'asc' ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
      }
      return 0;
    });
    return sorted;
  }, [reportData, sortField, sortDirection]);

  // Pagination slice
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Toggle Column Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).filter((k) => k !== 'id');
    let csv = headers.join(',') + '\n';

    reportData.forEach((row) => {
      const line = headers
        .map((h) => {
          let val = row[h];
          if (val === undefined || val === null) return '""';
          if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
          return val;
        })
        .join(',');
      csv += line + '\n';
    });

    const filename = `pharmapulse_${activeReport.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice(`Exported ${filename} (${reportData.length} records)`);
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  // PDF Print Trigger
  const handlePrintPDF = () => {
    window.print();
  };

  // Report Title Dictionary
  const reportTitles: Record<ReportType, { title: string; subtitle: string }> = {
    CURRENT_STOCK: {
      title: 'Current Stock Inventory Report',
      subtitle: 'Comprehensive audit of on-hand dispensary inventory and stock health status',
    },
    STOCK_VALUATION: {
      title: 'Stock Valuation & Margin Analysis',
      subtitle: 'Inventory valuation at cost vs retail with unrealized gross margins',
    },
    STOCK_MOVEMENT: {
      title: 'Stock Movement Ledger & Audit Trail',
      subtitle: 'Complete chronological history of inbound, outbound, and dispensing movements',
    },
    LOW_STOCK: {
      title: 'Low Stock Deficit Report',
      subtitle: 'Inventory units approaching critical reorder thresholds requiring procurement',
    },
    OUT_OF_STOCK: {
      title: 'Out of Stock & Depletion Report',
      subtitle: 'Zero-balance inventory items requiring immediate supplier purchase orders',
    },
    EXPIRY_REPORT: {
      title: 'Comprehensive Batch Expiry Audit',
      subtitle: 'Batch-by-batch shelf life analysis and clinical risk categorization',
    },
    EXPIRED_STOCK: {
      title: 'Expired Stock Quarantine Report',
      subtitle: 'Expired medications requiring regulatory disposal and cost write-off',
    },
    DAMAGED_STOCK: {
      title: 'Damaged & Written-Off Stock Report',
      subtitle: 'Loss analysis from breakages, clinical contamination, and audits',
    },
    DAILY_SALES: {
      title: 'Daily Sales Performance Summary',
      subtitle: 'Day-by-day revenue breakdown, transaction volumes, and payment methods',
    },
    WEEKLY_SALES: {
      title: 'Weekly Sales Revenue & Margin Report',
      subtitle: 'Weekly turnover, volume pacing, and gross profitability metrics',
    },
    MONTHLY_SALES: {
      title: 'Monthly Sales Volume & Run-Rate',
      subtitle: 'Month-on-month pharmacy dispensing revenue and average daily takings',
    },
    PRODUCT_SALES: {
      title: 'Product Sales & Velocity Ranking',
      subtitle: 'Revenue generation, unit volume, and profitability per medication SKU',
    },
    STAFF_SALES: {
      title: 'Staff Sales & Cashier Performance',
      subtitle: 'Individual operator sales transactions, revenue, and average ticket size',
    },
    PAYMENT_METHOD_SUMMARY: {
      title: 'Payment Method Breakdown Report',
      subtitle: 'Proportions of Cash, Bank Transfers, and POS Card collections',
    },
    PURCHASES: {
      title: 'Supplier Purchases & Invoice Register',
      subtitle: 'Inbound purchase orders, supplier bills, and payment clearance status',
    },
    SUPPLIER_PURCHASES: {
      title: 'Supplier Purchases & Vendor Performance',
      subtitle: 'Cumulative order totals, invoices fulfilled, and outstanding creditor dues',
    },
    OUTSTANDING_SUPPLIER_PAYMENTS: {
      title: 'Outstanding Supplier Payables Ledger',
      subtitle: 'Pending invoices with supplier credit terms and payable schedules',
    },
    REVENUE: {
      title: 'Cash Inflow & Revenue Ledger',
      subtitle: 'Itemized receipts, patient payments, and income transactions',
    },
    EXPENSES: {
      title: 'Operational Expenses Ledger',
      subtitle: 'Disbursements for rent, logistics, utility, salaries, and store supplies',
    },
    CASH_FLOW: {
      title: 'Comprehensive Cash Flow Statement',
      subtitle: 'Chronological timeline of all cash receipts and operational expenditures',
    },
    GROSS_PROFIT: {
      title: 'Gross Profit & Cost of Goods Sold (COGS)',
      subtitle: 'Gross margins derived from dispensing revenue minus medication acquisition costs',
    },
    NET_MOVEMENT: {
      title: 'Net Cash Movement & Treasury Balance',
      subtitle: 'Net treasury delta comparing periodic inflows against operational outflows',
    },
  };

  const currentMeta = reportTitles[activeReport];

  // Helper sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-emerald-600 ml-1 inline" />
    ) : (
      <ChevronDown className="w-3 h-3 text-emerald-600 ml-1 inline" />
    );
  };

  return (
    <div className="space-y-5">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXPORT ACTIONS */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                <BarChart3 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Pharmacy Operational Intelligence &amp; Reports
                </h3>
                <p className="text-xs text-slate-500">
                  Audit-grade clinical, inventory, and financial reporting complying with Nigerian standards
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Print official report / Save as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export PDF / Print</span>
            </button>

            <button
              id="report-export-csv-btn"
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
              title="Download CSV for Excel analysis"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Export CSV Data</span>
            </button>
          </div>
        </div>

        {downloadNotice && (
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 animate-in fade-in-50">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{downloadNotice}</span>
          </div>
        )}

        {/* Category Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          {(
            [
              {
                key: 'INVENTORY',
                label: 'Inventory Reports',
                icon: Package,
                count: '8 Reports',
              },
              {
                key: 'SALES',
                label: 'Sales & Dispensing',
                icon: TrendingUp,
                count: '6 Reports',
              },
              {
                key: 'PURCHASES',
                label: 'Purchase & Suppliers',
                icon: ShoppingBag,
                count: '3 Reports',
              },
              {
                key: 'FINANCIAL',
                label: 'Financial & P&L',
                icon: DollarSign,
                count: '5 Reports',
              },
            ] as const
          ).map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => handleCategoryChange(cat.key)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-2xs ring-1 ring-emerald-400'
                    : 'bg-slate-50/70 border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-emerald-200/70 text-emerald-900' : 'bg-slate-200/60 text-slate-500'
                    }`}
                  >
                    {cat.count}
                  </span>
                </div>
                <div className="text-xs font-bold truncate">{cat.label}</div>
              </button>
            );
          })}
        </div>

        {/* Sub-Report Pills */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {activeCategory === 'INVENTORY' && (
              <>
                <ReportPill
                  active={activeReport === 'CURRENT_STOCK'}
                  onClick={() => setActiveReport('CURRENT_STOCK')}
                  label="Current Stock"
                />
                <ReportPill
                  active={activeReport === 'STOCK_VALUATION'}
                  onClick={() => setActiveReport('STOCK_VALUATION')}
                  label="Stock Valuation"
                />
                <ReportPill
                  active={activeReport === 'STOCK_MOVEMENT'}
                  onClick={() => setActiveReport('STOCK_MOVEMENT')}
                  label="Stock Movement"
                />
                <ReportPill
                  active={activeReport === 'LOW_STOCK'}
                  onClick={() => setActiveReport('LOW_STOCK')}
                  label="Low Stock"
                />
                <ReportPill
                  active={activeReport === 'OUT_OF_STOCK'}
                  onClick={() => setActiveReport('OUT_OF_STOCK')}
                  label="Out of Stock"
                />
                <ReportPill
                  active={activeReport === 'EXPIRY_REPORT'}
                  onClick={() => setActiveReport('EXPIRY_REPORT')}
                  label="Expiry Report"
                />
                <ReportPill
                  active={activeReport === 'EXPIRED_STOCK'}
                  onClick={() => setActiveReport('EXPIRED_STOCK')}
                  label="Expired Stock"
                />
                <ReportPill
                  active={activeReport === 'DAMAGED_STOCK'}
                  onClick={() => setActiveReport('DAMAGED_STOCK')}
                  label="Damaged Stock"
                />
              </>
            )}

            {activeCategory === 'SALES' && (
              <>
                <ReportPill
                  active={activeReport === 'DAILY_SALES'}
                  onClick={() => setActiveReport('DAILY_SALES')}
                  label="Daily Sales"
                />
                <ReportPill
                  active={activeReport === 'WEEKLY_SALES'}
                  onClick={() => setActiveReport('WEEKLY_SALES')}
                  label="Weekly Sales"
                />
                <ReportPill
                  active={activeReport === 'MONTHLY_SALES'}
                  onClick={() => setActiveReport('MONTHLY_SALES')}
                  label="Monthly Sales"
                />
                <ReportPill
                  active={activeReport === 'PRODUCT_SALES'}
                  onClick={() => setActiveReport('PRODUCT_SALES')}
                  label="Product Sales"
                />
                <ReportPill
                  active={activeReport === 'STAFF_SALES'}
                  onClick={() => setActiveReport('STAFF_SALES')}
                  label="Staff Sales"
                />
                <ReportPill
                  active={activeReport === 'PAYMENT_METHOD_SUMMARY'}
                  onClick={() => setActiveReport('PAYMENT_METHOD_SUMMARY')}
                  label="Payment Summary"
                />
              </>
            )}

            {activeCategory === 'PURCHASES' && (
              <>
                <ReportPill
                  active={activeReport === 'PURCHASES'}
                  onClick={() => setActiveReport('PURCHASES')}
                  label="Purchases"
                />
                <ReportPill
                  active={activeReport === 'SUPPLIER_PURCHASES'}
                  onClick={() => setActiveReport('SUPPLIER_PURCHASES')}
                  label="Supplier Purchases"
                />
                <ReportPill
                  active={activeReport === 'OUTSTANDING_SUPPLIER_PAYMENTS'}
                  onClick={() => setActiveReport('OUTSTANDING_SUPPLIER_PAYMENTS')}
                  label="Outstanding Payments"
                />
              </>
            )}

            {activeCategory === 'FINANCIAL' && (
              <>
                <ReportPill
                  active={activeReport === 'REVENUE'}
                  onClick={() => setActiveReport('REVENUE')}
                  label="Revenue"
                />
                <ReportPill
                  active={activeReport === 'EXPENSES'}
                  onClick={() => setActiveReport('EXPENSES')}
                  label="Expenses"
                />
                <ReportPill
                  active={activeReport === 'CASH_FLOW'}
                  onClick={() => setActiveReport('CASH_FLOW')}
                  label="Cash Flow"
                />
                <ReportPill
                  active={activeReport === 'GROSS_PROFIT'}
                  onClick={() => setActiveReport('GROSS_PROFIT')}
                  label="Gross Profit"
                />
                <ReportPill
                  active={activeReport === 'NET_MOVEMENT'}
                  onClick={() => setActiveReport('NET_MOVEMENT')}
                  label="Net Movement"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED FILTERING BAR */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Multi-Parameter Filters</span>
          </div>

          <button
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 text-xs">
          {/* Date Presets */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Date Period
            </label>
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="THIS_WEEK">This Week</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_30">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Product
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Products ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.brandName}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Categories ({productCategories.length})</option>
              {productCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Staff / Cashier
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Staff ({staff.length})</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.role})
                </option>
              ))}
            </select>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Supplier
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 truncate"
            >
              <option value="ALL">All Suppliers ({suppliers.length})</option>
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Table */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Search Table
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type to filter..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker when active */}
        {datePreset === 'CUSTOM' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-slate-600">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <span className="font-semibold text-slate-600">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. REPORT DATA TABLE & PRINTABLE VIEW */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Printable Official Letterhead Header (visible on print, clean layout) */}
        <div className="p-6 border-b border-slate-200/80 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold tracking-wider text-emerald-800 uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{settings.pharmacyName || 'PHARMAPULSE PHARMACY LTD'}</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-1">{currentMeta.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">{currentMeta.subtitle}</p>
            </div>

            <div className="text-right text-xs text-slate-500">
              <div>
                Generated:{' '}
                <span className="font-semibold text-slate-800">
                  {new Date().toLocaleDateString('en-NG', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}{' '}
                  {new Date().toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Total Records: <span className="font-bold text-slate-700">{reportData.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* The Active Table */}
        <div className="overflow-x-auto">
          {paginatedRows.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <Package className="w-8 h-8 text-slate-300" />
              <p className="font-semibold text-slate-700">No records found matching current parameters</p>
              <p className="text-slate-400">Try adjusting your date range, product, category, or search keywords.</p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {/* Dynamic Columns based on Report */}
                  {activeReport === 'CURRENT_STOCK' && (
                    <>
                      <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('name')}
                      </th>
                      <th onClick={() => handleSort('sku')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        SKU {renderSortIcon('sku')}
                      </th>
                      <th onClick={() => handleSort('category')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Category {renderSortIcon('category')}
                      </th>
                      <th onClick={() => handleSort('currentStock')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Current Stock {renderSortIcon('currentStock')}
                      </th>
                      <th onClick={() => handleSort('reorderLevel')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Reorder Level {renderSortIcon('reorderLevel')}
                      </th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}

                  {activeReport === 'STOCK_VALUATION' && (
                    <>
                      <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('name')}
                      </th>
                      <th onClick={() => handleSort('category')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Category {renderSortIcon('category')}
                      </th>
                      <th onClick={() => handleSort('stock')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Stock {renderSortIcon('stock')}
                      </th>
                      <th onClick={() => handleSort('costPrice')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Cost Price {renderSortIcon('costPrice')}
                      </th>
                      <th onClick={() => handleSort('sellingPrice')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Selling Price {renderSortIcon('sellingPrice')}
                      </th>
                      <th onClick={() => handleSort('totalCostVal')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Cost Value {renderSortIcon('totalCostVal')}
                      </th>
                      <th onClick={() => handleSort('totalRetailVal')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Retail Value {renderSortIcon('totalRetailVal')}
                      </th>
                      <th onClick={() => handleSort('potentialProfit')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900">
                        Unrealized Profit {renderSortIcon('potentialProfit')}
                      </th>
                    </>
                  )}

                  {activeReport === 'STOCK_MOVEMENT' && (
                    <>
                      <th onClick={() => handleSort('timestamp')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Date &amp; Time {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-3 px-3">Reference</th>
                      <th onClick={() => handleSort('product')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Product {renderSortIcon('product')}
                      </th>
                      <th className="py-3 px-3">Type</th>
                      <th onClick={() => handleSort('quantityChange')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Quantity Change {renderSortIcon('quantityChange')}
                      </th>
                      <th className="py-3 px-3 text-center">Balance After</th>
                      <th className="py-3 px-3">Staff Operator</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                    </>
                  )}

                  {activeReport === 'LOW_STOCK' && (
                    <>
                      <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('name')}
                      </th>
                      <th className="py-3 px-3">Category</th>
                      <th onClick={() => handleSort('currentStock')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        In Stock {renderSortIcon('currentStock')}
                      </th>
                      <th className="py-3 px-3 text-center">Reorder Threshold</th>
                      <th onClick={() => handleSort('deficit')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Recommended Order {renderSortIcon('deficit')}
                      </th>
                      <th className="py-3 px-4">Primary Supplier</th>
                    </>
                  )}

                  {activeReport === 'OUT_OF_STOCK' && (
                    <>
                      <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('name')}
                      </th>
                      <th className="py-3 px-3">SKU</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Shelf</th>
                      <th className="py-3 px-3">Supplier</th>
                      <th className="py-3 px-4">Stock Status</th>
                    </>
                  )}

                  {activeReport === 'EXPIRY_REPORT' && (
                    <>
                      <th onClick={() => handleSort('productName')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('productName')}
                      </th>
                      <th className="py-3 px-3">Batch #</th>
                      <th onClick={() => handleSort('expiryDate')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Expiry Date {renderSortIcon('expiryDate')}
                      </th>
                      <th onClick={() => handleSort('daysRemaining')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Days Remaining {renderSortIcon('daysRemaining')}
                      </th>
                      <th onClick={() => handleSort('quantity')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units in Batch {renderSortIcon('quantity')}
                      </th>
                      <th onClick={() => handleSort('totalBatchValue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Batch Cost Value {renderSortIcon('totalBatchValue')}
                      </th>
                      <th className="py-3 px-4">Status</th>
                    </>
                  )}

                  {activeReport === 'EXPIRED_STOCK' && (
                    <>
                      <th onClick={() => handleSort('productName')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('productName')}
                      </th>
                      <th className="py-3 px-3">Batch Number</th>
                      <th onClick={() => handleSort('expiryDate')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Expired Date {renderSortIcon('expiryDate')}
                      </th>
                      <th onClick={() => handleSort('quantity')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Expired {renderSortIcon('quantity')}
                      </th>
                      <th onClick={() => handleSort('lossValue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Loss Value {renderSortIcon('lossValue')}
                      </th>
                      <th className="py-3 px-4">Action Protocol</th>
                    </>
                  )}

                  {activeReport === 'DAMAGED_STOCK' && (
                    <>
                      <th onClick={() => handleSort('timestamp')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Date &amp; Time {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-3 px-3">Reference</th>
                      <th onClick={() => handleSort('productName')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Product {renderSortIcon('productName')}
                      </th>
                      <th onClick={() => handleSort('quantity')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Quantity Lost {renderSortIcon('quantity')}
                      </th>
                      <th onClick={() => handleSort('lossValue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Estimated Loss {renderSortIcon('lossValue')}
                      </th>
                      <th className="py-3 px-3">Staff Operator</th>
                      <th className="py-3 px-4">Audit Reason</th>
                    </>
                  )}

                  {activeReport === 'DAILY_SALES' && (
                    <>
                      <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Date {renderSortIcon('date')}
                      </th>
                      <th onClick={() => handleSort('transactionsCount')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Receipts {renderSortIcon('transactionsCount')}
                      </th>
                      <th onClick={() => handleSort('unitsSold')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Sold {renderSortIcon('unitsSold')}
                      </th>
                      <th onClick={() => handleSort('cashAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Cash {renderSortIcon('cashAmount')}
                      </th>
                      <th onClick={() => handleSort('transferAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Bank Transfer {renderSortIcon('transferAmount')}
                      </th>
                      <th onClick={() => handleSort('posAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        POS Card {renderSortIcon('posAmount')}
                      </th>
                      <th onClick={() => handleSort('totalRevenue')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Total Revenue {renderSortIcon('totalRevenue')}
                      </th>
                    </>
                  )}

                  {activeReport === 'WEEKLY_SALES' && (
                    <>
                      <th onClick={() => handleSort('week')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Week Period {renderSortIcon('week')}
                      </th>
                      <th onClick={() => handleSort('orders')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Orders {renderSortIcon('orders')}
                      </th>
                      <th onClick={() => handleSort('units')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Sold {renderSortIcon('units')}
                      </th>
                      <th onClick={() => handleSort('revenue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Revenue {renderSortIcon('revenue')}
                      </th>
                      <th onClick={() => handleSort('cogs')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        COGS {renderSortIcon('cogs')}
                      </th>
                      <th onClick={() => handleSort('grossProfit')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Gross Profit {renderSortIcon('grossProfit')}
                      </th>
                    </>
                  )}

                  {activeReport === 'MONTHLY_SALES' && (
                    <>
                      <th onClick={() => handleSort('month')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Month {renderSortIcon('month')}
                      </th>
                      <th onClick={() => handleSort('orders')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Total Orders {renderSortIcon('orders')}
                      </th>
                      <th onClick={() => handleSort('units')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Dispensed {renderSortIcon('units')}
                      </th>
                      <th onClick={() => handleSort('revenue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Total Revenue {renderSortIcon('revenue')}
                      </th>
                      <th className="py-3 px-4 text-right">Avg Daily Revenue</th>
                    </>
                  )}

                  {activeReport === 'PRODUCT_SALES' && (
                    <>
                      <th onClick={() => handleSort('name')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Medication {renderSortIcon('name')}
                      </th>
                      <th className="py-3 px-3">Category</th>
                      <th onClick={() => handleSort('unitsSold')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Sold {renderSortIcon('unitsSold')}
                      </th>
                      <th onClick={() => handleSort('revenue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Revenue {renderSortIcon('revenue')}
                      </th>
                      <th onClick={() => handleSort('cogs')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Cost (COGS) {renderSortIcon('cogs')}
                      </th>
                      <th onClick={() => handleSort('grossProfit')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Gross Profit {renderSortIcon('grossProfit')}
                      </th>
                      <th onClick={() => handleSort('margin')} className="py-3 px-4 text-center cursor-pointer hover:text-slate-900">
                        Margin % {renderSortIcon('margin')}
                      </th>
                    </>
                  )}

                  {activeReport === 'STAFF_SALES' && (
                    <>
                      <th onClick={() => handleSort('staffName')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Staff Member {renderSortIcon('staffName')}
                      </th>
                      <th className="py-3 px-3">Role</th>
                      <th onClick={() => handleSort('transactionsCount')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Transactions {renderSortIcon('transactionsCount')}
                      </th>
                      <th onClick={() => handleSort('unitsSold')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Units Dispensed {renderSortIcon('unitsSold')}
                      </th>
                      <th onClick={() => handleSort('totalRevenue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Total Revenue {renderSortIcon('totalRevenue')}
                      </th>
                      <th onClick={() => handleSort('avgTicket')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900">
                        Average Order {renderSortIcon('avgTicket')}
                      </th>
                    </>
                  )}

                  {activeReport === 'PAYMENT_METHOD_SUMMARY' && (
                    <>
                      <th onClick={() => handleSort('method')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Payment Method {renderSortIcon('method')}
                      </th>
                      <th onClick={() => handleSort('count')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Transactions Count {renderSortIcon('count')}
                      </th>
                      <th onClick={() => handleSort('totalAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Total Amount {renderSortIcon('totalAmount')}
                      </th>
                      <th onClick={() => handleSort('percentage')} className="py-3 px-4 text-center cursor-pointer hover:text-slate-900">
                        Volume Share % {renderSortIcon('percentage')}
                      </th>
                    </>
                  )}

                  {activeReport === 'PURCHASES' && (
                    <>
                      <th onClick={() => handleSort('invoiceNumber')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Invoice # {renderSortIcon('invoiceNumber')}
                      </th>
                      <th onClick={() => handleSort('date')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Date {renderSortIcon('date')}
                      </th>
                      <th onClick={() => handleSort('supplier')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Supplier {renderSortIcon('supplier')}
                      </th>
                      <th className="py-3 px-3 text-center">Items</th>
                      <th onClick={() => handleSort('totalAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Amount {renderSortIcon('totalAmount')}
                      </th>
                      <th onClick={() => handleSort('amountPaid')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Amount Paid {renderSortIcon('amountPaid')}
                      </th>
                      <th onClick={() => handleSort('balance')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Outstanding {renderSortIcon('balance')}
                      </th>
                      <th className="py-3 px-4">Payment Status</th>
                    </>
                  )}

                  {activeReport === 'SUPPLIER_PURCHASES' && (
                    <>
                      <th onClick={() => handleSort('supplierName')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Supplier Name {renderSortIcon('supplierName')}
                      </th>
                      <th className="py-3 px-3">Contact</th>
                      <th onClick={() => handleSort('invoicesCount')} className="py-3 px-3 text-center cursor-pointer hover:text-slate-900">
                        Invoices {renderSortIcon('invoicesCount')}
                      </th>
                      <th onClick={() => handleSort('totalPurchased')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Purchased {renderSortIcon('totalPurchased')}
                      </th>
                      <th onClick={() => handleSort('totalPaid')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Paid {renderSortIcon('totalPaid')}
                      </th>
                      <th onClick={() => handleSort('outstandingBalance')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Outstanding Due {renderSortIcon('outstandingBalance')}
                      </th>
                    </>
                  )}

                  {activeReport === 'OUTSTANDING_SUPPLIER_PAYMENTS' && (
                    <>
                      <th onClick={() => handleSort('invoiceNumber')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Invoice # {renderSortIcon('invoiceNumber')}
                      </th>
                      <th onClick={() => handleSort('date')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Invoice Date {renderSortIcon('date')}
                      </th>
                      <th onClick={() => handleSort('supplier')} className="py-3 px-3 cursor-pointer hover:text-slate-900">
                        Supplier {renderSortIcon('supplier')}
                      </th>
                      <th className="py-3 px-3">Payment Terms</th>
                      <th onClick={() => handleSort('totalAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Total Bill {renderSortIcon('totalAmount')}
                      </th>
                      <th onClick={() => handleSort('amountPaid')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Paid {renderSortIcon('amountPaid')}
                      </th>
                      <th onClick={() => handleSort('outstandingBalance')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold text-rose-700">
                        Outstanding Balance {renderSortIcon('outstandingBalance')}
                      </th>
                    </>
                  )}

                  {activeReport === 'REVENUE' && (
                    <>
                      <th onClick={() => handleSort('timestamp')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Timestamp {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-3 px-3">Reference</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Received By</th>
                      <th onClick={() => handleSort('amount')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold text-emerald-800">
                        Amount {renderSortIcon('amount')}
                      </th>
                    </>
                  )}

                  {activeReport === 'EXPENSES' && (
                    <>
                      <th onClick={() => handleSort('timestamp')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Timestamp {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-3 px-3">Reference</th>
                      <th className="py-3 px-3">Expense Category</th>
                      <th className="py-3 px-3">Description</th>
                      <th className="py-3 px-3">Disbursed By</th>
                      <th onClick={() => handleSort('amount')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold text-rose-700">
                        Amount {renderSortIcon('amount')}
                      </th>
                    </>
                  )}

                  {activeReport === 'CASH_FLOW' && (
                    <>
                      <th onClick={() => handleSort('timestamp')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Timestamp {renderSortIcon('timestamp')}
                      </th>
                      <th className="py-3 px-3">Reference</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Description</th>
                      <th onClick={() => handleSort('inflowAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Inflow {renderSortIcon('inflowAmount')}
                      </th>
                      <th onClick={() => handleSort('outflowAmount')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Outflow {renderSortIcon('outflowAmount')}
                      </th>
                      <th onClick={() => handleSort('netDelta')} className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Net Impact {renderSortIcon('netDelta')}
                      </th>
                    </>
                  )}

                  {activeReport === 'GROSS_PROFIT' && (
                    <>
                      <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Period / Date {renderSortIcon('date')}
                      </th>
                      <th className="py-3 px-3 text-center">Orders</th>
                      <th onClick={() => handleSort('revenue')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        Revenue {renderSortIcon('revenue')}
                      </th>
                      <th onClick={() => handleSort('cogs')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900">
                        COGS {renderSortIcon('cogs')}
                      </th>
                      <th onClick={() => handleSort('grossProfit')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold text-emerald-800">
                        Gross Profit {renderSortIcon('grossProfit')}
                      </th>
                      <th onClick={() => handleSort('margin')} className="py-3 px-4 text-center cursor-pointer hover:text-slate-900">
                        Margin % {renderSortIcon('margin')}
                      </th>
                    </>
                  )}

                  {activeReport === 'NET_MOVEMENT' && (
                    <>
                      <th onClick={() => handleSort('period')} className="py-3 px-4 cursor-pointer hover:text-slate-900">
                        Month / Period {renderSortIcon('period')}
                      </th>
                      <th onClick={() => handleSort('inflow')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 text-emerald-700">
                        Total Inflows {renderSortIcon('inflow')}
                      </th>
                      <th onClick={() => handleSort('outflow')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 text-rose-700">
                        Total Outflows {renderSortIcon('outflow')}
                      </th>
                      <th onClick={() => handleSort('netMovement')} className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 font-bold">
                        Net Movement {renderSortIcon('netMovement')}
                      </th>
                      <th className="py-3 px-4">Financial Status</th>
                    </>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-slate-50/70 transition-colors">
                    {/* Rows matching report type */}
                    {activeReport === 'CURRENT_STOCK' && (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <span className="text-[10px] text-slate-400">{row.generic}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.sku}</td>
                        <td className="py-3 px-3 text-slate-700">{row.category}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {row.currentStock}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {row.reorderLevel}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{row.shelfLocation}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'OUT_OF_STOCK'
                                ? 'bg-rose-100 text-rose-800'
                                : row.status === 'LOW_STOCK'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'STOCK_VALUATION' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-slate-600">{row.category}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">{row.stock}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(row.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(row.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(row.totalCostVal)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(row.totalRetailVal)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(row.potentialProfit)}
                        </td>
                      </>
                    )}

                    {activeReport === 'STOCK_MOVEMENT' && (
                      <>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                          {row.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                          {row.reference}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{row.product}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-800 uppercase">
                            {row.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 text-center font-mono font-bold ${
                            row.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {row.quantityChange > 0 ? `+${row.quantityChange}` : row.quantityChange}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700 font-semibold">
                          {row.balanceAfter}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{row.staff}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{row.reason}</td>
                      </>
                    )}

                    {activeReport === 'LOW_STOCK' && (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <span className="text-[10px] text-slate-400">{row.generic}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-600">{row.category}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                          {row.currentStock}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {row.reorderLevel}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-800">
                          +{row.deficit} units
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{row.supplier}</td>
                      </>
                    )}

                    {activeReport === 'OUT_OF_STOCK' && (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{row.name}</div>
                          <span className="text-[10px] text-slate-400">{row.generic}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.sku}</td>
                        <td className="py-3 px-3 text-slate-600">{row.category}</td>
                        <td className="py-3 px-3 text-slate-600">{row.shelfLocation}</td>
                        <td className="py-3 px-3 text-slate-700">{row.supplier}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            DEPLETED (0 units)
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'EXPIRY_REPORT' && (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{row.productName}</div>
                          <span className="text-[10px] text-slate-400">{row.genericName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{row.batchNumber}</td>
                        <td className="py-3 px-3 font-mono text-slate-700 font-medium">
                          {row.expiryDate}
                        </td>
                        <td
                          className={`py-3 px-3 text-center font-mono font-bold ${
                            row.daysRemaining <= 0
                              ? 'text-rose-700'
                              : row.daysRemaining <= 60
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {row.daysRemaining <= 0 ? 'EXPIRED' : `${row.daysRemaining} days`}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-slate-900">
                          {row.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatCurrency(row.totalBatchValue)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'EXPIRED'
                                ? 'bg-rose-100 text-rose-800'
                                : row.status === 'EXPIRING_SOON'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {row.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'EXPIRED_STOCK' && (
                      <>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{row.productName}</div>
                          <span className="text-[10px] text-slate-400">{row.genericName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{row.batchNumber}</td>
                        <td className="py-3 px-3 font-mono text-rose-700 font-bold">
                          {row.expiryDate}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {row.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatCurrency(row.lossValue)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            {row.actionRequired}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'DAMAGED_STOCK' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {row.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.reference}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{row.productName}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-rose-700">
                          {row.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatCurrency(row.lossValue)}
                        </td>
                        <td className="py-3 px-3 text-slate-700">{row.staffName}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{row.reason}</td>
                      </>
                    )}

                    {activeReport === 'DAILY_SALES' && (
                      <>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{row.date}</td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          {row.transactionsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          {row.unitsSold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(row.cashAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(row.transferAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(row.posAmount)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(row.totalRevenue)}
                        </td>
                      </>
                    )}

                    {activeReport === 'WEEKLY_SALES' && (
                      <>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{row.week}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.orders}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.units}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(row.grossProfit)} ({row.margin.toFixed(1)}%)
                        </td>
                      </>
                    )}

                    {activeReport === 'MONTHLY_SALES' && (
                      <>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{row.month}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.orders}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.units}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatCurrency(row.avgDailyRevenue)}
                        </td>
                      </>
                    )}

                    {activeReport === 'PRODUCT_SALES' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.name}</td>
                        <td className="py-3 px-3 text-slate-600">{row.category}</td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {row.unitsSold}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-emerald-700 font-bold">
                          {row.margin.toFixed(1)}%
                        </td>
                      </>
                    )}

                    {activeReport === 'STAFF_SALES' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.staffName}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {row.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          {row.transactionsCount}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">{row.unitsSold}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(row.totalRevenue)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatCurrency(row.avgTicket)}
                        </td>
                      </>
                    )}

                    {activeReport === 'PAYMENT_METHOD_SUMMARY' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{row.method}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold">{row.count}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {row.percentage.toFixed(1)}%
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'PURCHASES' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {row.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{row.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.supplier}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.itemsCount}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(row.amountPaid)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-700">
                          {formatCurrency(row.balance)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.paymentStatus === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {row.paymentStatus}
                          </span>
                        </td>
                      </>
                    )}

                    {activeReport === 'SUPPLIER_PURCHASES' && (
                      <>
                        <td className="py-3 px-4 font-bold text-slate-900">{row.supplierName}</td>
                        <td className="py-3 px-3 text-slate-600">{row.contact}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.invoicesCount}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {formatCurrency(row.totalPurchased)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(row.totalPaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                          {formatCurrency(row.outstandingBalance)}
                        </td>
                      </>
                    )}

                    {activeReport === 'OUTSTANDING_SUPPLIER_PAYMENTS' && (
                      <>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {row.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{row.date}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.supplier}</td>
                        <td className="py-3 px-3 text-slate-600">{row.paymentTerms}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700">
                          {formatCurrency(row.amountPaid)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                          {formatCurrency(row.outstandingBalance)}
                        </td>
                      </>
                    )}

                    {activeReport === 'REVENUE' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {row.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.reference}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 uppercase">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">{row.description}</td>
                        <td className="py-3 px-3 text-slate-600">{row.staffName}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-emerald-800">
                          +{formatCurrency(row.amount)}
                        </td>
                      </>
                    )}

                    {activeReport === 'EXPENSES' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {row.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.reference}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-800 uppercase">
                            {row.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-medium">{row.description}</td>
                        <td className="py-3 px-3 text-slate-600">{row.staffName}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-700">
                          -{formatCurrency(row.amount)}
                        </td>
                      </>
                    )}

                    {activeReport === 'CASH_FLOW' && (
                      <>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {row.timestamp}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{row.reference}</td>
                        <td className="py-3 px-3 text-slate-700">{row.category}</td>
                        <td className="py-3 px-3 text-slate-800 max-w-xs truncate">
                          {row.description}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                          {row.inflowAmount > 0 ? `+${formatCurrency(row.inflowAmount)}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-700 font-semibold">
                          {row.outflowAmount > 0 ? `-${formatCurrency(row.outflowAmount)}` : '-'}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-mono font-black ${
                            row.netDelta >= 0 ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {formatCurrency(row.netDelta)}
                        </td>
                      </>
                    )}

                    {activeReport === 'GROSS_PROFIT' && (
                      <>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">{row.date}</td>
                        <td className="py-3 px-3 text-center font-mono">{row.orders}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-900">
                          {formatCurrency(row.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(row.cogs)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-emerald-800">
                          {formatCurrency(row.grossProfit)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700">
                          {row.margin.toFixed(1)}%
                        </td>
                      </>
                    )}

                    {activeReport === 'NET_MOVEMENT' && (
                      <>
                        <td className="py-3 px-4 font-bold font-mono text-slate-900">
                          {row.period}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-emerald-700 font-bold">
                          +{formatCurrency(row.inflow)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-rose-700 font-bold">
                          -{formatCurrency(row.outflow)}
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-black ${
                            row.netMovement >= 0 ? 'text-emerald-800' : 'text-rose-700'
                          }`}
                        >
                          {formatCurrency(row.netMovement)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              row.status === 'SURPLUS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Reusable Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={sortedRows.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          className="print:hidden"
        />

        {/* Printable Official Sign-Off Footer */}
        <div className="hidden print:block p-8 border-t border-slate-300 text-xs mt-6">
          <div className="grid grid-cols-2 gap-12 pt-6">
            <div>
              <p className="text-slate-500 mb-8">Prepared by Pharmacist / Operator:</p>
              <div className="border-b border-slate-900 w-48 mb-1"></div>
              <p className="font-bold text-slate-900">Name &amp; Signature</p>
            </div>
            <div>
              <p className="text-slate-500 mb-8">Superintendent Pharmacist Verification:</p>
              <div className="border-b border-slate-900 w-48 mb-1"></div>
              <p className="font-bold text-slate-900">PCN License &amp; Official Stamp</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-6 text-center">
            Report generated electronically by PharmaPulse Pharmacy Management Platform. Valid without seal if generated with verified security credentials.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Sub-report Pill Component
const ReportPill: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({
  active,
  onClick,
  label,
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
      active
        ? 'bg-emerald-600 text-white shadow-xs'
        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
    }`}
  >
    {label}
  </button>
);
