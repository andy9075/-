import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, Warehouse, Globe, BarChart3, DollarSign, AlertCircle, TrendingUp } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function Dashboard() {
  const { t } = useLang();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [trendDays, setTrendDays] = useState(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/dashboard/stats`),
      axios.get(`${API}/dashboard/trends?days=${trendDays}`)
    ]).then(([s, tr]) => { setStats(s.data); setTrends(tr.data); })
    .catch(console.error).finally(() => setLoading(false));
  }, [trendDays]);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-300 text-sm">{t('todaySales')}</p>
                <p className="text-2xl font-bold text-white mt-1" data-testid="today-sales">${stats?.today_sales_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-emerald-400 text-xs mt-1">{stats?.today_sales_count || 0} {t('items')}</p>
              </div>
              <DollarSign className="w-12 h-12 text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300 text-sm">{t('onlineOrderTotal')}</p>
                <p className="text-2xl font-bold text-white mt-1">${stats?.today_online_amount?.toFixed(2) || '0.00'}</p>
                <p className="text-blue-400 text-xs mt-1">{stats?.today_online_count || 0} {t('items')}</p>
              </div>
              <Globe className="w-12 h-12 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300 text-sm">{t('totalProducts')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.products_count || 0}</p>
                <p className="text-purple-400 text-xs mt-1">{t('active')}</p>
              </div>
              <Package className="w-12 h-12 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-300 text-sm">{t('pendingOrders')}</p>
                <p className="text-2xl font-bold text-white mt-1">{stats?.pending_online_orders || 0}</p>
                <p className="text-orange-400 text-xs mt-1">{t('onlineOrders')}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Trend Chart */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> {t('salesTrend')}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant={trendDays === 7 ? "default" : "ghost"} onClick={() => setTrendDays(7)} className={trendDays === 7 ? "bg-emerald-500" : "text-slate-400"} data-testid="trend-7d">{t('last7Days')}</Button>
              <Button size="sm" variant={trendDays === 30 ? "default" : "ghost"} onClick={() => setTrendDays(30)} className={trendDays === 30 ? "bg-emerald-500" : "text-slate-400"} data-testid="trend-30d">{t('last30Days')}</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => v?.substring(5)} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`$${Number(v).toFixed(2)}`, t('salesAmount')]} labelFormatter={v => v} />
              <Area type="monotone" dataKey="sales" stroke="#10b981" fill="url(#salesGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('quickActions')}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link to="/admin/products"><Button className="w-full bg-slate-700 hover:bg-slate-600 text-white"><Package className="w-4 h-4 mr-2" /> {t('productManagement')}</Button></Link>
            <Link to="/admin/online-orders"><Button className="w-full bg-slate-700 hover:bg-slate-600 text-white"><Globe className="w-4 h-4 mr-2" /> {t('onlineOrders')}</Button></Link>
            <Link to="/admin/warehouses"><Button className="w-full bg-slate-700 hover:bg-slate-600 text-white"><Warehouse className="w-4 h-4 mr-2" /> {t('warehouseManagement')}</Button></Link>
            <Link to="/admin/reports"><Button className="w-full bg-slate-700 hover:bg-slate-600 text-white"><BarChart3 className="w-4 h-4 mr-2" /> {t('reports')}</Button></Link>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('reports')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-slate-300"><span>{t('storeManagement')}</span><span className="text-white font-medium">{stats?.stores_count || 0}</span></div>
            <div className="flex justify-between text-slate-300"><span>{t('customerManagement')}</span><span className="text-white font-medium">{stats?.customers_count || 0}</span></div>
            <div className="flex justify-between text-slate-300"><span>{t('productManagement')}</span><span className="text-white font-medium">{stats?.products_count || 0}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
