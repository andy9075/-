import React, { useState, useEffect } from "react";
import { Search, Printer, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function SalesReportPage() {
  const { t } = useLang();
  const [stores, setStores] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ store_id: "", start_date: "", end_date: "" });

  useEffect(() => { axios.get(`${API}/stores`).then(r => setStores(r.data)).catch(() => {}); }, []);

  const generateReport = async () => { setLoading(true); try { const params = {}; if (filters.store_id) params.store_id = filters.store_id; if (filters.start_date) params.start_date = filters.start_date; if (filters.end_date) params.end_date = filters.end_date; const res = await axios.get(`${API}/sales-report`, { params }); setReport(res.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error("Failed to load report"); } finally { setLoading(false); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('salesReportTitle')}</h1>
        {report && <Button onClick={() => window.print()} className="bg-blue-500 hover:bg-blue-600" data-testid="print-report-btn"><Printer className="w-4 h-4 mr-2" /> {t('printReport')}</Button>}
      </div>
      <Card className="bg-slate-800 border-slate-700 print:hidden">
        <CardContent className="pt-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div><label className="text-sm text-slate-300 block mb-1">{t('storeFilter')}</label><Select value={filters.store_id} onValueChange={(v) => setFilters({...filters, store_id: v === "all" ? "" : v})}><SelectTrigger className="bg-slate-700 border-slate-600 w-48" data-testid="report-store-filter"><SelectValue placeholder={t('all')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('all')}</SelectItem>{stores.map(s => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}</SelectContent></Select></div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('dateFrom')}</label><Input type="date" value={filters.start_date} onChange={(e) => setFilters({...filters, start_date: e.target.value})} className="bg-slate-700 border-slate-600 w-44" data-testid="report-date-from" /></div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('dateTo')}</label><Input type="date" value={filters.end_date} onChange={(e) => setFilters({...filters, end_date: e.target.value})} className="bg-slate-700 border-slate-600 w-44" data-testid="report-date-to" /></div>
            <Button onClick={generateReport} className="bg-emerald-500 hover:bg-emerald-600" disabled={loading} data-testid="generate-report-btn"><Search className="w-4 h-4 mr-2" /> {t('generateReport')}</Button>
          </div>
        </CardContent>
      </Card>
      {report && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30"><CardContent className="pt-4 text-center"><p className="text-emerald-400 text-sm">{t('totalSales')}</p><p className="text-3xl font-bold text-white">${report.total_sales.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-500/10 border-blue-500/30"><CardContent className="pt-4 text-center"><p className="text-blue-400 text-sm">{t('totalOrders')}</p><p className="text-3xl font-bold text-white">{report.total_orders}</p></CardContent></Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30"><CardContent className="pt-4 text-center"><p className="text-yellow-400 text-sm">{t('totalItems')}</p><p className="text-3xl font-bold text-white">{report.total_items}</p></CardContent></Card>
          </div>
          {report.stores.map(store => (
            <Card key={store.store_id} className="bg-slate-800 border-slate-700">
              <CardHeader><CardTitle className="text-white flex justify-between"><span>{store.name}</span><span className="text-emerald-400">${store.total.toFixed(2)} ({store.orders} {t('items')})</span></CardTitle></CardHeader>
              <CardContent><Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productCode')}</TableHead><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-right text-slate-300">{t('soldQuantity')}</TableHead><TableHead className="text-right text-slate-300">{t('salesAmount')}</TableHead></TableRow></TableHeader><TableBody>{store.products.map((p, i) => (<TableRow key={i} className="border-slate-700"><TableCell className="text-slate-400">{p.code}</TableCell><TableCell className="text-white">{p.name}</TableCell><TableCell className="text-right text-blue-400 font-medium">{p.quantity}</TableCell><TableCell className="text-right text-emerald-400 font-bold">${p.amount.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
