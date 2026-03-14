import React, { useState, useEffect } from "react";
import { RotateCcw, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function PurchaseReturnsPage() {
  const { t } = useLang();
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplier_id: "", reason: "", items: [] });
  const [addItem, setAddItem] = useState({ product_id: "", quantity: 1 });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/purchase-returns`),
      axios.get(`${API}/suppliers`),
      axios.get(`${API}/products`)
    ]).then(([r, s, p]) => { setReturns(r.data); setSuppliers(s.data); setProducts(p.data); })
    .catch(console.error).finally(() => setLoading(false));
  }, []);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const supplierMap = Object.fromEntries(suppliers.map(s => [s.id, s]));

  const handleAddItem = () => {
    if (!addItem.product_id) return;
    const p = productMap[addItem.product_id];
    if (!p) return;
    setForm({ ...form, items: [...form.items, { product_id: p.id, product_name: p.name, quantity: addItem.quantity, amount: (p.cost_price || 0) * addItem.quantity }] });
    setAddItem({ product_id: "", quantity: 1 });
  };

  const handleSubmit = async () => {
    if (!form.supplier_id || form.items.length === 0) { toast.error(t('operationFailed')); return; }
    try { await axios.post(`${API}/purchase-returns`, form); toast.success(t('addSuccess')); setShowForm(false); setForm({ supplier_id: "", reason: "", items: [] }); const res = await axios.get(`${API}/purchase-returns`); setReturns(res.data); }
    catch (e) { toast.error(t('operationFailed')); }
  };

  const handleApprove = async (id) => {
    try { await axios.put(`${API}/purchase-returns/${id}/approve`); toast.success(t('updateSuccess')); const res = await axios.get(`${API}/purchase-returns`); setReturns(res.data); }
    catch (e) { toast.error(t('operationFailed')); }
  };

  return (
    <div className="space-y-6" data-testid="purchase-returns-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><RotateCcw className="w-6 h-6 text-orange-400" /> {t('purchaseReturn')}</h1>
        <Button onClick={() => { setForm({ supplier_id: "", reason: "", items: [] }); setShowForm(true); }} className="bg-orange-500 hover:bg-orange-600" data-testid="create-return-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('add')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
                <TableHead className="text-slate-300">{t('date')}</TableHead>
                <TableHead className="text-slate-300">{t('supplier')}</TableHead>
                <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
                <TableHead className="text-slate-300">{t('returnReason')}</TableHead>
                <TableHead className="text-slate-300">{t('status')}</TableHead>
                <TableHead className="text-slate-300">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {returns.map(r => (
                <TableRow key={r.id} className="border-slate-700">
                  <TableCell className="text-white font-mono">{r.return_no}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{r.created_at?.substring(0, 10)}</TableCell>
                  <TableCell className="text-slate-300">{supplierMap[r.supplier_id]?.name || '-'}</TableCell>
                  <TableCell className="text-orange-400">${r.total_amount?.toFixed(2)}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{r.reason || '-'}</TableCell>
                  <TableCell><Badge className={r.status === 'approved' ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}>{r.status}</Badge></TableCell>
                  <TableCell>{r.status === 'pending' && <Button size="sm" onClick={() => handleApprove(r.id)} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" data-testid={`approve-return-${r.id}`}>{t('approve')}</Button>}</TableCell>
                </TableRow>
              ))}
              {returns.length === 0 && <TableRow><TableCell colSpan={7} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>{t('purchaseReturn')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2" data-testid="return-supplier-select">
              <option value="">{t('selectSupplier')}</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Input placeholder={t('returnReason')} value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} className="bg-slate-700 border-slate-600" />
            <div className="flex gap-2">
              <select value={addItem.product_id} onChange={e => setAddItem({...addItem, product_id: e.target.value})} className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
                <option value="">{t('selectProduct')}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <Input type="number" min="1" value={addItem.quantity} onChange={e => setAddItem({...addItem, quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600 w-20" />
              <Button onClick={handleAddItem} className="bg-blue-500 hover:bg-blue-600">{t('add')}</Button>
            </div>
            {form.items.length > 0 && form.items.map((item, idx) => (
              <div key={idx} className="flex justify-between bg-slate-700/50 rounded px-3 py-2"><span className="text-white">{item.product_name} x{item.quantity}</span><span className="text-orange-400">${item.amount?.toFixed(2)}</span></div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1 bg-orange-500 hover:bg-orange-600" data-testid="return-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
