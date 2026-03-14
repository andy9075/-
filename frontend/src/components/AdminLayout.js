import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store, Package, Warehouse, Users, ShoppingCart, BarChart3,
  Settings, LogOut, Menu, X, Home, Building2, Truck, CreditCard,
  Globe, DollarSign, FileText, AlertCircle, ClipboardList, ArrowLeftRight,
  Tag, Calendar, RotateCcw, TrendingUp, Shield, Megaphone, Banknote,
  ChevronDown, ChevronRight, Clock, Target, Box, Bell
} from "lucide-react";

const AdminLayout = ({ children }) => {
  const { t, lang, setLang } = useLang();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({});

  const toggleGroup = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const navGroups = [
    { key: "main", label: t('dashboard'), items: [
      { icon: Home, label: t('dashboard'), path: "/admin" },
      { icon: Bell, label: t('notifications'), path: "/admin/notifications" },
    ]},
    { key: "sales", label: t('salesManagement'), items: [
      { icon: ShoppingCart, label: t('salesManagement'), path: "/admin/sales" },
      { icon: Globe, label: t('onlineOrders'), path: "/admin/online-orders" },
      { icon: Truck, label: t('wholesale'), path: "/admin/wholesale" },
      { icon: Calendar, label: t('dailySettlement'), path: "/admin/daily-settlement" },
      { icon: RotateCcw, label: t('refundHistory'), path: "/admin/refunds" },
    ]},
    { key: "products", label: t('productManagement'), items: [
      { icon: Package, label: t('productManagement'), path: "/admin/products" },
      { icon: Tag, label: t('categoryManagement'), path: "/admin/categories" },
      { icon: Box, label: t('bundles'), path: "/admin/bundles" },
    ]},
    { key: "inventory", label: t('warehouseManagement'), items: [
      { icon: Warehouse, label: t('warehouseManagement'), path: "/admin/warehouses" },
      { icon: ArrowLeftRight, label: t('transferManagement'), path: "/admin/transfers" },
      { icon: AlertCircle, label: t('stockAlerts'), path: "/admin/stock-alerts" },
      { icon: ClipboardList, label: t('stockTaking'), path: "/admin/stock-taking" },
    ]},
    { key: "purchase", label: t('purchaseManagement'), items: [
      { icon: FileText, label: t('purchaseManagement'), path: "/admin/purchases" },
      { icon: RotateCcw, label: t('purchaseReturn'), path: "/admin/purchase-returns" },
      { icon: Building2, label: t('supplierManagement'), path: "/admin/suppliers" },
    ]},
    { key: "crm", label: t('customerManagement'), items: [
      { icon: Users, label: t('customerManagement'), path: "/admin/customers" },
      { icon: Megaphone, label: t('promotions'), path: "/admin/promotions" },
    ]},
    { key: "finance", label: t('reports'), items: [
      { icon: BarChart3, label: t('reports'), path: "/admin/reports" },
      { icon: TrendingUp, label: t('profitAnalysis'), path: "/admin/profit-analysis" },
      { icon: Target, label: t('salesTarget'), path: "/admin/sales-targets" },
      { icon: Banknote, label: t('accountsReceivable'), path: "/admin/accounts" },
      { icon: DollarSign, label: t('exchangeRates'), path: "/admin/exchange-rates" },
    ]},
    { key: "hr", label: t('employees'), items: [
      { icon: Users, label: t('employees'), path: "/admin/employees" },
      { icon: Clock, label: t('attendance'), path: "/admin/attendance" },
    ]},
    { key: "system", label: t('systemSettings'), items: [
      { icon: Store, label: t('storeManagement'), path: "/admin/stores" },
      { icon: CreditCard, label: t('paymentSettings'), path: "/admin/payment-settings" },
      { icon: Settings, label: t('systemSettings'), path: "/admin/settings" },
      { icon: Shield, label: t('auditLog'), path: "/admin/audit-log" },
    ]},
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white tracking-wide">POS System</h2>
        <p className="text-xs text-slate-400 mt-1">{user?.name || user?.username}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navGroups.map(group => {
          const isExpanded = !collapsed[group.key];
          const isActive = group.items.some(item => location.pathname === item.path);
          return (
            <div key={group.key}>
              <button onClick={() => toggleGroup(group.key)} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${isActive ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}>
                <span className="font-medium">{group.label}</span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {isExpanded && (
                <div className="ml-2 space-y-0.5 mt-0.5">
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${active ? 'bg-emerald-500/15 text-emerald-400 font-medium' : 'text-slate-400 hover:text-white hover:bg-slate-700/30'}`} data-testid={`nav-${item.path.replace('/admin/', '').replace('/', '-') || 'home'}`}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-700 space-y-2">
        <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full bg-slate-700 border-slate-600 text-white rounded px-2 py-1.5 text-sm" data-testid="lang-select">
          <option value="zh">中文</option><option value="en">English</option><option value="es">Español</option>
        </select>
        <Button variant="ghost" onClick={() => { logout(); navigate("/login"); }} className="w-full justify-start text-red-400 hover:bg-red-500/10 hover:text-red-300" data-testid="logout-btn"><LogOut className="w-4 h-4 mr-2" />{t('logout')}</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-800 border-r border-slate-700 transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>
      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)} className="text-white"><Menu className="w-5 h-5" /></Button>
          <span className="text-white font-medium">POS System</span>
          <Link to="/pos"><Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-sm">{t('posMode')}</Button></Link>
        </header>
        <div className="p-4 lg:p-6 overflow-auto" style={{ maxHeight: 'calc(100vh - 0px)' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
