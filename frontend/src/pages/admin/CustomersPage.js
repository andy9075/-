import React, { useState, useEffect } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 });

  useEffect(() => { fetchCustomers(); }, []);
  const fetchCustomers = async () => { try { const res = await axios.get(`${API}/customers`, { params: { search: search || undefined } }); setCustomers(res.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const handleSubmit = async () => { try { await axios.post(`${API}/customers`, formData); toast.success(t('addSuccess')); setShowForm(false); fetchCustomers(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('customerManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-customer-btn"><Plus className="w-4 h-4 mr-2" /> {t('addCustomer')}</Button>
      </div>
      <div className="flex gap-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder={t('searchCustomerPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()} className="pl-10 bg-slate-800 border-slate-700 text-white" /></div></div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('customerCode')}</TableHead><TableHead className="text-slate-300">{t('customerName')}</TableHead><TableHead className="text-slate-300">{t('phone')}</TableHead><TableHead className="text-slate-300">{t('memberLevel')}</TableHead><TableHead className="text-slate-300">{t('points')}</TableHead><TableHead className="text-slate-300">{t('balance')}</TableHead></TableRow></TableHeader>
          <TableBody>{customers.map((c) => (<TableRow key={c.id} className="border-slate-700"><TableCell className="text-slate-300">{c.code}</TableCell><TableCell className="text-white font-medium">{c.name}</TableCell><TableCell className="text-slate-300">{c.phone || '-'}</TableCell><TableCell><Badge variant={c.member_level === 'vip' ? 'default' : 'secondary'}>{c.member_level === 'vip' ? t('vip') : t('normal')}</Badge></TableCell><TableCell className="text-purple-400">{c.points}</TableCell><TableCell className="text-emerald-400">${c.balance?.toFixed(2)}</TableCell></TableRow>))}</TableBody>
        </Table>
      </Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('addCustomer')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('customerCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" /></div><div><label className="text-sm text-slate-300">{t('customerName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('phone')}</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div><div><label className="text-sm text-slate-300">{t('email')}</label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-700 border-slate-600" /></div></div>
            <div><label className="text-sm text-slate-300">{t('address')}</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
