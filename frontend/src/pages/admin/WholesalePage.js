import React, { useState, useEffect } from "react";
import { Plus, Search, ShoppingBag, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function WholesalePage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/wholesale-orders`),
      axios.get(`${API}/products`),
      axios.get(`${API}/customers`)
    ]).then(([o, p, c]) => { setOrders(o.data); setProducts(p.data); setCustomers(c.data); })
    .catch(console.error).finally(() => setLoading(false));
  }, []);

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.id);
    if (existing) {
      setCart(cart.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * i.unit_price } : i));
    } else {
      const wholesalePrice = product.price2 || product.price1 * 0.8;
      setCart([...cart, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: wholesalePrice, amount: wholesalePrice }]);
    }
  };

  const updateQty = (pid, qty) => {
    if (qty <= 0) { setCart(cart.filter(i => i.product_id !== pid)); return; }
    setCart(cart.map(i => i.product_id === pid ? { ...i, quantity: qty, amount: qty * i.unit_price } : i));
  };

  const cartTotal = cart.reduce((s, i) => s + i.amount, 0);

  const handleSubmit = async () => {
    if (!selectedCustomer || cart.length === 0) { toast.error(t('operationFailed')); return; }
    try {
      await axios.post(`${API}/wholesale-orders`, { customer_id: selectedCustomer, items: cart, paid_amount: cartTotal, payment_method: "cash" });
      toast.success(t('addSuccess'));
      setShowForm(false); setCart([]);
      const res = await axios.get(`${API}/wholesale-orders`); setOrders(res.data);
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const filteredProducts = products.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6" data-testid="wholesale-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('wholesaleOrder')}</h1>
        <Button onClick={() => setShowForm(true)} className="bg-emerald-500 hover:bg-emerald-600" data-testid="create-wholesale-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('createWholesaleOrder')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
                <TableHead className="text-slate-300">{t('date')}</TableHead>
                <TableHead className="text-slate-300">{t('customer')}</TableHead>
                <TableHead className="text-slate-300">{t('quantity')}</TableHead>
                <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
                <TableHead className="text-slate-300">{t('status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(o => (
                <TableRow key={o.id} className="border-slate-700">
                  <TableCell className="text-white font-mono">{o.order_no}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{o.created_at?.substring(0, 10)}</TableCell>
                  <TableCell className="text-slate-300">{customers.find(c => c.id === o.customer_id)?.name || '-'}</TableCell>
                  <TableCell className="text-slate-300">{o.items?.length || 0}</TableCell>
                  <TableCell className="text-emerald-400 font-medium">${o.total_amount?.toFixed(2)}</TableCell>
                  <TableCell><Badge className={o.status === 'completed' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}>{o.status}</Badge></TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && <TableRow><TableCell colSpan={6} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t('createWholesaleOrder')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <select value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2" data-testid="wholesale-customer-select">
              <option value="">{t('selectCustomer')}</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
            <Input placeholder={t('searchProducts')} value={search} onChange={e => setSearch(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="wholesale-product-search" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 30).map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="text-left p-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                  <p className="text-white truncate">{p.name}</p>
                  <p className="text-emerald-400 text-xs">${(p.price2 || p.price1 * 0.8).toFixed(2)}</p>
                </button>
              ))}
            </div>
            {cart.length > 0 && (
              <Table>
                <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-slate-300">{t('unitPrice')}</TableHead><TableHead className="text-slate-300">{t('quantity')}</TableHead><TableHead className="text-slate-300">{t('amount')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {cart.map(item => (
                    <TableRow key={item.product_id} className="border-slate-700">
                      <TableCell className="text-white">{item.product_name}</TableCell>
                      <TableCell className="text-slate-300">${item.unit_price.toFixed(2)}</TableCell>
                      <TableCell><Input type="number" min="0" value={item.quantity} onChange={e => updateQty(item.product_id, parseInt(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-20" /></TableCell>
                      <TableCell className="text-emerald-400">${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-xl font-bold text-white">{t('totalAmount')}: <span className="text-emerald-400">${cartTotal.toFixed(2)}</span></span>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="wholesale-submit-btn">{t('confirm')}</Button>
                <Button onClick={() => setShowForm(false)} variant="outline" className="border-slate-600">{t('cancel')}</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
