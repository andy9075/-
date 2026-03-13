import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function ReportsPage() {
  const { t } = useLang();
  const [salesSummary, setSalesSummary] = useState(null);
  const [inventorySummary, setInventorySummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { Promise.all([axios.get(`${API}/reports/sales-summary`), axios.get(`${API}/reports/inventory-summary`), axios.get(`${API}/reports/top-products`)]).then(([s, i, tp]) => { setSalesSummary(s.data); setInventorySummary(i.data); setTopProducts(tp.data); }).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('reports')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('totalSales')}</p><p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_sales?.toFixed(2) || '0.00'}</p><p className="text-slate-500 text-xs mt-1">{salesSummary?.sales_count || 0} {t('items')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('onlineOrderTotal')}</p><p className="text-2xl font-bold text-white mt-1">${salesSummary?.total_online_sales?.toFixed(2) || '0.00'}</p><p className="text-slate-500 text-xs mt-1">{salesSummary?.online_count || 0} {t('items')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('inventoryQty')}</p><p className="text-2xl font-bold text-white mt-1">{inventorySummary?.total_quantity || 0}</p><p className="text-slate-500 text-xs mt-1">{inventorySummary?.total_items || 0} {t('products')}</p></CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-6"><p className="text-slate-400 text-sm">{t('totalAmount')}</p><p className="text-2xl font-bold text-white mt-1">${inventorySummary?.total_value?.toFixed(2) || '0.00'}</p><p className="text-red-400 text-xs mt-1">{inventorySummary?.low_stock_count || 0} {t('stockAlerts')}</p></CardContent></Card>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('topProducts')}</CardTitle></CardHeader>
        <CardContent><Table><TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">#</TableHead><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-slate-300">{t('soldQuantity')}</TableHead><TableHead className="text-slate-300">{t('salesAmount')}</TableHead></TableRow></TableHeader><TableBody>{topProducts.map((item, idx) => (<TableRow key={idx} className="border-slate-700"><TableCell className="text-slate-300">{idx + 1}</TableCell><TableCell className="text-white">{item.product?.name}</TableCell><TableCell className="text-slate-300">{item.quantity}</TableCell><TableCell className="text-emerald-400">${item.amount?.toFixed(2)}</TableCell></TableRow>))}</TableBody></Table></CardContent>
      </Card>
    </div>
  );
}
