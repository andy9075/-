import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function ExchangeRatesPage() {
  const { t } = useLang();
  const [rates, setRates] = useState({ usd_to_ves: 36.5, usd_to_cop: 4000, default_currency: "USD", local_currency: "VES", local_currency_symbol: "Bs." });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { Promise.all([axios.get(`${API}/exchange-rates`), axios.get(`${API}/categories`)]).then(([r, c]) => { setRates(r.data); setCategories(c.data); }).catch(console.error).finally(() => setLoading(false)); }, []);

  const handleSaveRates = async () => { setSaving(true); try { await axios.put(`${API}/exchange-rates?usd_to_ves=${rates.usd_to_ves}&usd_to_cop=${rates.usd_to_cop}&default_currency=${rates.default_currency}&local_currency=${rates.local_currency}&local_currency_symbol=${encodeURIComponent(rates.local_currency_symbol)}`); toast.success(t('ratesUpdated')); } catch (e) { toast.error(t('saveFailed')); } finally { setSaving(false); } };
  const handleUpdateCategoryRate = async (categoryId, newRate) => { try { const cat = categories.find(c => c.id === categoryId); await axios.put(`${API}/categories/${categoryId}`, { ...cat, exchange_rate: newRate }); setCategories(categories.map(c => c.id === categoryId ? { ...c, exchange_rate: newRate } : c)); toast.success(t('updateSuccess')); } catch (e) { toast.error(t('saveFailed')); } };

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('exchangeRates')}</h1>
      <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white">{t('systemRates')}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><label className="text-sm text-slate-300">USD - Bolivares (VES)</label><Input type="number" value={rates.usd_to_ves} onChange={(e) => setRates({ ...rates, usd_to_ves: parseFloat(e.target.value) || 0 })} className="bg-slate-700 border-slate-600 text-white text-lg" step="0.01" /><p className="text-xs text-slate-500 mt-1">$1 USD = Bs.{rates.usd_to_ves}</p></div>
          <div><label className="text-sm text-slate-300">USD - Pesos Colombianos</label><Input type="number" value={rates.usd_to_cop} onChange={(e) => setRates({ ...rates, usd_to_cop: parseFloat(e.target.value) || 0 })} className="bg-slate-700 border-slate-600 text-white text-lg" /><p className="text-xs text-slate-500 mt-1">$1 USD = COP {rates.usd_to_cop}</p></div>
          <div><label className="text-sm text-slate-300">Simbolo Local</label><Input value={rates.local_currency_symbol} onChange={(e) => setRates({ ...rates, local_currency_symbol: e.target.value })} className="bg-slate-700 border-slate-600 text-white" placeholder="Bs." /></div>
        </div>
        <Button onClick={handleSaveRates} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving}>{saving ? t('saving') : t('saveRates')}</Button>
      </CardContent></Card>
      <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white">{t('categoryRates')}</CardTitle><p className="text-slate-400 text-sm">{t('categoryRateDesc')}</p></CardHeader><CardContent>
        <Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productCode')}</TableHead><TableHead className="text-slate-300">{t('category')}</TableHead><TableHead className="text-slate-300">{t('exchangeRates')}</TableHead><TableHead className="text-slate-300">{t('example')}</TableHead></TableRow></TableHeader>
          <TableBody>{categories.map(cat => (<TableRow key={cat.id} className="border-slate-700"><TableCell className="text-slate-400">{cat.code}</TableCell><TableCell className="text-white font-medium">{cat.name}</TableCell><TableCell><Input type="number" value={cat.exchange_rate || rates.usd_to_ves} onChange={(e) => handleUpdateCategoryRate(cat.id, parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600 w-32" step="0.01" /></TableCell><TableCell className="text-yellow-400">$10 - Bs.{((cat.exchange_rate || rates.usd_to_ves) * 10).toFixed(2)}</TableCell></TableRow>))}</TableBody>
        </Table>
      </CardContent></Card>
      <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white">{t('quickConverter')}</CardTitle></CardHeader><CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-slate-400 text-sm">$1 USD</p><p className="text-2xl font-bold text-emerald-400">=</p><p className="text-xl font-bold text-yellow-400">Bs.{rates.usd_to_ves}</p></div>
          <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-slate-400 text-sm">$10 USD</p><p className="text-2xl font-bold text-emerald-400">=</p><p className="text-xl font-bold text-yellow-400">Bs.{(rates.usd_to_ves * 10).toFixed(2)}</p></div>
          <div className="bg-slate-700/50 rounded-lg p-4"><p className="text-slate-400 text-sm">$100 USD</p><p className="text-2xl font-bold text-emerald-400">=</p><p className="text-xl font-bold text-yellow-400">Bs.{(rates.usd_to_ves * 100).toFixed(2)}</p></div>
        </div>
      </CardContent></Card>
    </div>
  );
}
