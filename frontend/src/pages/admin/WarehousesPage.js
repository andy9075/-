import React, { useState, useEffect } from "react";
import { Plus, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function WarehousesPage() {
  const { t } = useLang();
  const [warehouses, setWarehouses] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [formData, setFormData] = useState({ code: "", name: "", address: "", is_main: false, store_id: "" });

  useEffect(() => { fetchWarehouses(); }, []);
  useEffect(() => { if (selectedWarehouse) fetchInventory(selectedWarehouse); }, [selectedWarehouse]);

  const fetchWarehouses = async () => { try { const res = await axios.get(`${API}/warehouses`); setWarehouses(res.data); if (res.data.length > 0 && !selectedWarehouse) setSelectedWarehouse(res.data[0].id); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const fetchInventory = async (warehouseId) => { try { const res = await axios.get(`${API}/inventory`, { params: { warehouse_id: warehouseId } }); setInventory(res.data); } catch (e) { console.error(e); } };
  const handleSubmit = async () => { try { await axios.post(`${API}/warehouses`, formData); toast.success(t('addSuccess')); setShowForm(false); fetchWarehouses(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('warehouseManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", address: "", is_main: false, store_id: "" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-warehouse-btn"><Plus className="w-4 h-4 mr-2" /> {t('addWarehouse')}</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {warehouses.map((wh) => (
          <Card key={wh.id} className={`bg-slate-800 border-slate-700 cursor-pointer transition-colors ${selectedWarehouse === wh.id ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setSelectedWarehouse(wh.id)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${wh.is_main ? 'bg-yellow-500/20' : 'bg-slate-700'}`}><WarehouseIcon className={`w-5 h-5 ${wh.is_main ? 'text-yellow-400' : 'text-slate-400'}`} /></div>
                <div><h3 className="text-white font-medium">{wh.name}</h3><p className="text-slate-400 text-xs">{wh.code}</p></div>
              </div>
              {wh.is_main && <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">{t('mainWarehouse')}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedWarehouse && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('inventoryList')} - {warehouses.find(w => w.id === selectedWarehouse)?.name}</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productCode')}</TableHead><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-slate-300">{t('inventoryQty')}</TableHead><TableHead className="text-slate-300">{t('reservedQty')}</TableHead><TableHead className="text-slate-300">{t('availableQty')}</TableHead></TableRow></TableHeader>
              <TableBody>
                {inventory.map((inv) => (<TableRow key={inv.id} className="border-slate-700"><TableCell className="text-slate-300">{inv.product?.code}</TableCell><TableCell className="text-white">{inv.product?.name}</TableCell><TableCell className="text-white">{inv.quantity}</TableCell><TableCell className="text-orange-400">{inv.reserved || 0}</TableCell><TableCell className="text-emerald-400">{inv.available}</TableCell></TableRow>))}
                {inventory.length === 0 && (<TableRow><TableCell colSpan={5} className="text-center text-slate-400">{t('noInventoryData')}</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('addWarehouse')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm text-slate-300">{t('warehouseCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-code" /></div>
            <div><label className="text-sm text-slate-300">{t('warehouseName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="warehouse-name" /></div>
            <div><label className="text-sm text-slate-300">{t('address')}</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div className="flex items-center gap-2"><input type="checkbox" checked={formData.is_main} onChange={(e) => setFormData({...formData, is_main: e.target.checked})} className="rounded" /><label className="text-sm text-slate-300">{t('setMainWarehouse')}</label></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="warehouse-submit">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
