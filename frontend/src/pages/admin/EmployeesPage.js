import React, { useState, useEffect } from "react";
import { UserPlus, Edit, Trash2 } from "lucide-react";
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

export default function EmployeesPage() {
  const { t } = useLang();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: { can_discount: false, can_refund: false, max_discount: 10 } });
  const [stores, setStores] = useState([]);

  const fetchData = async () => { try { const [empRes, storesRes] = await Promise.all([axios.get(`${API}/employees`), axios.get(`${API}/stores`)]); setEmployees(empRes.data); setStores(storesRes.data); } catch (e) { console.error(e); } };
  useEffect(() => { fetchData(); }, []);
  const handleSubmit = async () => { try { if (editing) { await axios.put(`${API}/employees/${editing}`, form); } else { await axios.post(`${API}/employees`, form); } toast.success(t('save') + " OK"); setShowForm(false); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const handleDelete = async (id) => { try { await axios.delete(`${API}/employees/${id}`); toast.success("Deleted"); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };
  const roleColors = { admin: "bg-red-500/20 text-red-400", manager: "bg-purple-500/20 text-purple-400", cashier: "bg-blue-500/20 text-blue-400", staff: "bg-slate-500/20 text-slate-400" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t('employees')}</h1><Button onClick={() => { setForm({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: { can_discount: false, can_refund: false, max_discount: 10 } }); setEditing(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600"><UserPlus className="w-4 h-4 mr-2" /> {t('add')}</Button></div>
      <Card className="bg-slate-800 border-slate-700"><Table>
        <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('username')}</TableHead><TableHead className="text-slate-300">{t('name')}</TableHead><TableHead className="text-slate-300">{t('phone')}</TableHead><TableHead className="text-slate-300">Role</TableHead><TableHead className="text-slate-300">{t('permission')}</TableHead><TableHead className="text-slate-300">{t('status')}</TableHead></TableRow></TableHeader>
        <TableBody>{employees.map(emp => (<TableRow key={emp.id} className="border-slate-700"><TableCell className="text-white font-medium">{emp.username}</TableCell><TableCell className="text-slate-300">{emp.name}</TableCell><TableCell className="text-slate-400">{emp.phone}</TableCell><TableCell><Badge className={roleColors[emp.role] || roleColors.staff}>{emp.role}</Badge></TableCell><TableCell className="text-xs text-slate-400">{emp.permissions?.can_discount && <Badge className="bg-green-500/10 text-green-400 mr-1">{t('canDiscount')}</Badge>}{emp.permissions?.can_refund && <Badge className="bg-blue-500/10 text-blue-400 mr-1">{t('canRefund')}</Badge>}</TableCell><TableCell><div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => { setForm({...emp, password: ""}); setEditing(emp.id); setShowForm(true); }}><Edit className="w-4 h-4 text-slate-400" /></Button><Button size="sm" variant="ghost" onClick={() => handleDelete(emp.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button></div></TableCell></TableRow>))}</TableBody>
      </Table></Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>{editing ? t('editProduct') : t('add')} {t('employees')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400">{t('username')}</label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('password')}</label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-slate-700 border-slate-600" placeholder={editing ? "Leave empty to keep" : ""} /></div>
            <div><label className="text-xs text-slate-400">{t('name')}</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('phone')}</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">Role</label><Select value={form.role} onValueChange={v => setForm({...form, role: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Admin</SelectItem><SelectItem value="manager">Manager</SelectItem><SelectItem value="cashier">Cashier</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select></div>
            <div><label className="text-xs text-slate-400">{t('storeManagement')}</label><Select value={form.store_id || ""} onValueChange={v => setForm({...form, store_id: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('all')} /></SelectTrigger><SelectContent><SelectItem value="">{t('all')}</SelectItem>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2 bg-slate-900 rounded-lg p-3 space-y-2"><h4 className="text-sm font-medium text-emerald-400">{t('permission')}</h4><div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.permissions?.can_discount} onChange={e => setForm({...form, permissions: {...form.permissions, can_discount: e.target.checked}})} /> {t('canDiscount')}</label><label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.permissions?.can_refund} onChange={e => setForm({...form, permissions: {...form.permissions, can_refund: e.target.checked}})} /> {t('canRefund')}</label></div><div><label className="text-xs text-slate-400">{t('maxDiscount')} %</label><Input type="number" value={form.permissions?.max_discount || 0} onChange={e => setForm({...form, permissions: {...form.permissions, max_discount: parseInt(e.target.value) || 0}})} className="bg-slate-700 border-slate-600 w-24" /></div></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
