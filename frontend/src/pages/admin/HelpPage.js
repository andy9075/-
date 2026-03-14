import React, { useState } from "react";
import { ChevronDown, ChevronRight, Monitor, ShoppingBag, Users, Package, Warehouse, BarChart3, Settings, Shield, Building2, CreditCard, Truck, FileText, Target, Clock, DollarSign, Bell, Tag, Box, Globe, RotateCcw, Megaphone, Banknote, ClipboardList, AlertCircle, ArrowLeftRight, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";

const Section = ({ icon: Icon, title, color, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <Card className="bg-slate-800 border-slate-700 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-700/50 transition-colors">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-4 h-4 text-white" /></div>
        <span className="text-white font-medium flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 pb-4 px-4"><div className="text-sm text-slate-300 space-y-2 pl-11">{children}</div></CardContent>}
    </Card>
  );
};

const Step = ({ n, children }) => (
  <div className="flex gap-2 items-start">
    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-bold">{n}</span>
    <span>{children}</span>
  </div>
);

const Key = ({ children }) => <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-emerald-400 font-mono">{children}</kbd>;

export default function HelpPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'admin' && !user?.tenant_id;

  return (
    <div className="space-y-4" data-testid="help-page">
      <div className="flex items-center gap-3 mb-6">
        <img src="/sellox-logo.png" alt="Sellox" className="w-10 h-10 rounded-xl" />
        <div>
          <h1 className="text-2xl font-bold text-white">{isSuperAdmin ? 'Sellox Admin Guide' : 'Sellox User Guide'}</h1>
          <p className="text-slate-400 text-sm">{isSuperAdmin ? 'System Administration Manual' : 'Store Operations Manual'}</p>
        </div>
      </div>

      {/* SUPER ADMIN ONLY SECTION */}
      {isSuperAdmin && (
        <>
          <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">Super Admin Functions</p>

          <Section icon={Building2} title="Tenant Management (SaaS)" color="bg-amber-500">
            <p className="text-slate-400 mb-2">Manage your customers (tenants) who use the Sellox system.</p>
            <Step n="1">Go to <strong>System Settings → SaaS Tenant Management</strong></Step>
            <Step n="2">Click <strong>"Add Tenant"</strong> to create a new customer</Step>
            <Step n="3">Fill in: Business Name, Contact, Admin Username & Password</Step>
            <Step n="4">Select a Plan: <strong>Basic</strong> / <strong>Pro</strong> / <strong>Enterprise</strong></Step>
            <Step n="5">Share the Tenant ID, username, and password with your customer</Step>
            <div className="mt-3 p-3 bg-slate-900 rounded-lg">
              <p className="text-emerald-400 font-medium text-xs mb-1">Plans:</p>
              <p><strong>Basic</strong> — POS, Products, Inventory, Customers, Basic Reports (1 store)</p>
              <p><strong>Pro</strong> — All Basic + Online Shop, Advanced Reports, Promotions, Wholesale, Multi-store</p>
              <p><strong>Enterprise</strong> — All Pro + Commission, API Access, Unlimited stores & users</p>
            </div>
            <div className="mt-2 p-3 bg-slate-900 rounded-lg">
              <p className="text-blue-400 font-medium text-xs mb-1">Quick Actions:</p>
              <p>Copy Shop Link — share with tenant's customers for online ordering</p>
              <p>Open Shop — preview tenant's online store</p>
              <p>Toggle — enable/disable a tenant</p>
            </div>
          </Section>
        </>
      )}

      <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide pt-2">Core Operations</p>

      {/* POS */}
      <Section icon={Monitor} title="POS Register" color="bg-emerald-500">
        <p className="text-slate-400 mb-2">The cash register for processing sales.</p>
        <Step n="1">Click <strong>POS</strong> button in sidebar (or go to /pos)</Step>
        <Step n="2">Login with your username/password, then select your store</Step>
        <Step n="3"><strong>Start Shift</strong> — enter opening cash amount</Step>
        <Step n="4">Scan barcode or search products, they'll be added to cart</Step>
        <Step n="5">Press <Key>F9</Key> to checkout, select payment method, confirm</Step>
        <div className="mt-3 p-3 bg-slate-900 rounded-lg">
          <p className="text-emerald-400 font-medium text-xs mb-2">Keyboard Shortcuts:</p>
          <div className="grid grid-cols-2 gap-1">
            <p><Key>F1</Key> Search products</p>
            <p><Key>F2</Key> Stock lookup</p>
            <p><Key>F3</Key> Clear cart</p>
            <p><Key>F4</Key> Hold order</p>
            <p><Key>F9</Key> Checkout</p>
            <p><Key>F10</Key> Recall held order</p>
            <p><Key>F11</Key> Refund (manager only)</p>
            <p><Key>Esc</Key> Close dialog</p>
          </div>
        </div>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-amber-400 font-medium text-xs mb-1">Payment Methods:</p>
          <p><Key>F5</Key> Cash &nbsp; <Key>F6</Key> Card &nbsp; <Key>F7</Key> BioPago &nbsp; <Key>F8</Key> Transfer</p>
        </div>
      </Section>

      {/* Stock Lookup */}
      <Section icon={Package} title="Stock Lookup (F2)" color="bg-amber-500">
        <p className="text-slate-400 mb-2">Quickly check product stock levels from POS.</p>
        <Step n="1">Press <Key>F2</Key> or click <strong>F2 Stock</strong> in POS</Step>
        <Step n="2">Search by product name or code</Step>
        <Step n="3">View stock by warehouse: quantity, reserved, available</Step>
        <div className="mt-2 p-3 bg-slate-900 rounded-lg">
          <p className="text-xs"><span className="text-emerald-400">OK</span> = sufficient stock &nbsp; <span className="text-amber-400">LOW</span> = below minimum &nbsp; <span className="text-red-400">OUT</span> = no stock</p>
        </div>
      </Section>

      {/* Refund */}
      <Section icon={RotateCcw} title="Refund (F11)" color="bg-red-500">
        <p className="text-slate-400 mb-2">Process refunds for completed orders. <strong>Requires manager/admin permission.</strong></p>
        <Step n="1">Press <Key>F11</Key> in POS (must have refund permission)</Step>
        <Step n="2">Enter the order number and click <strong>Search</strong></Step>
        <Step n="3">View full order details with product info</Step>
        <Step n="4">Check/uncheck items to refund (partial refund supported)</Step>
        <Step n="5">Enter reason (optional) and click <strong>Refund</strong></Step>
        <p className="text-red-400 text-xs mt-2">Note: Cashiers cannot process refunds unless given explicit permission.</p>
      </Section>

      <p className="text-xs text-blue-400 font-medium uppercase tracking-wide pt-2">Management</p>

      {/* Products */}
      <Section icon={Package} title="Product Management" color="bg-blue-500">
        <Step n="1">Go to <strong>Products → Product Management</strong></Step>
        <Step n="2">Click <strong>Add Product</strong> to create new products</Step>
        <Step n="3">Fill code, name, category, unit, cost price</Step>
        <Step n="4">Set 3 price tiers: Price 1 (retail), Price 2 (member), Price 3 (wholesale)</Step>
        <Step n="5">Upload product image (optional)</Step>
        <p className="mt-2"><strong>Import:</strong> Use CSV import to bulk-add products</p>
        <p><strong>Categories:</strong> Manage in Products → Categories</p>
        <p><strong>Bundles:</strong> Create product bundles in Products → Bundles</p>
      </Section>

      {/* Inventory */}
      <Section icon={Warehouse} title="Inventory & Warehouses" color="bg-purple-500">
        <Step n="1"><strong>Warehouses:</strong> Create warehouses in Warehouse → Warehouse Management</Step>
        <Step n="2"><strong>Stock In:</strong> Use Purchase Orders to add stock</Step>
        <Step n="3"><strong>Transfers:</strong> Move stock between warehouses</Step>
        <Step n="4"><strong>Adjustments:</strong> Manual stock corrections in Stock Taking</Step>
        <Step n="5"><strong>Alerts:</strong> View low stock alerts in Stock Alerts</Step>
      </Section>

      {/* Customers */}
      <Section icon={Users} title="Customers & Loyalty" color="bg-cyan-500">
        <Step n="1">Go to <strong>CRM → Customer Management</strong></Step>
        <Step n="2">Add customers with name, phone, email</Step>
        <Step n="3">Customers earn points automatically ($1 = 1 point)</Step>
        <Step n="4">Points can be redeemed at POS checkout (100 pts = $1)</Step>
        <Step n="5">VIP levels auto-upgrade based on spending</Step>
      </Section>

      {/* Purchases */}
      <Section icon={FileText} title="Purchase Orders" color="bg-orange-500">
        <Step n="1">Add suppliers in <strong>Purchases → Suppliers</strong></Step>
        <Step n="2">Create purchase orders in <strong>Purchases → Purchase Management</strong></Step>
        <Step n="3">Select supplier, warehouse, add products</Step>
        <Step n="4">When goods arrive, confirm the order → stock auto-increases</Step>
        <Step n="5">Purchase returns available for damaged goods</Step>
      </Section>

      {/* Sales */}
      <Section icon={CreditCard} title="Sales Management" color="bg-green-500">
        <p><strong>Sales History:</strong> View all sales, filter by date/store/payment</p>
        <p><strong>Online Orders:</strong> Manage orders from your online shop</p>
        <p><strong>Daily Settlement:</strong> End-of-day cash reconciliation</p>
        <p><strong>Refund History:</strong> View all processed refunds</p>
        <p><strong>Wholesale:</strong> B2B sales with bulk pricing</p>
      </Section>

      {/* Online Shop */}
      <Section icon={Globe} title="Online Shop" color="bg-indigo-500">
        <p className="text-slate-400 mb-2">Your customers can browse and order online.</p>
        <Step n="1">Click <strong>Shop</strong> button in sidebar to view your shop</Step>
        <Step n="2">Share your shop link with customers</Step>
        <Step n="3">Customers browse products, add to cart, checkout</Step>
        <Step n="4">You receive orders in <strong>Sales → Online Orders</strong></Step>
        <Step n="5">Process, ship, and complete orders</Step>
        {isSuperAdmin && <p className="text-amber-400 text-xs mt-2">Super Admin: Each tenant has their own shop at /shop/[tenant_id]</p>}
      </Section>

      <p className="text-xs text-purple-400 font-medium uppercase tracking-wide pt-2">Reports & Finance</p>

      {/* Reports */}
      <Section icon={BarChart3} title="Reports & Analytics" color="bg-violet-500">
        <p><strong>Dashboard:</strong> Today's sales, trends, top products</p>
        <p><strong>Reports:</strong> Sales reports with date filters, export to Excel</p>
        <p><strong>Profit Analysis:</strong> Cost vs revenue, margins by product</p>
        <p><strong>Sales Targets:</strong> Set monthly targets, track progress</p>
        <p><strong>Accounts:</strong> Receivable & payable tracking</p>
      </Section>

      {/* Exchange Rates */}
      <Section icon={DollarSign} title="Multi-Currency & Exchange Rates" color="bg-yellow-500">
        <p className="text-slate-400 mb-2">Support for USD and local currency (VES/Bs.)</p>
        <Step n="1">Go to <strong>Finance → Exchange Rates</strong></Step>
        <Step n="2">Set the USD to VES exchange rate</Step>
        <Step n="3">POS automatically shows prices in both currencies</Step>
      </Section>

      <p className="text-xs text-red-400 font-medium uppercase tracking-wide pt-2">System</p>

      {/* Employees & Permissions */}
      <Section icon={Shield} title="Employees & Permissions" color="bg-red-500">
        <p className="text-slate-400 mb-2">Manage staff and control what each person can do.</p>
        <Step n="1">Go to <strong>HR → Employees</strong></Step>
        <Step n="2">Click <strong>Add</strong> to create a new employee</Step>
        <Step n="3">Select a role preset: admin / manager / cashier / staff</Step>
        <Step n="4">Customize individual permissions by checking/unchecking:</Step>
        <div className="mt-1 p-3 bg-slate-900 rounded-lg grid grid-cols-2 gap-1 text-xs">
          <p><strong>POS</strong> — Use cash register</p>
          <p><strong>Discount</strong> — Apply discounts</p>
          <p><strong>Refund</strong> — Process refunds</p>
          <p><strong>Void</strong> — Void transactions</p>
          <p><strong>Products</strong> — Manage products</p>
          <p><strong>Inventory</strong> — Manage stock</p>
          <p><strong>Customers</strong> — Manage customers</p>
          <p><strong>Reports</strong> — View reports</p>
          <p><strong>Export</strong> — Export data</p>
          <p><strong>Cost Price</strong> — View cost prices</p>
          <p><strong>Settings</strong> — System settings</p>
          <p><strong>Employees</strong> — Manage staff</p>
        </div>
        <Step n="5">Set <strong>Max Discount %</strong> to limit discount amount</Step>
      </Section>

      {/* Settings */}
      <Section icon={Settings} title="System Settings" color="bg-slate-500">
        <p><strong>Store Management:</strong> Add stores, set headquarters</p>
        <p><strong>Payment Settings:</strong> Configure bank transfer, Pago Movil, WhatsApp</p>
        <p><strong>System Settings:</strong> Company info, invoice format, receipt settings</p>
        <p><strong>Audit Log:</strong> Track all system changes for security</p>
      </Section>

      {/* PWA */}
      <Section icon={Monitor} title="Install as Desktop App (PWA)" color="bg-teal-500">
        <p className="text-slate-400 mb-2">Install Sellox on your desktop for quick access and offline use.</p>
        <Step n="1">Open Sellox in Chrome/Edge browser</Step>
        <Step n="2">Click the install icon in the address bar (or look for the install prompt)</Step>
        <Step n="3">The app installs to your desktop like a regular program</Step>
        <Step n="4"><strong>Offline POS:</strong> If internet goes down, POS still works! Sales sync when connection returns.</Step>
      </Section>

      {/* Version */}
      <div className="text-center py-6 text-slate-600 text-xs">
        <p>Sellox v1.0 — Smart POS System</p>
        <p>Powered by Sellox &copy; 2026</p>
      </div>
    </div>
  );
}
