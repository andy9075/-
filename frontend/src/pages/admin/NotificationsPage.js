import React, { useState, useEffect } from "react";
import { Bell, AlertTriangle, Clock, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

const SEVERITY_STYLES = {
  error: { bg: "bg-red-500/10 border-red-500/30", icon: <AlertTriangle className="w-5 h-5 text-red-400" />, badge: "bg-red-500/20 text-red-400" },
  warning: { bg: "bg-yellow-500/10 border-yellow-500/30", icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />, badge: "bg-yellow-500/20 text-yellow-400" },
  info: { bg: "bg-blue-500/10 border-blue-500/30", icon: <ShoppingBag className="w-5 h-5 text-blue-400" />, badge: "bg-blue-500/20 text-blue-400" },
};

export default function NotificationsPage() {
  const { t } = useLang();
  const [data, setData] = useState({ count: 0, items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/notifications`).then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-400" /> {t('notifications')}
          {data.count > 0 && <Badge className="bg-red-500 text-white ml-2">{data.count}</Badge>}
        </h1>
      </div>

      {data.items.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">{t('noData')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((notif, idx) => {
            const style = SEVERITY_STYLES[notif.severity] || SEVERITY_STYLES.info;
            return (
              <Card key={idx} className={`${style.bg} border`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {style.icon}
                  <div className="flex-1">
                    <p className="text-white font-medium">{notif.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{notif.detail}</p>
                  </div>
                  <Badge className={style.badge}>
                    {notif.type === 'stock_low' ? t('stockLow') : notif.type === 'overdue_account' ? t('overdueAccount') : t('pendingOrdersNotif')}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
