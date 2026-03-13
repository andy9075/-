import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function ReportsPage() {
  const { t } = useLang();
  const [salesSummary, setSalesSummary] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/reports/sales-summary`),
      axios.get(`${API}/reports/inventory-summary`),
      axios.get(`${API}/reports/top-products`)
    ]).then(([s, i, tp]) => {
      setSalesSummary(s.data);
      setInventorySummary(i.data);
      setTopProducts(tp.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  // Prepare chart data
  const topProductsChart = topProducts.slice(0, 8).map(item => ({
    name: item.product?.name?.substring(0, 10) || '?',
    quantity: item.quantity || 0,
    amount: item.amount || 0
  }));

  const paymentMethodData = salesSummary?.by_payment_method
    ? Object.entries(salesSummary.by_payment_method).map(([key, val]) => ({
        name: key === 'cash' ? t('cash') : key === 'card' ? t('card') : key,
        value: val.amount || val || 0
      }))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('reports')}</h1>

      {/* Export Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => { const a = document.createElement('a'); a.href = `${API}/reports/export/sales`; a.download = 'sales_report.xlsx'; document.body.appendChild(a); a.click(); a.remove(); toast.success(t('exporting')); }} className="bg-blue-500 hover:bg-blue-600" data-testid="export-sales-btn">
          <Download className="w-4 h-4 mr-2" /> {t('exportSalesReport')}
        </Button>
        <Button onClick={() => { const a = document.createElement('a'); a.href = `${API}/reports/export/inventory`; a.download = 'inventory_report.xlsx'; document.body.appendChild(a); a.click(); a.remove(); toast.success(t('exporting')); }} className="bg-purple-500 hover:bg-purple-600" data-testid="export-inventory-btn">
          <Download className="w-4 h-4 mr-2" /> {t('exportInventoryReport')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('totalSales')}</p><p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_sales?.toFixed(2) || '0.00'}</p><p className="text-slate-500 text-xs mt-1">{salesSummary?.sales_count || 0} {t('items')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('onlineOrderTotal')}</p><p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_online_sales?.toFixed(2) || '0.00'}</p><p className="text-slate-500 text-xs mt-1">{salesSummary?.online_count || 0} {t('items')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('inventoryQty')}</p><p className="text-2xl font-bold text-white mt-1">{inventorySummary?.total_quantity || 0}</p><p className="text-slate-500 text-xs mt-1">{inventorySummary?.total_items || 0} {t('products')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('totalAmount')}</p><p className="text-2xl font-bold text-white mt-1">${inventorySummary?.total_value?.toFixed(2) || '0.00'}</p><p className="text-red-400 text-xs mt-1">{inventorySummary?.low_stock_count || 0} {t('stockAlerts')}</p></CardContent></Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('topProducts')} - {t('salesAmount')}</CardTitle></CardHeader>
          <CardContent>
            {topProductsChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProductsChart} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(value) => [`$${value.toFixed(2)}`, t('amount')]} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                    {topProductsChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center py-12">{t('noData')}</p>}
          </CardContent>
        </Card>

        {/* Payment Methods Pie Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('paymentMethod')}</CardTitle></CardHeader>
          <CardContent>
            {paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={paymentMethodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentMethodData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(value) => `$${value.toFixed(2)}`} />
                  <Legend wrapperStyle={{ color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-400 text-center py-12">{t('noData')}</p>}
          </CardContent>
        </Card>
      </div>

      {/* Top Products Quantity Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('topProducts')} - {t('soldQuantity')}</CardTitle></CardHeader>
        <CardContent>
          {topProductsChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topProductsChart} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={75} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} />
                <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-400 text-center py-12">{t('noData')}</p>}
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('topProducts')}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">#</TableHead><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-slate-300">{t('soldQuantity')}</TableHead><TableHead className="text-slate-300">{t('salesAmount')}</TableHead></TableRow></TableHeader>
            <TableBody>{topProducts.map((item, idx) => (
              <TableRow key={idx} className="border-slate-700">
                <TableCell className="text-slate-300">{idx + 1}</TableCell>
                <TableCell className="text-white">{item.product?.name}</TableCell>
                <TableCell className="text-slate-300">{item.quantity}</TableCell>
                <TableCell className="text-emerald-400">${item.amount?.toFixed(2)}</TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
