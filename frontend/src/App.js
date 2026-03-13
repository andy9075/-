import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Store, Package, Warehouse, Users, ShoppingCart, BarChart3, 
  Settings, LogOut, Menu, X, Plus, Search, Edit, Trash2, 
  Home, Building2, Truck, CreditCard, Globe, ChevronDown,
  ShoppingBag, DollarSign, TrendingUp, AlertCircle, Check,
  ArrowLeftRight, Printer, Wifi, WifiOff, FileText, Calendar
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
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(username, password);
      const from = location.state?.from || "/admin";
      navigate(from);
      toast.success("登录成功");
    } catch (error) {
      toast.error(error.response?.data?.detail || "登录失败");
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
          <CardTitle className="text-2xl text-white">POS管理系统</CardTitle>
          <p className="text-slate-400 text-sm">多店铺·多仓库·网店管理</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">用户名</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="bg-slate-700/50 border-slate-600 text-white"
                data-testid="login-username"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">密码</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
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
              {isLoading ? "登录中..." : "登录"}
            </Button>
            <p className="text-center text-slate-400 text-xs mt-4">
              管理员: admin / admin123
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

  if (loading) return <div className="text-white">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">仪表盘</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm">今日销售额</p>
                <p className="text-2xl font-bold text-white mt-1">${stats?.today_sales_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-emerald-400 text-xs mt-1">{stats?.today_sales_count || 0} 笔订单</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">网店订单</p>
                <p className="text-2xl font-bold text-white mt-1">${stats?.today_online_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-blue-400 text-xs mt-1">{stats?.today_online_count || 0} 笔订单</p>
              </div>
              <Globe className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">商品总数</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.products_count || 0}</p>
                <p className="text-purple-400 text-xs mt-1">在售商品</p>
              </div>
              <Package className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">待处理订单</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.pending_online_orders || 0}</p>
                <p className="text-orange-400 text-xs mt-1">网店待发货</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/admin/products">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Package className="w-4 h-4 mr-2" /> 商品管理
              </Button>
            </Link>
            <Link to="/admin/online-orders">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Globe className="w-4 h-4 mr-2" /> 网店订单
              </Button>
            </Link>
            <Link to="/admin/warehouses">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <Warehouse className="w-4 h-4 mr-2" /> 库存管理
              </Button>
            </Link>
            <Link to="/admin/reports">
              <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                <BarChart3 className="w-4 h-4 mr-2" /> 查看报表
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">系统信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-slate-300">
              <span>门店数量</span>
              <span className="text-white font-medium">{stats?.stores_count || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>客户数量</span>
              <span className="text-white font-medium">{stats?.customers_count || 0}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>商品数量</span>
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载商品失败");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API}/categories`);
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, formData);
        toast.success("更新成功");
      } else {
        await axios.post(`${API}/products`, formData);
        toast.success("添加成功");
      }
      setShowForm(false);
      setEditingProduct(null);
      resetForm();
      fetchProducts();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除此商品?")) return;
    try {
      await axios.delete(`${API}/products/${id}`);
      toast.success("删除成功");
      fetchProducts();
    } catch (e) {
      toast.error("删除失败");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">商品管理</h1>
        <Button onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-product-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加商品
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索商品名称、编码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
            data-testid="product-search"
          />
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">编码</TableHead>
              <TableHead className="text-slate-300">商品名称</TableHead>
              <TableHead className="text-slate-300">成本价</TableHead>
              <TableHead className="text-slate-300">利率1%</TableHead>
              <TableHead className="text-slate-300">价格1</TableHead>
              <TableHead className="text-slate-300">利率2%</TableHead>
              <TableHead className="text-slate-300">价格2</TableHead>
              <TableHead className="text-slate-300">利率3%</TableHead>
              <TableHead className="text-slate-300">价格3(整箱)</TableHead>
              <TableHead className="text-slate-300">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-slate-700">
                <TableCell className="text-slate-300">{product.code}</TableCell>
                <TableCell className="text-white font-medium">{product.name}</TableCell>
                <TableCell className="text-slate-400">${(product.cost_price || 0).toFixed(2)}</TableCell>
                <TableCell className="text-orange-400">{(product.margin1 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-emerald-400">${(product.price1 || product.retail_price || 0).toFixed(2)}</TableCell>
                <TableCell className="text-orange-400">{(product.margin2 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-yellow-400">${(product.price2 || 0).toFixed(2)}</TableCell>
                <TableCell className="text-orange-400">{(product.margin3 || 0).toFixed(1)}%</TableCell>
                <TableCell className="text-blue-400">${(product.price3 || product.wholesale_price || 0).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                    {product.status === 'active' ? '在售' : '下架'}
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
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? '编辑商品' : '添加商品'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300">商品编码</label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-code" />
            </div>
            <div>
              <label className="text-sm text-slate-300">条码</label>
              <Input value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-slate-300">商品名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-name" />
            </div>
            <div>
              <label className="text-sm text-slate-300">分类</label>
              <Select value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300">单位</label>
              <Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="col-span-2 bg-slate-900 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-400">价格设置 (成本 × (1 + 利率%))</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-400">成本价 ($)</label>
                  <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    const m1 = formData.margin1 || 0;
                    const m2 = formData.margin2 || 0;
                    const m3 = formData.margin3 || 0;
                    setFormData({...formData, cost_price: cost,
                      price1: m1 > 0 ? Math.round(cost * (1 + m1/100) * 100) / 100 : formData.price1,
                      price2: m2 > 0 ? Math.round(cost * (1 + m2/100) * 100) / 100 : formData.price2,
                      price3: m3 > 0 ? Math.round(cost * (1 + m3/100) * 100) / 100 : formData.price3
                    });
                  }} className="bg-slate-700 border-slate-600" data-testid="product-cost" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">利率1 (%)</label>
                  <Input type="number" step="0.1" value={formData.margin1} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin1: m, price1: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price1});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin1" />
                  <div className="text-xs text-emerald-400 font-medium">价格1: ${(formData.price1 || 0).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">利率2 (%)</label>
                  <Input type="number" step="0.1" value={formData.margin2} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin2: m, price2: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price2});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin2" />
                  <div className="text-xs text-yellow-400 font-medium">价格2: ${(formData.price2 || 0).toFixed(2)}</div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">利率3 (%) 整箱价</label>
                  <Input type="number" step="0.1" value={formData.margin3} onChange={(e) => {
                    const m = parseFloat(e.target.value) || 0;
                    const cost = formData.cost_price || 0;
                    setFormData({...formData, margin3: m, price3: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData.price3});
                  }} className="bg-slate-700 border-slate-600" data-testid="product-margin3" />
                  <div className="text-xs text-blue-400 font-medium">价格3(整箱): ${(formData.price3 || 0).toFixed(2)}</div>
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">每箱数量</label>
              <Input type="number" value={formData.box_quantity} onChange={(e) => setFormData({...formData, box_quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600" />
            </div>
            <div>
              <label className="text-sm text-slate-300">状态</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">在售</SelectItem>
                  <SelectItem value="inactive">下架</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="product-submit">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Stores Management
const StoresPage = () => {
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载门店失败");
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
        toast.success("更新成功");
      } else {
        await axios.post(`${API}/stores`, formData);
        toast.success("添加成功");
      }
      setShowForm(false);
      setEditingStore(null);
      fetchStores();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData(store);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除此门店?")) return;
    try {
      await axios.delete(`${API}/stores/${id}`);
      toast.success("删除成功");
      fetchStores();
    } catch (e) {
      toast.error("删除失败");
    }
  };

  const storeTypes = { retail: "实体门店", online: "网店", warehouse: "仓库" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">门店管理</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", type: "retail", address: "", phone: "", warehouse_id: "", is_headquarters: false, status: "active" }); setEditingStore(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-store-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加门店
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
                    {store.is_headquarters && <Badge className="bg-yellow-500/20 text-yellow-400">总部</Badge>}
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{store.code}</p>
                </div>
                <Badge variant={store.type === 'online' ? 'default' : 'secondary'}>
                  {storeTypes[store.type]}
                </Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-slate-300"><span className="text-slate-500">地址:</span> {store.address || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">电话:</span> {store.phone || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">关联仓库:</span> {warehouses.find(w => w.id === store.warehouse_id)?.name || '-'}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(store)} className="flex-1 border-slate-600 text-slate-300">
                  <Edit className="w-4 h-4 mr-1" /> 编辑
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
            <DialogTitle>{editingStore ? '编辑门店' : '添加门店'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">门店编码</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-code" />
              </div>
              <div>
                <label className="text-sm text-slate-300">门店名称</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">类型</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retail">实体门店</SelectItem>
                    <SelectItem value="online">网店</SelectItem>
                    <SelectItem value="warehouse">仓库</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-300">关联仓库</label>
                <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="选择仓库" />
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
              <label className="text-sm text-slate-300">地址</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div>
              <label className="text-sm text-slate-300">电话</label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="store-submit">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Warehouses Management
const WarehousesPage = () => {
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载仓库失败");
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
      toast.success("添加成功");
      setShowForm(false);
      fetchWarehouses();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">仓库管理</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", address: "", is_main: false, store_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-warehouse-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加仓库
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
              {wh.is_main && <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">总部仓库</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedWarehouse && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">库存列表 - {warehouses.find(w => w.id === selectedWarehouse)?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">商品编码</TableHead>
                  <TableHead className="text-slate-300">商品名称</TableHead>
                  <TableHead className="text-slate-300">库存数量</TableHead>
                  <TableHead className="text-slate-300">预留数量</TableHead>
                  <TableHead className="text-slate-300">可用数量</TableHead>
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
                    <TableCell colSpan={5} className="text-center text-slate-400">暂无库存数据</TableCell>
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
            <DialogTitle>添加仓库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">仓库编码</label>
              <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-code" />
            </div>
            <div>
              <label className="text-sm text-slate-300">仓库名称</label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-name" />
            </div>
            <div>
              <label className="text-sm text-slate-300">地址</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_main} onChange={(e) => setFormData({...formData, is_main: e.target.checked})} className="rounded" />
              <label className="text-sm text-slate-300">设为总部仓库</label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="warehouse-submit">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Online Orders Management
const OnlineOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

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
        <h1 className="text-2xl font-bold text-white">Pedidos Online / 网店订单</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos / 全部</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">Pedido #</TableHead>
              <TableHead className="text-slate-300">Cliente</TableHead>
              <TableHead className="text-slate-300">Método</TableHead>
              <TableHead className="text-slate-300">Referencia</TableHead>
              <TableHead className="text-slate-300">Total</TableHead>
              <TableHead className="text-slate-300">Pago</TableHead>
              <TableHead className="text-slate-300">Estado</TableHead>
              <TableHead className="text-slate-300">Fecha</TableHead>
              <TableHead className="text-slate-300">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono text-xs">{order.order_no}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-white text-sm">{order.shipping_name}</p>
                    <p className="text-slate-400 text-xs">{order.shipping_phone}</p>
                  </div>
                </TableCell>
                <TableCell className="text-slate-300 text-sm">{paymentMethodLabels[order.payment_method] || order.payment_method}</TableCell>
                <TableCell className="text-yellow-400 font-mono text-sm">{order.payment_reference || '-'}</TableCell>
                <TableCell className="text-emerald-400 font-medium">${(order.total_amount + order.shipping_fee).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[order.order_status]}>
                    {statusLabels[order.order_status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {order.payment_status === 'pending' && (
                      <Button size="sm" onClick={() => handleConfirmPayment(order.id)} className="bg-emerald-500 hover:bg-emerald-600 text-xs" data-testid={`confirm-payment-${order.id}`}>
                        Confirmar Pago
                      </Button>
                    )}
                    {order.payment_status === 'paid' && order.order_status === 'processing' && (
                      <Button size="sm" onClick={() => handleShip(order.id)} className="bg-purple-500 hover:bg-purple-600 text-xs" data-testid={`ship-order-${order.id}`}>
                        Enviar
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

// Customers Management
const CustomersPage = () => {
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载客户失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/customers`, formData);
      toast.success("添加成功");
      setShowForm(false);
      fetchCustomers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">客户管理</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-customer-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加客户
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="搜索客户名称、电话..."
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
              <TableHead className="text-slate-300">编码</TableHead>
              <TableHead className="text-slate-300">客户名称</TableHead>
              <TableHead className="text-slate-300">电话</TableHead>
              <TableHead className="text-slate-300">会员等级</TableHead>
              <TableHead className="text-slate-300">积分</TableHead>
              <TableHead className="text-slate-300">余额</TableHead>
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
                    {customer.member_level === 'vip' ? 'VIP' : '普通'}
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
            <DialogTitle>添加客户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">客户编码</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">客户名称</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">电话</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">邮箱</label>
                <Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">地址</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Suppliers Management
const SuppliersPage = () => {
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载供应商失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/suppliers`, formData);
      toast.success("添加成功");
      setShowForm(false);
      fetchSuppliers();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除此供应商?")) return;
    try {
      await axios.delete(`${API}/suppliers/${id}`);
      toast.success("删除成功");
      fetchSuppliers();
    } catch (e) {
      toast.error("删除失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">供应商管理</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", contact: "", phone: "", address: "", bank_account: "", tax_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-supplier-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加供应商
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">编码</TableHead>
              <TableHead className="text-slate-300">供应商名称</TableHead>
              <TableHead className="text-slate-300">联系人</TableHead>
              <TableHead className="text-slate-300">电话</TableHead>
              <TableHead className="text-slate-300">地址</TableHead>
              <TableHead className="text-slate-300">操作</TableHead>
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
            <DialogTitle>添加供应商</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">供应商编码</label>
                <Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">供应商名称</label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">联系人</label>
                <Input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
              <div>
                <label className="text-sm text-slate-300">电话</label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300">地址</label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Purchase Orders
const PurchasesPage = () => {
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
        toast.error("加载采购单失败");
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
      toast.success("创建成功");
      setShowForm(false);
      setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" });
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "操作失败");
    }
  };

  const handleReceive = async (orderId) => {
    try {
      await axios.put(`${API}/purchase-orders/${orderId}/receive`);
      toast.success("入库成功");
      fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.detail || "入库失败");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">采购管理</h1>
        <Button onClick={() => { setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-purchase-btn">
          <Plus className="w-4 h-4 mr-2" /> 新建采购单
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">单号</TableHead>
              <TableHead className="text-slate-300">供应商</TableHead>
              <TableHead className="text-slate-300">入库仓库</TableHead>
              <TableHead className="text-slate-300">商品数</TableHead>
              <TableHead className="text-slate-300">总金额</TableHead>
              <TableHead className="text-slate-300">状态</TableHead>
              <TableHead className="text-slate-300">创建时间</TableHead>
              <TableHead className="text-slate-300">操作</TableHead>
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
                    {order.status === 'received' ? '已入库' : '待入库'}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {order.status === 'pending' && (
                    <Button size="sm" onClick={() => handleReceive(order.id)} className="bg-emerald-500 hover:bg-emerald-600">
                      入库
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
            <DialogTitle>新建采购单</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-300">供应商</label>
                <Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="选择供应商" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-slate-300">入库仓库</label>
                <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="选择仓库" />
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
              <h4 className="text-sm font-medium text-slate-300 mb-3">添加商品</h4>
              <div className="grid grid-cols-4 gap-3">
                <Select value={newItem.product_id} onValueChange={(v) => {
                  const p = products.find(x => x.id === v);
                  setNewItem({...newItem, product_id: v, unit_price: p?.cost_price || 0});
                }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder="选择商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="数量" value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Input type="number" placeholder="单价" value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Button onClick={addItem} className="bg-blue-500 hover:bg-blue-600">添加</Button>
              </div>
            </div>

            {formData.items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">商品</TableHead>
                    <TableHead className="text-slate-300">数量</TableHead>
                    <TableHead className="text-slate-300">单价</TableHead>
                    <TableHead className="text-slate-300">金额</TableHead>
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
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" disabled={formData.items.length === 0}>
              创建采购单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Sales Orders
const SalesPage = () => {
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
        toast.error("加载销售单失败");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">销售管理</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">单号</TableHead>
              <TableHead className="text-slate-300">商品数</TableHead>
              <TableHead className="text-slate-300">总金额</TableHead>
              <TableHead className="text-slate-300">支付方式</TableHead>
              <TableHead className="text-slate-300">状态</TableHead>
              <TableHead className="text-slate-300">创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono">{order.order_no}</TableCell>
                <TableCell className="text-slate-300">{order.items?.length || 0}</TableCell>
                <TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell>
                <TableCell className="text-slate-300">{order.payment_method === 'cash' ? '现金' : '其他'}</TableCell>
                <TableCell>
                  <Badge className={order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.status === 'completed' ? '已完成' : '待处理'}
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
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("加载数据失败");
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
      toast.error("请填写完整信息"); return;
    }
    if (formData.from_warehouse_id === formData.to_warehouse_id) {
      toast.error("来源和目标仓库不能相同"); return;
    }
    try {
      await axios.post(`${API}/inventory/transfer`, null, {
        params: formData
      });
      toast.success("调货成功");
      setFormData({...formData, quantity: 1});
      fetchAll();
    } catch (e) {
      toast.error(e.response?.data?.detail || "调货失败");
    }
  };

  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || id;
  const getProductName = (id) => products.find(p => p.id === id)?.name || id;

  if (loading) return <div className="text-white text-center py-12">加载中...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">调货管理</h1>

      {/* Transfer Form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">新建调货单</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div>
              <label className="text-sm text-slate-300 block mb-1">来源仓库</label>
              <Select value={formData.from_warehouse_id} onValueChange={(v) => setFormData({...formData, from_warehouse_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-from">
                  <SelectValue placeholder="选择来源" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">目标仓库</label>
              <Select value={formData.to_warehouse_id} onValueChange={(v) => setFormData({...formData, to_warehouse_id: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-to">
                  <SelectValue placeholder="选择目标" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.filter(w => w.id !== formData.from_warehouse_id).map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">商品
                {formData.product_id && formData.from_warehouse_id && (
                  <span className="text-yellow-400 ml-1">(库存: {getStock(formData.product_id, formData.from_warehouse_id)})</span>
                )}
              </label>
              <div className="relative">
                <Input
                  placeholder="搜索商品名称/编码..."
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
                      <p className="text-slate-400 text-sm text-center py-2">无结果</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 block mb-1">数量</label>
              <Input type="number" min="1" value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                className="bg-slate-700 border-slate-600" data-testid="transfer-qty" />
            </div>
            <div>
              <Button onClick={handleTransfer} className="bg-blue-500 hover:bg-blue-600 w-full" data-testid="transfer-submit">
                <ArrowLeftRight className="w-4 h-4 mr-2" /> 确认调货
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">各仓库库存概览</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">商品</TableHead>
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
            <CardTitle className="text-white">调货记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">时间</TableHead>
                  <TableHead className="text-slate-300">商品</TableHead>
                  <TableHead className="text-slate-300">来源</TableHead>
                  <TableHead className="text-slate-300">目标</TableHead>
                  <TableHead className="text-slate-300">数量</TableHead>
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
      toast.success("Tasas actualizadas / 汇率已更新");
    } catch (e) {
      toast.error("Error al guardar");
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

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Tasas de Cambio / 汇率设置</h1>

      {/* System Exchange Rates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tasas del Sistema / 系统汇率</CardTitle>
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
            {saving ? 'Guardando...' : 'Guardar Tasas / 保存汇率'}
          </Button>
        </CardContent>
      </Card>

      {/* Category Exchange Rates */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tasas por Categoría / 部门汇率</CardTitle>
          <p className="text-slate-400 text-sm">Configurar tasa de cambio específica para cada departamento</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Código</TableHead>
                <TableHead className="text-slate-300">Categoría / 部门</TableHead>
                <TableHead className="text-slate-300">Tasa de Cambio / 汇率</TableHead>
                <TableHead className="text-slate-300">Ejemplo (USD → Local)</TableHead>
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
          <CardTitle className="text-white">Convertidor Rápido / 快速换算</CardTitle>
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
      toast.success("Configuración guardada / 设置已保存");
    } catch (e) {
      toast.error("Error al guardar / 保存失败");
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

  if (loading) return <div className="text-white">Cargando...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Configuración de Pagos / 支付设置</h1>
      <p className="text-slate-400">Configure los métodos de pago para la tienda en línea (Venezuela)</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transfer Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Transferencia Bancaria / 银行转账</CardTitle>
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
              <label className="text-sm text-slate-300">Banco / 银行名称</label>
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
              <label className="text-sm text-slate-300">Número de Cuenta / 账户号码</label>
              <Input 
                value={settings.transfer_account_number} 
                onChange={(e) => setSettings({...settings, transfer_account_number: e.target.value})}
                className="bg-slate-700 border-slate-600"
                placeholder="0102-0000-00-0000000000"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Titular de la Cuenta / 账户持有人</label>
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
              <CardTitle className="text-white">Pago Móvil / 移动支付</CardTitle>
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
              <label className="text-sm text-slate-300">Código de Banco / 银行代码</label>
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
              <label className="text-sm text-slate-300">Cédula / 身份证号</label>
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
            WhatsApp Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Número de WhatsApp / WhatsApp号码</label>
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
              <p className="text-sm text-green-400">✓ Los clientes podrán contactarte por WhatsApp después de hacer un pedido</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving} data-testid="save-payment-settings">
          {saving ? 'Guardando...' : 'Guardar Configuración / 保存设置'}
        </Button>
      </div>

      {/* Preview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Vista Previa / 预览</CardTitle>
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
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
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? {...i, quantity: i.quantity + 1} : i));
    } else {
      setCart([...cart, { product_id: product.id, product, quantity: 1, unit_price: product.retail_price, amount: product.retail_price }]);
    }
    toast.success("已加入购物车");
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
            <h1 className="text-xl font-bold text-white">网上商城</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/shop/orders" className="text-slate-400 hover:text-white text-sm">
              Mis Pedidos / 我的订单
            </Link>
            <Link to="/admin" className="text-slate-400 hover:text-white text-sm">
              管理后台
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

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
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
                  <span className="text-emerald-400 font-bold">${product.retail_price?.toFixed(2)}</span>
                  <span className="text-slate-500 text-sm">库存: {product.stock}</span>
                </div>
                <Button 
                  className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600" 
                  onClick={() => addToCart(product)}
                  disabled={product.stock <= 0}
                  data-testid={`add-to-cart-${product.id}`}
                >
                  {product.stock > 0 ? '加入购物车' : '缺货'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>购物车</DialogTitle>
          </DialogHeader>
          {cart.length === 0 ? (
            <p className="text-slate-400 text-center py-8">购物车是空的</p>
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
                  <span className="text-slate-300">总计:</span>
                  <span className="text-emerald-400 font-bold">${cartTotal.toFixed(2)}</span>
                </div>
                <Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600" onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="checkout-btn">
                  去结算
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
            <DialogTitle>Información de Pago / 支付信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Shipping Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-emerald-400">Dirección de Entrega / 收货地址</h3>
              <div>
                <label className="text-sm text-slate-300">Nombre / 收货人</label>
                <Input value={checkoutForm.shipping_name} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-name" placeholder="Nombre completo" />
              </div>
              <div>
                <label className="text-sm text-slate-300">Teléfono / 电话</label>
                <Input value={checkoutForm.shipping_phone} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_phone: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-phone" placeholder="0412-1234567" />
              </div>
              <div>
                <label className="text-sm text-slate-300">Dirección / 地址</label>
                <Input value={checkoutForm.shipping_address} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-address" placeholder="Dirección completa" />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 border-t border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-emerald-400">Método de Pago / 支付方式</h3>
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
          <Route path="/admin/sales-report" element={
            <ProtectedRoute>
              <AdminLayout><SalesReportPage /></AdminLayout>
            </ProtectedRoute>
          } />
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
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [shift, setShift] = useState(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [priceMode, setPriceMode] = useState("price1"); // global display: price1, bs
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 36.5 });
  const [showBs, setShowBs] = useState(false); // Bs. display toggle
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingOrders, setPendingOrders] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pos_pending_orders') || '[]'); } catch { return []; }
  });

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

  const fetchData = async (token) => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      const [productsRes, categoriesRes, storesRes, ratesRes] = await Promise.all([
        axios.get(`${API}/products`),
        axios.get(`${API}/categories`),
        axios.get(`${API}/stores`),
        axios.get(`${API}/exchange-rates`)
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
      setStores(storesRes.data.filter(s => s.type === 'retail'));
      setExchangeRates(ratesRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const getProductPrice = (product) => {
    const p1 = product.price1 || product.retail_price || 0;
    return showBs ? p1 * (exchangeRates.usd_to_ves || 1) : p1;
  };

  const getPriceSymbol = () => showBs ? "Bs." : "$";

  const getItemPriceByMode = (product, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    switch (mode) {
      case "price2": return p2;
      case "box": return p3;
      default: return p1;
    }
  };

  const calcCartItemAmount = (product, quantity, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    const boxQty = product.box_quantity || 1;
    if (mode === "box") {
      // quantity = number of boxes, each box has boxQty items
      return quantity * p3;
    }
    const unitPrice = mode === "price2" ? p2 : p1;
    return quantity * unitPrice;
  };

  const getActualItems = (item) => {
    // For box mode, quantity represents boxes
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
      const res = await axios.post(`${API}/auth/login`, loginForm);
      const userData = { ...res.data.user, token: res.data.token };
      setUser(userData);
      localStorage.setItem("pos_user", JSON.stringify(userData));
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      await fetchData(res.data.token);
      setShowLogin(false);
    } catch (e) {
      toast.error("Usuario o contraseña incorrectos");
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
    toast.success("Turno iniciado / 已当班");
  };

  const handleEndShift = () => {
    setShowShiftModal(true);
  };

  const confirmEndShift = () => {
    localStorage.removeItem("pos_shift");
    setShift(null);
    setShowShiftModal(false);
    toast.success("Turno finalizado / 已交班");
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
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      const newQty = existing.quantity + 1;
      const amount = calcCartItemAmount(product, newQty, existing.price_mode);
      setCart(cart.map(i => i.product_id === product.id 
        ? {...i, quantity: newQty, amount} 
        : i));
    } else {
      const p1 = product.price1 || product.retail_price || 0;
      setCart([...cart, {
        product_id: product.id,
        product,
        quantity: 1,
        price_mode: "price1",
        unit_price: p1,
        amount: p1
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(i => {
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
    setCart(cart.map(i => {
      if (i.product_id === productId) {
        let newQty = i.quantity;
        const boxQty = i.product.box_quantity || 1;
        // When switching to box mode, convert pieces to boxes (min 1)
        if (newMode === "box" && i.price_mode !== "box") {
          newQty = Math.max(1, Math.round(i.quantity / boxQty));
        }
        // When switching from box to pieces, convert boxes to pieces
        if (newMode !== "box" && i.price_mode === "box") {
          newQty = i.quantity * boxQty;
        }
        const amount = calcCartItemAmount(i.product, newQty, newMode);
        const unitPrice = getItemPriceByMode(i.product, newMode);
        return {...i, price_mode: newMode, quantity: newQty, unit_price: unitPrice, amount};
      }
      return i;
    }));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, i) => sum + i.amount, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

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
        discount: 0,
        amount: i.amount
      })),
      payment_method: paymentMethod,
      paid_amount: parseFloat(receivedAmount) || cartTotal,
      notes: ""
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
        sales: [...shift.sales, { amount: cartTotal, method: paymentMethod, time: new Date().toISOString() }],
        total_sales: shift.total_sales + cartTotal,
        total_cash: paymentMethod === 'cash' ? shift.total_cash + cartTotal : shift.total_cash
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

  const change = parseFloat(receivedAmount) - cartTotal;

  // Login Screen
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
              <CreditCard className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">POS - Caja</CardTitle>
            <p className="text-slate-400">Sistema de Punto de Venta</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">Usuario / 用户名</label>
              <Input
                value={loginForm.username}
                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ingrese usuario"
                data-testid="pos-username"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">Contraseña / 密码</label>
              <Input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Ingrese contraseña"
                data-testid="pos-password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="pos-login-btn">
              Iniciar Sesión / 登录
            </Button>
            <div className="text-center">
              <Link to="/admin" className="text-slate-400 hover:text-white text-sm">
                Ir al Panel Admin →
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
            <CardTitle className="text-xl text-white">Seleccionar Tienda / 选择门店</CardTitle>
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
                <p className="text-slate-400 text-sm">{store.code} - {store.address || 'Sin dirección'}</p>
              </div>
            ))}
            {stores.length === 0 && (
              <p className="text-slate-400 text-center py-4">No hay tiendas configuradas</p>
            )}
            <Button variant="outline" onClick={handleLogout} className="w-full mt-4 border-slate-600 text-slate-300">
              Cerrar Sesión / 退出
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
          {/* Currency Toggle - Up/Down */}
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1">
            <span className="text-xs text-slate-400 mr-1">币种</span>
            <span className={`text-sm font-bold min-w-[36px] text-center ${showBs ? 'text-orange-400' : 'text-emerald-400'}`}>
              {showBs ? 'Bs.' : '$'}
            </span>
            <div className="flex flex-col">
              <button onClick={() => setShowBs(!showBs)} className="text-slate-400 hover:text-white leading-none" data-testid="currency-up">
                <ChevronDown className="w-3 h-3 rotate-180" />
              </button>
              <button onClick={() => setShowBs(!showBs)} className="text-slate-400 hover:text-white leading-none" data-testid="currency-down">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>
          {shift ? (
            <Badge className="bg-green-500/20 text-green-400 text-xs">
              Turno desde {new Date(shift.start_time).toLocaleTimeString()}
            </Badge>
          ) : (
            <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">Sin Turno</Badge>
          )}
          {!shift ? (
            <Button size="sm" onClick={handleStartShift} className="bg-green-600 hover:bg-green-700 h-7 text-xs" data-testid="start-shift-btn">
              当班
            </Button>
          ) : (
            <Button size="sm" onClick={handleEndShift} className="bg-orange-600 hover:bg-orange-700 h-7 text-xs" data-testid="end-shift-btn">
              交班
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
              placeholder="扫描条码 / 搜索商品名称..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value) setShowProductSearch(true); }}
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
            <Package className="w-4 h-4 mr-2" /> 商品
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
                全部
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
                    <th className="text-left px-3 py-2">编码</th>
                    <th className="text-left px-3 py-2">商品名称</th>
                    <th className="text-right px-3 py-2">成本</th>
                    <th className="text-right px-3 py-2">价格1</th>
                    <th className="text-right px-3 py-2">价格2</th>
                    <th className="text-right px-3 py-2">价格3(整箱)</th>
                    <th className="text-center px-3 py-2 w-16">操作</th>
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
                    <tr><td colSpan="7" className="text-slate-400 text-sm text-center py-4">没有找到商品</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Close button */}
            <div className="p-2 border-t border-slate-700 text-right">
              <Button size="sm" variant="outline" onClick={() => setShowProductSearch(false)} className="border-slate-600 text-slate-300 h-7 text-xs">
                关闭
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
              <h2 className="text-white font-bold">销售单</h2>
              <Badge className="bg-slate-600 text-xs">{cartCount} 件</Badge>
            </div>
            <Button size="sm" variant="outline" onClick={clearCart} className="border-slate-600 text-slate-300 h-7 text-xs" disabled={cart.length === 0}>
              清空
            </Button>
          </div>

          {/* Cart Table */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 sticky top-0">
                <tr className="text-slate-400 text-xs">
                  <th className="text-left px-4 py-2 w-8">#</th>
                  <th className="text-left px-4 py-2">商品名称</th>
                  <th className="text-center px-2 py-2 w-32">数量</th>
                  <th className="text-center px-2 py-2 w-28">价格类型</th>
                  <th className="text-right px-4 py-2 w-28">单价</th>
                  <th className="text-right px-4 py-2 w-36">金额</th>
                  <th className="text-center px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center text-slate-500 py-16">
                      <Search className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">搜索或扫描条码添加商品</p>
                    </td>
                  </tr>
                ) : (
                  cart.map((item, idx) => {
                    const boxQty = item.product.box_quantity || 1;
                    const isBoxMode = item.price_mode === "box";
                    const totalPieces = isBoxMode ? item.quantity * boxQty : item.quantity;
                    const displayAmount = showBs ? item.amount * (exchangeRates.usd_to_ves || 1) : item.amount;
                    const displayUnitPrice = showBs ? getItemPriceByMode(item.product, item.price_mode) * (exchangeRates.usd_to_ves || 1) : getItemPriceByMode(item.product, item.price_mode);
                    const priceModes = ["price1", "price2", "box"];
                    const currentIdx = priceModes.indexOf(item.price_mode);
                    const modeLabels = { price1: "价格1", price2: "价格2", box: "整箱" };
                    const modeColors = { price1: "text-emerald-400", price2: "text-yellow-400", box: "text-blue-400" };
                    return (
                      <tr key={item.product_id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`cart-row-${item.product_id}`}>
                        <td className="px-4 py-3 text-slate-500 text-sm">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-white text-sm font-medium">{item.product.name}</p>
                          <p className="text-slate-500 text-xs">{item.product.code}</p>
                          {/* Box calculation: 数量×单价=金额 */}
                          {isBoxMode && (() => {
                            const rate = exchangeRates.usd_to_ves || 1;
                            const p3 = item.product.price3 || item.product.wholesale_price || 0;
                            return (
                              <p className="text-blue-300 text-xs mt-0.5">
                                {item.quantity}{t('boxes')}×{getPriceSymbol()}{(showBs ? p3*rate : p3).toFixed(2)}={getPriceSymbol()}{displayAmount.toFixed(2)}
                                <span className="text-slate-400 ml-1">({totalPieces}{t('pieces')})</span>
                              </p>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => updateQuantity(item.product_id, -1)} className="w-7 h-7 rounded bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center text-sm">-</button>
                            <span className="text-white w-10 text-center font-medium">{item.quantity}</span>
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
                        <td className="px-4 py-3 text-right text-slate-300 text-sm">
                          {getPriceSymbol()}{displayUnitPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white">
                          {getPriceSymbol()}{displayAmount.toFixed(2)}
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
              {cart.length} 种商品, {cartCount} 件
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-slate-400 text-sm mr-3">合计:</span>
                <span className="text-2xl font-bold text-white">
                  {getPriceSymbol()}{(showBs ? cartTotal * (exchangeRates.usd_to_ves || 1) : cartTotal).toFixed(2)}
                </span>
              </div>
              <Button 
                onClick={() => setShowPayment(true)} 
                className="bg-green-600 hover:bg-green-700 h-10 px-8 text-base font-bold" 
                disabled={cart.length === 0 || !shift}
                data-testid="pos-pay-btn"
              >
                收款
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Cobrar / 收款</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-sm">Total a Cobrar ({showBs ? 'Bs.' : 'USD'})</p>
              <p className="text-4xl font-bold text-white">
                {getPriceSymbol()}{(showBs ? cartTotal * (exchangeRates.usd_to_ves || 1) : cartTotal).toFixed(2)}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cash', label: 'Efectivo', icon: '💵' },
                  { id: 'card', label: 'Tarjeta', icon: '💳' },
                  { id: 'transfer', label: 'Transfer', icon: '📱' }
                ].map(method => (
                  <div
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-3 rounded-lg border cursor-pointer text-center transition-colors ${
                      paymentMethod === method.id 
                        ? 'border-green-500 bg-green-500/10' 
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <p className="text-sm mt-1">{method.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="space-y-2">
                <label className="text-sm text-slate-300">Monto Recibido</label>
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-2xl text-center"
                  placeholder="0.00"
                  data-testid="pos-received-amount"
                />
                {receivedAmount && change >= 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-400">Cambio / 找零</p>
                    <p className="text-2xl font-bold text-green-400">{getPriceSymbol()}{change.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPayment(false)} className="border-slate-600">
                Cancelar
              </Button>
              <Button 
                onClick={handlePayment} 
                className="bg-green-600 hover:bg-green-700"
                disabled={paymentMethod === 'cash' && (!receivedAmount || change < 0)}
                data-testid="pos-confirm-payment"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Cerrar Turno / 交班</DialogTitle>
          </DialogHeader>
          {shift && (
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cajero:</span>
                  <span className="text-white">{shift.user}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tienda:</span>
                  <span className="text-white">{shift.store}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Inicio:</span>
                  <span className="text-white">{new Date(shift.start_time).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ventas:</span>
                  <span className="text-white">{shift.sales?.length || 0} transacciones</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600">
                  <span className="text-slate-300">Total Ventas:</span>
                  <span className="text-green-400">${shift.total_sales?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Efectivo:</span>
                  <span className="text-white">${shift.total_cash?.toFixed(2)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setShowShiftModal(false)} className="border-slate-600">
                  Cancelar
                </Button>
                <Button onClick={confirmEndShift} className="bg-orange-600 hover:bg-orange-700" data-testid="confirm-end-shift">
                  Confirmar Cierre
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
