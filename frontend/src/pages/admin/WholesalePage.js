import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, Truck, Eye, Trash2, DollarSign, Package, Clock, CheckCircle, XCircle, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const STATUS_CONFIG = {
  pending: { color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  completed: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
  delivered: { color: "bg-blue-500/20 text-blue-400", icon: Truck },
  cancelled: { color: "bg-red-500/20 text-red-400", icon: XCircle },
};

export default function WholesalePage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [orderNotes, setOrderNotes] = useState("");
  const [deliveryAddr, setDeliveryAddr] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [o, p, c, s] = await Promise.all([
        axios.get(`${API}/wholesale-orders`),
        axios.get(`${API}/products`),
        axios.get(`${API}/customers`),
        axios.get(`${API}/wholesale-orders/stats`),
      ]);
      setOrders(o.data); setProducts(p.data); setCustomers(c.data); setStats(s.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * i.unit_price } : i));
    } else {
      const wp = product.wholesale_price || product.price2 || product.price1 * 0.8;
      setCart([...cart, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: wp, amount: wp }]);
    }
  };

  const updateQty = (pid, qty) => {
    if (qty <= 0) { setCart(cart.filter(i => i.product_id !== pid)); return; }
    setCart(cart.map(i => i.product_id === pid ? { ...i, quantity: qty, amount: qty * i.unit_price } : i));
  };

  const updatePrice = (pid, price) => {
    setCart(cart.map(i => i.product_id === pid ? { ...i, unit_price: price, amount: i.quantity * price } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer || cart.length === 0) { toast.error(t('operationFailed')); return; }
    try {
      await axios.post(`${API}/wholesale-orders`, {
        customer_id: selectedCustomer, items: cart, paid_amount: cartTotal,
        payment_method: "cash", notes: orderNotes, delivery_address: deliveryAddr
      });
      toast.success(t('addSuccess'));
      setShowForm(false); setCart([]); setOrderNotes(""); setDeliveryAddr(""); setSelectedCustomer("");
      fetchData();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await axios.put(`${API}/wholesale-orders/${orderId}`, { status });
      toast.success(t('updateSuccess'));
      fetchData();
      if (showDetail) {
        const res = await axios.get(`${API}/wholesale-orders/${orderId}`);
        setShowDetail(res.data);
      }
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handleCancel = async (orderId) => {
    if (!confirm(t('cancelOrder') + "?")) return;
    try {
      await axios.delete(`${API}/wholesale-orders/${orderId}`);
      toast.success(t('orderCancelled'));
      fetchData(); setShowDetail(null);
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handlePayment = async () => {
    if (!showPayment || !payAmount) return;
    const newPaid = (showPayment.paid_amount || 0) + parseFloat(payAmount);
    try {
      await axios.put(`${API}/wholesale-orders/${showPayment.id}`, { paid_amount: newPaid });
      toast.success(t('updateSuccess'));
      setShowPayment(null); setPayAmount("");
      fetchData();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handlePrint = (order) => {
    const customer = customers.find(c => c.id === order.customer_id);
    const printContent = `
      <html><head><style>
        body { font-family: monospace; font-size: 12px; width: 72mm; margin: 0; padding: 8px; }
        h2 { text-align: center; margin: 0 0 8px; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
      </style></head><body>
        <h2>${t('wholesaleOrder')}</h2>
        <div class="line"></div>
        <table>
          <tr><td>${t('orderNo')}:</td><td class="right">${order.order_no}</td></tr>
          <tr><td>${t('date')}:</td><td class="right">${order.created_at?.substring(0, 10)}</td></tr>
          <tr><td>${t('customer')}:</td><td class="right">${customer?.name || '-'}</td></tr>
        </table>
        <div class="line"></div>
        <table>
          <tr class="bold"><td>${t('productName')}</td><td class="right">${t('quantity')}</td><td class="right">${t('unitPrice')}</td><td class="right">${t('amount')}</td></tr>
          ${order.items?.map(i => `<tr><td>${i.product_name}</td><td class="right">${i.quantity}</td><td class="right">${i.unit_price?.toFixed(2)}</td><td class="right">${i.amount?.toFixed(2)}</td></tr>`).join('')}
        </table>
        <div class="line"></div>
        <table>
          <tr class="bold"><td>${t('totalAmount')}:</td><td class="right">$${order.total_amount?.toFixed(2)}</td></tr>
          <tr><td>${t('paidAmount')}:</td><td class="right">$${order.paid_amount?.toFixed(2)}</td></tr>
        </table>
        ${order.notes ? `<div class="line"></div><p>${t('orderNotes')}: ${order.notes}</p>` : ''}
      </body></html>`;
    const w = window.open('', '_blank', 'width=300,height=600');
    w.document.write(printContent);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const filteredProducts = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));
  const filteredOrders = orders.filter(o => filterStatus === "all" || o.status === filterStatus);

  const getStatusLabel = (status) => {
    const map = { pending: t('statusPending'), completed: t('statusCompleted'), delivered: t('statusDelivered'), cancelled: t('statusCancelled') };
    return map[status] || status;
  };

  return (
    <div className="space-y-6" data-testid="wholesale-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Truck className="w-6 h-6 text-blue-400" /> {t('wholesaleOrder')}</h1>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600" data-testid="create-wholesale-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('createWholesaleOrder')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Package className="w-5 h-5 text-blue-400" /></div>
          <div><p className="text-xs text-slate-400">{t('wholesaleOrder')}</p><p className="text-xl font-bold text-white">{stats.total_orders || 0}</p></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"><Clock className="w-5 h-5 text-yellow-400" /></div>
          <div><p className="text-xs text-slate-400">{t('pendingOrders')}</p><p className="text-xl font-bold text-yellow-400">{stats.pending || 0}</p></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
          <div><p className="text-xs text-slate-400">{t('totalRevenue')}</p><p className="text-xl font-bold text-emerald-400">${stats.total_revenue?.toFixed(2) || '0.00'}</p></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Package className="w-5 h-5 text-purple-400" /></div>
          <div><p className="text-xs text-slate-400">{t('totalItems')}</p><p className="text-xl font-bold text-white">{stats.total_items || 0}</p></div>
        </CardContent></Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "pending", "completed", "delivered", "cancelled"].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-1.5 rounded-full text-sm transition-all ${filterStatus === s ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`} data-testid={`filter-${s}`}>
            {s === "all" ? t('all') : getStatusLabel(s)} {s !== "all" && `(${orders.filter(o => o.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
              <TableHead className="text-slate-300">{t('date')}</TableHead>
              <TableHead className="text-slate-300">{t('customer')}</TableHead>
              <TableHead className="text-slate-300">{t('itemCount')}</TableHead>
              <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
              <TableHead className="text-slate-300">{t('paidAmount')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredOrders.map(o => {
                const cfg = STATUS_CONFIG[o.status] || STATUS_CONFIG.pending;
                const unpaid = (o.total_amount || 0) - (o.paid_amount || 0);
                return (
                  <TableRow key={o.id} className="border-slate-700 hover:bg-slate-750">
                    <TableCell className="text-white font-mono text-sm">{o.order_no}</TableCell>
                    <TableCell className="text-slate-400 text-sm">{o.created_at?.substring(0, 10)}</TableCell>
                    <TableCell className="text-slate-300">{customers.find(c => c.id === o.customer_id)?.name || '-'}</TableCell>
                    <TableCell className="text-slate-300">{o.items?.length || 0}</TableCell>
                    <TableCell className="text-emerald-400 font-medium">${o.total_amount?.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className="text-white">${o.paid_amount?.toFixed(2)}</span>
                      {unpaid > 0.01 && <span className="text-red-400 text-xs ml-1">(-${unpaid.toFixed(2)})</span>}
                    </TableCell>
                    <TableCell><Badge className={cfg.color}>{getStatusLabel(o.status)}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setShowDetail(o)} data-testid={`view-order-${o.id}`}><Eye className="w-4 h-4 text-blue-400" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => handlePrint(o)} data-testid={`print-order-${o.id}`}><Printer className="w-4 h-4 text-slate-400" /></Button>
                        {o.status === "pending" && <Button size="sm" variant="ghost" onClick={() => { setShowPayment(o); setPayAmount(""); }} data-testid={`pay-order-${o.id}`}><DollarSign className="w-4 h-4 text-emerald-400" /></Button>}
                        {o.status !== "cancelled" && o.status !== "delivered" && <Button size="sm" variant="ghost" onClick={() => handleCancel(o.id)} data-testid={`cancel-order-${o.id}`}><Trash2 className="w-4 h-4 text-red-400" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredOrders.length === 0 && <TableRow><TableCell colSpan={8} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('createWholesaleOrder')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">{t('wholesaleCustomer')} *</label>
                <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 mt-1" data-testid="wholesale-customer-select">
                  <option value="">{t('selectCustomer')}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('deliveryAddress')}</label>
                <Input value={deliveryAddr} onChange={e => setDeliveryAddr(e.target.value)} className="bg-slate-700 border-slate-600 mt-1" />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400">{t('orderNotes')}</label>
              <Textarea value={orderNotes} onChange={e => setOrderNotes(e.target.value)} className="bg-slate-700 border-slate-600 mt-1" rows={2} />
            </div>
            <Input placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="wholesale-product-search" />
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
              {filteredProducts.slice(0, 30).map(p => {
                const wp = p.wholesale_price || p.price2 || p.price1 * 0.8;
                return (
                  <button key={p.id} onClick={() => addToCart(p)} className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors" data-testid={`add-product-${p.id}`}>
                    <p className="text-white truncate">{p.name}</p>
                    <div className="flex justify-between text-xs mt-0.5">
                      <span className="text-emerald-400">{t('wholesalePrice')}: ${wp.toFixed(2)}</span>
                      <span className="text-slate-500">{t('retailPrice')}: ${p.price1?.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            {cart.length > 0 && (
              <Table>
                <TableHeader><TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">{t('productName')}</TableHead>
                  <TableHead className="text-slate-300">{t('unitPrice')}</TableHead>
                  <TableHead className="text-slate-300">{t('quantity')}</TableHead>
                  <TableHead className="text-slate-300">{t('amount')}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.product_id} className="border-slate-700">
                      <TableCell className="text-white">{item.product_name}</TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updatePrice(item.product_id, parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-24" /></TableCell>
                      <TableCell><Input type="number" min="0" value={item.quantity} onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-20" /></TableCell>
                      <TableCell className="text-emerald-400 font-medium">${item.amount.toFixed(2)}</TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => updateQty(item.product_id, 0)}><Trash2 className="w-3 h-3 text-red-400" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-slate-700">
              <span className="text-xl font-bold text-white">{t('totalAmount')}: <span className="text-emerald-400">${cartTotal.toFixed(2)}</span></span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
                <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="wholesale-submit-btn">{t('confirm')}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[85vh] overflow-y-auto">
          {showDetail && <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{t('orderDetail')} - {showDetail.order_no}</span>
                <Badge className={STATUS_CONFIG[showDetail.status]?.color}>{getStatusLabel(showDetail.status)}</Badge>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-400">{t('customer')}:</span> <span className="text-white ml-2">{customers.find(c => c.id === showDetail.customer_id)?.name || '-'}</span></div>
                <div><span className="text-slate-400">{t('date')}:</span> <span className="text-white ml-2">{showDetail.created_at?.substring(0, 10)}</span></div>
                {showDetail.delivery_address && <div className="col-span-2"><span className="text-slate-400">{t('deliveryAddress')}:</span> <span className="text-white ml-2">{showDetail.delivery_address}</span></div>}
                {showDetail.notes && <div className="col-span-2"><span className="text-slate-400">{t('orderNotes')}:</span> <span className="text-white ml-2">{showDetail.notes}</span></div>}
              </div>
              <Table>
                <TableHeader><TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">{t('productName')}</TableHead>
                  <TableHead className="text-slate-300 text-right">{t('unitPrice')}</TableHead>
                  <TableHead className="text-slate-300 text-right">{t('quantity')}</TableHead>
                  <TableHead className="text-slate-300 text-right">{t('amount')}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {showDetail.items?.map((item, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell className="text-white">{item.product_name}</TableCell>
                      <TableCell className="text-right text-slate-300">${item.unit_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-slate-300">{item.quantity}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-medium">${item.amount?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">{t('totalAmount')}</span><span className="text-white font-bold text-lg">${showDetail.total_amount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{t('paidAmount')}</span><span className="text-emerald-400">${showDetail.paid_amount?.toFixed(2)}</span></div>
                {(showDetail.total_amount - showDetail.paid_amount) > 0.01 && (
                  <div className="flex justify-between"><span className="text-slate-400">{t('unpaidAmount')}</span><span className="text-red-400">${(showDetail.total_amount - showDetail.paid_amount).toFixed(2)}</span></div>
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-700 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => handlePrint(showDetail)} className="border-slate-600"><Printer className="w-4 h-4 mr-1" /> {t('printOrder')}</Button>
                {showDetail.status === "pending" && <>
                  <Button size="sm" onClick={() => { setShowPayment(showDetail); setPayAmount(""); }} className="bg-emerald-500 hover:bg-emerald-600"><DollarSign className="w-4 h-4 mr-1" /> {t('recordPayment')}</Button>
                  <Button size="sm" onClick={() => handleStatusUpdate(showDetail.id, "completed")} className="bg-blue-500 hover:bg-blue-600"><CheckCircle className="w-4 h-4 mr-1" /> {t('markCompleted')}</Button>
                </>}
                {showDetail.status === "completed" && (
                  <Button size="sm" onClick={() => handleStatusUpdate(showDetail.id, "delivered")} className="bg-purple-500 hover:bg-purple-600"><Truck className="w-4 h-4 mr-1" /> {t('markDelivered')}</Button>
                )}
                {showDetail.status !== "cancelled" && showDetail.status !== "delivered" && (
                  <Button size="sm" variant="destructive" onClick={() => handleCancel(showDetail.id)}><XCircle className="w-4 h-4 mr-1" /> {t('cancelOrder')}</Button>
                )}
              </div>
            </div>
          </>}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={!!showPayment} onOpenChange={() => setShowPayment(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>{t('recordPayment')}</DialogTitle></DialogHeader>
          {showPayment && (
            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">{t('totalAmount')}</span><span className="text-white">${showPayment.total_amount?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">{t('paidAmount')}</span><span className="text-emerald-400">${showPayment.paid_amount?.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-700 pt-1"><span className="text-slate-400">{t('unpaidAmount')}</span><span className="text-red-400">${((showPayment.total_amount || 0) - (showPayment.paid_amount || 0)).toFixed(2)}</span></div>
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('paymentAmount')}</label>
                <Input type="number" min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="bg-slate-700 border-slate-600 mt-1" autoFocus data-testid="payment-amount-input" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPayment(null)} className="border-slate-600">{t('cancel')}</Button>
                <Button onClick={handlePayment} className="bg-emerald-500 hover:bg-emerald-600" data-testid="payment-submit">{t('confirm')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
