import React, { useState, useEffect } from "react";
import { Target, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function SalesTargetsPage() {
  const { t } = useLang();
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: 0, start_date: "", end_date: "", period: "monthly", employee_id: "", store_id: "" });

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/sales-targets`),
      axios.get(`${API}/employees`),
      axios.get(`${API}/stores`)
    ]).then(([t, e, s]) => { setTargets(t.data); setEmployees(e.data); setStores(s.data); })
    .catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    try { await axios.post(`${API}/sales-targets`, form); toast.success(t('addSuccess')); setShowForm(false); const res = await axios.get(`${API}/sales-targets`); setTargets(res.data); }
    catch (e) { toast.error(t('operationFailed')); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try { await axios.delete(`${API}/sales-targets/${id}`); setTargets(targets.filter(t => t.id !== id)); }
    catch (e) { toast.error(t('deleteFailed')); }
  };

  const progressColor = (p) => p >= 100 ? "text-emerald-400" : p >= 60 ? "text-blue-400" : p >= 30 ? "text-yellow-400" : "text-red-400";

  return (
    <div className="space-y-6" data-testid="sales-targets-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Target className="w-6 h-6 text-blue-400" /> {t('salesTarget')}</h1>
        <Button onClick={() => { setForm({ name: "", target_amount: 0, start_date: "", end_date: "", period: "monthly", employee_id: "", store_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="set-target-btn">
          <Plus className="w-4 h-4 mr-2" /> {t('setTarget')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targets.map(tgt => (
          <Card key={tgt.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-white font-medium">{tgt.name || t('salesTarget')}</h3>
                  <p className="text-slate-400 text-xs mt-1">{tgt.start_date} ~ {tgt.end_date}</p>
                  <Badge className="mt-1 bg-blue-500/20 text-blue-400">{t(tgt.period) || tgt.period}</Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(tgt.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">{t('actual')}: <span className="text-emerald-400">${tgt.actual?.toFixed(2) || '0.00'}</span></span>
                  <span className="text-slate-400">{t('targetAmount')}: <span className="text-white">${tgt.target_amount?.toFixed(2)}</span></span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(tgt.progress || 0, 100)}%`, background: (tgt.progress || 0) >= 100 ? '#10b981' : (tgt.progress || 0) >= 60 ? '#3b82f6' : '#f59e0b' }} />
                </div>
                <p className={`text-right text-sm mt-1 font-bold ${progressColor(tgt.progress || 0)}`}>{tgt.progress || 0}%</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {targets.length === 0 && <p className="text-slate-400 col-span-3 text-center py-8">{t('noData')}</p>}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{t('setTarget')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="target-name-input" />
            <Input type="number" placeholder={t('targetAmount')} value={form.target_amount} onChange={e => setForm({...form, target_amount: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="target-amount-input" />
            <select value={form.period} onChange={e => setForm({...form, period: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
              <option value="monthly">{t('monthly')}</option>
              <option value="quarterly">{t('quarterly')}</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="target-start-date" />
              <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="target-end-date" />
            </div>
            <select value={form.employee_id} onChange={e => setForm({...form, employee_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
              <option value="">{t('all')} {t('employees')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name || e.username}</option>)}
            </select>
            <select value={form.store_id} onChange={e => setForm({...form, store_id: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
              <option value="">{t('all')} {t('stores')}</option>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600" data-testid="target-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
