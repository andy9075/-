import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function SalesPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/sales-orders`).then(r => setOrders(r.data)).catch(e => { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); }).finally(() => setLoading(false)); }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('salesManagement')}</h1>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('orderNo')}</TableHead><TableHead className="text-slate-300">{t('itemCount')}</TableHead><TableHead className="text-slate-300">{t('totalAmount')}</TableHead><TableHead className="text-slate-300">{t('paymentMethod')}</TableHead><TableHead className="text-slate-300">{t('status')}</TableHead><TableHead className="text-slate-300">{t('createTime')}</TableHead></TableRow></TableHeader>
          <TableBody>{orders.map((order) => (<TableRow key={order.id} className="border-slate-700"><TableCell className="text-white font-mono">{order.order_no}</TableCell><TableCell className="text-slate-300">{order.items?.length || 0}</TableCell><TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell><TableCell className="text-slate-300">{order.payment_method === 'cash' ? t('cash') : t('otherPayment')}</TableCell><TableCell><Badge className={order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>{order.status === 'completed' ? t('completedStatus') : t('pendingStatus')}</Badge></TableCell><TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell></TableRow>))}</TableBody>
        </Table>
      </Card>
    </div>
  );
}
