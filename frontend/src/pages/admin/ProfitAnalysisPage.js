import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, DollarSign, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ProfitAnalysisPage() {
  const { t } = useLang();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await axios.get(`${API}/reports/profit-analysis`, { params });
      setData(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  const chartData = (data?.items || []).slice(0, 10).map(item => ({
    name: item.product_name?.substring(0, 8) || '?',
    profit: item.profit,
    revenue: item.revenue,
    cost: item.cost,
  }));

  return (
    <div className="space-y-6" data-testid="profit-analysis-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white">{t('profitAnalysis')}</h1>
        <div className="flex gap-2 items-center">
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" data-testid="profit-start-date" />
          <span className="text-slate-400">-</span>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-40" data-testid="profit-end-date" />
          <Button onClick={fetchData} className="bg-emerald-500 hover:bg-emerald-600" data-testid="profit-filter-btn">{t('search')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-blue-300 text-sm">{t('totalRevenue')}</p>
            <p className="text-2xl font-bold text-white mt-1" data-testid="total-revenue">${data?.total_revenue?.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <p className="text-orange-300 text-sm">{t('totalCost')}</p>
            <p className="text-2xl font-bold text-white mt-1" data-testid="total-cost">${data?.total_cost?.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6">
            <p className="text-emerald-300 text-sm">{t('totalProfit')}</p>
            <p className="text-2xl font-bold text-white mt-1" data-testid="total-profit">${data?.total_profit?.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-purple-300 text-sm">{t('overallMargin')}</p>
            <p className="text-2xl font-bold text-white mt-1" data-testid="overall-margin">{data?.overall_margin}%</p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('profit')} TOP 10</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v) => `$${v.toFixed(2)}`} />
                <Bar dataKey="profit" name={t('profit')} radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, idx) => <Cell key={idx} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('profitAnalysis')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">#</TableHead>
                <TableHead className="text-slate-300">{t('productCode')}</TableHead>
                <TableHead className="text-slate-300">{t('productName')}</TableHead>
                <TableHead className="text-slate-300">{t('quantity')}</TableHead>
                <TableHead className="text-slate-300">{t('revenue')}</TableHead>
                <TableHead className="text-slate-300">{t('cost')}</TableHead>
                <TableHead className="text-slate-300">{t('profit')}</TableHead>
                <TableHead className="text-slate-300">{t('profitMargin')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.items || []).map((item, idx) => (
                <TableRow key={idx} className="border-slate-700">
                  <TableCell className="text-slate-300">{idx + 1}</TableCell>
                  <TableCell className="text-slate-400">{item.product_code}</TableCell>
                  <TableCell className="text-white">{item.product_name}</TableCell>
                  <TableCell className="text-slate-300">{item.quantity}</TableCell>
                  <TableCell className="text-blue-400">${item.revenue.toFixed(2)}</TableCell>
                  <TableCell className="text-orange-400">${item.cost.toFixed(2)}</TableCell>
                  <TableCell className={item.profit >= 0 ? "text-emerald-400" : "text-red-400"}>${item.profit.toFixed(2)}</TableCell>
                  <TableCell className={item.margin >= 20 ? "text-emerald-400" : "text-yellow-400"}>{item.margin}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {(!data?.items || data.items.length === 0) && <p className="text-slate-400 text-center py-8">{t('noData')}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
