import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard, Search, Package, Plus, X, ChevronDown,
  LogOut, Wifi, WifiOff, ShoppingBag, Printer, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { InvoicePrint } from "@/components/InvoicePrint";

export default function PosPage() {
  const { t, lang, changeLang } = useLang();
  const auth = useAuth();
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
  const [pendingOrders, setPendingOrders] = useState(() => { try { return JSON.parse(localStorage.getItem('pos_pending_orders') || '[]'); } catch { return []; } });
  const [heldOrders, setHeldOrders] = useState(() => { try { return JSON.parse(localStorage.getItem('pos_held_orders') || '[]'); } catch { return []; } });
  const [showHeldOrders, setShowHeldOrders] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [refundOrderNo, setRefundOrderNo] = useState("");
  const [pricingMode, setPricingMode] = useState("local_based");
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [systemSettings, setSystemSettings] = useState({});
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [pointsToUse, setPointsToUse] = useState(0);
  const receiptRef = useRef(null);
  const invoiceRef = useRef(null);

  // Network detection
  useEffect(() => { const goOnline = () => setIsOnline(true); const goOffline = () => setIsOnline(false); window.addEventListener('online', goOnline); window.addEventListener('offline', goOffline); return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); }; }, []);

  // Auto-sync when coming back online
  useEffect(() => { if (isOnline && pendingOrders.length > 0) syncPendingOrders(); }, [isOnline]);

  const syncPendingOrders = async () => {
    const remaining = [];
    let synced = 0;
    for (const order of pendingOrders) { try { await axios.post(`${API}/sales-orders`, order); synced++; } catch { remaining.push(order); } }
    setPendingOrders(remaining); localStorage.setItem('pos_pending_orders', JSON.stringify(remaining));
    if (synced > 0) toast.success(`${synced} ${t('pendingSync')} OK`);
    if (remaining.length > 0) toast.warning(`${remaining.length} ${t('pendingSync')}`);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("pos_user");
    const savedStore = localStorage.getItem("pos_store");
    const savedShift = localStorage.getItem("pos_shift");
    const savedPriceMode = localStorage.getItem("pos_price_mode");
    if (savedUser && savedStore) {
      setUser(JSON.parse(savedUser)); setSelectedStore(JSON.parse(savedStore)); setShowLogin(false);
      if (savedShift) setShift(JSON.parse(savedShift));
      if (savedPriceMode) setPriceMode(savedPriceMode);
      fetchData(JSON.parse(savedUser).token);
    } else if (auth?.token && auth?.user) {
      // Use admin panel token for POS (supports tenant context)
      const userData = { ...auth.user, token: auth.token };
      setUser(userData);
      localStorage.setItem("pos_user", JSON.stringify(userData));
      localStorage.setItem("pos_token", auth.token);
      fetchData(auth.token);
      setShowLogin(false);
    }
  }, []);

  // Keyboard shortcuts
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

  const holdCurrentOrder = () => { if (cart.length === 0) return; const held = { id: Date.now(), items: cart, total: finalTotal, time: new Date().toISOString() }; const newHeld = [...heldOrders, held]; setHeldOrders(newHeld); localStorage.setItem('pos_held_orders', JSON.stringify(newHeld)); clearCart(); toast.success(t('holdOrder') + " OK"); };
  const recallOrder = (heldId) => { const held = heldOrders.find(h => h.id === heldId); if (held) { setCart(held.items); setHeldOrders(prev => { const n = prev.filter(h => h.id !== heldId); localStorage.setItem('pos_held_orders', JSON.stringify(n)); return n; }); setShowHeldOrders(false); toast.success(t('recallOrder') + " OK"); } };
  const handleRefund = async () => { try { const token = localStorage.getItem("pos_token"); await axios.post(`${API}/refunds`, { order_no: refundOrderNo, items: [], reason: "POS refund" }, { headers: { Authorization: `Bearer ${token}` } }); toast.success(t('refund') + " OK"); setShowRefund(false); setRefundOrderNo(""); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };

  const fetchData = async (token) => {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    try {
      const [productsRes, categoriesRes, storesRes, ratesRes, settingsRes] = await Promise.all([
        axios.get(`${API}/products`), axios.get(`${API}/categories`), axios.get(`${API}/stores`), axios.get(`${API}/exchange-rates`), axios.get(`${API}/settings/system`).catch(() => ({ data: {} }))
      ]);
      setProducts(productsRes.data); setCategories(categoriesRes.data); setStores(storesRes.data.filter(s => s.type === 'retail')); setExchangeRates(ratesRes.data);
      if (settingsRes.data?.pricing_mode) setPricingMode(settingsRes.data.pricing_mode);
      setSystemSettings(settingsRes.data || {});
      // Fetch customers
      axios.get(`${API}/customers`).then(r => setCustomers(r.data)).catch(() => {});
    } catch (e) { console.error(e); }
  };

  const fetchCashiers = async () => {
    try { const res = await axios.get(`${API}/auth/cashiers`); setCashiers(res.data); } catch { setCashiers([]); }
  };
  useEffect(() => { if (!showLogin && user?.token) { axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`; fetchCashiers(); } }, [showLogin]);

  // === Pricing helpers ===
  const getProductBsMultiplier = (product) => {
    const sysRate = exchangeRates.usd_to_ves || 1;
    if (pricingMode === "local_based") { const cat = categories.find(c => c.id === product.category_id); const catRate = cat?.exchange_rate; if (catRate && catRate > 1) return catRate / sysRate; }
    return sysRate;
  };

  const getPriceSymbol = () => showBs ? "Bs." : "$";
  const toDisplayPrice = (usdPrice, product) => { if (!showBs) return usdPrice; return usdPrice * getProductBsMultiplier(product); };

  const getItemPriceByMode = (product, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    const boxQty = product.box_quantity || 1;
    switch (mode) { case "price2": return p2; case "box": return p3 * boxQty; default: return p1; }
  };

  const calcCartItemAmount = (product, quantity, mode) => {
    const p1 = product.price1 || product.retail_price || 0;
    const p2 = product.price2 || p1;
    const p3 = product.price3 || product.wholesale_price || p1;
    const boxQty = product.box_quantity || 1;
    if (mode === "box") return quantity * boxQty * p3;
    return quantity * (mode === "price2" ? p2 : p1);
  };

  const getActualItems = (item) => item.price_mode === "box" ? item.quantity * (item.product.box_quantity || 1) : item.quantity;

  // === Login/Store/Shift ===
  const handleLogin = async () => {
    try {
      const loginData = selectedCashier ? { username: selectedCashier.username, password: loginForm.password } : loginForm;
      const res = await axios.post(`${API}/auth/login`, loginData);
      const userData = { ...res.data.user, token: res.data.token };
      setUser(userData); localStorage.setItem("pos_user", JSON.stringify(userData)); localStorage.setItem("pos_token", res.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      await fetchData(res.data.token); setShowLogin(false);
    } catch (e) { toast.error(t('login') + " failed"); }
  };
  const handleSelectStore = (store) => { setSelectedStore(store); localStorage.setItem("pos_store", JSON.stringify(store)); };
  const handleStartShift = () => { const newShift = { id: Date.now(), start_time: new Date().toISOString(), user: user.username, store: selectedStore.name, sales: [], total_sales: 0, total_cash: 0 }; setShift(newShift); localStorage.setItem("pos_shift", JSON.stringify(newShift)); toast.success(t('startShift')); };
  const handleEndShift = () => setShowShiftModal(true);
  const confirmEndShift = () => { localStorage.removeItem("pos_shift"); setShift(null); setShowShiftModal(false); toast.success(t('endShift')); };
  const handleLogout = () => { localStorage.removeItem("pos_user"); localStorage.removeItem("pos_store"); localStorage.removeItem("pos_shift"); setUser(null); setSelectedStore(null); setShift(null); setShowLogin(true); };

  // === Cart ===
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) { const newQty = existing.quantity + 1; return prev.map(i => i.product_id === product.id ? {...i, quantity: newQty, amount: calcCartItemAmount(product, newQty, existing.price_mode)} : i); }
      const p1 = product.price1 || product.retail_price || 0;
      return [...prev, { product_id: product.id, product, quantity: 1, price_mode: "price1", unit_price: p1, amount: p1 }];
    });
  };
  const updateQuantity = (productId, delta) => { setCart(prev => prev.map(i => { if (i.product_id === productId) { const newQty = i.quantity + delta; if (newQty <= 0) return null; return {...i, quantity: newQty, amount: calcCartItemAmount(i.product, newQty, i.price_mode)}; } return i; }).filter(Boolean)); };
  const changeItemPriceMode = (productId, newMode) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== productId) return i;
      const boxQty = i.product.box_quantity || 1;
      if (newMode === "box" && i.price_mode !== "box") { const boxCount = Math.max(1, Math.floor(i.quantity / boxQty) || 1); return {...i, price_mode: "box", quantity: boxCount, unit_price: getItemPriceByMode(i.product, "box"), amount: calcCartItemAmount(i.product, boxCount, "box"), _saved_pieces: i.quantity}; }
      if (newMode !== "box" && i.price_mode === "box") { const autoBoxCount = Math.max(1, Math.floor((i._saved_pieces || 1) / boxQty) || 1); let newQty = (i._saved_pieces && i.quantity === autoBoxCount) ? i._saved_pieces : i.quantity * boxQty; return {...i, price_mode: newMode, quantity: newQty, unit_price: getItemPriceByMode(i.product, newMode), amount: calcCartItemAmount(i.product, newQty, newMode), _saved_pieces: undefined}; }
      return {...i, price_mode: newMode, unit_price: getItemPriceByMode(i.product, newMode), amount: calcCartItemAmount(i.product, i.quantity, newMode)};
    }));
  };
  const removeFromCart = (productId) => setCart(prev => prev.filter(i => i.product_id !== productId));
  const clearCart = () => setCart([]);

  // === Totals ===
  const cartTotal = cart.reduce((sum, i) => sum + i.amount, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotalDisplay = (() => {
    if (!showBs && pricingMode !== "local_based") return cartTotal;
    return cart.reduce((sum, i) => {
      const rate = getProductBsMultiplier(i.product);
      const sysRate = exchangeRates.usd_to_ves || 1;
      if (showBs) return sum + i.amount * rate;
      return sum + (rate !== sysRate ? i.amount * rate / sysRate : i.amount);
    }, 0);
  })();
  const cartCost = cart.reduce((sum, i) => { const cost = i.product.cost_price || 0; const qty = i.price_mode === "box" ? i.quantity * (i.product.box_quantity || 1) : i.quantity; return sum + cost * qty; }, 0);
  const maxDiscountPercent = cartTotal > 0 ? Math.floor((1 - cartCost / cartTotal) * 100) : 0;
  const safeDiscount = Math.min(discountPercent, maxDiscountPercent);
  const discountAmount = cartTotal * safeDiscount / 100;
  const pointsValueRate = systemSettings?.points_value_rate || 100;
  const pointsDiscount = pointsToUse / pointsValueRate;
  const finalTotal = Math.max(0, cartTotal - discountAmount - pointsDiscount);
  const change = parseFloat(receivedAmount) - finalTotal;

  // === Payment ===
  const handlePayment = async () => {
    if (!shift) { toast.error(t('noShift')); return; }
    const orderItems = cart.map(i => ({ product_id: i.product_id, product_name: i.product.name, quantity: i.price_mode === "box" ? getActualItems(i) : i.quantity, unit_price: i.unit_price, discount: safeDiscount, amount: i.amount * (1 - safeDiscount / 100) }));
    const orderData = { store_id: selectedStore.id, customer_id: selectedCustomer?.id || null, items: orderItems, payment_method: paymentMethod, paid_amount: parseFloat(receivedAmount) || finalTotal, notes: safeDiscount > 0 ? `Discount: ${safeDiscount}%` : "", points_used: pointsToUse };
    // Capture receipt data before clearing cart
    const receiptData = { order_no: `SO${Date.now()}`, date: new Date().toISOString(), items: orderItems, subtotal: cartTotal, total_amount: finalTotal, discount: safeDiscount, payment_method: paymentMethod, paid_amount: parseFloat(receivedAmount) || finalTotal, cashier: user?.name || user?.username, store: selectedStore?.name, customer_name: selectedCustomer?.name, points_used: pointsToUse, points_discount: pointsDiscount, points_earned: 0 };
    try {
      if (isOnline) {
        const res = await axios.post(`${API}/sales-orders`, orderData);
        if (res.data?.order_no) receiptData.order_no = res.data.order_no;
        if (res.data?.points_earned) receiptData.points_earned = res.data.points_earned;
        // Refresh customer data to show updated points
        if (selectedCustomer) {
          const cRes = await axios.get(`${API}/customers`);
          setCustomers(cRes.data);
          const updated = cRes.data.find(c => c.id === selectedCustomer.id);
          if (updated) setSelectedCustomer(updated);
        }
      }
      else { const newPending = [...pendingOrders, { ...orderData, offline_id: Date.now().toString(), created_at: new Date().toISOString() }]; setPendingOrders(newPending); localStorage.setItem('pos_pending_orders', JSON.stringify(newPending)); }
      const updatedShift = { ...shift, sales: [...shift.sales, { amount: finalTotal, method: paymentMethod, time: new Date().toISOString() }], total_sales: shift.total_sales + finalTotal, total_cash: paymentMethod === 'cash' ? shift.total_cash + finalTotal : shift.total_cash };
      setShift(updatedShift); localStorage.setItem("pos_shift", JSON.stringify(updatedShift));
      toast.success(isOnline ? t('confirmPayment') + " OK" : t('offlineMode') + " - " + t('pendingSync'));
      setLastOrder(receiptData); setShowReceipt(true);
      setCart([]); setShowPayment(false); setReceivedAmount(""); setDiscountPercent(0); setPointsToUse(0);
    } catch (e) {
      const newPending = [...pendingOrders, { ...orderData, offline_id: Date.now().toString(), created_at: new Date().toISOString() }]; setPendingOrders(newPending); localStorage.setItem('pos_pending_orders', JSON.stringify(newPending));
      setLastOrder(receiptData); setShowReceipt(true);
      toast.warning(t('offlineWarning')); setCart([]); setShowPayment(false); setReceivedAmount(""); setDiscountPercent(0); setPointsToUse(0);
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) { receiptRef.current.style.display = 'block'; window.print(); receiptRef.current.style.display = 'none'; }
  };
  const handlePrintInvoice = () => {
    if (invoiceRef.current) { invoiceRef.current.style.display = 'block'; window.print(); invoiceRef.current.style.display = 'none'; }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm);
    const matchCategory = selectedCategory === "all" || p.category_id === selectedCategory;
    return matchSearch && matchCategory && p.status === 'active';
  });

  // === LOGIN SCREEN ===
  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardHeader className="text-center"><div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4"><CreditCard className="w-10 h-10 text-white" /></div><CardTitle className="text-2xl text-white">POS</CardTitle><p className="text-slate-400">{t('posTitle')}</p></CardHeader>
          <CardContent className="space-y-4">
            {cashiers.length > 0 && !selectedCashier && (
              <div className="space-y-2"><label className="text-sm text-slate-300">{t('employees')}</label><div className="grid grid-cols-2 gap-2">{cashiers.map(c => (<div key={c.id} onClick={() => { setSelectedCashier(c); setLoginForm({...loginForm, username: c.username}); }} className="p-3 rounded-lg border border-slate-600 hover:border-emerald-500 cursor-pointer text-center transition-colors" data-testid={`cashier-${c.username}`}><div className="w-10 h-10 bg-slate-600 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold">{(c.name || c.username).charAt(0).toUpperCase()}</div><p className="text-white text-sm font-medium">{c.name || c.username}</p><p className="text-slate-500 text-xs">{c.role}</p></div>))}</div></div>
            )}
            {selectedCashier && (
              <div className="space-y-3"><div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3"><div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{(selectedCashier.name || selectedCashier.username).charAt(0).toUpperCase()}</div><div><p className="text-white font-medium">{selectedCashier.name || selectedCashier.username}</p><p className="text-slate-400 text-xs">{selectedCashier.role}</p></div><Button size="sm" variant="ghost" onClick={() => setSelectedCashier(null)} className="ml-auto text-slate-400"><X className="w-4 h-4" /></Button></div><div><label className="text-sm text-slate-300">{t('password')}</label><Input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="bg-slate-700 border-slate-600 text-white" autoFocus data-testid="pos-password" /></div><Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="pos-login-btn">{t('login')}</Button></div>
            )}
            {cashiers.length === 0 && (
              <><div><label className="text-sm text-slate-300">{t('username')}</label><Input value={loginForm.username} onChange={(e) => setLoginForm({...loginForm, username: e.target.value})} className="bg-slate-700 border-slate-600 text-white" data-testid="pos-username" /></div><div><label className="text-sm text-slate-300">{t('password')}</label><Input type="password" value={loginForm.password} onChange={(e) => setLoginForm({...loginForm, password: e.target.value})} className="bg-slate-700 border-slate-600 text-white" data-testid="pos-password" onKeyDown={(e) => e.key === 'Enter' && handleLogin()} /></div><Button onClick={handleLogin} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="pos-login-btn-manual">{t('login')}</Button></>
            )}
            <div className="text-center"><Link to="/admin" className="text-slate-400 hover:text-white text-sm">Admin</Link></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // === STORE SELECTION ===
  if (!selectedStore) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-slate-800/80 border-slate-700 backdrop-blur">
          <CardHeader className="text-center"><CardTitle className="text-xl text-white">{t('storeManagement')}</CardTitle><p className="text-slate-400">{user?.name || user?.username}</p></CardHeader>
          <CardContent className="space-y-3">{stores.map(store => (<div key={store.id} onClick={() => handleSelectStore(store)} className="p-4 bg-slate-700/50 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors border border-slate-600"><p className="text-white font-medium">{store.name}</p><p className="text-slate-400 text-sm">{store.code} - {store.address || ''}</p></div>))}{stores.length === 0 && <p className="text-slate-400 text-center py-4">{t('noData')}</p>}<Button variant="outline" onClick={handleLogout} className="w-full mt-4 border-slate-600 text-slate-300">{t('logout')}</Button></CardContent>
        </Card>
      </div>
    );
  }

  // === MAIN POS ===
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-blue-400" /><span className="text-white font-bold text-sm">POS</span></div>
          <span className="text-slate-400 text-sm"><span className="text-white">{selectedStore?.name}</span> | {user?.name || user?.username}</span>
          {/* Customer selector */}
          <div className="relative">
            <button onClick={() => setShowCustomerSearch(!showCustomerSearch)} className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs border transition-colors ${selectedCustomer ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 text-slate-400 hover:text-white'}`} data-testid="pos-customer-btn">
              <Users className="w-3 h-3" />
              {selectedCustomer ? selectedCustomer.name : t('customer')}
              {selectedCustomer && <X className="w-3 h-3 ml-1 hover:text-red-400" onClick={(e) => { e.stopPropagation(); setSelectedCustomer(null); setPointsToUse(0); }} />}
            </button>
            {selectedCustomer && selectedCustomer.points > 0 && (
              <span className="text-xs text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded" data-testid="customer-points-badge">{selectedCustomer.points} pts</span>
            )}
            {showCustomerSearch && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden" data-testid="customer-dropdown">
                <div className="p-2 border-b border-slate-700"><Input placeholder={t('searchCustomerPlaceholder')} value={customerSearch} onChange={e => setCustomerSearch(e.target.value)} className="bg-slate-700 border-slate-600 h-8 text-sm" autoFocus /></div>
                <div className="max-h-48 overflow-y-auto">{customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).map(c => (
                  <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(""); }} className="px-3 py-2 hover:bg-slate-700 cursor-pointer flex justify-between" data-testid={`customer-option-${c.id}`}>
                    <span className="text-white text-sm">{c.name}</span>
                    <span className="text-slate-500 text-xs">{c.phone || c.member_level}</span>
                  </div>
                ))}{customers.filter(c => !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone?.includes(customerSearch)).length === 0 && <p className="text-slate-500 text-xs text-center py-3">{t('noData')}</p>}</div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5">{[{k:'zh',l:'中'},{k:'en',l:'EN'},{k:'es',l:'ES'}].map(({k,l}) => (<button key={k} onClick={() => changeLang(k)} className={`px-1.5 py-0.5 text-xs rounded ${lang === k ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`} data-testid={`pos-lang-${k}`}>{l}</button>))}</div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${isOnline ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`} data-testid="online-status">{isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}{isOnline ? t('online') : t('offline')}{pendingOrders.length > 0 && <Badge className="ml-1 bg-orange-500 text-white text-xs px-1 py-0">{pendingOrders.length}</Badge>}</div>
          <div className="flex gap-1.5"><Button size="sm" variant="outline" onClick={holdCurrentOrder} className="border-slate-600 text-slate-300 h-7 text-xs" disabled={cart.length === 0} data-testid="hold-btn">F4 {t('holdOrder')}</Button><Button size="sm" variant="outline" onClick={() => setShowHeldOrders(true)} className="border-slate-600 text-slate-300 h-7 text-xs relative" data-testid="recall-btn">F10 {t('recallOrder')}{heldOrders.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-xs flex items-center justify-center">{heldOrders.length}</span>}</Button><Button size="sm" variant="outline" onClick={() => setShowRefund(true)} className="border-slate-600 text-slate-300 h-7 text-xs" data-testid="refund-btn">F11 {t('refund')}</Button></div>
          <div className="flex items-center gap-1 bg-slate-700 rounded-lg px-2 py-1"><span className="text-xs text-slate-400 mr-1">{t('currency')}</span><span className={`text-sm font-bold min-w-[36px] text-center ${showBs ? 'text-orange-400' : 'text-emerald-400'}`}>{showBs ? 'Bs.' : '$'}</span><div className="flex flex-col"><button onClick={() => !showPayment && setShowBs(!showBs)} className={`text-slate-400 hover:text-white leading-none ${showPayment ? 'opacity-30 cursor-not-allowed' : ''}`} data-testid="currency-up"><ChevronDown className="w-3 h-3 rotate-180" /></button><button onClick={() => !showPayment && setShowBs(!showBs)} className={`text-slate-400 hover:text-white leading-none ${showPayment ? 'opacity-30 cursor-not-allowed' : ''}`} data-testid="currency-down"><ChevronDown className="w-3 h-3" /></button></div></div>
          {shift ? <Badge className="bg-green-500/20 text-green-400 text-xs">{t('shiftSince')} {new Date(shift.start_time).toLocaleTimeString()}</Badge> : <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">{t('noShift')}</Badge>}
          {!shift ? <Button size="sm" onClick={handleStartShift} className="bg-green-600 hover:bg-green-700 h-7 text-xs" data-testid="start-shift-btn">{t('startShift')}</Button> : <Button size="sm" onClick={handleEndShift} className="bg-orange-600 hover:bg-orange-700 h-7 text-xs" data-testid="end-shift-btn">{t('endShift')}</Button>}
          <Button size="sm" variant="outline" onClick={handleLogout} className="border-slate-600 text-slate-300 h-7"><LogOut className="w-3 h-3" /></Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder={t('scanOrSearch')} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value) setShowProductSearch(true); }} onFocus={() => setShowProductSearch(true)} onKeyDown={(e) => { if (e.key === 'Enter' && filteredProducts.length === 1) { addToCart(filteredProducts[0]); setSearchTerm(''); setShowProductSearch(false); } else if (e.key === 'Enter' && searchTerm.trim()) { const found = products.find(p => p.barcode === searchTerm.trim() || p.code === searchTerm.trim()); if (found) { addToCart(found); setSearchTerm(""); } } }} className="pl-10 bg-slate-800 border-slate-700 text-white h-10" data-testid="pos-search" autoFocus /></div>
          <Button onClick={() => setShowProductSearch(!showProductSearch)} className="bg-blue-500 hover:bg-blue-600 h-10 px-4" data-testid="open-products-btn"><Package className="w-4 h-4 mr-2" /> {t('products')}</Button>
        </div>

        {/* Product Search Popup */}
        {showProductSearch && <>
          <div className="absolute left-4 right-4 top-[120px] z-50 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl max-h-[60vh] flex flex-col" data-testid="product-search-popup">
            <div className="flex gap-1 p-3 border-b border-slate-700 overflow-x-auto flex-shrink-0"><Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"} onClick={() => setSelectedCategory("all")} className={`h-7 text-xs ${selectedCategory === "all" ? "bg-blue-500" : "border-slate-600 text-slate-300"}`}>{t('all')}</Button>{categories.map(cat => (<Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"} onClick={() => setSelectedCategory(cat.id)} className={`h-7 text-xs whitespace-nowrap ${selectedCategory === cat.id ? "bg-blue-500" : "border-slate-600 text-slate-300"}`}>{cat.name}</Button>))}</div>
            <div className="overflow-y-auto flex-1"><table className="w-full"><thead className="bg-slate-700/50 sticky top-0"><tr className="text-slate-400 text-xs"><th className="text-left px-3 py-2">{t('productCode')}</th><th className="text-left px-3 py-2">{t('productName')}</th><th className="text-right px-3 py-2">{t('costPrice')}</th><th className="text-right px-3 py-2">{t('price1')}</th><th className="text-right px-3 py-2">{t('price2')}</th><th className="text-right px-3 py-2">{t('price3Box')}</th><th className="text-center px-3 py-2 w-16">{t('add')}</th></tr></thead><tbody>{filteredProducts.map(product => { const p1 = product.price1 || product.retail_price || 0; const p2 = product.price2 || p1; const p3 = product.price3 || product.wholesale_price || p1; return (<tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 cursor-pointer" onClick={() => { addToCart(product); setSearchTerm(''); setShowProductSearch(false); }} data-testid={`pos-product-${product.id}`}><td className="px-3 py-2 text-slate-400 text-xs">{product.code}</td><td className="px-3 py-2 text-white text-sm font-medium">{product.name}</td><td className="px-3 py-2 text-right text-slate-500 text-xs">${(product.cost_price || 0).toFixed(2)}</td><td className="px-3 py-2 text-right text-emerald-400 text-xs font-medium">${p1.toFixed(2)}</td><td className="px-3 py-2 text-right text-yellow-400 text-xs font-medium">${p2.toFixed(2)}</td><td className="px-3 py-2 text-right text-blue-400 text-xs font-medium">${p3.toFixed(2)}</td><td className="px-3 py-2 text-center"><Button size="sm" className="h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600" onClick={(e) => { e.stopPropagation(); addToCart(product); }}><Plus className="w-3 h-3" /></Button></td></tr>); })}{filteredProducts.length === 0 && <tr><td colSpan="7" className="text-slate-400 text-sm text-center py-4">{t('noData')}</td></tr>}</tbody></table></div>
            <div className="p-2 border-t border-slate-700 text-right"><Button size="sm" variant="outline" onClick={() => setShowProductSearch(false)} className="border-slate-600 text-slate-300 h-7 text-xs">{t('close')}</Button></div>
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setShowProductSearch(false)} />
        </>}

        {/* Cart Table */}
        <div className="flex-1 bg-slate-800 rounded-lg border border-slate-700 flex flex-col overflow-hidden">
          <div className="bg-slate-750 border-b border-slate-700 px-4 py-2 flex items-center justify-between"><div className="flex items-center gap-3"><h2 className="text-white font-bold">{t('salesOrder')}</h2><Badge className="bg-slate-600 text-xs">{cartCount} {t('items')}</Badge></div><Button size="sm" variant="outline" onClick={clearCart} className="border-slate-600 text-slate-300 h-7 text-xs" disabled={cart.length === 0}>{t('clear')}</Button></div>
          <div className="flex-1 overflow-y-auto"><table className="w-full"><thead className="bg-slate-700/50 sticky top-0"><tr className="text-slate-400 text-xs"><th className="text-left px-4 py-2 w-8">#</th><th className="text-left px-4 py-2">{t('productName')}</th><th className="text-center px-2 py-2 w-32">{t('quantity')}</th><th className="text-center px-2 py-2 w-28">{t('priceType')}</th><th className="text-right px-4 py-2 w-28">{t('unitPrice')}</th><th className="text-right px-4 py-2 w-36">{t('amount')}</th><th className="text-center px-2 py-2 w-10"></th></tr></thead>
            <tbody>{cart.length === 0 ? (<tr><td colSpan="7" className="text-center text-slate-500 py-16"><Search className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">{t('scanOrSearch')}</p></td></tr>) : cart.map((item, idx) => {
              const boxQty = item.product.box_quantity || 1;
              const isBoxMode = item.price_mode === "box";
              const totalPieces = isBoxMode ? item.quantity * boxQty : item.quantity;
              const displayUnitPrice = toDisplayPrice(getItemPriceByMode(item.product, item.price_mode), item.product);
              const displayAmount = displayUnitPrice * item.quantity;
              const priceModes = ["price1", "price2", "box"];
              const currentIdx = priceModes.indexOf(item.price_mode);
              const modeLabels = { price1: t('price1'), price2: t('price2'), box: t('box') };
              const modeColors = { price1: "text-emerald-400", price2: "text-yellow-400", box: "text-blue-400" };
              return (<tr key={item.product_id} className="border-b border-slate-700/50 hover:bg-slate-700/30" data-testid={`cart-row-${item.product_id}`}>
                <td className="px-4 py-3 text-slate-500 text-sm">{idx + 1}</td>
                <td className="px-4 py-3"><p className="text-white text-sm font-medium">{item.product.name}</p><p className="text-slate-500 text-xs">{item.product.code}</p>{isBoxMode && <p className="text-blue-300 text-xs mt-0.5">{boxQty}pcs/{t('box')} ({totalPieces}{t('pieces')})</p>}</td>
                <td className="px-2 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => updateQuantity(item.product_id, -1)} className="w-7 h-7 rounded bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center text-sm">-</button><input type="number" step="0.1" min="0.1" value={item.quantity} onChange={(e) => { const val = parseFloat(e.target.value); if (val > 0) setCart(prev => prev.map(i => i.product_id === item.product_id ? {...i, quantity: val, amount: calcCartItemAmount(i.product, val, i.price_mode)} : i)); }} className="w-14 text-center bg-slate-700 border border-slate-600 rounded text-white text-sm py-1" data-testid={`qty-input-${item.product_id}`} /><button onClick={() => updateQuantity(item.product_id, 1)} className="w-7 h-7 rounded bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-center text-sm">+</button></div></td>
                <td className="px-2 py-3 text-center"><div className="flex items-center justify-center gap-1"><span className={`text-xs font-medium min-w-[40px] ${modeColors[item.price_mode]}`}>{modeLabels[item.price_mode]}</span><div className="flex flex-col"><button onClick={() => changeItemPriceMode(item.product_id, priceModes[(currentIdx + 2) % 3])} className="text-slate-400 hover:text-white leading-none" data-testid={`price-up-${item.product_id}`}><ChevronDown className="w-3 h-3 rotate-180" /></button><button onClick={() => changeItemPriceMode(item.product_id, priceModes[(currentIdx + 1) % 3])} className="text-slate-400 hover:text-white leading-none" data-testid={`price-down-${item.product_id}`}><ChevronDown className="w-3 h-3" /></button></div></div></td>
                <td className="px-4 py-3 text-right text-sm"><span className={showBs ? 'text-orange-300' : 'text-slate-300'}>{getPriceSymbol()}{displayUnitPrice.toFixed(2)}</span>{showBs && <p className="text-slate-500 text-xs">${getItemPriceByMode(item.product, item.price_mode).toFixed(2)}</p>}</td>
                <td className="px-4 py-3 text-right font-bold"><span className={showBs ? 'text-orange-300' : 'text-white'}>{getPriceSymbol()}{displayAmount.toFixed(2)}</span>{showBs && <p className="text-slate-500 text-xs">${item.amount.toFixed(2)}</p>}</td>
                <td className="px-2 py-3 text-center"><button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button></td>
              </tr>);
            })}</tbody></table></div>

          {/* Cart Footer */}
          <div className="border-t border-slate-700 px-4 py-3 flex items-center justify-between bg-slate-800">
            <div className="text-slate-400 text-sm">{cart.length} {t('products')}, {cartCount} {t('items')}{safeDiscount > 0 && <span className="text-red-400 ml-2">-{safeDiscount}%</span>}</div>
            <div className="flex items-center gap-6">
              <div className="text-right">{showBs ? (<><div><span className="text-slate-400 text-xs mr-1">Bs.</span><span className="text-xl font-bold text-orange-400">{(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}</span></div><div><span className="text-slate-500 text-xs mr-1">$</span><span className="text-sm text-slate-400">{finalTotal.toFixed(2)}</span></div></>) : (<><div><span className="text-slate-400 text-sm mr-2">{t('total')}:</span><span className="text-2xl font-bold text-white">${(cartTotalDisplay * (1 - safeDiscount / 100)).toFixed(2)}</span></div>{pricingMode === "local_based" && <div><span className="text-slate-500 text-xs mr-1">Bs.</span><span className="text-sm text-slate-400">{(cart.reduce((s, i) => s + i.amount * getProductBsMultiplier(i.product), 0) * (1 - safeDiscount / 100)).toFixed(2)}</span></div>}</>)}</div>
              <Button onClick={() => setShowPayment(true)} className="bg-green-600 hover:bg-green-700 h-10 px-8 text-base font-bold" disabled={cart.length === 0 || !shift} data-testid="pos-pay-btn">F9 {t('checkout')}</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Dialog open={showPayment} onOpenChange={(open) => { setShowPayment(open); if (!open) { setDiscountPercent(0); setReceivedAmount(""); setPointsToUse(0); } }}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg"><DialogHeader><DialogTitle className="text-xl">{t('checkout')} (F9)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4 text-center">{showBs ? (<><p className="text-slate-400 text-xs">Bs.</p><p className="text-3xl font-bold text-orange-400">Bs.{(cartTotalDisplay * (1 - safeDiscount / 100) - pointsDiscount * (exchangeRates?.usd_to_ves || 1)).toFixed(2)}</p><p className="text-slate-400 text-sm mt-1">${finalTotal.toFixed(2)} USD</p></>) : (<><p className="text-slate-400 text-xs">USD</p><p className="text-3xl font-bold text-white">${finalTotal.toFixed(2)}</p>{pricingMode === "local_based" && <p className="text-slate-400 text-sm mt-1">Bs.{(cart.reduce((s, i) => s + i.amount * getProductBsMultiplier(i.product), 0) * (1 - safeDiscount / 100) - pointsDiscount * (exchangeRates?.usd_to_ves || 1)).toFixed(2)}</p>}</>)}{safeDiscount > 0 && <p className="text-red-400 text-sm mt-1">-{safeDiscount}% ({t('discount')})</p>}{pointsToUse > 0 && <p className="text-purple-400 text-sm">-{pointsToUse} pts (-${pointsDiscount.toFixed(2)})</p>}</div>
            <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-3"><label className="text-sm text-slate-300 whitespace-nowrap">{t('discount')} %</label><Input type="number" min="0" max={maxDiscountPercent} value={discountPercent} onChange={(e) => { const v = parseInt(e.target.value) || 0; if (v > maxDiscountPercent) { toast.error(`${t('discount')} max ${maxDiscountPercent}%`); setDiscountPercent(maxDiscountPercent); } else setDiscountPercent(Math.max(0, v)); }} className="bg-slate-700 border-slate-600 w-24 text-center" data-testid="discount-input" /><span className="text-xs text-slate-500">max {maxDiscountPercent}%</span>{discountPercent > 0 && <span className="text-red-400 text-sm">-${discountAmount.toFixed(2)}</span>}</div>
            {/* Points Redemption */}
            {selectedCustomer ? (
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-purple-300 font-medium">{t('usePoints')}</span>
                  <span className="text-xs text-purple-400">{t('pointsAvailable')}: <b>{selectedCustomer.points}</b></span>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max={selectedCustomer.points} value={pointsToUse} onChange={e => { const v = Math.min(parseInt(e.target.value) || 0, selectedCustomer.points); setPointsToUse(Math.max(0, v)); }} className="bg-slate-700 border-slate-600 w-28 text-center" data-testid="points-use-input" />
                  <span className="text-xs text-slate-500">{pointsValueRate} pts = $1</span>
                  {pointsToUse > 0 && <span className="text-emerald-400 text-sm font-medium">-${pointsDiscount.toFixed(2)}</span>}
                  {selectedCustomer.points > 0 && <Button size="sm" variant="outline" className="border-purple-500/30 text-purple-400 h-7 text-xs" onClick={() => setPointsToUse(selectedCustomer.points)} data-testid="use-all-points-btn">{t('all')}</Button>}
                </div>
                <p className="text-xs text-slate-500">{t('pointsEarned')}: ~{Math.floor((cartTotal - discountAmount - pointsDiscount) * (systemSettings?.points_per_dollar || 1))} pts</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center">{t('noCustomerNoPoints')}</p>
            )}
            <div className="space-y-2"><label className="text-sm text-slate-300">{t('paymentMethod')}</label><div className="grid grid-cols-2 gap-2">{[{id:'cash',label:t('cash'),key:'F5',active:'border-emerald-500 bg-emerald-500/10'},{id:'card',label:t('card'),key:'F6',active:'border-blue-500 bg-blue-500/10'},{id:'biopago',label:'Biopago',key:'F7',active:'border-purple-500 bg-purple-500/10'},{id:'transfer',label:'Transfer',key:'F8',active:'border-yellow-500 bg-yellow-500/10'}].map(method => (<div key={method.id} onClick={() => setPaymentMethod(method.id)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${paymentMethod === method.id ? method.active : 'border-slate-600 hover:border-slate-500'}`} data-testid={`pay-method-${method.id}`}><div className="flex items-center justify-between"><span className={`text-sm font-medium ${paymentMethod === method.id ? 'text-white' : 'text-slate-300'}`}>{method.label}</span><kbd className="px-1.5 py-0.5 text-xs bg-slate-700 text-slate-400 rounded">{method.key}</kbd></div></div>))}</div></div>
            {paymentMethod === 'cash' && <div className="space-y-2"><label className="text-sm text-slate-300">{t('received')}</label><Input type="number" value={receivedAmount} onChange={(e) => setReceivedAmount(e.target.value)} className="bg-slate-700 border-slate-600 text-2xl text-center" placeholder="0.00" data-testid="pos-received-amount" autoFocus />{receivedAmount && change >= 0 && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center"><p className="text-sm text-slate-400">{t('change')}</p><p className="text-2xl font-bold text-green-400">{showBs ? `Bs.${(change * (exchangeRates.usd_to_ves || 1)).toFixed(2)} / $${change.toFixed(2)}` : `$${change.toFixed(2)}`}</p></div>}</div>}
            <div className="grid grid-cols-2 gap-3 pt-2"><Button variant="outline" onClick={() => setShowPayment(false)} className="border-slate-600">ESC {t('cancel')}</Button><Button onClick={handlePayment} className="bg-green-600 hover:bg-green-700" disabled={paymentMethod === 'cash' && (!receivedAmount || change < 0)} data-testid="pos-confirm-payment">{t('confirmPayment')}</Button></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift Modal */}
      <Dialog open={showShiftModal} onOpenChange={setShowShiftModal}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>{t('endShift')}</DialogTitle></DialogHeader>{shift && <div className="space-y-4"><div className="bg-slate-700/50 rounded-lg p-4 space-y-2"><div className="flex justify-between"><span className="text-slate-400">{t('username')}:</span><span className="text-white">{shift.user}</span></div><div className="flex justify-between"><span className="text-slate-400">{t('storeManagement')}:</span><span className="text-white">{shift.store}</span></div><div className="flex justify-between"><span className="text-slate-400">{t('shiftSince')}:</span><span className="text-white">{new Date(shift.start_time).toLocaleString()}</span></div><div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600"><span className="text-slate-300">{t('totalSales')}:</span><span className="text-green-400">${shift.total_sales?.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-slate-400">{t('cash')}:</span><span className="text-white">${shift.total_cash?.toFixed(2)}</span></div></div><div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => setShowShiftModal(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={confirmEndShift} className="bg-orange-600 hover:bg-orange-700" data-testid="confirm-end-shift">{t('confirm')}</Button></div></div>}</DialogContent></Dialog>

      {/* Held Orders (F10) */}
      <Dialog open={showHeldOrders} onOpenChange={setShowHeldOrders}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>{t('recallOrder')} (F10)</DialogTitle></DialogHeader>{heldOrders.length === 0 ? <p className="text-slate-400 text-center py-4">{t('noData')}</p> : <div className="space-y-2">{heldOrders.map(held => (<div key={held.id} className="flex items-center justify-between bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 cursor-pointer" onClick={() => recallOrder(held.id)} data-testid={`recall-${held.id}`}><div><p className="text-white font-medium">{held.items.length} {t('products')}</p><p className="text-slate-400 text-xs">{new Date(held.time).toLocaleTimeString()}</p></div><span className="text-emerald-400 font-bold">${held.total?.toFixed(2)}</span></div>))}</div>}</DialogContent></Dialog>

      {/* Refund (F11) */}
      <Dialog open={showRefund} onOpenChange={setShowRefund}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>{t('refund')} (F11)</DialogTitle></DialogHeader><div className="space-y-4"><div><label className="text-sm text-slate-300">{t('salesOrder')} #</label><Input value={refundOrderNo} onChange={e => setRefundOrderNo(e.target.value)} placeholder="SO20260313..." className="bg-slate-700 border-slate-600" data-testid="refund-order-no" /></div><div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setShowRefund(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleRefund} disabled={!refundOrderNo} className="bg-red-500 hover:bg-red-600" data-testid="confirm-refund">{t('refund')}</Button></div></div></DialogContent></Dialog>

      {/* Shortcut Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 z-30" data-testid="pos-toolbar">
        <div className="flex items-center justify-center gap-1 px-2 py-1.5">{[
          { key: "F1", label: t('search'), action: () => setShowProductSearch(true), color: "bg-blue-600 hover:bg-blue-700" },
          { key: "F3", label: t('clear'), action: () => clearCart(), color: "bg-orange-600 hover:bg-orange-700" },
          { key: "F4", label: t('holdOrder'), action: () => holdCurrentOrder(), color: "bg-yellow-600 hover:bg-yellow-700" },
          { key: "F9", label: t('checkout'), action: () => setShowPayment(true), color: "bg-green-600 hover:bg-green-700", disabled: cart.length === 0 || !shift },
          { key: "F10", label: t('recallOrder'), action: () => setShowHeldOrders(true), color: "bg-purple-600 hover:bg-purple-700" },
          { key: "F11", label: t('refund'), action: () => setShowRefund(true), color: "bg-red-600 hover:bg-red-700" },
        ].map(btn => (<button key={btn.key} onClick={btn.action} disabled={btn.disabled} className={`${btn.color} text-white px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed`} data-testid={`toolbar-${btn.key.toLowerCase()}`}><kbd className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">{btn.key}</kbd><span>{btn.label}</span></button>))}</div>
      </div>

      {/* Receipt Print Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-emerald-400">{t('confirmPayment')} - {lastOrder?.order_no}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">${lastOrder?.total_amount?.toFixed(2)}</p>
              <p className="text-slate-400 text-sm mt-1">Bs.{((lastOrder?.total_amount || 0) * (exchangeRates?.usd_to_ves || 1)).toFixed(2)}</p>
              <p className="text-slate-500 text-xs mt-2">{lastOrder?.payment_method === 'cash' ? t('cash') : lastOrder?.payment_method === 'card' ? t('card') : lastOrder?.payment_method || '-'}</p>
              {lastOrder?.points_used > 0 && <p className="text-purple-400 text-xs mt-1">{t('pointsDiscount')}: -{lastOrder.points_used} pts (-${lastOrder.points_discount?.toFixed(2)})</p>}
              {lastOrder?.points_earned > 0 && <p className="text-emerald-300 text-xs mt-1">{t('pointsEarned')}: +{lastOrder.points_earned} pts</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handlePrintReceipt} className="bg-blue-500 hover:bg-blue-600" data-testid="print-receipt-btn">
                <Printer className="w-4 h-4 mr-2" /> {t('printReceipt80mm')}
              </Button>
              <Button onClick={handlePrintInvoice} variant="outline" className="border-slate-600 text-slate-300" data-testid="print-invoice-btn">
                <Printer className="w-4 h-4 mr-2" /> {t('printInvoiceA4')}
              </Button>
            </div>
            <Button onClick={() => setShowReceipt(false)} variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="close-receipt-btn">{t('close')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden print components */}
      <ReceiptPrint ref={receiptRef} order={lastOrder} settings={systemSettings} exchangeRates={exchangeRates} t={t} />
      <InvoicePrint ref={invoiceRef} order={lastOrder} settings={systemSettings} exchangeRates={exchangeRates} t={t} />
    </div>
  );
}
