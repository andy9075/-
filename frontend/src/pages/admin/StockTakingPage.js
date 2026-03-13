import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function StockTakingPage() {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => { Promise.all([axios.get(`${API}/products`), axios.get(`${API}/warehouses`), axios.get(`${API}/stock-takings`)]).then(([p, w, h]) => { setProducts(p.data); setWarehouses(w.data); setHistory(h.data); }).catch(console.error); }, []);

  const startTaking = async () => { if (!selectedWarehouse) return; const invRes = await axios.get(`${API}/inventory?warehouse_id=${selectedWarehouse}`); const inv = invRes.data; setItems(products.map(p => { const stock = inv.find(i => i.product_id === p.id); return { product_id: p.id, product_name: p.name, product_code: p.code, system_qty: stock?.quantity || 0, actual_qty: stock?.quantity || 0, difference: 0 }; })); };
  const updateActualQty = (idx, qty) => { setItems(prev => prev.map((item, i) => i === idx ? {...item, actual_qty: qty, difference: qty - item.system_qty} : item)); };
  const submitTaking = async (status) => { try { await axios.post(`${API}/stock-taking`, { warehouse_id: selectedWarehouse, items, status, notes: "" }); toast.success(t('save') + " OK"); setItems([]); } catch (e) { toast.error("Error"); } };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('stockTaking')}</h1>
      {items.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6 space-y-4">
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('warehouseManagement')} /></SelectTrigger><SelectContent>{warehouses.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent></Select>
          <Button onClick={startTaking} disabled={!selectedWarehouse} className="bg-emerald-500 hover:bg-emerald-600">{t('stockTaking')}</Button>
        </CardContent></Card>
      ) : (
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-4">
          <div className="overflow-auto max-h-96"><Table>
            <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productCode')}</TableHead><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-slate-300">{t('systemQty')}</TableHead><TableHead className="text-slate-300">{t('actualQty')}</TableHead><TableHead className="text-slate-300">{t('difference')}</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((item, idx) => (<TableRow key={idx} className={`border-slate-700 ${item.difference !== 0 ? 'bg-red-500/5' : ''}`}><TableCell className="text-slate-400">{item.product_code}</TableCell><TableCell className="text-white">{item.product_name}</TableCell><TableCell className="text-slate-300">{item.system_qty}</TableCell><TableCell><Input type="number" value={item.actual_qty} onChange={e => updateActualQty(idx, parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-20" /></TableCell><TableCell className={`font-bold ${item.difference > 0 ? 'text-green-400' : item.difference < 0 ? 'text-red-400' : 'text-slate-400'}`}>{item.difference > 0 ? '+' : ''}{item.difference}</TableCell></TableRow>))}</TableBody>
          </Table></div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setItems([])} className="border-slate-600">{t('cancel')}</Button><Button onClick={() => submitTaking("draft")} className="bg-blue-500 hover:bg-blue-600">{t('save')} (Draft)</Button><Button onClick={() => submitTaking("confirmed")} className="bg-emerald-500 hover:bg-emerald-600">{t('confirm')}</Button></div>
        </CardContent></Card>
      )}
      {history.length > 0 && (<Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">History</CardTitle></CardHeader><CardContent>{history.map(h => (<div key={h.id} className="flex justify-between py-2 border-b border-slate-700 last:border-0"><span className="text-white">{h.taking_no}</span><Badge className={h.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>{h.status}</Badge><span className="text-slate-400 text-sm">{new Date(h.created_at).toLocaleString()}</span></div>))}</CardContent></Card>)}
    </div>
  );
}
