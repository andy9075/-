import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function CategoriesPage() {
  const { t } = useLang();
  const [categories, setCategories] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 1 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: "", name: "", exchange_rate: 0, description: "" });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { try { const [c, r] = await Promise.all([axios.get(`${API}/categories`), axios.get(`${API}/exchange-rates`)]); setCategories(c.data); setExchangeRates(r.data); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const handleSubmit = async () => {
    try {
      if (editing) { await axios.put(`${API}/categories/${editing}`, form); toast.success(t('updateSuccess')); }
      else { await axios.post(`${API}/categories`, form); toast.success(t('addSuccess')); }
      setShowForm(false); setEditing(null); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };
  const handleEdit = (cat) => { setEditing(cat.id); setForm({ code: cat.code, name: cat.name, exchange_rate: cat.exchange_rate || 0, description: cat.description || "" }); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm(t('deleteConfirm'))) return; try { await axios.delete(`${API}/categories/${id}`); toast.success(t('deleteSuccess')); fetchData(); } catch (e) { toast.error(t('deleteFailed')); } };
  const sysRate = exchangeRates.usd_to_ves || 1;
  const localSymbol = exchangeRates.local_currency_symbol || 'Bs.';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">{t('categoryManagement')}</h1><p className="text-slate-400 text-sm mt-1">{t('categoryRateDesc')}</p></div>
        <Button onClick={() => { setForm({ code: "", name: "", exchange_rate: sysRate, description: "" }); setEditing(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-category-btn"><Plus className="w-4 h-4 mr-2" /> {t('add')}</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(cat => {
          const rate = cat.exchange_rate || sysRate;
          return (
            <Card key={cat.id} className="bg-slate-800 border-slate-700 p-5">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="text-white font-semibold text-lg">{cat.name}</h3><p className="text-slate-500 text-sm">{cat.code}</p></div>
                <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => handleEdit(cat)} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></Button><Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button></div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 space-y-2">
                <div className="flex justify-between"><span className="text-slate-400 text-sm">{t('exchangeRates')}:</span><span className="text-cyan-400 font-bold">{localSymbol}{rate}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 text-sm">$10 =</span><span className="text-yellow-400 font-medium">{localSymbol}{(rate * 10).toFixed(2)}</span></div>
                {rate !== sysRate && <div className="text-xs text-orange-400 mt-1">{t('exchangeRates')}: {localSymbol}{sysRate} ({t('systemRates')})</div>}
              </div>
              {cat.description && <p className="text-slate-500 text-xs mt-2">{cat.description}</p>}
            </Card>
          );
        })}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('add')} {t('category')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-slate-300">{t('productCode')}</label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="cat-code" /></div>
              <div><label className="text-sm text-slate-300">{t('category')}</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="cat-name" /></div>
            </div>
            <div><label className="text-sm text-slate-300">{t('exchangeRates')} ({localSymbol})</label><Input type="number" step="0.01" value={form.exchange_rate} onChange={e => setForm({...form, exchange_rate: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="cat-rate" /><p className="text-xs text-cyan-400 mt-1">$1 = {localSymbol}{form.exchange_rate || sysRate} | {t('systemRates')}: {localSymbol}{sysRate}</p></div>
            <div><label className="text-sm text-slate-300">{t('notes')}</label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="cat-submit">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
