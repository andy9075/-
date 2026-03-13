import React, { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Store, Package, Warehouse, Users, ShoppingCart, BarChart3, 
  Settings, LogOut, Menu, X, Plus, Search, Edit, Trash2, 
  Home, Building2, Truck, CreditCard, Globe, ChevronDown,
  ShoppingBag, DollarSign, TrendingUp, AlertCircle, Check,
  ArrowLeftRight, Printer, Wifi, WifiOff, FileText, Calendar,
  ClipboardList, RotateCcw, UserPlus, Shield, Weight,
  Upload, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LangProvider, useLang } from "@/context/LangContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Global axios interceptor - handle auth errors silently
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Don't show toast for auth errors - will be handled by redirect
      console.warn('Auth error:', error.response?.status);
    }
    return Promise.reject(error);
  }
);

// Auth Context
const AuthContext = createContext(null);

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`);
      setUser(res.data);
    } catch (e) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const res = await axios.post(`${API}/auth/login`, { username, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem("token", newToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Login Page
const LoginPage = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      const from = location.state?.from || "/admin";
      navigate(from);
      toast.success(t('login') + " OK");
    } catch (error) {
      toast.error(error.response?.data?.detail || t('login') + " failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700 backdrop-blur">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-white">POS</CardTitle>
          <p className="text-slate-400 text-sm">{t('storeManagement')} · {t('warehouseManagement')}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t('username')}</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('username')}
                className="bg-slate-700/50 border-slate-600 text-white"
                data-testid="login-username"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">{t('password')}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('password')}
                className="bg-slate-700/50 border-slate-600 text-white"
                data-testid="login-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              disabled={isLoading}
              data-testid="login-submit"
            >
              {isLoading ? t('loading') : t('login')}
            </Button>
            <p className="text-center text-slate-400 text-xs mt-4">
              admin / admin123
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Admin Layout
const AdminLayout = ({ children }) => {
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
    { icon: ArrowLeftRight, label: t('transferManagement'), path: "/admin/transfers" },
    { icon: Users, label: t('customerManagement'), path: "/admin/customers" },
    { icon: Truck, label: t('supplierManagement'), path: "/admin/suppliers" },
    { icon: ShoppingCart, label: t('purchaseManagement'), path: "/admin/purchases" },
    { icon: CreditCard, label: t('salesManagement'), path: "/admin/sales" },
    { icon: Globe, label: t('onlineOrders'), path: "/admin/online-orders" },
    { icon: FileText, label: t('salesReport'), path: "/admin/sales-report" },
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
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full bg-slate-800 border-r border-slate-700 transition-all duration-300 z-40 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'hidden'}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold">POS系统</h1>
              <p className="text-slate-400 text-xs">{user?.name || user?.username}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        
        <nav className="p-3 space-y-1">
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

      {/* Main Content */}
      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

// Dashboard
const Dashboard = () => {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API}/dashboard/stats`);
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm">{t('todaySales')}</p>
                <p className="text-2xl font-bold text-white mt-1">${stats?.today_sales_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-emerald-400 text-xs mt-1">{stats?.today_sales_count || 0} {t('items')}</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">{t('onlineOrderTotal')}</p>
                <p className="text-2xl font-bold text-white mt-1">${stats?.today_online_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-blue-400 text-xs mt-1">{stats?.today_online_count || 0} {t('items')}</p>
              </div>
              <Globe className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">{t('totalProducts')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.products_count || 0}</p>
                <p className="text-purple-400 text-xs mt-1">{t('active')}</p>
              </div>
              <Package className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">{t('pendingOrders')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.pending_online_orders || 0}</p>
                <p className="text-orange-400 text-xs mt-1">{t('onlineOrders')}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/admin/products">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Package className="w-4 h-4 mr-2" /> {t('productManagement')}
              </Button>
            </Link>
            <Link to="/admin/online-orders">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Globe className="w-4 h-4 mr-2" /> {t('onlineOrders')}
              </Button>
            </Link>
            <Link to="/admin/warehouses">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Warehouse className="w-4 h-4 mr-2" /> {t('warehouseManagement')}
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <BarChart3 className="w-4 h-4 mr-2" /> {t('reports')}
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('reports')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>{t('storeManagement')}</span>
              <span className="text-white font-medium">{stats?.stores_count || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{t('customerManagement')}</span>
              <span className="text-white font-medium">{stats?.customers_count || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>{t('productManagement')}</span>
              <span className="text-white font-medium">{stats?.products_count || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Products Management
const ProductsPage = () => {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 1, local_currency_symbol: 'Bs.' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    code: "", barcode: "", name: "", category_id: "", unit: "件",
    cost_price: 0, margin1: 0, margin2: 0, margin3: 0,
    price1: 0, price2: 0, price3: 0, wholesale_price: 0, box_quantity: 1,
    retail_price: 0, min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active"
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`, { params: { search } });
      setProducts(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const [catRes, rateRes] = await Promise.all([
        axios.get(`${API}/categories`),
        axios.get(`${API}/exchange-rates`)
      ]);
      setCategories(catRes.data);
      setExchangeRates(rateRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, formData);
        toast.success(t('updateSuccess'));
      } else {
        await axios.post(`${API}/products`, formData);
        toast.success(t('addSuccess'));
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success(t('deleteSuccess'));
      fetchProducts();
    } catch (e) {
      toast.error(t('deleteFailed'));
    }
  };

  const resetForm = () => {
    setFormData({
      code: "", barcode: "", name: "", category_id: "", unit: "件",
      cost_price: 0, margin1: 0, margin2: 0, margin3: 0,
      price1: 0, price2: 0, price3: 0, wholesale_price: 0, box_quantity: 1,
      retail_price: 0, min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active"
    });
  };

  // Get Bs. rate for a category: use category rate if > 1, otherwise use system rate
  const getCategoryRate = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    const catRate = cat?.exchange_rate || 0;
    return catRate > 1 ? catRate : (exchangeRates.usd_to_ves || 1);
  };
  const localSymbol = exchangeRates.local_currency_symbol || 'Bs.';
  const sysRate = exchangeRates.usd_to_ves || 1;
  const selectedCatRate = getCategoryRate(formData.category_id);
  const toBs = (usd) => (usd * selectedCatRate).toFixed(2);
  // Auto-calc: USD selling price = cost × category_rate / system_rate
  const autoCalcPrice = (cost, catRate) => {
    if (!cost || !catRate || catRate <= 1 || !sysRate) return 0;
    return Math.round(cost * catRate / sysRate * 100) / 100;
  };

  // Import functionality
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState("skip");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await axios.post(`${API}/products/import?mode=${importMode}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setImportResult(res.data);
      toast.success(t('importSuccess'));
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('importFailed'));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    window.open(`${API}/products/import/template`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('productManagement')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setShowImport(true); setImportResult(null); setImportFile(null); }} variant="outline" className="border-slate-600 text-slate-300" data-testid="import-products-btn">
            <Upload className="w-4 h-4 mr-2" /> {t('importProducts')}
          </Button>
          <Button onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" /> {t('addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t('searchProduct')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
            data-testid="product-search"
          />
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('productCode')}</TableHead>
              <TableHead className="text-slate-300">{t('productName')}</TableHead>
              <TableHead className="text-slate-300">{t('category')}</TableHead>
              <TableHead className="text-slate-300">{t('costPrice')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}1%</TableHead>
              <TableHead className="text-slate-300">{t('price1')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}2%</TableHead>
              <TableHead className="text-slate-300">{t('price2')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}3%</TableHead>
              <TableHead className="text-slate-300">{t('price3Box')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const catRate = getCategoryRate(product.category_id);
              const cat = categories.find(c => c.id === product.category_id);
              return (
              <TableRow key={product.id} className="border-slate-700">
                <TableCell className="text-slate-300">{product.code}</TableCell>
                <TableCell className="text-white font-medium">{product.name}</TableCell>
                <TableCell className="text-slate-400 text-xs">{cat?.name || '-'}</TableCell>
                <TableCell className="text-slate-400">
                  <div>${(product.cost_price || 0).toFixed(2)}</div>
                  <div className="text-cyan-400 text-xs">{localSymbol}{((product.cost_price || 0) * catRate).toFixed(2)}</div>
                </TableCell>
                <TableCell className="text-orange-400">{(product.margin1 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-emerald-400">
                  <div>${(product.price1 || product.retail_price || 0).toFixed(2)}</div>
                  <div className="text-cyan-400 text-xs">{localSymbol}{((product.price1 || product.retail_price || 0) * catRate).toFixed(2)}</div>
                </TableCell>
                <TableCell className="text-orange-400">{(product.margin2 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-yellow-400">
                  <div>${(product.price2 || 0).toFixed(2)}</div>
                  <div className="text-cyan-400 text-xs">{localSymbol}{((product.price2 || 0) * catRate).toFixed(2)}</div>
                </TableCell>
                <TableCell className="text-orange-400">{(product.margin3 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-blue-400">
                  <div>${(product.price3 || product.wholesale_price || 0).toFixed(2)}</div>
                  <div className="text-cyan-400 text-xs">{localSymbol}{((product.price3 || product.wholesale_price || 0) * catRate).toFixed(2)}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? t('active') : t('inactive')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(product)} className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Info */}
            <div>
              <label className="text-sm text-slate-300">{t('productCode')}</label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-code" />
            </div>
            <div>
              <label className="text-sm text-slate-300">Barcode</label>
              <Input value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300">{t('productName')}</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-name" />
            </div>

            {/* Category with Exchange Rate */}
            <div>
              <label className="text-sm text-slate-300">{t('category')}</label>
              <Select value={formData.category_id} onValueChange={(v) => {
                const newCatRate = getCategoryRate(v);
                const cost = formData.cost_price || 0;
                const autoPrice = autoCalcPrice(cost, newCatRate);
                if (autoPrice > 0) {
                  setFormData({...formData, category_id: v, price1: autoPrice, price2: autoPrice, price3: autoPrice});
                } else {
                  setFormData({...formData, category_id: v});
                }
              }}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name} {cat.exchange_rate > 1 ? `(${localSymbol}${cat.exchange_rate})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.category_id && (
                <p className="text-xs text-cyan-400 mt-1" data-testid="category-rate-display">
                  {t('exchangeRates')}: $1 = {localSymbol}{selectedCatRate}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('unit')}</label>
              <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>

            {/* Price Settings */}
            <div className="col-span-2 bg-slate-900 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-400">{t('priceSettings')} ({t('marginFormula')})</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-400">{t('costPrice')} ($)</label>
                  <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    const catRate = selectedCatRate;
                    // Auto-calc from category rate if available
                    const autoPrice = autoCalcPrice(cost, catRate);
                    if (autoPrice > 0) {
                      setFormData({...formData, cost_price: cost, price1: autoPrice, price2: autoPrice, price3: autoPrice});
                    } else {
                      const m1 = formData.margin1 || 0;
                      const m2 = formData.margin2 || 0;
                      const m3 = formData.margin3 || 0;
                      setFormData({...formData, cost_price: cost,
                        price1: m1 > 0 ? Math.round(cost * (1 + m1/100) * 100) / 100 : formData.price1,
                        price2: m2 > 0 ? Math.round(cost * (1 + m2/100) * 100) / 100 : formData.price2,
                        price3: m3 > 0 ? Math.round(cost * (1 + m3/100) * 100) / 100 : formData.price3
                      });
                    }
                  }} className="bg-slate-700 border-slate-600" data-testid="product-cost" />
                  {formData.cost_price > 0 && formData.category_id && (
                    <p className="text-xs text-cyan-400 mt-0.5">{localSymbol}{toBs(formData.cost_price)}</p>
                  )}
                  {formData.cost_price > 0 && selectedCatRate > 1 && (
                    <p className="text-xs text-emerald-400 mt-0.5">
                      {t('pricingLocalBased')}: ${formData.cost_price}×{selectedCatRate}/{sysRate} = ${autoCalcPrice(formData.cost_price, selectedCatRate).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{t('margin')}1 (%)</label>
                  <Input type="number" step="0.1" value={formData.margin1} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin1: m, price1: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price1});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin1" />
                  <div className="text-xs text-emerald-400 font-medium">
                    {t('price1')}: ${(formData.price1 || 0).toFixed(2)}
                    {formData.category_id && <span className="text-cyan-400 ml-1">({localSymbol}{toBs(formData.price1 || 0)})</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{t('margin')}2 (%)</label>
                  <Input type="number" step="0.1" value={formData.margin2} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin2: m, price2: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price2});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin2" />
                  <div className="text-xs text-yellow-400 font-medium">
                    {t('price2')}: ${(formData.price2 || 0).toFixed(2)}
                    {formData.category_id && <span className="text-cyan-400 ml-1">({localSymbol}{toBs(formData.price2 || 0)})</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">{t('margin')}3 (%) {t('box')}</label>
                  <Input type="number" step="0.1" value={formData.margin3} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin3: m, price3: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price3});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin3" />
                  <div className="text-xs text-blue-400 font-medium">
                    {t('price3Box')}: ${(formData.price3 || 0).toFixed(2)}
                    {formData.category_id && <span className="text-cyan-400 ml-1">({localSymbol}{toBs(formData.price3 || 0)})</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div>
              <label className="text-sm text-slate-300">{t('wholesale')} ($)</label>
              <Input type="number" step="0.01" value={formData.wholesale_price} onChange={(e) => setFormData({...formData, wholesale_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
              {formData.wholesale_price > 0 && formData.category_id && (
                <p className="text-xs text-cyan-400 mt-0.5">{localSymbol}{toBs(formData.wholesale_price)}</p>
              )}
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('boxQuantity')}</label>
              <Input type="number" value={formData.box_quantity} onChange={(e) => setFormData({...formData, box_quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600" />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('stockAlerts')} ({t('quantity')})</label>
              <Input type="number" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600" placeholder="0" />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('status')}</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300">{t('notes')}</label>
              <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="product-submit">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('importProducts')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input
                type="file"
                accept=".csv,.xlsx,.xls,.json"
                onChange={(e) => setImportFile(e.target.files[0])}
                className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer"
                data-testid="import-file-input"
              />
              <p className="text-xs text-slate-400 mt-2">{t('supportedFormats')}: Excel (.xlsx/.xls), CSV, JSON</p>
            </div>

            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('duplicateHandling')}</label>
              <Select value={importMode} onValueChange={setImportMode}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">{t('skipDuplicate')}</SelectItem>
                  <SelectItem value="overwrite">{t('overwriteDuplicate')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={downloadTemplate} variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="download-template-btn">
              <Download className="w-4 h-4 mr-2" /> {t('downloadTemplate')}
            </Button>

            {importResult && (
              <div className="bg-slate-700 rounded-lg p-4 space-y-1">
                <h4 className="font-medium text-white mb-2">{t('importResult')}</h4>
                <p className="text-emerald-400 text-sm">{t('created')}: {importResult.created}</p>
                <p className="text-blue-400 text-sm">{t('updated')}: {importResult.updated}</p>
                <p className="text-yellow-400 text-sm">{t('skipped')}: {importResult.skipped}</p>
                <p className="text-red-400 text-sm">{t('failed')}: {importResult.failed}</p>
                {importResult.errors?.length > 0 && (
                  <div className="mt-2 text-xs text-red-300 space-y-1">
                    {importResult.errors.map((err, i) => <p key={i}>{err}</p>)}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowImport(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleImport} disabled={!importFile || importing} className="bg-emerald-500 hover:bg-emerald-600" data-testid="start-import-btn">
              {importing ? t('importing') : t('startImport')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stores Management
const StoresPage = () => {
  const { t } = useLang();
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    code: "", name: "", type: "retail", address: "", phone: "", warehouse_id: "", is_headquarters: false, status: "active"
  });

  useEffect(() => {
    fetchStores();
    fetchWarehouses();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await axios.get(`${API}/stores`);
      setStores(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${API}/warehouses`);
      setWarehouses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingStore) {
        await axios.put(`${API}/stores/${editingStore.id}`, formData);
        toast.success(t('updateSuccess'));
      } else {
        await axios.post(`${API}/stores`, formData);
        toast.success(t('addSuccess'));
      }
      setShowForm(false);
      setEditingStore(null);
      fetchStores();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData(store);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await axios.delete(`${API}/stores/${id}`);
      toast.success(t('deleteSuccess'));
      fetchStores();
    } catch (e) {
      toast.error(t('deleteFailed'));
    }
  };

  const storeTypes = { retail: t('physicalStore'), online: t('onlineStore'), warehouse: t('warehouse') };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('storeManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", type: "retail", address: "", phone: "", warehouse_id: "", is_headquarters: false, status: "active" }); setEditingStore(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-store-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('addStore')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white font-semibold">{store.name}</h3>
                    {store.is_headquarters && <Badge className="bg-yellow-500/20 text-yellow-400">{t('headquarters')}</Badge>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{store.code}</p>
                </div>
                <Badge variant={store.type === 'online' ? 'default' : 'secondary'}>
                  {storeTypes[store.type]}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-slate-300"><span className="text-slate-500">{t('address')}:</span> {store.address || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">{t('phone')}:</span> {store.phone || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">{t('associatedWarehouse')}:</span> {warehouses.find(w => w.id === store.warehouse_id)?.name || '-'}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(store)} className="flex-1 border-slate-600 text-slate-300">
                  <Edit className="w-4 h-4 mr-1" /> {t('edit')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(store.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{editingStore ? t('editStore') : t('addStore')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('storeCode')}</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-code" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('storeName')}</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('type')}</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">{t('physicalStore')}</SelectItem>
                    <SelectItem value="online">{t('onlineStore')}</SelectItem>
                    <SelectItem value="warehouse">{t('warehouse')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('associatedWarehouse')}</label>
                <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder={t('selectWarehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('address')}</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('phone')}</label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="store-submit">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Warehouses Management
const WarehousesPage = () => {
  const { t } = useLang();
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", address: "", is_main: false, store_id: "" });

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    if (selectedWarehouse) {
      fetchInventory(selectedWarehouse);
    }
  }, [selectedWarehouse]);

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${API}/warehouses`);
      setWarehouses(res.data);
      if (res.data.length > 0 && !selectedWarehouse) {
        setSelectedWarehouse(res.data[0].id);
      }
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (warehouseId) => {
    try {
      const res = await axios.get(`${API}/inventory`, { params: { warehouse_id: warehouseId } });
      setInventory(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/warehouses`, formData);
      toast.success(t('addSuccess'));
      setShowForm(false);
      fetchWarehouses();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('warehouseManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", address: "", is_main: false, store_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-warehouse-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('addWarehouse')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {warehouses.map((wh) => (
          <Card 
            key={wh.id} 
            className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${selectedWarehouse === wh.id ? 'ring-2 ring-emerald-500' : ''}`}
            onClick={() => setSelectedWarehouse(wh.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${wh.is_main ? 'bg-yellow-500/20' : 'bg-slate-700'}`}>
                  <Warehouse className={`w-5 h-5 ${wh.is_main ? 'text-yellow-400' : 'text-slate-400'}`} />
                </div>
                <div>
                  <h3 className="text-white font-medium">{wh.name}</h3>
                  <p className="text-slate-400 text-xs">{wh.code}</p>
                </div>
              </div>
              {wh.is_main && <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">{t('mainWarehouse')}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWarehouse && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('inventoryList')} - {warehouses.find(w => w.id === selectedWarehouse)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">{t('productCode')}</TableHead>
                  <TableHead className="text-slate-300">{t('productName')}</TableHead>
                  <TableHead className="text-slate-300">{t('inventoryQty')}</TableHead>
                  <TableHead className="text-slate-300">{t('reservedQty')}</TableHead>
                  <TableHead className="text-slate-300">{t('availableQty')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((inv) => (
                  <TableRow key={inv.id} className="border-slate-700">
                    <TableCell className="text-slate-300">{inv.product?.code}</TableCell>
                    <TableCell className="text-white">{inv.product?.name}</TableCell>
                    <TableCell className="text-white">{inv.quantity}</TableCell>
                    <TableCell className="text-orange-400">{inv.reserved || 0}</TableCell>
                    <TableCell className="text-emerald-400">{inv.available}</TableCell>
                  </TableRow>
                ))}
                {inventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-400">{t('noInventoryData')}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('addWarehouse')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">{t('warehouseCode')}</label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-code" />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('warehouseName')}</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-name" />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('address')}</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_main} onChange={(e) => setFormData({...formData, is_main: e.target.checked})} className="rounded" />
              <label className="text-sm text-slate-300">{t('setMainWarehouse')}</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="warehouse-submit">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Online Orders Management
const OnlineOrdersPage = () => {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const res = await axios.get(`${API}/shop/orders`, { params });
      setOrders(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载订单失败");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async (orderId) => {
    try {
      await axios.put(`${API}/shop/orders/${orderId}/confirm-payment`);
      toast.success("Pago confirmado / 支付已确认");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "确认失败");
    }
  };

  const handleShip = async (orderId) => {
    try {
      await axios.put(`${API}/shop/orders/${orderId}/ship`);
      toast.success("Enviado / 已发货");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "发货失败");
    }
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    completed: "bg-emerald-500/20 text-emerald-400",
    cancelled: "bg-red-500/20 text-red-400"
  };

  const statusLabels = {
    pending: "Pendiente",
    processing: "Procesando",
    shipped: "Enviado",
    completed: "Completado",
    cancelled: "Cancelado"
  };

  const paymentMethodLabels = {
    transfer: "Transferencia",
    pago_movil: "Pago Móvil"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('onlineOrders')}</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder={t('all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="pending">{t('pending')}</SelectItem>
            <SelectItem value="processing">{t('processing')}</SelectItem>
            <SelectItem value="shipped">{t('shipped')}</SelectItem>
            <SelectItem value="completed">{t('completed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">#</TableHead>
              <TableHead className="text-slate-300">{t('customer')}</TableHead>
              <TableHead className="text-slate-300">{t('paymentMethod')}</TableHead>
              <TableHead className="text-slate-300">Ref</TableHead>
              <TableHead className="text-slate-300">{t('total')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('date')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow className="border-slate-700 cursor-pointer hover:bg-slate-700/50" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                  <TableCell className="text-white font-mono text-xs">{order.order_no}</TableCell>
                  <TableCell>
                    <p className="text-white text-sm">{order.shipping_name}</p>
                    <p className="text-slate-400 text-xs">{order.shipping_phone}</p>
                    <p className="text-slate-500 text-xs">{order.shipping_address}</p>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">{paymentMethodLabels[order.payment_method] || order.payment_method}</TableCell>
                  <TableCell className="text-yellow-400 font-mono text-sm">{order.payment_reference || '-'}</TableCell>
                  <TableCell className="text-emerald-400 font-medium">${(order.total_amount + order.shipping_fee).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                      {order.payment_status === 'paid' ? t('paid') : t('pending')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.payment_status === 'pending' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleConfirmPayment(order.id); }} className="bg-emerald-500 hover:bg-emerald-600 text-xs" data-testid={`confirm-payment-${order.id}`}>
                          {t('confirm')}
                        </Button>
                      )}
                      {order.payment_status === 'paid' && order.order_status === 'processing' && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleShip(order.id); }} className="bg-purple-500 hover:bg-purple-600 text-xs" data-testid={`ship-order-${order.id}`}>
                          {t('shipped')}
                        </Button>
                      )}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                    </div>
                  </TableCell>
                </TableRow>
                {/* Expanded Order Items Detail */}
                {expandedOrder === order.id && (
                  <TableRow className="border-slate-700 bg-slate-900/50">
                    <TableCell colSpan={8} className="p-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-emerald-400 mb-2">{t('orderDetail')}</h4>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-slate-400 text-xs border-b border-slate-700">
                              <th className="text-left py-1 px-2">{t('productName')}</th>
                              <th className="text-right py-1 px-2">{t('unitPrice')}</th>
                              <th className="text-center py-1 px-2">{t('quantity')}</th>
                              <th className="text-right py-1 px-2">{t('amount')}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item, idx) => (
                              <tr key={idx} className="border-b border-slate-700/30">
                                <td className="py-1.5 px-2 text-white">{item.product_name || item.product_id}</td>
                                <td className="py-1.5 px-2 text-right text-slate-300">${(item.unit_price || 0).toFixed(2)}</td>
                                <td className="py-1.5 px-2 text-center text-slate-300">{item.quantity}</td>
                                <td className="py-1.5 px-2 text-right text-emerald-400">${(item.amount || item.unit_price * item.quantity).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="border-t border-slate-600">
                              <td colSpan={3} className="py-1.5 px-2 text-right text-slate-400">{t('total')}:</td>
                              <td className="py-1.5 px-2 text-right text-emerald-400 font-bold">${order.total_amount?.toFixed(2)}</td>
                            </tr>
                            {order.shipping_fee > 0 && (
                              <tr>
                                <td colSpan={3} className="py-1 px-2 text-right text-slate-500 text-xs">{t('shipping')}:</td>
                                <td className="py-1 px-2 text-right text-slate-400 text-xs">${order.shipping_fee?.toFixed(2)}</td>
                              </tr>
                            )}
                          </tfoot>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {orders.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">{t('noData')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// Customers Management
const CustomersPage = () => {
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(`${API}/customers`, { params: { search: search || undefined } });
      setCustomers(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/customers`, formData);
      toast.success(t('addSuccess'));
      setShowForm(false);
      fetchCustomers();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('customerManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-customer-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('addCustomer')}
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t('searchCustomerPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('customerCode')}</TableHead>
              <TableHead className="text-slate-300">{t('customerName')}</TableHead>
              <TableHead className="text-slate-300">{t('phone')}</TableHead>
              <TableHead className="text-slate-300">{t('memberLevel')}</TableHead>
              <TableHead className="text-slate-300">{t('points')}</TableHead>
              <TableHead className="text-slate-300">{t('balance')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id} className="border-slate-700">
                <TableCell className="text-slate-300">{customer.code}</TableCell>
                <TableCell className="text-white font-medium">{customer.name}</TableCell>
                <TableCell className="text-slate-300">{customer.phone || '-'}</TableCell>
                <TableCell>
                  <Badge variant={customer.member_level === 'vip' ? 'default' : 'secondary'}>
                    {customer.member_level === 'vip' ? t('vip') : t('normal')}
                  </Badge>
                </TableCell>
                <TableCell className="text-purple-400">{customer.points}</TableCell>
                <TableCell className="text-emerald-400">${customer.balance?.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('addCustomer')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('customerCode')}</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('customerName')}</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('phone')}</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('email')}</label>
                <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('address')}</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Suppliers Management
const SuppliersPage = () => {
  const { t } = useLang();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "", name: "", contact: "", phone: "", address: "", bank_account: "", tax_id: ""
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`);
      setSuppliers(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/suppliers`, formData);
      toast.success(t('addSuccess'));
      setShowForm(false);
      fetchSuppliers();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try {
      await axios.delete(`${API}/suppliers/${id}`);
      toast.success(t('deleteSuccess'));
      fetchSuppliers();
    } catch (e) {
      toast.error(t('deleteFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('supplierManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", contact: "", phone: "", address: "", bank_account: "", tax_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-supplier-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('addSupplier')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('supplierCode')}</TableHead>
              <TableHead className="text-slate-300">{t('supplierName')}</TableHead>
              <TableHead className="text-slate-300">{t('contact')}</TableHead>
              <TableHead className="text-slate-300">{t('phone')}</TableHead>
              <TableHead className="text-slate-300">{t('address')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suppliers.map((supplier) => (
              <TableRow key={supplier.id} className="border-slate-700">
                <TableCell className="text-slate-300">{supplier.code}</TableCell>
                <TableCell className="text-white font-medium">{supplier.name}</TableCell>
                <TableCell className="text-slate-300">{supplier.contact || '-'}</TableCell>
                <TableCell className="text-slate-300">{supplier.phone || '-'}</TableCell>
                <TableCell className="text-slate-300">{supplier.address || '-'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(supplier.id)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('addSupplier')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('supplierCode')}</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('supplierName')}</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('contact')}</label>
                <Input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('phone')}</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('address')}</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Purchase Orders
const PurchasesPage = () => {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: "", warehouse_id: "", items: [], notes: ""
  });
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1, unit_price: 0 });

  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/purchase-orders`);
      setOrders(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        toast.error(t('loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API}/suppliers`);
      setSuppliers(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${API}/warehouses`);
      setWarehouses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`);
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = () => {
    if (!newItem.product_id || newItem.quantity <= 0) return;
    const product = products.find(p => p.id === newItem.product_id);
    const amount = newItem.quantity * newItem.unit_price;
    setFormData({
      ...formData,
      items: [...formData.items, { ...newItem, amount, product_name: product?.name }]
    });
    setNewItem({ product_id: "", quantity: 1, unit_price: 0 });
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/purchase-orders`, {
        ...formData,
        items: formData.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, amount: i.amount }))
      });
      toast.success(t('createSuccess'));
      setShowForm(false);
      setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" });
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  const handleReceive = async (orderId) => {
    try {
      await axios.put(`${API}/purchase-orders/${orderId}/receive`);
      toast.success(t('receivedStatus'));
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('operationFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('purchaseManagement')}</h1>
        <Button onClick={() => { setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-purchase-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('createPurchaseOrder')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
              <TableHead className="text-slate-300">{t('supplier')}</TableHead>
              <TableHead className="text-slate-300">{t('receiveWarehouse')}</TableHead>
              <TableHead className="text-slate-300">{t('itemCount')}</TableHead>
              <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('createTime')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono">{order.order_no}</TableCell>
                <TableCell className="text-slate-300">{suppliers.find(s => s.id === order.supplier_id)?.name}</TableCell>
                <TableCell className="text-slate-300">{warehouses.find(w => w.id === order.warehouse_id)?.name}</TableCell>
                <TableCell className="text-slate-300">{order.items?.length || 0}</TableCell>
                <TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={order.status === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.status === 'received' ? t('receivedStatus') : t('pendingReceive')}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => handleReceive(order.id)} className="bg-emerald-500 hover:bg-emerald-600">
                      {t('receiveGoods')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('createPurchaseOrder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">{t('supplier')}</label>
                <Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder={t('selectSupplier')} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('receiveWarehouse')}</label>
                <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder={t('selectWarehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(w => (
                      <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">{t('addItems')}</h4>
              <div className="grid grid-cols-4 gap-3">
                <Select value={newItem.product_id} onValueChange={(v) => {
                  const p = products.find(x => x.id === v);
                  setNewItem({...newItem, product_id: v, unit_price: p?.cost_price || 0});
                }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder={t('selectProduct')} />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder={t('quantity')} value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Input type="number" placeholder={t('unitPrice')} value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Button onClick={addItem} className="bg-blue-500 hover:bg-blue-600">{t('add')}</Button>
              </div>
            </div>

            {formData.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">{t('product')}</TableHead>
                    <TableHead className="text-slate-300">{t('quantity')}</TableHead>
                    <TableHead className="text-slate-300">{t('unitPrice')}</TableHead>
                    <TableHead className="text-slate-300">{t('amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item, idx) => (
                    <TableRow key={idx} className="border-slate-700">
                      <TableCell className="text-white">{item.product_name}</TableCell>
                      <TableCell className="text-slate-300">{item.quantity}</TableCell>
                      <TableCell className="text-slate-300">${item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-400">${item.amount?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" disabled={formData.items.length === 0}>
              {t('createPurchaseOrder')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sales Orders
const SalesPage = () => {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API}/sales-orders`);
      setOrders(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) {
        toast.error(t('loadFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('salesManagement')}</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
              <TableHead className="text-slate-300">{t('itemCount')}</TableHead>
              <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
              <TableHead className="text-slate-300">{t('paymentMethod')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('createTime')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono">{order.order_no}</TableCell>
                <TableCell className="text-slate-300">{order.items?.length || 0}</TableCell>
                <TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell>
                <TableCell className="text-slate-300">{order.payment_method === 'cash' ? t('cash') : t('otherPayment')}</TableCell>
                <TableCell>
                  <Badge className={order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.status === 'completed' ? t('completedStatus') : t('pendingStatus')}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// Reports

// Sales Report Page
const SalesReportPage = () => {
  const { t } = useLang();
  const [stores, setStores] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    store_id: "", start_date: "", end_date: ""
  });

  useEffect(() => {
    axios.get(`${API}/stores`).then(r => setStores(r.data)).catch(() => {});
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.store_id) params.store_id = filters.store_id;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get(`${API}/sales-report`, { params });
      setReport(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('salesReportTitle')}</h1>
        {report && (
          <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600" data-testid="print-report-btn">
            <Printer className="w-4 h-4 mr-2" /> {t('printReport')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700 print:hidden">
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('storeFilter')}</label>
              <Select value={filters.store_id} onValueChange={(v) => setFilters({...filters, store_id: v === "all" ? "" : v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 w-48" data-testid="report-store-filter">
                  <SelectValue placeholder={t('all')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('all')}</SelectItem>
                  {stores.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('dateFrom')}</label>
              <Input type="date" value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})}
                className="bg-slate-700 border-slate-600 w-44" data-testid="report-date-from" />
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('dateTo')}</label>
              <Input type="date" value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})}
                className="bg-slate-700 border-slate-600 w-44" data-testid="report-date-to" />
            </div>
            <Button onClick={generateReport} className="bg-emerald-500 hover:bg-emerald-600" disabled={loading} data-testid="generate-report-btn">
              <Search className="w-4 h-4 mr-2" /> {t('generateReport')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {report && (
        <div className="space-y-6 print:text-black" id="sales-report-content">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30 print:border print:border-gray-300">
              <CardContent className="pt-4 text-center">
                <p className="text-emerald-400 text-sm print:text-gray-600">{t('totalSales')}</p>
                <p className="text-3xl font-bold text-white print:text-black">${report.total_sales.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/10 border-blue-500/30 print:border print:border-gray-300">
              <CardContent className="pt-4 text-center">
                <p className="text-blue-400 text-sm print:text-gray-600">{t('totalOrders')}</p>
                <p className="text-3xl font-bold text-white print:text-black">{report.total_orders}</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30 print:border print:border-gray-300">
              <CardContent className="pt-4 text-center">
                <p className="text-yellow-400 text-sm print:text-gray-600">{t('totalItems')}</p>
                <p className="text-3xl font-bold text-white print:text-black">{report.total_items}</p>
              </CardContent>
            </Card>
          </div>

          {/* Store Sales Detail */}
          {report.stores.map(store => (
            <Card key={store.store_id} className="bg-slate-800 border-slate-700 print:border print:border-gray-300">
              <CardHeader>
                <CardTitle className="text-white print:text-black flex justify-between">
                  <span>{store.name}</span>
                  <span className="text-emerald-400 print:text-gray-700">${store.total.toFixed(2)} ({store.orders} {t('items')})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 print:border-gray-300">
                      <TableHead className="text-slate-300 print:text-gray-600">{t('productCode')}</TableHead>
                      <TableHead className="text-slate-300 print:text-gray-600">{t('productName')}</TableHead>
                      <TableHead className="text-right text-slate-300 print:text-gray-600">{t('soldQuantity')}</TableHead>
                      <TableHead className="text-right text-slate-300 print:text-gray-600">{t('salesAmount')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {store.products.map((p, i) => (
                      <TableRow key={i} className="border-slate-700 print:border-gray-300">
                        <TableCell className="text-slate-400 print:text-gray-500">{p.code}</TableCell>
                        <TableCell className="text-white print:text-black">{p.name}</TableCell>
                        <TableCell className="text-right text-blue-400 print:text-gray-700 font-medium">{p.quantity}</TableCell>
                        <TableCell className="text-right text-emerald-400 print:text-gray-700 font-bold">${p.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}

          {/* Order List */}
          {report.orders.length > 0 && (
            <Card className="bg-slate-800 border-slate-700 print:border print:border-gray-300">
              <CardHeader>
                <CardTitle className="text-white print:text-black">{t('salesManagement')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">{t('orderNumber')}</TableHead>
                      <TableHead className="text-slate-300">{t('storeFilter')}</TableHead>
                      <TableHead className="text-slate-300">{t('productSalesDetail')}</TableHead>
                      <TableHead className="text-right text-slate-300">{t('totalAmount')}</TableHead>
                      <TableHead className="text-slate-300">{t('time')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.orders.map(o => (
                      <TableRow key={o.id} className="border-slate-700">
                        <TableCell className="text-white font-mono text-xs">{o.order_no}</TableCell>
                        <TableCell className="text-slate-300">{o.store_name}</TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          {o.items.map((it, i) => (
                            <div key={i}>{it.product_name} ×{it.quantity} ${it.amount.toFixed(2)}</div>
                          ))}
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 font-bold">${o.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-slate-400 text-xs">{new Date(o.created_at).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {report.orders.length === 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="py-12 text-center">
                <p className="text-slate-400">{t('noData')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};


const ReportsPage = () => {
  const [salesSummary, setSalesSummary] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [sales, inventory, top] = await Promise.all([
        axios.get(`${API}/reports/sales-summary`),
        axios.get(`${API}/reports/inventory-summary`),
        axios.get(`${API}/reports/top-products`)
      ]);
      setSalesSummary(sales.data);
      setInventorySummary(inventory.data);
      setTopProducts(top.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-white">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">报表统计</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">门店销售额</p>
            <p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_sales?.toFixed(2) || '0.00'}</p>
            <p className="text-slate-500 text-xs mt-1">{salesSummary?.sales_count || 0} 笔</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">网店销售额</p>
            <p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_online_sales?.toFixed(2) || '0.00'}</p>
            <p className="text-slate-500 text-xs mt-1">{salesSummary?.online_count || 0} 笔</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">库存总量</p>
            <p className="text-2xl font-bold text-white mt-1">{inventorySummary?.total_quantity || 0}</p>
            <p className="text-slate-500 text-xs mt-1">{inventorySummary?.total_items || 0} 种商品</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">库存总值</p>
            <p className="text-2xl font-bold text-white mt-1">${inventorySummary?.total_value?.toFixed(2) || '0.00'}</p>
            <p className="text-red-400 text-xs mt-1">{inventorySummary?.low_stock_count || 0} 种低库存</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">商品销售排行</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">排名</TableHead>
                <TableHead className="text-slate-300">商品名称</TableHead>
                <TableHead className="text-slate-300">销售数量</TableHead>
                <TableHead className="text-slate-300">销售金额</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((item, idx) => (
                <TableRow key={idx} className="border-slate-700">
                  <TableCell className="text-slate-300">{idx + 1}</TableCell>
                  <TableCell className="text-white">{item.product?.name}</TableCell>
                  <TableCell className="text-slate-300">{item.quantity}</TableCell>
                  <TableCell className="text-emerald-400">${item.amount?.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
};

// Exchange Rates Settings Page

// Transfer Management Page - 调货管理
const TransferPage = () => {
  const { t } = useLang();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({
    from_warehouse_id: "", to_warehouse_id: "", product_id: "", quantity: 1
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [wRes, pRes, iRes, tRes] = await Promise.all([
        axios.get(`${API}/warehouses`),
        axios.get(`${API}/products`),
        axios.get(`${API}/inventory`),
        axios.get(`${API}/transfer-logs`).catch(() => ({ data: [] }))
      ]);
      setWarehouses(wRes.data);
      setProducts(pRes.data);
      setInventory(iRes.data);
      setTransfers(tRes.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getStock = (productId, warehouseId) => {
    const inv = inventory.find(i => i.product_id === productId && i.warehouse_id === warehouseId);
    return inv ? inv.quantity : 0;
  };

  const handleTransfer = async () => {
    if (!formData.from_warehouse_id || !formData.to_warehouse_id || !formData.product_id) {
      toast.error(t('fillCompleteInfo')); return;
    }
    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      toast.error(t('sameWarehouseError')); return;
    }
    try {
      await axios.post(`${API}/inventory/transfer`, null, {
        params: formData
      });
      toast.success(t('transferSuccess'));
      setFormData({...formData, quantity: 1});
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || t('transferFailed'));
    }
  };

  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || id;
  const getProductName = (id) => products.find(p => p.id === id)?.name || id;

  if (loading) return <div className="text-white text-center py-12">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('transferManagement')}</h1>

      {/* Transfer Form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('newTransfer')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('sourceWarehouse')}</label>
              <Select value={formData.from_warehouse_id} onValueChange={(v) => setFormData({...formData, from_warehouse_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-from">
                  <SelectValue placeholder={t('source')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('targetWarehouse')}</label>
              <Select value={formData.to_warehouse_id} onValueChange={(v) => setFormData({...formData, to_warehouse_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-to">
                  <SelectValue placeholder={t('target')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.id !== formData.from_warehouse_id).map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('product')}
                {formData.product_id && formData.from_warehouse_id && (
                  <span className="text-yellow-400 ml-1">({t('stock')}: {getStock(formData.product_id, formData.from_warehouse_id)})</span>
                )}
              </label>
              <div className="relative">
                <Input
                  placeholder={t('searchProduct')}
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white" data-testid="transfer-product-search"
                />
                {productSearch && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-slate-700 border border-slate-600 rounded-lg max-h-48 overflow-y-auto shadow-xl">
                    {products.filter(p => 
                      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                      p.code.toLowerCase().includes(productSearch.toLowerCase())
                    ).map(p => (
                      <div key={p.id} onClick={() => { setFormData({...formData, product_id: p.id}); setProductSearch(p.name); }}
                        className="px-3 py-2 hover:bg-slate-600 cursor-pointer flex justify-between">
                        <span className="text-white text-sm">{p.name}</span>
                        <span className="text-slate-400 text-xs">{p.code}</span>
                      </div>
                    ))}
                    {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-2">{t('noResults')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">{t('quantity')}</label>
              <Input type="number" min="1" value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="bg-slate-700 border-slate-600" data-testid="transfer-qty" />
            </div>
            <div>
              <Button onClick={handleTransfer} className="bg-blue-500 hover:bg-blue-600 w-full" data-testid="transfer-submit">
                <ArrowLeftRight className="w-4 h-4 mr-2" /> {t('transferConfirm')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('inventoryOverview')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('product')}</TableHead>
                {warehouses.map(w => (
                  <TableHead key={w.id} className="text-slate-300 text-center">{w.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.filter(p => p.status === 'active').map(product => (
                <TableRow key={product.id} className="border-slate-700">
                  <TableCell className="text-white font-medium">{product.name}</TableCell>
                  {warehouses.map(w => {
                    const stock = getStock(product.id, w.id);
                    return (
                      <TableCell key={w.id} className={`text-center font-medium ${stock <= 0 ? 'text-red-400' : stock < 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                        {stock}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Transfer History */}
      {transfers.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('transferHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">{t('time')}</TableHead>
                  <TableHead className="text-slate-300">{t('product')}</TableHead>
                  <TableHead className="text-slate-300">{t('source')}</TableHead>
                  <TableHead className="text-slate-300">{t('target')}</TableHead>
                  <TableHead className="text-slate-300">{t('quantity')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map(t => (
                  <TableRow key={t.id} className="border-slate-700">
                    <TableCell className="text-slate-300">{new Date(t.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-white">{getProductName(t.product_id)}</TableCell>
                    <TableCell className="text-orange-400">{getWarehouseName(t.from_warehouse_id)}</TableCell>
                    <TableCell className="text-emerald-400">{getWarehouseName(t.to_warehouse_id)}</TableCell>
                    <TableCell className="text-blue-400 font-bold">{t.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


const ExchangeRatesPage = () => {
  const { t } = useLang();
  const [rates, setRates] = useState({
    usd_to_ves: 36.5,
    usd_to_cop: 4000,
    default_currency: "USD",
    local_currency: "VES",
    local_currency_symbol: "Bs."
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ratesRes, catsRes] = await Promise.all([
        axios.get(`${API}/exchange-rates`),
        axios.get(`${API}/categories`)
      ]);
      setRates(ratesRes.data);
      setCategories(catsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRates = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/exchange-rates?usd_to_ves=${rates.usd_to_ves}&usd_to_cop=${rates.usd_to_cop}&default_currency=${rates.default_currency}&local_currency=${rates.local_currency}&local_currency_symbol=${encodeURIComponent(rates.local_currency_symbol)}`);
      toast.success(t('ratesUpdated'));
    } catch (e) {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateCategoryRate = async (categoryId, newRate) => {
    try {
      const cat = categories.find(c => c.id === categoryId);
      await axios.put(`${API}/categories/${categoryId}`, { ...cat, exchange_rate: newRate });
      setCategories(categories.map(c => c.id === categoryId ? { ...c, exchange_rate: newRate } : c));
      toast.success("Tasa de categoría actualizada");
    } catch (e) {
      toast.error("Error al actualizar");
    }
  };

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('exchangeRates')}</h1>

      {/* System Exchange Rates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('systemRates')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-slate-300">USD → Bolívares (VES)</label>
              <Input
                type="number"
                value={rates.usd_to_ves}
                onChange={(e) => setRates({ ...rates, usd_to_ves: parseFloat(e.target.value) || 0 })}
                className="bg-slate-700 border-slate-600 text-white text-lg"
                step="0.01"
              />
              <p className="text-xs text-slate-500 mt-1">$1 USD = Bs.{rates.usd_to_ves}</p>
            </div>
            <div>
              <label className="text-sm text-slate-300">USD → Pesos Colombianos</label>
              <Input
                type="number"
                value={rates.usd_to_cop}
                onChange={(e) => setRates({ ...rates, usd_to_cop: parseFloat(e.target.value) || 0 })}
                className="bg-slate-700 border-slate-600 text-white text-lg"
              />
              <p className="text-xs text-slate-500 mt-1">$1 USD = COP {rates.usd_to_cop}</p>
            </div>
            <div>
              <label className="text-sm text-slate-300">Símbolo Local</label>
              <Input
                value={rates.local_currency_symbol}
                onChange={(e) => setRates({ ...rates, local_currency_symbol: e.target.value })}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Bs."
              />
            </div>
          </div>
          <Button onClick={handleSaveRates} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving}>
            {saving ? t('saving') : t('saveRates')}
          </Button>
        </CardContent>
      </Card>

      {/* Category Exchange Rates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('categoryRates')}</CardTitle>
          <p className="text-slate-400 text-sm">{t('categoryRateDesc')}</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('productCode')}</TableHead>
                <TableHead className="text-slate-300">{t('category')}</TableHead>
                <TableHead className="text-slate-300">{t('exchangeRates')}</TableHead>
                <TableHead className="text-slate-300">{t('example')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(cat => (
                <TableRow key={cat.id} className="border-slate-700">
                  <TableCell className="text-slate-400">{cat.code}</TableCell>
                  <TableCell className="text-white font-medium">{cat.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={cat.exchange_rate || rates.usd_to_ves}
                      onChange={(e) => handleUpdateCategoryRate(cat.id, parseFloat(e.target.value) || 0)}
                      className="bg-slate-700 border-slate-600 w-32"
                      step="0.01"
                    />
                  </TableCell>
                  <TableCell className="text-yellow-400">
                    $10 → Bs.{((cat.exchange_rate || rates.usd_to_ves) * 10).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Quick Converter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('quickConverter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">$1 USD</p>
              <p className="text-2xl font-bold text-emerald-400">=</p>
              <p className="text-xl font-bold text-yellow-400">Bs.{rates.usd_to_ves}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">$10 USD</p>
              <p className="text-2xl font-bold text-emerald-400">=</p>
              <p className="text-xl font-bold text-yellow-400">Bs.{(rates.usd_to_ves * 10).toFixed(2)}</p>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-4">
              <p className="text-slate-400 text-sm">$100 USD</p>
              <p className="text-2xl font-bold text-emerald-400">=</p>
              <p className="text-xl font-bold text-yellow-400">Bs.{(rates.usd_to_ves * 100).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Payment Settings Page
const PaymentSettingsPage = () => {
  const { t } = useLang();
  const [settings, setSettings] = useState({
    transfer_enabled: true,
    transfer_bank_name: "",
    transfer_account_number: "",
    transfer_account_holder: "",
    transfer_rif: "",
    pago_movil_enabled: true,
    pago_movil_phone: "",
    pago_movil_bank_code: "",
    pago_movil_cedula: "",
    whatsapp_number: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/payment-settings`);
      setSettings(prev => ({ ...prev, ...res.data }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/payment-settings`, settings);
      toast.success(t('settingsSaved'));
    } catch (e) {
      toast.error(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const venezuelaBanks = [
    { code: "0102", name: "Banco de Venezuela" },
    { code: "0104", name: "Venezolano de Crédito" },
    { code: "0105", name: "Mercantil" },
    { code: "0108", name: "Provincial" },
    { code: "0114", name: "Bancaribe" },
    { code: "0115", name: "Exterior" },
    { code: "0128", name: "Banco Caroní" },
    { code: "0134", name: "Banesco" },
    { code: "0137", name: "Sofitasa" },
    { code: "0138", name: "Banco Plaza" },
    { code: "0151", name: "BFC Banco Fondo Común" },
    { code: "0156", name: "100% Banco" },
    { code: "0157", name: "Del Sur" },
    { code: "0163", name: "Banco del Tesoro" },
    { code: "0166", name: "Banco Agrícola" },
    { code: "0168", name: "Bancrecer" },
    { code: "0169", name: "Mi Banco" },
    { code: "0171", name: "Banco Activo" },
    { code: "0172", name: "Bancamiga" },
    { code: "0174", name: "Banplus" },
    { code: "0175", name: "Bicentenario" },
    { code: "0177", name: "Banfanb" },
  ];

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('paymentSettings')}</h1>
      <p className="text-slate-400">{t('paymentSettings')}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transfer Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{t('bankTransfer')}</CardTitle>
              <input 
                type="checkbox" 
                checked={settings.transfer_enabled} 
                onChange={(e) => setSettings({...settings, transfer_enabled: e.target.checked})}
                className="w-5 h-5 rounded"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">{t('bankName')}</label>
              <Select value={settings.transfer_bank_name} onValueChange={(v) => setSettings({...settings, transfer_bank_name: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Seleccione banco" />
                </SelectTrigger>
                <SelectContent>
                  {venezuelaBanks.map(bank => (
                    <SelectItem key={bank.code} value={bank.name}>{bank.code} - {bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('accountNumber')}</label>
              <Input 
                value={settings.transfer_account_number} 
                onChange={(e) => setSettings({...settings, transfer_account_number: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="0102-0000-00-0000000000"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('accountHolder')}</label>
              <Input 
                value={settings.transfer_account_holder} 
                onChange={(e) => setSettings({...settings, transfer_account_holder: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">RIF</label>
              <Input 
                value={settings.transfer_rif} 
                onChange={(e) => setSettings({...settings, transfer_rif: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="V-12345678-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Pago Movil Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">{t('mobilePay')}</CardTitle>
              <input 
                type="checkbox" 
                checked={settings.pago_movil_enabled} 
                onChange={(e) => setSettings({...settings, pago_movil_enabled: e.target.checked})}
                className="w-5 h-5 rounded"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">Teléfono / 手机号码</label>
              <Input 
                value={settings.pago_movil_phone} 
                onChange={(e) => setSettings({...settings, pago_movil_phone: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="0412-1234567"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('selectBank')}</label>
              <Select value={settings.pago_movil_bank_code} onValueChange={(v) => setSettings({...settings, pago_movil_bank_code: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Seleccione banco" />
                </SelectTrigger>
                <SelectContent>
                  {venezuelaBanks.map(bank => (
                    <SelectItem key={bank.code} value={bank.code}>{bank.code} - {bank.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('idNumber')}</label>
              <Input 
                value={settings.pago_movil_cedula} 
                onChange={(e) => setSettings({...settings, pago_movil_cedula: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="V-12345678"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            {t('whatsappContact')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">{t('whatsappNumber')}</label>
            <Input 
              value={settings.whatsapp_number} 
              onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})}
              className="bg-slate-700 border-slate-600"
              placeholder="584121234567 (con código de país)"
            />
            <p className="text-xs text-slate-500 mt-1">Ingrese el número con código de país, sin + ni espacios. Ej: 584121234567</p>
          </div>
          {settings.whatsapp_number && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <p className="text-sm text-green-400">{t('whatsappEnabled')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving} data-testid="save-payment-settings">
          {saving ? t('saving') : t('saveSettings')}
        </Button>
      </div>

      {/* Preview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">{t('preview')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settings.transfer_enabled && (
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-400 mb-2">Datos para Transferencia:</p>
              <p className="text-sm text-slate-300">Banco: {settings.transfer_bank_name || '-'}</p>
              <p className="text-sm text-slate-300">Cuenta: {settings.transfer_account_number || '-'}</p>
              <p className="text-sm text-slate-300">Titular: {settings.transfer_account_holder || '-'}</p>
              <p className="text-sm text-slate-300">RIF: {settings.transfer_rif || '-'}</p>
            </div>
          )}
          {settings.pago_movil_enabled && (
            <div className="bg-slate-700/50 p-4 rounded-lg">
              <p className="text-sm font-medium text-yellow-400 mb-2">Datos para Pago Móvil:</p>
              <p className="text-sm text-slate-300">Teléfono: {settings.pago_movil_phone || '-'}</p>
              <p className="text-sm text-slate-300">Banco: {settings.pago_movil_bank_code || '-'}</p>
              <p className="text-sm text-slate-300">Cédula: {settings.pago_movil_cedula || '-'}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Online Shop (Public)
const ShopPage = () => {
  const { t, lang, changeLang } = useLang();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [checkoutForm, setCheckoutForm] = useState({
    customer_id: "", shipping_name: "", shipping_phone: "", shipping_address: "",
    payment_method: "transfer", payment_reference: ""
  });
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchPaymentSettings();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/shop/products`);
      setProducts(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/shop/categories`);
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await axios.get(`${API}/payment-settings`);
      setPaymentSettings(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (product) => {
    const price = product.price1 || product.retail_price || 0;
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? {...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * price} : i));
    } else {
      setCart([...cart, { product_id: product.id, product, quantity: 1, unit_price: price, amount: price }]);
    }
    toast.success(t('addToCart'));
  };

  const updateCartItem = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(i => i.product_id !== productId));
    } else {
      setCart(cart.map(i => i.product_id === productId ? {...i, quantity, amount: i.unit_price * quantity} : i));
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.amount, 0);
  const shippingFee = cartTotal >= 100 ? 0 : 10;
  const orderTotal = cartTotal + shippingFee;

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === "all" || p.category_id === selectedCategory;
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleCheckout = async () => {
    if (!checkoutForm.shipping_name || !checkoutForm.shipping_phone || !checkoutForm.shipping_address) {
      toast.error("请填写完整的收货信息");
      return;
    }
    if (!checkoutForm.payment_reference) {
      toast.error("请填写支付参考号");
      return;
    }
    try {
      const res = await axios.post(`${API}/shop/orders`, {
        customer_id: checkoutForm.customer_id || "guest",
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, discount: 0, amount: i.amount })),
        shipping_name: checkoutForm.shipping_name,
        shipping_phone: checkoutForm.shipping_phone,
        shipping_address: checkoutForm.shipping_address,
        payment_method: checkoutForm.payment_method,
        payment_reference: checkoutForm.payment_reference
      });
      setOrderSuccess(res.data);
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
      toast.success("¡Pedido creado exitosamente!");
    } catch (e) {
      toast.error(e.response?.data?.detail || "下单失败");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">{t('shopTitle')}</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex gap-0.5">
              {[{k:'zh',l:'中'},{k:'en',l:'EN'},{k:'es',l:'ES'}].map(({k,l}) => (
                <button key={k} onClick={() => changeLang(k)}
                  className={`px-1.5 py-0.5 text-xs rounded ${lang === k ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                  data-testid={`shop-lang-${k}`}
                >{l}</button>
              ))}
            </div>
            <Link to="/shop/orders" className="text-slate-400 hover:text-white text-sm">
              {t('myOrders')}
            </Link>
            <Link to="/admin" className="text-slate-400 hover:text-white text-sm">
              Admin
            </Link>
            <Button variant="outline" className="relative border-slate-600 text-slate-300" onClick={() => setShowCart(true)} data-testid="cart-btn">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full text-xs flex items-center justify-center text-white">
                  {cart.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Category Filter + Search */}
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('searchProduct')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
              data-testid="shop-search"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className={`h-8 ${selectedCategory === "all" ? "bg-emerald-500" : "border-slate-600 text-slate-300"}`}
              data-testid="shop-cat-all"
            >
              {t('all')}
            </Button>
            {categories.map(cat => (
              <Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className={`h-8 ${selectedCategory === cat.id ? "bg-emerald-500" : "border-slate-600 text-slate-300"}`}
                data-testid={`shop-cat-${cat.id}`}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const price = product.price1 || product.retail_price || 0;
            return (
            <Card key={product.id} className="bg-slate-800 border-slate-700 overflow-hidden">
              <div className="aspect-square bg-slate-700 flex items-center justify-center">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-12 h-12 text-slate-500" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="text-white font-medium truncate">{product.name}</h3>
                <p className="text-slate-400 text-sm">{product.code}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-emerald-400 font-bold">${price.toFixed(2)}</span>
                  <span className="text-slate-500 text-sm">{t('stock')}: {product.stock}</span>
                </div>
                <Button 
                  className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600" 
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  data-testid={`add-to-cart-${product.id}`}
                >
                  {product.stock > 0 ? t('addToCart') : t('noData')}
                </Button>
              </CardContent>
            </Card>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-400">{t('noData')}</div>
          )}
        </div>
      </main>

      {/* Cart Drawer */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('cart')}</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-8">{t('noData')}</p>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product_id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.product.name}</p>
                    <p className="text-emerald-400">${item.unit_price?.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateCartItem(item.product_id, item.quantity - 1)} className="border-slate-600">-</Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="sm" variant="outline" onClick={() => updateCartItem(item.product_id, item.quantity + 1)} className="border-slate-600">+</Button>
                  </div>
                </div>
              ))}
              <div className="border-t border-slate-700 pt-4">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">{t('total')}:</span>
                  <span className="text-emerald-400 font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600" onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="checkout-btn">
                  {t('checkoutTitle')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('paymentInfo')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Shipping Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-emerald-400">{t('shippingInfo')}</h3>
              <div>
                <label className="text-sm text-slate-300">{t('name')}</label>
                <Input value={checkoutForm.shipping_name} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-name" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('phone')}</label>
                <Input value={checkoutForm.shipping_phone} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_phone: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-phone" />
              </div>
              <div>
                <label className="text-sm text-slate-300">{t('address')}</label>
                <Input value={checkoutForm.shipping_address} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-address" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-emerald-400">{t('paymentMethod')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {paymentSettings?.transfer_enabled && (
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${checkoutForm.payment_method === 'transfer' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`}
                    onClick={() => setCheckoutForm({...checkoutForm, payment_method: 'transfer'})}
                    data-testid="payment-transfer"
                  >
                    <p className="font-medium text-white">Transferencia</p>
                    <p className="text-xs text-slate-400">银行转账</p>
                  </div>
                )}
                {paymentSettings?.pago_movil_enabled && (
                  <div 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${checkoutForm.payment_method === 'pago_movil' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`}
                    onClick={() => setCheckoutForm({...checkoutForm, payment_method: 'pago_movil'})}
                    data-testid="payment-pago-movil"
                  >
                    <p className="font-medium text-white">Pago Móvil</p>
                    <p className="text-xs text-slate-400">移动支付</p>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              {checkoutForm.payment_method === 'transfer' && paymentSettings && (
                <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-yellow-400">Datos para Transferencia:</p>
                  <p className="text-sm"><span className="text-slate-400">Banco:</span> {paymentSettings.transfer_bank_name || 'Por configurar'}</p>
                  <p className="text-sm"><span className="text-slate-400">Cuenta:</span> {paymentSettings.transfer_account_number || 'Por configurar'}</p>
                  <p className="text-sm"><span className="text-slate-400">Titular:</span> {paymentSettings.transfer_account_holder || 'Por configurar'}</p>
                  <p className="text-sm"><span className="text-slate-400">RIF:</span> {paymentSettings.transfer_rif || 'Por configurar'}</p>
                </div>
              )}

              {checkoutForm.payment_method === 'pago_movil' && paymentSettings && (
                <div className="bg-slate-700/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-yellow-400">Datos para Pago Móvil:</p>
                  <p className="text-sm"><span className="text-slate-400">Teléfono:</span> {paymentSettings.pago_movil_phone || 'Por configurar'}</p>
                  <p className="text-sm"><span className="text-slate-400">Banco:</span> {paymentSettings.pago_movil_bank_code || 'Por configurar'}</p>
                  <p className="text-sm"><span className="text-slate-400">Cédula:</span> {paymentSettings.pago_movil_cedula || 'Por configurar'}</p>
                </div>
              )}

              {/* Payment Reference */}
              <div>
                <label className="text-sm text-slate-300">Número de Referencia / 参考号 *</label>
                <Input 
                  value={checkoutForm.payment_reference} 
                  onChange={(e) => setCheckoutForm({...checkoutForm, payment_reference: e.target.value})} 
                  className="bg-slate-700 border-slate-600" 
                  placeholder="Ingrese el número de referencia del pago"
                  data-testid="payment-reference"
                />
                <p className="text-xs text-slate-500 mt-1">Ingrese el número de referencia de su transferencia o pago móvil</p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t border-slate-700 pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-300">Subtotal / 商品金额:</span>
                <span className="text-white">${cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Envío / 运费:</span>
                <span className="text-white">{shippingFee === 0 ? 'Gratis' : `$${shippingFee.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700">
                <span className="text-slate-300">Total:</span>
                <span className="text-emerald-400">${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="border-slate-600">Cancelar</Button>
            <Button onClick={handleCheckout} className="bg-emerald-500 hover:bg-emerald-600" data-testid="place-order-btn">
              Confirmar Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <Dialog open={!!orderSuccess} onOpenChange={() => setOrderSuccess(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-emerald-400">¡Pedido Exitoso! / 订单成功</DialogTitle>
          </DialogHeader>
          {orderSuccess && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
                <Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <p className="text-lg font-medium">Pedido #{orderSuccess.order_no}</p>
                <p className="text-sm text-slate-400">Su pedido ha sido recibido</p>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-400">Total:</span> ${(orderSuccess.total_amount + orderSuccess.shipping_fee).toFixed(2)}</p>
                <p><span className="text-slate-400">Estado:</span> Pendiente de confirmación de pago</p>
                <p className="text-yellow-400 text-xs mt-2">* Una vez verificado su pago, procesaremos su pedido.</p>
              </div>
              
              {/* WhatsApp Contact Button */}
              {paymentSettings?.whatsapp_number && (
                <a 
                  href={`https://wa.me/${paymentSettings.whatsapp_number}?text=${encodeURIComponent(
                    `¡Hola! Acabo de realizar un pedido:\n\n` +
                    `📦 Pedido: #${orderSuccess.order_no}\n` +
                    `💰 Total: $${(orderSuccess.total_amount + orderSuccess.shipping_fee).toFixed(2)}\n` +
                    `💳 Método: ${orderSuccess.payment_method === 'pago_movil' ? 'Pago Móvil' : 'Transferencia'}\n` +
                    `🔢 Referencia: ${orderSuccess.payment_reference || 'N/A'}\n\n` +
                    `Por favor confirme mi pago. ¡Gracias!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors"
                  data-testid="whatsapp-contact-btn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Contactar por WhatsApp
                </a>
              )}
              
              <Button onClick={() => setOrderSuccess(null)} className="w-full bg-slate-700 hover:bg-slate-600">
                Cerrar / 关闭
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// App
function AppContent() {
  useEffect(() => {
    // Initialize data on first load
    axios.post(`${API}/init-data`).catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout><Dashboard /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/stores" element={
            <ProtectedRoute>
              <AdminLayout><StoresPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/warehouses" element={
            <ProtectedRoute>
              <AdminLayout><WarehousesPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/products" element={
            <ProtectedRoute>
              <AdminLayout><ProductsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/transfers" element={
            <ProtectedRoute>
              <AdminLayout><TransferPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/customers" element={
            <ProtectedRoute>
              <AdminLayout><CustomersPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/suppliers" element={
            <ProtectedRoute>
              <AdminLayout><SuppliersPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/purchases" element={
            <ProtectedRoute>
              <AdminLayout><PurchasesPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sales" element={
            <ProtectedRoute>
              <AdminLayout><SalesPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/online-orders" element={
            <ProtectedRoute>
              <AdminLayout><OnlineOrdersPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/sales-report" element={
            <ProtectedRoute>
              <AdminLayout><SalesReportPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <AdminLayout><ReportsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/exchange-rates" element={
            <ProtectedRoute>
              <AdminLayout><ExchangeRatesPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/payment-settings" element={
            <ProtectedRoute>
              <AdminLayout><PaymentSettingsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/settings" element={
            <ProtectedRoute>
              <AdminLayout><SystemSettingsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute>
              <AdminLayout><EmployeesPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/stock-alerts" element={
            <ProtectedRoute>
              <AdminLayout><StockAlertsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/admin/stock-taking" element={
            <ProtectedRoute>
              <AdminLayout><StockTakingPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/shop/orders" element={<ShopOrdersPage />} />
          <Route path="/" element={<Navigate to="/shop" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

// Shop Orders Page - Customer Order Lookup
const ShopOrdersPage = () => {
  const [searchType, setSearchType] = useState("order_no");
  const [searchValue, setSearchValue] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Por favor ingrese el número de pedido o teléfono");
      return;
    }
    setLoading(true);
    try {
      const params = searchType === "order_no" 
        ? { order_no: searchValue.trim() }
        : { phone: searchValue.trim() };
      const res = await axios.get(`${API}/shop/order-lookup`, { params });
      setOrders(res.data);
      if (res.data.length === 0) {
        toast.error("No se encontraron pedidos");
      }
    } catch (e) {
      toast.error("Error al buscar pedidos");
    } finally {
      setLoading(false);
    }
  };

  const statusLabels = {
    pending: { text: "Pendiente / 待处理", color: "bg-yellow-500/20 text-yellow-400" },
    processing: { text: "Procesando / 处理中", color: "bg-blue-500/20 text-blue-400" },
    shipped: { text: "Enviado / 已发货", color: "bg-purple-500/20 text-purple-400" },
    completed: { text: "Completado / 已完成", color: "bg-emerald-500/20 text-emerald-400" },
    cancelled: { text: "Cancelado / 已取消", color: "bg-red-500/20 text-red-400" }
  };

  const paymentLabels = {
    pending: { text: "Pendiente / 待支付", color: "bg-yellow-500/20 text-yellow-400" },
    paid: { text: "Pagado / 已支付", color: "bg-emerald-500/20 text-emerald-400" }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/shop" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Mis Pedidos</h1>
            </Link>
          </div>
          <Link to="/shop" className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← Volver a Tienda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Search Box */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Buscar Pedido / 查询订单</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order_no">Nº Pedido / 订单号</SelectItem>
                  <SelectItem value="phone">Teléfono / 电话</SelectItem>
                </SelectContent>
              </Select>
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchType === "order_no" ? "ON2026031300..." : "0412-1234567"}
                className="flex-1 bg-slate-700 border-slate-600 text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                data-testid="order-search-input"
              />
              <Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600" disabled={loading} data-testid="order-search-btn">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {orders.length > 0 && (
          <div className="space-y-4">
            {orders.map(order => (
              <Card key={order.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-white font-bold text-lg">Pedido #{order.order_no}</p>
                      <p className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={paymentLabels[order.payment_status]?.color}>
                        {paymentLabels[order.payment_status]?.text}
                      </Badge>
                      <Badge className={statusLabels[order.order_status]?.color}>
                        {statusLabels[order.order_status]?.text}
                      </Badge>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <p className="text-slate-400 text-sm mb-2">Productos / 商品:</p>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <p className="text-white">{item.product_name || 'Producto'}</p>
                          <p className="text-slate-400 text-xs">{item.product_code}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white">{item.quantity} x ${item.unit_price?.toFixed(2)}</p>
                          <p className="text-emerald-400">${item.amount?.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Summary */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Envío a / 收货人:</p>
                      <p className="text-white">{order.shipping_name}</p>
                      <p className="text-slate-300">{order.shipping_phone}</p>
                      <p className="text-slate-300">{order.shipping_address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400">Subtotal: <span className="text-white">${order.total_amount?.toFixed(2)}</span></p>
                      <p className="text-slate-400">Envío: <span className="text-white">${order.shipping_fee?.toFixed(2)}</span></p>
                      <p className="text-lg font-bold text-emerald-400 mt-2">
                        Total: ${(order.total_amount + order.shipping_fee)?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Payment Info */}
                  {order.payment_reference && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-slate-400 text-sm">
                        Método: <span className="text-white">{order.payment_method === 'pago_movil' ? 'Pago Móvil' : 'Transferencia'}</span>
                        {" | "}Referencia: <span className="text-yellow-400">{order.payment_reference}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Ingrese su número de pedido o teléfono para buscar</p>
          </div>
        )}
      </main>
    </div>
  );
};


// ==================== System Settings Page ====================
const SystemSettingsPage = () => {
  const { t } = useLang();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/api/settings/system`, { headers: { Authorization: `Bearer ${token}` } });
        setSettings(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchSettings();
  }, [API]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/api/settings/system`, settings, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(t('save') + " OK");
    } catch (e) { toast.error("Error saving"); }
  };

  const updateField = (key, value) => setSettings(prev => ({...prev, [key]: value}));

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('systemSettings')}</h1>
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" data-testid="save-settings">{t('save')}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Invoice/Company Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('invoiceHeader')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('companyName')}</label><Input value={settings.company_name || ""} onChange={e => updateField("company_name", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('taxId')}</label><Input value={settings.company_tax_id || ""} onChange={e => updateField("company_tax_id", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('companyAddress')}</label><Input value={settings.company_address || ""} onChange={e => updateField("company_address", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('companyPhone')}</label><Input value={settings.company_phone || ""} onChange={e => updateField("company_phone", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('invoiceFooter')}</label><Input value={settings.invoice_footer || ""} onChange={e => updateField("invoice_footer", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('printFormat')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('printFormat')}</label>
              <Select value={settings.default_print_format || "80mm"} onValueChange={v => updateField("default_print_format", v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">{t('receipt80mm')}</SelectItem>
                  <SelectItem value="A4">{t('receiptA4')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('autoPrint')}</span>
              <button onClick={() => updateField("auto_print_receipt", !settings.auto_print_receipt)} className={`w-12 h-6 rounded-full transition-colors ${settings.auto_print_receipt ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.auto_print_receipt ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div><label className="text-xs text-slate-400">{t('receiptCopies')}</label><Input type="number" value={settings.receipt_copies || 1} onChange={e => updateField("receipt_copies", parseInt(e.target.value) || 1)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Scanner Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('scannerEnabled')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('scannerEnabled')}</span>
              <button onClick={() => updateField("barcode_scanner_enabled", !settings.barcode_scanner_enabled)} className={`w-12 h-6 rounded-full transition-colors ${settings.barcode_scanner_enabled !== false ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.barcode_scanner_enabled !== false ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div><label className="text-xs text-slate-400">Scanner Delay (ms)</label><Input type="number" value={settings.scanner_input_delay || 50} onChange={e => updateField("scanner_input_delay", parseInt(e.target.value) || 50)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Wholesale Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('wholesale')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('wholesaleEnabled')}</span>
              <button onClick={() => updateField("wholesale_enabled", !settings.wholesale_enabled)} className={`w-12 h-6 rounded-full transition-colors ${settings.wholesale_enabled !== false ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.wholesale_enabled !== false ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div><label className="text-xs text-slate-400">{t('wholesaleMinQty')}</label><Input type="number" value={settings.wholesale_min_quantity || 10} onChange={e => updateField("wholesale_min_quantity", parseInt(e.target.value) || 10)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('wholesaleDiscount')} %</label><Input type="number" value={settings.wholesale_discount_percent || 0} onChange={e => updateField("wholesale_discount_percent", parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Document Numbering */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">Document Numbering</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">Sales Prefix</label><Input value={settings.sales_prefix || "SO"} onChange={e => updateField("sales_prefix", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">Transfer Prefix</label><Input value={settings.transfer_prefix || "TR"} onChange={e => updateField("transfer_prefix", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">Purchase Prefix</label><Input value={settings.purchase_prefix || "PO"} onChange={e => updateField("purchase_prefix", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Report Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('reports')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('currency')}</label>
              <Select value={settings.default_report_currency || "USD"} onValueChange={v => updateField("default_report_currency", v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="VES">VES (Bs.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Mode */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('pricingMode')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div
              onClick={() => updateField("pricing_mode", "local_based")}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`}
              data-testid="pricing-local-based"
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500' : 'border-slate-500'}`}>
                  {(settings.pricing_mode === 'local_based' || !settings.pricing_mode) && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <span className="text-white font-medium text-sm">{t('pricingLocalBased')}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingLocalDesc')}</p>
              <p className="text-cyan-400 text-xs mt-1 ml-6">Bs. = $Cost × Dept.Rate | USD = Bs. ÷ Sales Rate</p>
            </div>
            <div
              onClick={() => updateField("pricing_mode", "foreign_direct")}
              className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`}
              data-testid="pricing-foreign-direct"
            >
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500' : 'border-slate-500'}`}>
                  {settings.pricing_mode === 'foreign_direct' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                </div>
                <span className="text-white font-medium text-sm">{t('pricingForeignDirect')}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingForeignDesc')}</p>
              <p className="text-cyan-400 text-xs mt-1 ml-6">USD = $Price | Bs. = $Price × Sales Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ==================== Employees Page ====================
const EmployeesPage = () => {
  const { t } = useLang();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: { can_discount: false, can_refund: false, max_discount: 10 } });
  const [stores, setStores] = useState([]);
  const API = process.env.REACT_APP_BACKEND_URL;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const h = { Authorization: `Bearer ${token}` };
      const [empRes, storesRes] = await Promise.all([
        axios.get(`${API}/api/employees`, { headers: h }),
        axios.get(`${API}/api/stores`, { headers: h })
      ]);
      setEmployees(empRes.data);
      setStores(storesRes.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
      const h = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      if (editing) {
        await axios.put(`${API}/api/employees/${editing}`, form, { headers: h });
      } else {
        await axios.post(`${API}/api/employees`, form, { headers: h });
      }
      toast.success(t('save') + " OK");
      setShowForm(false);
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Deleted");
      fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  const roleColors = { admin: "bg-red-500/20 text-red-400", manager: "bg-purple-500/20 text-purple-400", cashier: "bg-blue-500/20 text-blue-400", staff: "bg-slate-500/20 text-slate-400" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('employees')}</h1>
        <Button onClick={() => { setForm({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: { can_discount: false, can_refund: false, max_discount: 10 } }); setEditing(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600">
          <UserPlus className="w-4 h-4 mr-2" /> {t('add')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('username')}</TableHead>
              <TableHead className="text-slate-300">{t('name')}</TableHead>
              <TableHead className="text-slate-300">{t('phone')}</TableHead>
              <TableHead className="text-slate-300">Role</TableHead>
              <TableHead className="text-slate-300">{t('permission')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} className="border-slate-700">
                <TableCell className="text-white font-medium">{emp.username}</TableCell>
                <TableCell className="text-slate-300">{emp.name}</TableCell>
                <TableCell className="text-slate-400">{emp.phone}</TableCell>
                <TableCell><Badge className={roleColors[emp.role] || roleColors.staff}>{emp.role}</Badge></TableCell>
                <TableCell className="text-xs text-slate-400">
                  {emp.permissions?.can_discount && <Badge className="bg-green-500/10 text-green-400 mr-1">{t('canDiscount')}</Badge>}
                  {emp.permissions?.can_refund && <Badge className="bg-blue-500/10 text-blue-400 mr-1">{t('canRefund')}</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => { setForm({...emp, password: ""}); setEditing(emp.id); setShowForm(true); }}><Edit className="w-4 h-4 text-slate-400" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(emp.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{editing ? t('editProduct') : t('add')} {t('employees')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400">{t('username')}</label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('password')}</label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-slate-700 border-slate-600" placeholder={editing ? "Leave empty to keep" : ""} /></div>
            <div><label className="text-xs text-slate-400">{t('name')}</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('phone')}</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">Role</label>
              <Select value={form.role} onValueChange={v => setForm({...form, role: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-slate-400">{t('storeManagement')}</label>
              <Select value={form.store_id || ""} onValueChange={v => setForm({...form, store_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('all')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('all')}</SelectItem>
                  {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 bg-slate-900 rounded-lg p-3 space-y-2">
              <h4 className="text-sm font-medium text-emerald-400">{t('permission')}</h4>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={form.permissions?.can_discount} onChange={e => setForm({...form, permissions: {...form.permissions, can_discount: e.target.checked}})} /> {t('canDiscount')}
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" checked={form.permissions?.can_refund} onChange={e => setForm({...form, permissions: {...form.permissions, can_refund: e.target.checked}})} /> {t('canRefund')}
                </label>
              </div>
              <div><label className="text-xs text-slate-400">{t('maxDiscount')} %</label><Input type="number" value={form.permissions?.max_discount || 0} onChange={e => setForm({...form, permissions: {...form.permissions, max_discount: parseInt(e.target.value) || 0}})} className="bg-slate-700 border-slate-600 w-24" /></div>
            </div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== Stock Alerts Page ====================
const StockAlertsPage = () => {
  const { t } = useLang();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API}/api/stock-alerts`, { headers: { Authorization: `Bearer ${token}` } });
        setAlerts(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetch();
  }, [API]);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('stockAlerts')}</h1>
      {alerts.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-8 text-center text-slate-400"><Check className="w-12 h-12 mx-auto mb-3 text-emerald-400" /><p>{t('noData')}</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((a, i) => (
            <Card key={i} className={`border ${a.level === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{a.product_name}</p>
                  <p className="text-slate-400 text-sm">{a.product_code}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${a.level === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>{a.current_stock}</p>
                  <p className="text-slate-400 text-xs">min: {a.min_stock}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== Stock Taking Page ====================
const StockTakingPage = () => {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const API = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const h = { Authorization: `Bearer ${token}` };
        const [prodRes, whRes, histRes] = await Promise.all([
          axios.get(`${API}/api/products`, { headers: h }),
          axios.get(`${API}/api/warehouses`, { headers: h }),
          axios.get(`${API}/api/stock-takings`, { headers: h })
        ]);
        setProducts(prodRes.data);
        setWarehouses(whRes.data);
        setHistory(histRes.data);
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, [API]);

  const startTaking = async () => {
    if (!selectedWarehouse) return;
    const token = localStorage.getItem("token");
    const invRes = await axios.get(`${API}/api/inventory?warehouse_id=${selectedWarehouse}`, { headers: { Authorization: `Bearer ${token}` } });
    const inv = invRes.data;
    setItems(products.map(p => {
      const stock = inv.find(i => i.product_id === p.id);
      return { product_id: p.id, product_name: p.name, product_code: p.code, system_qty: stock?.quantity || 0, actual_qty: stock?.quantity || 0, difference: 0 };
    }));
  };

  const updateActualQty = (idx, qty) => {
    setItems(prev => prev.map((item, i) => i === idx ? {...item, actual_qty: qty, difference: qty - item.system_qty} : item));
  };

  const submitTaking = async (status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/api/stock-taking`, { warehouse_id: selectedWarehouse, items, status, notes: "" }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      toast.success(t('save') + " OK");
      setItems([]);
    } catch (e) { toast.error("Error"); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('stockTaking')}</h1>
      
      {items.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6 space-y-4">
            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('warehouseManagement')} /></SelectTrigger>
              <SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
            </Select>
            <Button onClick={startTaking} disabled={!selectedWarehouse} className="bg-emerald-500 hover:bg-emerald-600">{t('stockTaking')}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">{t('productCode')}</TableHead>
                    <TableHead className="text-slate-300">{t('productName')}</TableHead>
                    <TableHead className="text-slate-300">{t('systemQty')}</TableHead>
                    <TableHead className="text-slate-300">{t('actualQty')}</TableHead>
                    <TableHead className="text-slate-300">{t('difference')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, idx) => (
                    <TableRow key={idx} className={`border-slate-700 ${item.difference !== 0 ? 'bg-red-500/5' : ''}`}>
                      <TableCell className="text-slate-400">{item.product_code}</TableCell>
                      <TableCell className="text-white">{item.product_name}</TableCell>
                      <TableCell className="text-slate-300">{item.system_qty}</TableCell>
                      <TableCell><Input type="number" value={item.actual_qty} onChange={e => updateActualQty(idx, parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-20" /></TableCell>
                      <TableCell className={`font-bold ${item.difference > 0 ? 'text-green-400' : item.difference < 0 ? 'text-red-400' : 'text-slate-400'}`}>{item.difference > 0 ? '+' : ''}{item.difference}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setItems([])} className="border-slate-600">{t('cancel')}</Button>
              <Button onClick={() => submitTaking("draft")} className="bg-blue-500 hover:bg-blue-600">{t('save')} (Draft)</Button>
              <Button onClick={() => submitTaking("confirmed")} className="bg-emerald-500 hover:bg-emerald-600">{t('confirm')}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">History</CardTitle></CardHeader>
          <CardContent>
            {history.map(h => (
              <div key={h.id} className="flex justify-between py-2 border-b border-slate-700 last:border-0">
                <span className="text-white">{h.taking_no}</span>
                <Badge className={h.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>{h.status}</Badge>
                <span className="text-slate-400 text-sm">{new Date(h.created_at).toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};


// POS Front Desk Page
const POSPage = () => {
  const { t, lang, changeLang } = useLang();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showLogin, setShowLogin] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [cashiers, setCashiers] = useState([]);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [shift, setShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [priceMode, setPriceMode] = useState("price1");
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 36.5 });
  const [showBs, setShowBs] = useState(true);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOrders, setPendingOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_pending_orders') || '[]'); } catch { return []; }
  });
  const [heldOrders, setHeldOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_held_orders') || '[]'); } catch { return []; }
  });
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundOrderNo, setRefundOrderNo] = useState("");
  const [pricingMode, setPricingMode] = useState("local_based");
  const searchInputRef = React.useRef(null);
  const lastKeyTime = React.useRef(0);
  const scanBuffer = React.useRef("");

  // Network detection
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      syncPendingOrders();
    }
  }, [isOnline]);

  const syncPendingOrders = async () => {
    const remaining = [];
    for (const order of pendingOrders) {
      try {
        await axios.post(`${API}/sales-orders`, order);
      } catch {
        remaining.push(order);
      }
    }
    setPendingOrders(remaining);
    localStorage.setItem('pos_pending_orders', JSON.stringify(remaining));
    if (remaining.length === 0 && pendingOrders.length > 0) {
      toast.success(t('syncSuccess'));
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("pos_user");
    const savedStore = localStorage.getItem("pos_store");
    const savedShift = localStorage.getItem("pos_shift");
    const savedPriceMode = localStorage.getItem("pos_price_mode");
    if (savedUser && savedStore) {
      setUser(JSON.parse(savedUser));
      setSelectedStore(JSON.parse(savedStore));
      setShowLogin(false);
      if (savedShift) setShift(JSON.parse(savedShift));
      if (savedPriceMode) setPriceMode(savedPriceMode);
      fetchData(JSON.parse(savedUser).token);
    }
  }, []);

  // Keyboard shortcuts: F1=search, F3=clear, F4=hold, F9=pay, F10=recall, F11=refund, ESC=close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showLogin || !selectedStore) return;
      if (e.key === 'F1') { e.preventDefault(); setShowProductSearch(true); }
      if (e.key === 'F3') { e.preventDefault(); clearCart(); }
      if (e.key === 'F4') { e.preventDefault(); holdCurrentOrder(); }
      if (e.key === 'F9') { e.preventDefault(); if (cart.length > 0 && shift) setShowPayment(true); }
      if (e.key === 'F10') { e.preventDefault(); setShowHeldOrders(true); }
      if (e.key === 'F11') { e.preventDefault(); setShowRefund(true); }
      if (e.key === 'Escape') { setShowProductSearch(false); setShowPayment(false); setShowShiftModal(false); setShowHeldOrders(false); setShowRefund(false); }
      if (showPayment) {
        if (e.key === 'F5') { e.preventDefault(); setPaymentMethod('cash'); }
        if (e.key === 'F6') { e.preventDefault(); setPaymentMethod('card'); }
        if (e.key === 'F7') { e.preventDefault(); setPaymentMethod('biopago'); }
        if (e.key === 'F8') { e.preventDefault(); setPaymentMethod('transfer'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLogin, selectedStore, cart, shift, showPayment]);

  // Barcode scanner: Enter in search box searches by barcode/code
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      const found = products.find(p => p.barcode === searchTerm.trim() || p.code === searchTerm.trim());
      if (found) { addToCart(found); setSearchTerm(""); }
    }
  };

  // Hold order (F4)
  const holdCurrentOrder = () => {
    if (cart.length === 0) return;
    const held = { id: Date.now(), items: cart, total: finalTotal, time: new Date().toISOString() };
    const newHeld = [...heldOrders, held];
    setHeldOrders(newHeld);
    localStorage.setItem('pos_held_orders', JSON.stringify(newHeld));
    clearCart();
    toast.success(t('holdOrder') + " OK");
  };

  // Recall order (F10)
  const recallOrder = (heldId) => {
    const held = heldOrders.find(h => h.id === heldId);
    if (held) {
      setCart(held.items);
      setHeldOrders(prev => { const n = prev.filter(h => h.id !== heldId); localStorage.setItem('pos_held_orders', JSON.stringify(n)); return n; });
      setShowHeldOrders(false);
      toast.success(t('recallOrder') + " OK");
    }
  };

  // Refund (F11)
  const handleRefund = async () => {
    try {
      const token = localStorage.getItem("pos_token");
      await axios.post(`${API}/api/refunds`, { order_no: refundOrderNo, items: [], reason: "POS refund" }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
      toast.success(t('refund') + " OK");
      setShowRefund(false); setRefundOrderNo("");
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };

  const fetchData = async (token) => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      const [productsRes, categoriesRes, storesRes, ratesRes, settingsRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/stores`),
        axios.get(`${API}/exchange-rates`),
        axios.get(`${API}/settings/system`).catch(() => ({ data: {} }))
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setStores(storesRes.data.filter(s => s.type === 'retail'));
      setExchangeRates(ratesRes.data);
      if (settingsRes.data?.pricing_mode) setPricingMode(settingsRes.data.pricing_mode);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch cashier list for login screen
  useEffect(() => {
    axios.get(`${API}/auth/cashiers`).then(res => setCashiers(res.data)).catch(() => {});
  }, []);

  const getProductPrice = (product) => {
    const p1 = product.price1 || product.retail_price || 0;
    if (!showBs) return p1; // $ always shows stored USD price
    // Bs. mode
    if (pricingMode === "local_based") {
      const cat = categories.find(c => c.id === product.category_id);
      const catRate = cat?.exchange_rate;
      const sysRate = exchangeRates.usd_to_ves || 1;
      if (catRate && catRate > 1) {
        // Bs. = USD price × (category_rate / system_rate)
        return p1 * catRate / sysRate;
      }
    }
    // foreign_direct: Bs. = USD × system_rate
    return p1 * (exchangeRates.usd_to_ves || 1);
  };

  const getPriceSymbol = () => showBs ? "Bs." : "$";

  // Get Bs. multiplier for a product
  const getProductBsMultiplier = (product) => {
    const sysRate = exchangeRates.usd_to_ves || 1;
    if (pricingMode === "local_based") {
      const cat = categories.find(c => c.id === product.category_id);
      const catRate = cat?.exchange_rate;
      if (catRate && catRate > 1) return catRate / sysRate;
    }
    return sysRate; // foreign_direct uses full system rate
  };

  // Convert a USD price to display value
  const toDisplayPrice = (usdPrice, product) => {
    if (!showBs) return usdPrice; // $ stays as-is
    return usdPrice * getProductBsMultiplier(product);
  };

  const getItemPriceByMode = (product, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    const boxQty = product.box_quantity || 1;
    switch (mode) {
      case "price2": return p2;
      case "box": return p3 * boxQty; // per-box price
      default: return p1;
    }
  };

  const calcCartItemAmount = (product, quantity, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    const boxQty = product.box_quantity || 1;
    if (mode === "box") {
      // quantity = number of boxes
      return quantity * boxQty * p3;
    }
    const unitPrice = mode === "price2" ? p2 : p1;
    return quantity * unitPrice;
  };

  const getActualItems = (item) => {
    if (item.price_mode === "box") {
      return item.quantity * (item.product.box_quantity || 1);
    }
    return item.quantity;
  };

  const handlePriceModeChange = (mode) => {
    setPriceMode(mode);
    localStorage.setItem("pos_price_mode", mode);
  };

  const getProductPriceByMode = (product, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    switch (mode) {
      case "price2": return product.price2 || p1;
      case "price3": return product.price3 || product.wholesale_price || p1;
      case "bs": return p1 * (exchangeRates.usd_to_ves || 1);
      default: return p1;
    }
  };

  const handleLogin = async () => {
    try {
      const loginData = selectedCashier 
        ? { username: selectedCashier.username, password: loginForm.password }
        : loginForm;
      const res = await axios.post(`${API}/auth/login`, loginData);
      const userData = { ...res.data.user, token: res.data.token };
      setUser(userData);
      localStorage.setItem("pos_user", JSON.stringify(userData));
      localStorage.setItem("pos_token", res.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      await fetchData(res.data.token);
      setShowLogin(false);
    } catch (e) {
      toast.error(t('login') + " failed");
    }
  };

  const handleSelectStore = (store) => {
    setSelectedStore(store);
    localStorage.setItem("pos_store", JSON.stringify(store));
  };

  const handleStartShift = () => {
    const newShift = {
      id: Date.now(),
      start_time: new Date().toISOString(),
      user: user.username,
      store: selectedStore.name,
      sales: [],
      total_sales: 0,
      total_cash: 0
    };
    setShift(newShift);
    localStorage.setItem("pos_shift", JSON.stringify(newShift));
    toast.success(t('startShift'));
  };

  const handleEndShift = () => {
    setShowShiftModal(true);
  };

  const confirmEndShift = () => {
    localStorage.removeItem("pos_shift");
    setShift(null);
    setShowShiftModal(false);
    toast.success(t('endShift'));
  };

  const handleLogout = () => {
    localStorage.removeItem("pos_user");
    localStorage.removeItem("pos_store");
    localStorage.removeItem("pos_shift");
    setUser(null);
    setSelectedStore(null);
    setShift(null);
    setShowLogin(true);
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        const amount = calcCartItemAmount(product, newQty, existing.price_mode);
        return prev.map(i => i.product_id === product.id 
          ? {...i, quantity: newQty, amount} 
          : i);
      } else {
        const p1 = product.price1 || product.retail_price || 0;
        return [...prev, {
          product_id: product.id,
          product,
          quantity: 1,
          price_mode: "price1",
          unit_price: p1,
          amount: p1
        }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id === productId) {
        const newQty = i.quantity + delta;
        if (newQty <= 0) return null;
        const amount = calcCartItemAmount(i.product, newQty, i.price_mode);
        return {...i, quantity: newQty, amount};
      }
      return i;
    }).filter(Boolean));
  };

  const changeItemPriceMode = (productId, newMode) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const boxQty = i.product.box_quantity || 1;

      // Switching TO box mode from piece mode
      if (newMode === "box" && i.price_mode !== "box") {
        const boxCount = Math.max(1, Math.floor(i.quantity / boxQty) || 1);
        const amount = calcCartItemAmount(i.product, boxCount, "box");
        const unitPrice = getItemPriceByMode(i.product, "box");
        return {...i, price_mode: "box", quantity: boxCount, unit_price: unitPrice, amount, _saved_pieces: i.quantity};
      }

      // Switching FROM box mode to piece mode
      if (newMode !== "box" && i.price_mode === "box") {
        // Restore saved piece count if user didn't manually change box qty
        const autoBoxCount = Math.max(1, Math.floor((i._saved_pieces || 1) / boxQty) || 1);
        let newQty;
        if (i._saved_pieces && i.quantity === autoBoxCount) {
          newQty = i._saved_pieces; // restore original
        } else {
          newQty = i.quantity * boxQty; // user changed boxes, convert
        }
        const amount = calcCartItemAmount(i.product, newQty, newMode);
        const unitPrice = getItemPriceByMode(i.product, newMode);
        return {...i, price_mode: newMode, quantity: newQty, unit_price: unitPrice, amount, _saved_pieces: undefined};
      }

      // Switching between piece modes (price1 <-> price2)
      const amount = calcCartItemAmount(i.product, i.quantity, newMode);
      const unitPrice = getItemPriceByMode(i.product, newMode);
      return {...i, price_mode: newMode, unit_price: unitPrice, amount};
    }));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.amount, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  // Display total using category rates
  const cartTotalDisplay = (() => {
    if (!showBs && pricingMode !== "local_based") return cartTotal;
    return cart.reduce((sum, i) => {
      const rate = getProductBsRate(i.product);
      const sysRate = exchangeRates.usd_to_ves || 1;
      if (showBs) {
        return sum + i.amount * rate;
      } else {
        // USD in local_based mode: amount × category_rate / system_rate
        return sum + (rate !== sysRate ? i.amount * rate / sysRate : i.amount);
      }
    }, 0);
  })();
  // Discount: max discount = total - total_cost (can't sell below cost)
  const cartCost = cart.reduce((sum, i) => {
    const cost = i.product.cost_price || 0;
    const qty = i.price_mode === "box" ? i.quantity * (i.product.box_quantity || 1) : i.quantity;
    return sum + cost * qty;
  }, 0);
  const maxDiscountPercent = cartTotal > 0 ? Math.floor((1 - cartCost / cartTotal) * 100) : 0;
  const safeDiscount = Math.min(discountPercent, maxDiscountPercent);
  const discountAmount = cartTotal * safeDiscount / 100;
  const finalTotal = cartTotal - discountAmount;

  const handlePayment = async () => {
    if (!shift) {
      toast.error(t('noShift'));
      return;
    }
    
    const orderData = {
      store_id: selectedStore.id,
      customer_id: null,
      items: cart.map(i => ({
        product_id: i.product_id,
        quantity: i.price_mode === "box" ? getActualItems(i) : i.quantity,
        unit_price: i.unit_price,
        discount: safeDiscount,
        amount: i.amount * (1 - safeDiscount / 100)
      })),
      payment_method: paymentMethod,
      paid_amount: parseFloat(receivedAmount) || finalTotal,
      notes: safeDiscount > 0 ? `Discount: ${safeDiscount}%` : ""
    };

    try {
      if (isOnline) {
        await axios.post(`${API}/sales-orders`, orderData);
      } else {
        // Offline mode: save to localStorage
        const newPending = [...pendingOrders, { ...orderData, offline_id: Date.now().toString(), created_at: new Date().toISOString() }];
        setPendingOrders(newPending);
        localStorage.setItem('pos_pending_orders', JSON.stringify(newPending));
      }
      
      // Update shift stats
      const updatedShift = {
        ...shift,
        sales: [...shift.sales, { amount: finalTotal, method: paymentMethod, time: new Date().toISOString() }],
        total_sales: shift.total_sales + finalTotal,
        total_cash: paymentMethod === 'cash' ? shift.total_cash + finalTotal : shift.total_cash
      };
      setShift(updatedShift);
      localStorage.setItem("pos_shift", JSON.stringify(updatedShift));

      toast.success(isOnline ? t('confirmPayment') + " ✓" : t('offlineMode') + " - " + t('pendingSync'));
      setCart([]);
      setShowPayment(false);
      setReceivedAmount("");
    } catch (e) {
      // If online fails, save offline
      const newPending = [...pendingOrders, { ...orderData, offline_id: Date.now().toString(), created_at: new Date().toISOString() }];
      setPendingOrders(newPending);
      localStorage.setItem('pos_pending_orders', JSON.stringify(newPending));
      toast.warning(t('offlineWarning'));
      setCart([]);
      setShowPayment(false);
      setReceivedAmount("");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.barcode?.includes(searchTerm);
    const matchCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    return matchSearch && matchCategory && p.status === 'active';
  });

  const change = parseFloat(receivedAmount) - finalTotal;

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">POS</CardTitle>
            <p className="text-slate-400">{t('posTitle')}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cashier Selection */}
            {cashiers.length > 0 && !selectedCashier && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">{t('employees')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {cashiers.map(c => (
                    <div key={c.id} onClick={() => { setSelectedCashier(c); setLoginForm({...loginForm, username: c.username}); }}
                      className="p-3 rounded-lg border border-slate-600 hover:border-emerald-500 cursor-pointer text-center transition-colors" data-testid={`cashier-${c.username}`}>
                      <div className="w-10 h-10 bg-slate-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">
                        {(c.name || c.username).charAt(0).toUpperCase()}
                      </div>
                      <p className="text-white text-sm font-medium">{c.name || c.username}</p>
                      <p className="text-slate-500 text-xs">{c.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Password input after cashier selected */}
            {selectedCashier && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                    {(selectedCashier.name || selectedCashier.username).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedCashier.name || selectedCashier.username}</p>
                    <p className="text-slate-400 text-xs">{selectedCashier.role}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedCashier(null)} className="ml-auto text-slate-400">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div>
                  <label className="text-sm text-slate-300">{t('password')}</label>
                  <Input type="password" value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder={t('password')} autoFocus data-testid="pos-password" />
                </div>
                <Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="pos-login-btn">{t('login')}</Button>
              </div>
            )}
            {/* Manual login fallback */}
            {cashiers.length === 0 && (
              <>
                <div>
                  <label className="text-sm text-slate-300">{t('username')}</label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder={t('username')}
                data-testid="pos-username"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">{t('password')}</label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder={t('password')}
                data-testid="pos-password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="pos-login-btn-manual">
              {t('login')}
            </Button>
              </>
            )}
            <div className="text-center">
              <Link to="/admin" className="text-slate-400 hover:text-white text-sm">
                Admin →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Store Selection
  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">{t('storeManagement')}</CardTitle>
            <p className="text-slate-400">{user?.name || user?.username}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {stores.map(store => (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store)}
                className="p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600"
              >
                <p className="text-white font-medium">{store.name}</p>
                <p className="text-slate-400 text-sm">{store.code} - {store.address || ''}</p>
              </div>
            ))}
            {stores.length === 0 && (
              <p className="text-slate-400 text-center py-4">{t('noData')}</p>
            )}
            <Button variant="outline" onClick={handleLogout} className="w-full mt-4 border-slate-600 text-slate-300">
              {t('logout')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main POS Interface
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <span className="text-white font-bold text-sm">POS</span>
          </div>
          <span className="text-slate-400 text-sm">
            <span className="text-white">{selectedStore?.name}</span> | {user?.name || user?.username}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex gap-0.5">
            {[{k:'zh',l:'中'},{k:'en',l:'EN'},{k:'es',l:'ES'}].map(({k,l}) => (
              <button key={k} onClick={() => changeLang(k)}
                className={`px-1.5 py-0.5 text-xs rounded ${lang === k ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`}
                data-testid={`pos-lang-${k}`}
              >{l}</button>
            ))}
          </div>
          {/* Online/Offline Indicator */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`} data-testid="online-status">
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isOnline ? t('online') : t('offline')}
            {pendingOrders.length > 0 && <Badge className="ml-1 bg-orange-500 text-white text-xs px-1 py-0">{pendingOrders.length}</Badge>}
          </div>
          {/* Quick action buttons */}
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={holdCurrentOrder} className="border-slate-600 text-slate-300 h-7 text-xs" disabled={cart.length === 0} data-testid="hold-btn">
              F4 {t('holdOrder')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowHeldOrders(true)} className="border-slate-600 text-slate-300 h-7 text-xs relative" data-testid="recall-btn">
              F10 {t('recallOrder')}
              {heldOrders.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-xs flex items-center justify-center">{heldOrders.length}</span>}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowRefund(true)} className="border-slate-600 text-slate-300 h-7 text-xs" data-testid="refund-btn">
              F11 {t('refund')}
            </Button>
          </div>
          {/* Currency Toggle - Up/Down */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1">
            <span className="text-xs text-slate-400 mr-1">{t('currency')}</span>
            <span className={`text-sm font-bold min-w-[36px] text-center ${showBs ? 'text-orange-400' : 'text-emerald-400'}`}>
              {showBs ? 'Bs.' : '$'}
            </span>
            <div className="flex flex-col">
              <button onClick={() => !showPayment && setShowBs(!showBs)} className={`text-slate-400 hover:text-white leading-none ${showPayment ? 'opacity-30 cursor-not-allowed' : ''}`} data-testid="currency-up">
                <ChevronDown className="w-3 h-3 rotate-180" />
              </button>
              <button onClick={() => !showPayment && setShowBs(!showBs)} className={`text-slate-400 hover:text-white leading-none ${showPayment ? 'opacity-30 cursor-not-allowed' : ''}`} data-testid="currency-down">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          {shift ? (
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              {t('shiftSince')} {new Date(shift.start_time).toLocaleTimeString()}
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">{t('noShift')}</Badge>
          )}
          {!shift ? (
            <Button size="sm" onClick={handleStartShift} className="bg-green-600 hover:bg-green-700 h-7 text-xs" data-testid="start-shift-btn">
              {t('startShift')}
            </Button>
          ) : (
            <Button size="sm" onClick={handleEndShift} className="bg-orange-600 hover:bg-orange-700 h-7 text-xs" data-testid="end-shift-btn">
              {t('endShift')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleLogout} className="border-slate-600 text-slate-300 h-7">
            <LogOut className="w-3 h-3" />
          </Button>
        </div>
      </header>

      {/* Main Content - Full Screen Cart */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        {/* Search Bar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t('scanOrSearch')}
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value) setShowProductSearch(true); }}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setShowProductSearch(true)}
              className="pl-10 bg-slate-800 border-slate-700 text-white h-10"
              data-testid="pos-search"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredProducts.length === 1) {
                  addToCart(filteredProducts[0]);
                  setSearchTerm('');
                  setShowProductSearch(false);
                }
              }}
            />
          </div>
          <Button onClick={() => setShowProductSearch(!showProductSearch)} className="bg-blue-500 hover:bg-blue-600 h-10 px-4" data-testid="open-products-btn">
            <Package className="w-4 h-4 mr-2" /> {t('products')}
          </Button>
        </div>

        {/* Product Search Popup */}
        {showProductSearch && (
          <div className="absolute left-4 right-4 top-[120px] z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-[60vh] flex flex-col" data-testid="product-search-popup">
            {/* Category Tabs */}
            <div className="flex gap-1 p-3 border-b border-slate-700 overflow-x-auto flex-shrink-0">
              <Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"}
                onClick={() => setSelectedCategory("all")}
                className={`h-7 text-xs ${selectedCategory === "all" ? "bg-blue-500" : "border-slate-600 text-slate-300"}`}
              >
                {t('all')}
              </Button>
              {categories.map(cat => (
                <Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`h-7 text-xs whitespace-nowrap ${selectedCategory === cat.id ? "bg-blue-500" : "border-slate-600 text-slate-300"}`}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            {/* Product Table */}
            <div className="overflow-y-auto flex-1">
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0">
                  <tr className="text-slate-400 text-xs">
                    <th className="text-left px-3 py-2">{t('productCode')}</th>
                    <th className="text-left px-3 py-2">{t('productName')}</th>
                    <th className="text-right px-3 py-2">{t('costPrice')}</th>
                    <th className="text-right px-3 py-2">{t('price1')}</th>
                    <th className="text-right px-3 py-2">{t('price2')}</th>
                    <th className="text-right px-3 py-2">{t('price3Box')}</th>
                    <th className="text-center px-3 py-2 w-16">{t('add')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => {
                    const p1 = product.price1 || product.retail_price || 0;
                    const p2 = product.price2 || p1;
                    const p3 = product.price3 || product.wholesale_price || p1;
                    return (
                      <tr key={product.id}
                        className="border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer"
                        onClick={() => { addToCart(product); setSearchTerm(''); setShowProductSearch(false); }}
                        data-testid={`pos-product-${product.id}`}
                      >
                        <td className="px-3 py-2 text-slate-400 text-xs">{product.code}</td>
                        <td className="px-3 py-2 text-white text-sm font-medium">{product.name}</td>
                        <td className="px-3 py-2 text-right text-slate-500 text-xs">${(product.cost_price || 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-emerald-400 text-xs font-medium">${p1.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-yellow-400 text-xs font-medium">${p2.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-blue-400 text-xs font-medium">${p3.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          <Button size="sm" className="h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); addToCart(product); }}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredProducts.length === 0 && (
                    <tr><td colSpan="7" className="text-slate-400 text-sm text-center py-4">{t('noData')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Close button */}
            <div className="p-2 border-t border-slate-700 text-right">
              <Button size="sm" variant="outline" onClick={() => setShowProductSearch(false)} className="border-slate-600 text-slate-300 h-7 text-xs">
                {t('close')}
              </Button>
            </div>
          </div>
        )}

        {/* Click backdrop to close product search */}
        {showProductSearch && (
          <div className="fixed inset-0 z-40" onClick={() => setShowProductSearch(false)} />
        )}

        {/* Full Screen Cart Table */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
          {/* Cart Header */}
          <div className="bg-slate-750 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-bold">{t('salesOrder')}</h2>
              <Badge className="bg-slate-600 text-xs">{cartCount} {t('items')}</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={clearCart} className="border-slate-600 text-slate-300 h-7 text-xs" disabled={cart.length === 0}>
              {t('clear')}
            </Button>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr className="text-slate-400 text-xs">
                  <th className="text-left px-4 py-2 w-8">#</th>
                  <th className="text-left px-4 py-2">{t('productName')}</th>
                  <th className="text-center px-2 py-2 w-32">{t('quantity')}</th>
                  <th className="text-center px-2 py-2 w-28">{t('priceType')}</th>
                  <th className="text-right px-4 py-2 w-28">{t('unitPrice')}</th>
                  <th className="text-right px-4 py-2 w-36">{t('amount')}</th>
                  <th className="text-center px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-slate-500 py-16">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">{t('scanOrSearch')}</p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const boxQty = item.product.box_quantity || 1;
                    const isBoxMode = item.price_mode === "box";
                    const totalPieces = isBoxMode ? item.quantity * boxQty : item.quantity;
                    const displayUnitPrice = toDisplayPrice(getItemPriceByMode(item.product, item.price_mode), item.product);
                    const displayAmount = displayUnitPrice * item.quantity;
                    const priceModes = ["price1", "price2", "box"];
                    const currentIdx = priceModes.indexOf(item.price_mode);
                    const modeLabels = { price1: t('price1'), price2: t('price2'), box: t('box') };
                    const modeColors = { price1: "text-emerald-400", price2: "text-yellow-400", box: "text-blue-400" };
                    return (
                      <tr key={item.product_id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`cart-row-${item.product_id}`}>
                        <td className="px-4 py-3 text-slate-500 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{item.product.name}</p>
                          <p className="text-slate-500 text-xs">{item.product.code}</p>
                          {/* Box calculation: show per-box breakdown */}
                          {isBoxMode && (() => {
                            const rate = getProductBsRate(item.product);
                            const p3 = item.product.price3 || item.product.wholesale_price || 0;
                            const p3Display = showBs ? (item.product.cost_price > 0 ? item.product.cost_price * rate / (item.product.price1 || 1) * p3 : p3 * rate) : p3;
                            const perBoxDisplay = p3Display * boxQty;
                            return (
                              <p className="text-blue-300 text-xs mt-0.5">
                                {boxQty}×{getPriceSymbol()}{p3Display.toFixed(2)}={getPriceSymbol()}{perBoxDisplay.toFixed(2)}/{t('box')}
                                <span className="text-slate-400 ml-1">({totalPieces}{t('pieces')})</span>
                              </p>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateQuantity(item.product_id, -1)} className="w-7 h-7 rounded bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center text-sm">-</button>
                            <input type="number" step="0.1" min="0.1" value={item.quantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val > 0) {
                                  setCart(prev => prev.map(i => i.product_id === item.product_id
                                    ? {...i, quantity: val, amount: calcCartItemAmount(i.product, val, i.price_mode)}
                                    : i));
                                }
                              }}
                              className="w-14 text-center bg-slate-700 border border-slate-600 rounded text-white text-sm py-1"
                              data-testid={`qty-input-${item.product_id}`}
                            />
                            <button onClick={() => updateQuantity(item.product_id, 1)} className="w-7 h-7 rounded bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center text-sm">+</button>
                          </div>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-xs font-medium min-w-[40px] ${modeColors[item.price_mode]}`}>
                              {modeLabels[item.price_mode]}
                            </span>
                            <div className="flex flex-col">
                              <button onClick={() => changeItemPriceMode(item.product_id, priceModes[(currentIdx + 2) % 3])}
                                className="text-slate-400 hover:text-white leading-none" data-testid={`price-up-${item.product_id}`}>
                                <ChevronDown className="w-3 h-3 rotate-180" />
                              </button>
                              <button onClick={() => changeItemPriceMode(item.product_id, priceModes[(currentIdx + 1) % 3])}
                                className="text-slate-400 hover:text-white leading-none" data-testid={`price-down-${item.product_id}`}>
                                <ChevronDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          <span className={showBs ? 'text-orange-300' : 'text-slate-300'}>{getPriceSymbol()}{displayUnitPrice.toFixed(2)}</span>
                          {showBs && <p className="text-slate-500 text-xs">${getItemPriceByMode(item.product, item.price_mode).toFixed(2)}</p>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          <span className={showBs ? 'text-orange-300' : 'text-white'}>{getPriceSymbol()}{displayAmount.toFixed(2)}</span>
                          {showBs && <p className="text-slate-500 text-xs">${item.amount.toFixed(2)}</p>}
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-300">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Cart Footer - Total & Pay */}
          <div className="border-t border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-800">
            <div className="text-slate-400 text-sm">
              {cart.length} {t('products')}, {cartCount} {t('items')}
              {safeDiscount > 0 && <span className="text-red-400 ml-2">-{safeDiscount}%</span>}
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                {showBs ? (
                  <>
                    <div>
                      <span className="text-slate-400 text-xs mr-1">Bs.</span>
                      <span className="text-xl font-bold text-orange-400">
                        {(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-xs mr-1">$</span>
                      <span className="text-sm text-slate-400">{finalTotal.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="text-slate-400 text-sm mr-2">{t('total')}:</span>
                      <span className="text-2xl font-bold text-white">${(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}</span>
                    </div>
                    {pricingMode === "local_based" && (
                      <div>
                        <span className="text-slate-500 text-xs mr-1">Bs.</span>
                        <span className="text-sm text-slate-400">
                          {(cart.reduce((s, i) => s + i.amount * getProductBsRate(i.product), 0) * (1 - safeDiscount / 100)).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              <Button 
                onClick={() => setShowPayment(true)} 
                className="bg-green-600 hover:bg-green-700 h-10 px-8 text-base font-bold" 
                disabled={cart.length === 0 || !shift}
                data-testid="pos-pay-btn"
              >
                F9 {t('checkout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal - F9 */}
      <Dialog open={showPayment} onOpenChange={(open) => { setShowPayment(open); if (!open) { setDiscountPercent(0); setReceivedAmount(""); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('checkout')} (F9)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Total Display - Dual Currency when Bs */}
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              {showBs ? (
                <>
                  <p className="text-slate-400 text-xs">Bs.</p>
                  <p className="text-3xl font-bold text-orange-400">Bs.{(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}</p>
                  <p className="text-slate-400 text-sm mt-1">${finalTotal.toFixed(2)} USD</p>
                </>
              ) : (
                <>
                  <p className="text-slate-400 text-xs">USD</p>
                  <p className="text-3xl font-bold text-white">${(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}</p>
                  {pricingMode === "local_based" && (
                    <p className="text-slate-400 text-sm mt-1">Bs.{(cart.reduce((s, i) => s + i.amount * getProductBsRate(i.product), 0) * (1 - safeDiscount / 100)).toFixed(2)}</p>
                  )}
                </>
              )}
              {safeDiscount > 0 && (
                <p className="text-red-400 text-sm mt-1">-{safeDiscount}% ({t('discount')})</p>
              )}
            </div>

            {/* Discount */}
            <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-3">
              <label className="text-sm text-slate-300 whitespace-nowrap">{t('discount')} %</label>
              <Input
                type="number"
                min="0"
                max={maxDiscountPercent}
                value={discountPercent}
                onChange={(e) => {
                  const v = parseInt(e.target.value) || 0;
                  if (v > maxDiscountPercent) {
                    toast.error(`${t('discount')} max ${maxDiscountPercent}% (${t('costPrice')})`);
                    setDiscountPercent(maxDiscountPercent);
                  } else {
                    setDiscountPercent(Math.max(0, v));
                  }
                }}
                className="bg-slate-700 border-slate-600 w-24 text-center"
                data-testid="discount-input"
              />
              <span className="text-xs text-slate-500">max {maxDiscountPercent}%</span>
              {discountPercent > 0 && (
                <span className="text-red-400 text-sm">-${discountAmount.toFixed(2)}</span>
              )}
            </div>

            {/* Payment Methods Table */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">{t('paymentMethod')}</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cash', label: t('cash'), key: 'F5', active: 'border-emerald-500 bg-emerald-500/10' },
                  { id: 'card', label: t('card'), key: 'F6', active: 'border-blue-500 bg-blue-500/10' },
                  { id: 'biopago', label: 'Biopago', key: 'F7', active: 'border-purple-500 bg-purple-500/10' },
                  { id: 'transfer', label: 'Transfer', key: 'F8', active: 'border-yellow-500 bg-yellow-500/10' }
                ].map(method => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      paymentMethod === method.id 
                        ? method.active
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                    data-testid={`pay-method-${method.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-white' : 'text-slate-300'}`}>{method.label}</span>
                      <kbd className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">{method.key}</kbd>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash: received + change */}
            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">{t('received')}</label>
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-2xl text-center"
                  placeholder="0.00"
                  data-testid="pos-received-amount"
                  autoFocus
                />
                {receivedAmount && change >= 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-400">{t('change')}</p>
                    <p className="text-2xl font-bold text-green-400">
                      {showBs ? `Bs.${(change * (exchangeRates.usd_to_ves || 1)).toFixed(2)} / $${change.toFixed(2)}` : `$${change.toFixed(2)}`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="border-slate-600">
                ESC {t('cancel')}
              </Button>
              <Button 
                onClick={handlePayment} 
                className="bg-green-600 hover:bg-green-700"
                disabled={paymentMethod === 'cash' && (!receivedAmount || change < 0)}
                data-testid="pos-confirm-payment"
              >
                {t('confirmPayment')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>{t('endShift')}</DialogTitle>
          </DialogHeader>
          {shift && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('username')}:</span>
                  <span className="text-white">{shift.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('storeManagement')}:</span>
                  <span className="text-white">{shift.store}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('shiftSince')}:</span>
                  <span className="text-white">{new Date(shift.start_time).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('salesManagement')}:</span>
                  <span className="text-white">{shift.sales?.length || 0}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600">
                  <span className="text-slate-300">{t('totalSales')}:</span>
                  <span className="text-green-400">${shift.total_sales?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('cash')}:</span>
                  <span className="text-white">${shift.total_cash?.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowShiftModal(false)} className="border-slate-600">
                  {t('cancel')}
                </Button>
                <Button onClick={confirmEndShift} className="bg-orange-600 hover:bg-orange-700" data-testid="confirm-end-shift">
                  {t('confirm')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Held Orders Modal (F10) */}
      <Dialog open={showHeldOrders} onOpenChange={setShowHeldOrders}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('recallOrder')} (F10)</DialogTitle></DialogHeader>
          {heldOrders.length === 0 ? (
            <p className="text-slate-400 text-center py-4">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {heldOrders.map(held => (
                <div key={held.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 cursor-pointer" onClick={() => recallOrder(held.id)} data-testid={`recall-${held.id}`}>
                  <div>
                    <p className="text-white font-medium">{held.items.length} {t('products')}</p>
                    <p className="text-slate-400 text-xs">{new Date(held.time).toLocaleTimeString()}</p>
                  </div>
                  <span className="text-emerald-400 font-bold">${held.total?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Modal (F11) */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('refund')} (F11)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">{t('salesOrder')} #</label>
              <Input value={refundOrderNo} onChange={e => setRefundOrderNo(e.target.value)} placeholder="SO20260313..." className="bg-slate-700 border-slate-600" data-testid="refund-order-no" />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowRefund(false)} className="border-slate-600">{t('cancel')}</Button>
              <Button onClick={handleRefund} disabled={!refundOrderNo} className="bg-red-500 hover:bg-red-600" data-testid="confirm-refund">{t('refund')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* POS Shortcut Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-30" data-testid="pos-toolbar">
        <div className="flex items-center justify-center gap-1 px-2 py-1.5">
          {[
            { key: "F1", label: t('search'), action: () => setShowSearch(true), color: "bg-blue-600 hover:bg-blue-700" },
            { key: "F3", label: t('clear'), action: () => clearCart(), color: "bg-orange-600 hover:bg-orange-700" },
            { key: "F4", label: t('holdOrder'), action: () => holdCurrentOrder(), color: "bg-yellow-600 hover:bg-yellow-700" },
            { key: "F9", label: t('checkout'), action: () => setShowPayment(true), color: "bg-green-600 hover:bg-green-700", disabled: cart.length === 0 || !shift },
            { key: "F10", label: t('recallOrder'), action: () => setShowHeldOrders(true), color: "bg-purple-600 hover:bg-purple-700" },
            { key: "F11", label: t('refund'), action: () => setShowRefund(true), color: "bg-red-600 hover:bg-red-700" },
          ].map(btn => (
            <button
              key={btn.key}
              onClick={btn.action}
              disabled={btn.disabled}
              className={`${btn.color} text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed`}
              data-testid={`toolbar-${btn.key.toLowerCase()}`}
            >
              <kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">{btn.key}</kbd>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};

function App() {
  return (
    <LangProvider>
      <AppContent />
    </LangProvider>
  );
}

export default App;
