import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Store, Package, Warehouse, Users, ShoppingCart, BarChart3,
  Settings, LogOut, Menu, X, Home, Building2, Truck, CreditCard,
  Globe, DollarSign, FileText, AlertCircle, ClipboardList, ArrowLeftRight,
  Tag, Calendar, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";

export const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { t, lang, changeLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: t('dashboard'), path: "/admin" },
    { icon: Building2, label: t('storeManagement'), path: "/admin/stores" },
    { icon: Warehouse, label: t('warehouseManagement'), path: "/admin/warehouses" },
    { icon: Package, label: t('productManagement'), path: "/admin/products" },
    { icon: Tag, label: t('categoryManagement'), path: "/admin/categories" },
    { icon: ArrowLeftRight, label: t('transferManagement'), path: "/admin/transfers" },
    { icon: Users, label: t('customerManagement'), path: "/admin/customers" },
    { icon: Truck, label: t('supplierManagement'), path: "/admin/suppliers" },
    { icon: ShoppingCart, label: t('purchaseManagement'), path: "/admin/purchases" },
    { icon: CreditCard, label: t('salesManagement'), path: "/admin/sales" },
    { icon: Globe, label: t('onlineOrders'), path: "/admin/online-orders" },
    { icon: FileText, label: t('salesReport'), path: "/admin/sales-report" },
    { icon: Calendar, label: t('dailySettlement'), path: "/admin/daily-settlement" },
    { icon: RotateCcw, label: t('refundHistory'), path: "/admin/refunds" },
    { icon: BarChart3, label: t('reports'), path: "/admin/reports" },
    { icon: DollarSign, label: t('exchangeRates'), path: "/admin/exchange-rates" },
    { icon: Settings, label: t('paymentSettings'), path: "/admin/payment-settings" },
    { icon: Settings, label: t('systemSettings'), path: "/admin/settings" },
    { icon: Users, label: t('employees'), path: "/admin/employees" },
    { icon: AlertCircle, label: t('stockAlerts'), path: "/admin/stock-alerts" },
    { icon: ClipboardList, label: t('stockTaking'), path: "/admin/stock-taking" },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <aside className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">POS</h1>
              <p className="text-slate-400 text-xs">{user?.name || user?.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 160px)' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
                data-testid={`nav-${item.path.split('/').pop() || 'dashboard'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700 space-y-2">
          {sidebarOpen && (
            <div className="flex gap-1 justify-center">
              {[{k:'zh',l:'中'},{k:'en',l:'EN'},{k:'es',l:'ES'}].map(({k,l}) => (
                <button key={k} onClick={() => changeLang(k)}
                  className={`px-2 py-1 text-xs rounded ${lang === k ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  data-testid={`lang-${k}`}
                >{l}</button>
              ))}
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && t('logout')}
          </Button>
        </div>
      </aside>

      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
