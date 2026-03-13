import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function PurchasesPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ supplier_id: "", warehouse_id: "", items: [], notes: "" });
  const [newItem, setNewItem] = useState({ product_id: "", quantity: 1, unit_price: 0 });

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { try { const [o, s, w, p] = await Promise.all([axios.get(`${API}/purchase-orders`), axios.get(`${API}/suppliers`), axios.get(`${API}/warehouses`), axios.get(`${API}/products`)]); setOrders(o.data); setSuppliers(s.data); setWarehouses(w.data); setProducts(p.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };

  const addItem = () => { if (!newItem.product_id || newItem.quantity <= 0) return; const product = products.find(p => p.id === newItem.product_id); const amount = newItem.quantity * newItem.unit_price; setFormData({...formData, items: [...formData.items, { ...newItem, amount, product_name: product?.name }]}); setNewItem({ product_id: "", quantity: 1, unit_price: 0 }); };
  const handleSubmit = async () => { try { await axios.post(`${API}/purchase-orders`, {...formData, items: formData.items.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, amount: i.amount }))}); toast.success(t('createSuccess')); setShowForm(false); setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" }); fetchAll(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };
  const handleReceive = async (orderId) => { try { await axios.put(`${API}/purchase-orders/${orderId}/receive`); toast.success(t('receivedStatus')); fetchAll(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('purchaseManagement')}</h1>
        <Button onClick={() => { setFormData({ supplier_id: "", warehouse_id: "", items: [], notes: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-purchase-btn"><Plus className="w-4 h-4 mr-2" /> {t('createPurchaseOrder')}</Button>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('orderNo')}</TableHead><TableHead className="text-slate-300">{t('supplier')}</TableHead><TableHead className="text-slate-300">{t('receiveWarehouse')}</TableHead><TableHead className="text-slate-300">{t('itemCount')}</TableHead><TableHead className="text-slate-300">{t('totalAmount')}</TableHead><TableHead className="text-slate-300">{t('status')}</TableHead><TableHead className="text-slate-300">{t('createTime')}</TableHead><TableHead className="text-slate-300">{t('actions')}</TableHead></TableRow></TableHeader>
          <TableBody>{orders.map((order) => (<TableRow key={order.id} className="border-slate-700"><TableCell className="text-white font-mono">{order.order_no}</TableCell><TableCell className="text-slate-300">{suppliers.find(s => s.id === order.supplier_id)?.name}</TableCell><TableCell className="text-slate-300">{warehouses.find(w => w.id === order.warehouse_id)?.name}</TableCell><TableCell className="text-slate-300">{order.items?.length || 0}</TableCell><TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell><TableCell><Badge className={order.status === 'received' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>{order.status === 'received' ? t('receivedStatus') : t('pendingReceive')}</Badge></TableCell><TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell><TableCell>{order.status === 'pending' && (<Button size="sm" onClick={() => handleReceive(order.id)} className="bg-emerald-500 hover:bg-emerald-600">{t('receiveGoods')}</Button>)}</TableCell></TableRow>))}</TableBody>
        </Table>
      </Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl">
          <DialogHeader><DialogTitle>{t('createPurchaseOrder')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-slate-300">{t('supplier')}</label><Select value={formData.supplier_id} onValueChange={(v) => setFormData({...formData, supplier_id: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('selectSupplier')} /></SelectTrigger><SelectContent>{suppliers.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>
              <div><label className="text-sm text-slate-300">{t('receiveWarehouse')}</label><Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('selectWarehouse')} /></SelectTrigger><SelectContent>{warehouses.map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="border border-slate-700 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-300 mb-3">{t('addItems')}</h4>
              <div className="grid grid-cols-4 gap-3">
                <Select value={newItem.product_id} onValueChange={(v) => { const p = products.find(x => x.id === v); setNewItem({...newItem, product_id: v, unit_price: p?.cost_price || 0}); }}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('selectProduct')} /></SelectTrigger><SelectContent>{products.map(p => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent></Select>
                <Input type="number" placeholder={t('quantity')} value={newItem.quantity} onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Input type="number" placeholder={t('unitPrice')} value={newItem.unit_price} onChange={(e) => setNewItem({...newItem, unit_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />
                <Button onClick={addItem} className="bg-blue-500 hover:bg-blue-600">{t('add')}</Button>
              </div>
            </div>
            {formData.items.length > 0 && (<Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('product')}</TableHead><TableHead className="text-slate-300">{t('quantity')}</TableHead><TableHead className="text-slate-300">{t('unitPrice')}</TableHead><TableHead className="text-slate-300">{t('amount')}</TableHead></TableRow></TableHeader><TableBody>{formData.items.map((item, idx) => (<TableRow key={idx} className="border-slate-700"><TableCell className="text-white">{item.product_name}</TableCell><TableCell className="text-slate-300">{item.quantity}</TableCell><TableCell className="text-slate-300">${item.unit_price?.toFixed(2)}</TableCell><TableCell className="text-emerald-400">${item.amount?.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table>)}
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" disabled={formData.items.length === 0}>{t('createPurchaseOrder')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
