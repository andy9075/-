import React, { useState, useEffect } from "react";
import { Calendar, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function DailySettlementPage() {
  const { t } = useLang();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { axios.get(`${API}/stores`).then(r => setStores(r.data)).catch(() => {}); }, []);
  useEffect(() => { fetchReport(); }, [date, storeId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { date };
      if (storeId) params.store_id = storeId;
      const res = await axios.get(`${API}/reports/daily-settlement`, { params });
      setReport(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const payMethodLabel = (m) => {
    const labels = { cash: t('cash'), card: t('card'), transfer: 'Transfer', biopago: 'Biopago' };
    return labels[m] || m;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">{t('dailySettlement')}</h1><p className="text-slate-400 text-sm">Z-Report</p></div>
        <Button onClick={() => window.print()} className="bg-blue-500 hover:bg-blue-600 print:hidden" data-testid="print-settlement"><Printer className="w-4 h-4 mr-2" /> {t('printReport')}</Button>
      </div>

      <div className="flex gap-4 items-end print:hidden">
        <div><label className="text-sm text-slate-300 block mb-1">{t('date')}</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-44" data-testid="settlement-date" /></div>
        <div><label className="text-sm text-slate-300 block mb-1">{t('storeManagement')}</label><Select value={storeId || "all"} onValueChange={v => setStoreId(v === "all" ? "" : v)}><SelectTrigger className="bg-slate-800 border-slate-700 w-48" data-testid="settlement-store"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t('all')}</SelectItem>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
      </div>

      {report && (
        <div className="space-y-6">
          <div className="text-center print:block hidden"><h2 className="text-xl font-bold">Z-Report - {report.date}</h2></div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-emerald-500/10 border-emerald-500/30"><CardContent className="p-5 text-center"><p className="text-emerald-400 text-sm">{t('totalSales')}</p><p className="text-3xl font-bold text-white mt-1">${report.total_sales?.toFixed(2)}</p><p className="text-emerald-400 text-xs">{report.total_orders} {t('items')}</p></CardContent></Card>
            <Card className="bg-red-500/10 border-red-500/30"><CardContent className="p-5 text-center"><p className="text-red-400 text-sm">{t('refund')}</p><p className="text-3xl font-bold text-white mt-1">-${report.total_refunds?.toFixed(2)}</p><p className="text-red-400 text-xs">{report.refund_count} {t('items')}</p></CardContent></Card>
            <Card className="bg-blue-500/10 border-blue-500/30"><CardContent className="p-5 text-center"><p className="text-blue-400 text-sm">{t('costPrice')}</p><p className="text-3xl font-bold text-white mt-1">${report.total_cost?.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-yellow-500/10 border-yellow-500/30"><CardContent className="p-5 text-center"><p className="text-yellow-400 text-sm">{t('grossProfit')}</p><p className={`text-3xl font-bold mt-1 ${report.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${report.gross_profit?.toFixed(2)}</p><p className="text-yellow-400 text-xs">{report.total_sales > 0 ? ((report.gross_profit / report.total_sales) * 100).toFixed(1) : 0}%</p></CardContent></Card>
          </div>

          {/* By payment method */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle className="text-white">{t('paymentMethod')}</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('paymentMethod')}</TableHead><TableHead className="text-right text-slate-300">{t('quantity')}</TableHead><TableHead className="text-right text-slate-300">{t('amount')}</TableHead><TableHead className="text-right text-slate-300">%</TableHead></TableRow></TableHeader>
                <TableBody>
                  {Object.entries(report.by_payment_method || {}).map(([method, data]) => (
                    <TableRow key={method} className="border-slate-700">
                      <TableCell className="text-white font-medium">{payMethodLabel(method)}</TableCell>
                      <TableCell className="text-right text-slate-300">{data.count}</TableCell>
                      <TableCell className="text-right text-emerald-400 font-bold">${data.amount?.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-slate-400">{report.total_sales > 0 ? ((data.amount / report.total_sales) * 100).toFixed(1) : 0}%</TableCell>
                    </TableRow>
                  ))}
                  {Object.keys(report.by_payment_method || {}).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-slate-400 py-8">{t('noData')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Net total */}
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex justify-between items-center text-lg">
                <span className="text-slate-300">{t('totalSales')}:</span><span className="text-white font-bold">${report.total_sales?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg text-red-400">
                <span>- {t('refund')}:</span><span>-${report.total_refunds?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-lg text-blue-400">
                <span>- {t('costPrice')}:</span><span>-${report.total_cost?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-2xl font-bold pt-4 mt-4 border-t border-slate-700">
                <span className="text-white">{t('grossProfit')}:</span>
                <span className={report.gross_profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>${report.gross_profit?.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
