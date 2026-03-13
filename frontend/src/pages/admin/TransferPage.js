import React, { useState, useEffect } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function TransferPage() {
  const { t } = useLang();
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [formData, setFormData] = useState({ from_warehouse_id: "", to_warehouse_id: "", product_id: "", quantity: 1 });

  useEffect(() => { fetchAll(); }, []);
  const fetchAll = async () => { try { const [wRes, pRes, iRes, tRes] = await Promise.all([axios.get(`${API}/warehouses`), axios.get(`${API}/products`), axios.get(`${API}/inventory`), axios.get(`${API}/transfer-logs`).catch(() => ({ data: [] }))]); setWarehouses(wRes.data); setProducts(pRes.data); setInventory(iRes.data); setTransfers(tRes.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const getStock = (productId, warehouseId) => { const inv = inventory.find(i => i.product_id === productId && i.warehouse_id === warehouseId); return inv ? inv.quantity : 0; };
  const handleTransfer = async () => { if (!formData.from_warehouse_id || !formData.to_warehouse_id || !formData.product_id) { toast.error(t('fillCompleteInfo')); return; } if (formData.from_warehouse_id === formData.to_warehouse_id) { toast.error(t('sameWarehouseError')); return; } try { await axios.post(`${API}/inventory/transfer`, null, { params: formData }); toast.success(t('transferSuccess')); setFormData({...formData, quantity: 1}); fetchAll(); } catch (e) { toast.error(e.response?.data?.detail || t('transferFailed')); } };
  const getWarehouseName = (id) => warehouses.find(w => w.id === id)?.name || id;
  const getProductName = (id) => products.find(p => p.id === id)?.name || id;

  if (loading) return <div className="text-white text-center py-12">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('transferManagement')}</h1>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('newTransfer')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div><label className="text-sm text-slate-300 block mb-1">{t('sourceWarehouse')}</label><Select value={formData.from_warehouse_id} onValueChange={(v) => setFormData({...formData, from_warehouse_id: v})}><SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-from"><SelectValue placeholder={t('source')} /></SelectTrigger><SelectContent>{warehouses.map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent></Select></div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('targetWarehouse')}</label><Select value={formData.to_warehouse_id} onValueChange={(v) => setFormData({...formData, to_warehouse_id: v})}><SelectTrigger className="bg-slate-700 border-slate-600" data-testid="transfer-to"><SelectValue placeholder={t('target')} /></SelectTrigger><SelectContent>{warehouses.filter(w => w.id !== formData.from_warehouse_id).map(w => (<SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>))}</SelectContent></Select></div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('product')}{formData.product_id && formData.from_warehouse_id && <span className="text-yellow-400 ml-1">({t('stock')}: {getStock(formData.product_id, formData.from_warehouse_id)})</span>}</label>
              <div className="relative"><Input placeholder={t('searchProduct')} value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="bg-slate-700 border-slate-600 text-white" data-testid="transfer-product-search" />
                {productSearch && (<div className="absolute z-20 left-0 right-0 top-full mt-1 bg-slate-700 border border-slate-600 rounded-lg max-h-48 overflow-y-auto shadow-xl">{products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).map(p => (<div key={p.id} onClick={() => { setFormData({...formData, product_id: p.id}); setProductSearch(p.name); }} className="px-3 py-2 hover:bg-slate-600 cursor-pointer flex justify-between"><span className="text-white text-sm">{p.name}</span><span className="text-slate-400 text-xs">{p.code}</span></div>))}{products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && <p className="text-slate-400 text-sm text-center py-2">{t('noResults')}</p>}</div>)}
              </div>
            </div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('quantity')}</label><Input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600" data-testid="transfer-qty" /></div>
            <div><Button onClick={handleTransfer} className="bg-blue-500 hover:bg-blue-600 w-full" data-testid="transfer-submit"><ArrowLeftRight className="w-4 h-4 mr-2" /> {t('transferConfirm')}</Button></div>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('inventoryOverview')}</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('product')}</TableHead>{warehouses.map(w => (<TableHead key={w.id} className="text-slate-300 text-center">{w.name}</TableHead>))}</TableRow></TableHeader><TableBody>{products.filter(p => p.status === 'active').map(product => (<TableRow key={product.id} className="border-slate-700"><TableCell className="text-white font-medium">{product.name}</TableCell>{warehouses.map(w => { const stock = getStock(product.id, w.id); return (<TableCell key={w.id} className={`text-center font-medium ${stock <= 0 ? 'text-red-400' : stock < 10 ? 'text-yellow-400' : 'text-emerald-400'}`}>{stock}</TableCell>); })}</TableRow>))}</TableBody></Table></CardContent>
      </Card>
      {transfers.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('transferHistory')}</CardTitle></CardHeader>
          <CardContent><Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('time')}</TableHead><TableHead className="text-slate-300">{t('product')}</TableHead><TableHead className="text-slate-300">{t('source')}</TableHead><TableHead className="text-slate-300">{t('target')}</TableHead><TableHead className="text-slate-300">{t('quantity')}</TableHead></TableRow></TableHeader><TableBody>{transfers.map(tr => (<TableRow key={tr.id} className="border-slate-700"><TableCell className="text-slate-300">{new Date(tr.created_at).toLocaleString()}</TableCell><TableCell className="text-white">{getProductName(tr.product_id)}</TableCell><TableCell className="text-orange-400">{getWarehouseName(tr.from_warehouse_id)}</TableCell><TableCell className="text-emerald-400">{getWarehouseName(tr.to_warehouse_id)}</TableCell><TableCell className="text-blue-400 font-bold">{tr.quantity}</TableCell></TableRow>))}</TableBody></Table></CardContent>
        </Card>
      )}
    </div>
  );
}
