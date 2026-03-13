import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function StockAlertsPage() {
  const { t } = useLang();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/stock-alerts`).then(r => setAlerts(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('stockAlerts')}</h1>
      {alerts.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700"><CardContent className="p-8 text-center text-slate-400"><Check className="w-12 h-12 mx-auto mb-3 text-emerald-400" /><p>{t('noData')}</p></CardContent></Card>
      ) : (
        <div className="space-y-3">{alerts.map((a, i) => (
          <Card key={i} className={`border ${a.level === 'critical' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <CardContent className="p-4 flex items-center justify-between"><div><p className="text-white font-medium">{a.product_name}</p><p className="text-slate-400 text-sm">{a.product_code}</p></div><div className="text-right"><p className={`text-lg font-bold ${a.level === 'critical' ? 'text-red-400' : 'text-yellow-400'}`}>{a.current_stock}</p><p className="text-slate-400 text-xs">min: {a.min_stock}</p></div></CardContent>
          </Card>
        ))}</div>
      )}
    </div>
  );
}
