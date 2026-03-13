import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const TYPE_LABELS = { discount: "discount_promo", full_reduction: "fullReduction", buy_get: "buyGet", flash_sale: "flashSale" };

export default function PromotionsPage() {
  const { t } = useLang();
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "discount", discount_value: 10, min_amount: 0, start_date: "", end_date: "", status: "active", description: "" });

  const fetchPromos = async () => {
    try { const res = await axios.get(`${API}/promotions`); setPromos(res.data); } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchPromos(); }, []);

  const handleSubmit = async () => {
    try {
      if (editId) { await axios.put(`${API}/promotions/${editId}`, form); toast.success(t('updateSuccess')); }
      else { await axios.post(`${API}/promotions`, form); toast.success(t('addSuccess')); }
      setShowForm(false); setEditId(null); fetchPromos();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try { await axios.delete(`${API}/promotions/${id}`); toast.success(t('deleteSuccess')); fetchPromos(); } catch (e) { toast.error(t('deleteFailed')); }
  };

  const openEdit = (promo) => {
    setForm({ name: promo.name, type: promo.type, discount_value: promo.discount_value || 0, min_amount: promo.min_amount || 0, start_date: promo.start_date || "", end_date: promo.end_date || "", status: promo.status, description: promo.description || "" });
    setEditId(promo.id); setShowForm(true);
  };

  const statusColor = (s) => s === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400';

  return (
    <div className="space-y-6" data-testid="promotions-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('promotions')}</h1>
        <Button onClick={() => { setForm({ name: "", type: "discount", discount_value: 10, min_amount: 0, start_date: "", end_date: "", status: "active", description: "" }); setEditId(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-promotion-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('addPromotion')}
        </Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('promoName')}</TableHead>
                <TableHead className="text-slate-300">{t('promoType')}</TableHead>
                <TableHead className="text-slate-300">{t('discountValue')}</TableHead>
                <TableHead className="text-slate-300">{t('minAmount')}</TableHead>
                <TableHead className="text-slate-300">{t('startDate')}</TableHead>
                <TableHead className="text-slate-300">{t('endDate')}</TableHead>
                <TableHead className="text-slate-300">{t('status')}</TableHead>
                <TableHead className="text-slate-300">{t('actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promos.map(p => (
                <TableRow key={p.id} className="border-slate-700">
                  <TableCell className="text-white font-medium">{p.name}</TableCell>
                  <TableCell><Badge className="bg-blue-500/20 text-blue-400">{t(TYPE_LABELS[p.type] || p.type)}</Badge></TableCell>
                  <TableCell className="text-emerald-400">{p.type === 'discount' ? `${p.discount_value}%` : `$${p.discount_value}`}</TableCell>
                  <TableCell className="text-slate-300">${p.min_amount || 0}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{p.start_date || '-'}</TableCell>
                  <TableCell className="text-slate-400 text-sm">{p.end_date || '-'}</TableCell>
                  <TableCell><Badge className={statusColor(p.status)}>{p.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="text-blue-400 hover:text-blue-300"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {promos.length === 0 && <TableRow><TableCell colSpan={8} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{editId ? t('edit') : t('addPromotion')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('promoName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="promo-name-input" />
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2" data-testid="promo-type-select">
              <option value="discount">{t('discount_promo')}</option>
              <option value="full_reduction">{t('fullReduction')}</option>
              <option value="buy_get">{t('buyGet')}</option>
              <option value="flash_sale">{t('flashSale')}</option>
            </select>
            <Input type="number" placeholder={t('discountValue')} value={form.discount_value} onChange={e => setForm({...form, discount_value: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="promo-discount-input" />
            <Input type="number" placeholder={t('minAmount')} value={form.min_amount} onChange={e => setForm({...form, min_amount: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="promo-min-amount-input" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="promo-start-date" />
              <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="promo-end-date" />
            </div>
            <Input placeholder={t('notes')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-slate-700 border-slate-600" />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600" data-testid="promo-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600 text-slate-300">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
