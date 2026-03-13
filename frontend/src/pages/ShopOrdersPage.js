import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Store, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios, { API } from "@/lib/api";
import { toast } from "sonner";

export default function ShopOrdersPage() {
  const [searchType, setSearchType] = useState("order_no");
  const [searchValue, setSearchValue] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) { toast.error("Please enter order number or phone"); return; }
    setLoading(true);
    try { const params = searchType === "order_no" ? { order_no: searchValue.trim() } : { phone: searchValue.trim() }; const res = await axios.get(`${API}/shop/order-lookup`, { params }); setOrders(res.data); if (res.data.length === 0) toast.error("No orders found"); } catch (e) { toast.error("Error searching"); } finally { setLoading(false); }
  };

  const statusLabels = { pending: { text: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" }, processing: { text: "Procesando", color: "bg-blue-500/20 text-blue-400" }, shipped: { text: "Enviado", color: "bg-purple-500/20 text-purple-400" }, completed: { text: "Completado", color: "bg-emerald-500/20 text-emerald-400" }, cancelled: { text: "Cancelado", color: "bg-red-500/20 text-red-400" } };
  const paymentLabels = { pending: { text: "Pendiente", color: "bg-yellow-500/20 text-yellow-400" }, paid: { text: "Pagado", color: "bg-emerald-500/20 text-emerald-400" } };

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700"><div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between"><Link to="/shop" className="flex items-center gap-2"><div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div><h1 className="text-xl font-bold text-white">Mis Pedidos</h1></Link><Link to="/shop" className="text-emerald-400 hover:text-emerald-300 text-sm">Volver a Tienda</Link></div></header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Card className="bg-slate-800 border-slate-700 mb-6"><CardHeader><CardTitle className="text-white">Buscar Pedido</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex gap-4"><Select value={searchType} onValueChange={setSearchType}><SelectTrigger className="w-48 bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="order_no">Nro Pedido</SelectItem><SelectItem value="phone">Telefono</SelectItem></SelectContent></Select><Input value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder={searchType === "order_no" ? "ON2026..." : "0412..."} className="flex-1 bg-slate-700 border-slate-600 text-white" onKeyDown={(e) => e.key === 'Enter' && handleSearch()} data-testid="order-search-input" /><Button onClick={handleSearch} className="bg-emerald-500 hover:bg-emerald-600" disabled={loading} data-testid="order-search-btn">{loading ? "..." : "Buscar"}</Button></div></CardContent></Card>
        {orders.length > 0 && <div className="space-y-4">{orders.map(order => (<Card key={order.id} className="bg-slate-800 border-slate-700"><CardContent className="p-6"><div className="flex items-start justify-between mb-4"><div><p className="text-white font-bold text-lg">Pedido #{order.order_no}</p><p className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</p></div><div className="flex gap-2"><Badge className={paymentLabels[order.payment_status]?.color}>{paymentLabels[order.payment_status]?.text}</Badge><Badge className={statusLabels[order.order_status]?.color}>{statusLabels[order.order_status]?.text}</Badge></div></div>
          <div className="bg-slate-700/30 rounded-lg p-4 mb-4">{order.items?.map((item, idx) => (<div key={idx} className="flex justify-between py-2 border-b border-slate-700 last:border-0"><div><p className="text-white">{item.product_name || 'Producto'}</p></div><div className="text-right"><p className="text-white">{item.quantity} x ${item.unit_price?.toFixed(2)}</p><p className="text-emerald-400">${item.amount?.toFixed(2)}</p></div></div>))}</div>
          <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-slate-400">Envio a:</p><p className="text-white">{order.shipping_name}</p><p className="text-slate-300">{order.shipping_phone}</p></div><div className="text-right"><p className="text-lg font-bold text-emerald-400">Total: ${(order.total_amount + order.shipping_fee)?.toFixed(2)}</p></div></div>
        </CardContent></Card>))}</div>}
        {orders.length === 0 && !loading && <div className="text-center py-12"><Package className="w-16 h-16 text-slate-600 mx-auto mb-4" /><p className="text-slate-400">Ingrese su numero de pedido o telefono para buscar</p></div>}
      </main>
    </div>
  );
}
