import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import axios, { API } from "@/lib/api";
import { LangProvider } from "@/context/LangContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminLayout } from "@/components/AdminLayout";

// Pages
import LoginPage from "@/pages/LoginPage";
import PosPage from "@/pages/PosPage";
import ShopPage from "@/pages/ShopPage";
import ShopOrdersPage from "@/pages/ShopOrdersPage";

// Admin Pages
import Dashboard from "@/pages/admin/Dashboard";
import StoresPage from "@/pages/admin/StoresPage";
import WarehousesPage from "@/pages/admin/WarehousesPage";
import ProductsPage from "@/pages/admin/ProductsPage";
import TransferPage from "@/pages/admin/TransferPage";
import CustomersPage from "@/pages/admin/CustomersPage";
import SuppliersPage from "@/pages/admin/SuppliersPage";
import PurchasesPage from "@/pages/admin/PurchasesPage";
import SalesPage from "@/pages/admin/SalesPage";
import OnlineOrdersPage from "@/pages/admin/OnlineOrdersPage";
import SalesReportPage from "@/pages/admin/SalesReportPage";
import ReportsPage from "@/pages/admin/ReportsPage";
import ExchangeRatesPage from "@/pages/admin/ExchangeRatesPage";
import PaymentSettingsPage from "@/pages/admin/PaymentSettingsPage";
import SystemSettingsPage from "@/pages/admin/SystemSettingsPage";
import EmployeesPage from "@/pages/admin/EmployeesPage";
import StockAlertsPage from "@/pages/admin/StockAlertsPage";
import StockTakingPage from "@/pages/admin/StockTakingPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import DailySettlementPage from "@/pages/admin/DailySettlementPage";
import RefundsPage from "@/pages/admin/RefundsPage";

function AdminRoute({ children }) {
  return (
    <ProtectedRoute>
      <AdminLayout>{children}</AdminLayout>
    </ProtectedRoute>
  );
}

function AppContent() {
  useEffect(() => {
    axios.post(`${API}/init-data`).catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/orders" element={<ShopOrdersPage />} />
          <Route path="/pos" element={<PosPage />} />

          <Route path="/admin" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/admin/stores" element={<AdminRoute><StoresPage /></AdminRoute>} />
          <Route path="/admin/warehouses" element={<AdminRoute><WarehousesPage /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
          <Route path="/admin/transfers" element={<AdminRoute><TransferPage /></AdminRoute>} />
          <Route path="/admin/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />
          <Route path="/admin/suppliers" element={<AdminRoute><SuppliersPage /></AdminRoute>} />
          <Route path="/admin/purchases" element={<AdminRoute><PurchasesPage /></AdminRoute>} />
          <Route path="/admin/sales" element={<AdminRoute><SalesPage /></AdminRoute>} />
          <Route path="/admin/online-orders" element={<AdminRoute><OnlineOrdersPage /></AdminRoute>} />
          <Route path="/admin/sales-report" element={<AdminRoute><SalesReportPage /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><ReportsPage /></AdminRoute>} />
          <Route path="/admin/exchange-rates" element={<AdminRoute><ExchangeRatesPage /></AdminRoute>} />
          <Route path="/admin/payment-settings" element={<AdminRoute><PaymentSettingsPage /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><SystemSettingsPage /></AdminRoute>} />
          <Route path="/admin/employees" element={<AdminRoute><EmployeesPage /></AdminRoute>} />
          <Route path="/admin/stock-alerts" element={<AdminRoute><StockAlertsPage /></AdminRoute>} />
          <Route path="/admin/stock-taking" element={<AdminRoute><StockTakingPage /></AdminRoute>} />
          <Route path="/admin/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
          <Route path="/admin/daily-settlement" element={<AdminRoute><DailySettlementPage /></AdminRoute>} />
          <Route path="/admin/refunds" element={<AdminRoute><RefundsPage /></AdminRoute>} />

          <Route path="/" element={<Navigate to="/shop" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}

export default App;
