import { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "sonner";
import { 
  Store, Package, Warehouse, Users, ShoppingCart, BarChart3, 
  Settings, LogOut, Menu, X, Plus, Search, Edit, Trash2, 
  Home, Building2, Truck, CreditCard, Globe, ChevronDown,
  ShoppingBag, DollarSign, TrendingUp, AlertCircle, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: Home, label: "仪表盘", path: "/admin" },
    { icon: Building2, label: "门店管理", path: "/admin/stores" },
    { icon: Warehouse, label: "仓库管理", path: "/admin/warehouses" },
    { icon: Package, label: "商品管理", path: "/admin/products" },
    { icon: Users, label: "客户管理", path: "/admin/customers" },
    { icon: Truck, label: "供应商", path: "/admin/suppliers" },
    { icon: ShoppingCart, label: "采购管理", path: "/admin/purchases" },
    { icon: CreditCard, label: "销售管理", path: "/admin/sales" },
    { icon: Globe, label: "网店订单", path: "/admin/online-orders" },
    { icon: BarChart3, label: "报表统计", path: "/admin/reports" },
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

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-700">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && "退出登录"}
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
                <p className="text-2xl font-bold text-white mt-1">¥{stats?.today_sales_amount?.toFixed(2) || '0.00'}</p>
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
                <p className="text-2xl font-bold text-white mt-1">¥{stats?.today_online_amount?.toFixed(2) || '0.00'}</p>
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
    cost_price: 0, retail_price: 0, wholesale_price: 0,
    min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active"
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
      toast.error("加载商品失败");
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
      cost_price: 0, retail_price: 0, wholesale_price: 0,
      min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active"
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
              <TableHead className="text-slate-300">分类</TableHead>
              <TableHead className="text-slate-300">零售价</TableHead>
              <TableHead className="text-slate-300">成本价</TableHead>
              <TableHead className="text-slate-300">状态</TableHead>
              <TableHead className="text-slate-300">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-slate-700">
                <TableCell className="text-slate-300">{product.code}</TableCell>
                <TableCell className="text-white font-medium">{product.name}</TableCell>
                <TableCell className="text-slate-300">
                  {categories.find(c => c.id === product.category_id)?.name || '-'}
                </TableCell>
                <TableCell className="text-emerald-400">¥{product.retail_price?.toFixed(2)}</TableCell>
                <TableCell className="text-slate-400">¥{product.cost_price?.toFixed(2)}</TableCell>
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
            <div>
              <label className="text-sm text-slate-300">成本价</label>
              <Input type="number" value={formData.cost_price} onChange={(e) => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
            </div>
            <div>
              <label className="text-sm text-slate-300">零售价</label>
              <Input type="number" value={formData.retail_price} onChange={(e) => setFormData({...formData, retail_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="product-price" />
            </div>
            <div>
              <label className="text-sm text-slate-300">批发价</label>
              <Input type="number" value={formData.wholesale_price} onChange={(e) => setFormData({...formData, wholesale_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
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
      toast.error("加载门店失败");
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
      toast.error("加载仓库失败");
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
      toast.error("加载订单失败");
    } finally {
      setLoading(false);
    }
  };

  const handleShip = async (orderId) => {
    try {
      await axios.put(`${API}/shop/orders/${orderId}/ship`);
      toast.success("发货成功");
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
    pending: "待处理",
    processing: "处理中",
    shipped: "已发货",
    completed: "已完成",
    cancelled: "已取消"
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">网店订单</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待处理</SelectItem>
            <SelectItem value="processing">处理中</SelectItem>
            <SelectItem value="shipped">已发货</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">订单号</TableHead>
              <TableHead className="text-slate-300">收货人</TableHead>
              <TableHead className="text-slate-300">商品数</TableHead>
              <TableHead className="text-slate-300">订单金额</TableHead>
              <TableHead className="text-slate-300">支付状态</TableHead>
              <TableHead className="text-slate-300">订单状态</TableHead>
              <TableHead className="text-slate-300">下单时间</TableHead>
              <TableHead className="text-slate-300">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono">{order.order_no}</TableCell>
                <TableCell className="text-slate-300">{order.shipping_name}</TableCell>
                <TableCell className="text-slate-300">{order.items?.length || 0}</TableCell>
                <TableCell className="text-emerald-400">¥{(order.total_amount + order.shipping_fee).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge className={order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.payment_status === 'paid' ? '已支付' : '待支付'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[order.order_status]}>
                    {statusLabels[order.order_status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {order.payment_status === 'paid' && order.order_status === 'processing' && (
                    <Button size="sm" onClick={() => handleShip(order.id)} className="bg-purple-500 hover:bg-purple-600" data-testid={`ship-order-${order.id}`}>
                      发货
                    </Button>
                  )}
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
      toast.error("加载客户失败");
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
                <TableCell className="text-emerald-400">¥{customer.balance?.toFixed(2)}</TableCell>
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
      toast.error("加载供应商失败");
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
      toast.error("加载采购单失败");
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
                <TableCell className="text-emerald-400">¥{order.total_amount?.toFixed(2)}</TableCell>
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
                      <TableCell className="text-slate-300">¥{item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-emerald-400">¥{item.amount?.toFixed(2)}</TableCell>
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
      toast.error("加载销售单失败");
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
                <TableCell className="text-emerald-400">¥{order.total_amount?.toFixed(2)}</TableCell>
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
            <p className="text-2xl font-bold text-white mt-1">¥{salesSummary?.total_sales?.toFixed(2) || '0.00'}</p>
            <p className="text-slate-500 text-xs mt-1">{salesSummary?.sales_count || 0} 笔</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-sm">网店销售额</p>
            <p className="text-2xl font-bold text-white mt-1">¥{salesSummary?.total_online_sales?.toFixed(2) || '0.00'}</p>
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
            <p className="text-2xl font-bold text-white mt-1">¥{inventorySummary?.total_value?.toFixed(2) || '0.00'}</p>
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
                  <TableCell className="text-emerald-400">¥{item.amount?.toFixed(2)}</TableCell>
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

// Online Shop (Public)
const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customer_id: "", shipping_name: "", shipping_phone: "", shipping_address: ""
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
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

  const handleCheckout = async () => {
    try {
      const res = await axios.post(`${API}/shop/orders`, {
        customer_id: checkoutForm.customer_id || "guest",
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, amount: i.amount })),
        shipping_name: checkoutForm.shipping_name,
        shipping_phone: checkoutForm.shipping_phone,
        shipping_address: checkoutForm.shipping_address
      });
      toast.success("订单创建成功!");
      setCart([]);
      setShowCheckout(false);
      setShowCart(false);
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
                  <span className="text-emerald-400 font-bold">¥{product.retail_price?.toFixed(2)}</span>
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
                    <p className="text-emerald-400">¥{item.unit_price?.toFixed(2)}</p>
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
                  <span className="text-emerald-400 font-bold">¥{cartTotal.toFixed(2)}</span>
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
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>收货信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300">收货人姓名</label>
              <Input value={checkoutForm.shipping_name} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-name" />
            </div>
            <div>
              <label className="text-sm text-slate-300">联系电话</label>
              <Input value={checkoutForm.shipping_phone} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_phone: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-phone" />
            </div>
            <div>
              <label className="text-sm text-slate-300">收货地址</label>
              <Input value={checkoutForm.shipping_address} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-address" />
            </div>
            <div className="border-t border-slate-700 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-300">商品金额:</span>
                <span className="text-white">¥{cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-slate-300">运费:</span>
                <span className="text-white">{cartTotal >= 100 ? '免运费' : '¥10.00'}</span>
              </div>
              <div className="flex justify-between mt-2 text-lg font-bold">
                <span className="text-slate-300">应付:</span>
                <span className="text-emerald-400">¥{(cartTotal + (cartTotal >= 100 ? 0 : 10)).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="border-slate-600">取消</Button>
            <Button onClick={handleCheckout} className="bg-emerald-500 hover:bg-emerald-600" data-testid="place-order-btn">
              提交订单
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// App
function App() {
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
          <Route path="/admin/reports" element={
            <ProtectedRoute>
              <AdminLayout><ReportsPage /></AdminLayout>
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/shop" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
