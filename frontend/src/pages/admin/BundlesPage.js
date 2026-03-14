import React, { useState, useEffect } from "react";
import { Package, Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function BundlesPage() {
  const { t } = useLang();
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", bundle_price: 0, items: [] });
  const [addItem, setAddItem] = useState({ product_id: "", quantity: 1 });

  useEffect(() => {
    Promise.all([axios.get(`${API}/bundles`), axios.get(`${API}/products`)])
    .then(([b, p]) => { setBundles(b.data); setProducts(p.data); })
    .catch(console.error).finally(() => setLoading(false));
  }, []);

  const productMap = Object.fromEntries(products.map(p => [p.id, p]));

  const handleAddItem = () => {
    if (!addItem.product_id) return;
    const p = productMap[addItem.product_id];
    if (!p) return;
    setForm({ ...form, items: [...form.items, { product_id: p.id, product_name: p.name, quantity: addItem.quantity }] });
    setAddItem({ product_id: "", quantity: 1 });
  };

  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const originalPrice = form.items.reduce((s, item) => s + (productMap[item.product_id]?.price1 || 0) * item.quantity, 0);

  const handleSubmit = async () => {
    if (!form.name || form.items.length === 0) { toast.error(t('operationFailed')); return; }
    try {
      const data = { ...form, original_price: originalPrice };
      if (editId) { await axios.put(`${API}/bundles/${editId}`, data); }
      else { await axios.post(`${API}/bundles`, data); }
      toast.success(t(editId ? 'updateSuccess' : 'addSuccess'));
      setShowForm(false); setEditId(null);
      const res = await axios.get(`${API}/bundles`); setBundles(res.data);
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try { await axios.delete(`${API}/bundles/${id}`); setBundles(bundles.filter(b => b.id !== id)); }
    catch (e) { toast.error(t('deleteFailed')); }
  };

  const openEdit = (b) => {
    setForm({ name: b.name, description: b.description || "", bundle_price: b.bundle_price, items: b.items || [] });
    setEditId(b.id); setShowForm(true);
  };

  return (
    <div className="space-y-6" data-testid="bundles-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Package className="w-6 h-6 text-purple-400" /> {t('bundles')}</h1>
        <Button onClick={() => { setForm({ name: "", description: "", bundle_price: 0, items: [] }); setEditId(null); setShowForm(true); }} className="bg-purple-500 hover:bg-purple-600" data-testid="add-bundle-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('add')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bundles.map(b => (
          <Card key={b.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-medium text-lg">{b.name}</h3>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(b)} className="text-blue-400"><Edit2 className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              {b.description && <p className="text-slate-400 text-sm mt-1">{b.description}</p>}
              <div className="mt-3 space-y-1">
                {(b.items || []).map((item, idx) => (
                  <div key={idx} className="text-slate-300 text-sm flex justify-between">
                    <span>{item.product_name || '?'} x{item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-slate-500 line-through text-sm">${b.original_price?.toFixed(2)}</span>
                <span className="text-emerald-400 font-bold text-lg">${b.bundle_price?.toFixed(2)}</span>
                {b.original_price > 0 && <Badge className="bg-red-500/20 text-red-400">-{Math.round((1 - b.bundle_price / b.original_price) * 100)}%</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
        {bundles.length === 0 && <p className="text-slate-400 col-span-3 text-center py-8">{t('noData')}</p>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
          <DialogHeader><DialogTitle>{editId ? t('edit') : t('add')} {t('bundles')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('bundleName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="bundle-name-input" />
            <Input placeholder={t('notes')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-slate-700 border-slate-600" />
            <div className="flex gap-2">
              <select value={addItem.product_id} onChange={e => setAddItem({...addItem, product_id: e.target.value})} className="flex-1 bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
                <option value="">{t('selectProduct')}</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price1})</option>)}
              </select>
              <Input type="number" min="1" value={addItem.quantity} onChange={e => setAddItem({...addItem, quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600 w-20" />
              <Button onClick={handleAddItem} className="bg-blue-500 hover:bg-blue-600">{t('add')}</Button>
            </div>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-700/50 rounded px-3 py-2">
                <span className="text-white">{item.product_name} x{item.quantity}</span>
                <Button size="sm" variant="ghost" onClick={() => removeItem(idx)} className="text-red-400"><Trash2 className="w-3 h-3" /></Button>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <span className="text-slate-400">{t('originalPrice')}: <span className="text-white">${originalPrice.toFixed(2)}</span></span>
              <Input type="number" placeholder={t('bundlePrice')} value={form.bundle_price} onChange={e => setForm({...form, bundle_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600 w-32" data-testid="bundle-price-input" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1 bg-purple-500 hover:bg-purple-600" data-testid="bundle-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
