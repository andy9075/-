import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function StoresPage() {
  const { t } = useLang();
  const [stores, setStores] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", type: "retail", address: "", phone: "", warehouse_id: "", is_headquarters: false, status: "active" });

  useEffect(() => { fetchStores(); fetchWarehouses(); }, []);
  const fetchStores = async () => { try { const res = await axios.get(`${API}/stores`); setStores(res.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const fetchWarehouses = async () => { try { const res = await axios.get(`${API}/warehouses`); setWarehouses(res.data); } catch (e) { console.error(e); } };
  const handleSubmit = async () => { try { if (editingStore) { await axios.put(`${API}/stores/${editingStore.id}`, formData); toast.success(t('updateSuccess')); } else { await axios.post(`${API}/stores`, formData); toast.success(t('addSuccess')); } setShowForm(false); setEditingStore(null); fetchStores(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };
  const handleEdit = (store) => { setEditingStore(store); setFormData(store); setShowForm(true); };
  const handleDelete = async (id) => { if (!window.confirm(t('deleteConfirm'))) return; try { await axios.delete(`${API}/stores/${id}`); toast.success(t('deleteSuccess')); fetchStores(); } catch (e) { toast.error(t('deleteFailed')); } };
  const storeTypes = { retail: t('physicalStore'), online: t('onlineStore'), warehouse: t('warehouse') };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('storeManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", type: "retail", address: "", phone: "", warehouse_id: "", is_headquarters: false, status: "active" }); setEditingStore(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-store-btn"><Plus className="w-4 h-4 mr-2" /> {t('addStore')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stores.map((store) => (
          <Card key={store.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><h3 className="text-white font-semibold">{store.name}</h3>{store.is_headquarters && <Badge className="bg-yellow-500/20 text-yellow-400">{t('headquarters')}</Badge>}</div>
                  <p className="text-slate-400 text-sm mt-1">{store.code}</p>
                </div>
                <Badge variant={store.type === 'online' ? 'default' : 'secondary'}>{storeTypes[store.type]}</Badge>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-slate-300"><span className="text-slate-500">{t('address')}:</span> {store.address || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">{t('phone')}:</span> {store.phone || '-'}</p>
                <p className="text-slate-300"><span className="text-slate-500">{t('associatedWarehouse')}:</span> {warehouses.find(w => w.id === store.warehouse_id)?.name || '-'}</p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" onClick={() => handleEdit(store)} className="flex-1 border-slate-600 text-slate-300"><Edit className="w-4 h-4 mr-1" /> {t('edit')}</Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(store.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{editingStore ? t('editStore') : t('addStore')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-slate-300">{t('storeCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-code" /></div>
              <div><label className="text-sm text-slate-300">{t('storeName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="store-name" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-slate-300">{t('type')}</label>
                <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="retail">{t('physicalStore')}</SelectItem><SelectItem value="online">{t('onlineStore')}</SelectItem><SelectItem value="warehouse">{t('warehouse')}</SelectItem></SelectContent>
                </Select>
              </div>
              <div><label className="text-sm text-slate-300">{t('associatedWarehouse')}</label>
                <Select value={formData.warehouse_id} onValueChange={(v) => setFormData({...formData, warehouse_id: v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('selectWarehouse')} /></SelectTrigger>
                  <SelectContent>{warehouses.map(wh => (<SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm text-slate-300">{t('address')}</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-sm text-slate-300">{t('phone')}</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="store-submit">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
