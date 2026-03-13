import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function SuppliersPage() {
  const { t } = useLang();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", contact: "", phone: "", address: "", bank_account: "", tax_id: "" });

  useEffect(() => { fetchSuppliers(); }, []);
  const fetchSuppliers = async () => { try { const res = await axios.get(`${API}/suppliers`); setSuppliers(res.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const handleSubmit = async () => { try { await axios.post(`${API}/suppliers`, formData); toast.success(t('addSuccess')); setShowForm(false); fetchSuppliers(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };
  const handleDelete = async (id) => { if (!window.confirm(t('deleteConfirm'))) return; try { await axios.delete(`${API}/suppliers/${id}`); toast.success(t('deleteSuccess')); fetchSuppliers(); } catch (e) { toast.error(t('deleteFailed')); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('supplierManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", contact: "", phone: "", address: "", bank_account: "", tax_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-supplier-btn"><Plus className="w-4 h-4 mr-2" /> {t('addSupplier')}</Button>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('supplierCode')}</TableHead><TableHead className="text-slate-300">{t('supplierName')}</TableHead><TableHead className="text-slate-300">{t('contact')}</TableHead><TableHead className="text-slate-300">{t('phone')}</TableHead><TableHead className="text-slate-300">{t('address')}</TableHead><TableHead className="text-slate-300">{t('actions')}</TableHead></TableRow></TableHeader>
          <TableBody>{suppliers.map((s) => (<TableRow key={s.id} className="border-slate-700"><TableCell className="text-slate-300">{s.code}</TableCell><TableCell className="text-white font-medium">{s.name}</TableCell><TableCell className="text-slate-300">{s.contact || '-'}</TableCell><TableCell className="text-slate-300">{s.phone || '-'}</TableCell><TableCell className="text-slate-300">{s.address || '-'}</TableCell><TableCell><Button size="sm" variant="ghost" onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button></TableCell></TableRow>))}</TableBody>
        </Table>
      </Card>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('addSupplier')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('supplierCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" /></div><div><label className="text-sm text-slate-300">{t('supplierName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('contact')}</label><Input value={formData.contact} onChange={(e) => setFormData({...formData, contact: e.target.value})} className="bg-slate-700 border-slate-600" /></div><div><label className="text-sm text-slate-300">{t('phone')}</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div></div>
            <div><label className="text-sm text-slate-300">{t('address')}</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
