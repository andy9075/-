import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function RefundsPage() {
  const { t } = useLang();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/refunds`).then(r => setRefunds(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('refundHistory')}</h1>
      {refunds.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700 p-8 text-center text-slate-400">{t('noData')}</Card>
      ) : (
        <Card className="bg-slate-800 border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('refund')} #</TableHead>
                <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
                <TableHead className="text-slate-300">{t('amount')}</TableHead>
                <TableHead className="text-slate-300">{t('status')}</TableHead>
                <TableHead className="text-slate-300">{t('date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refunds.map(r => (
                <TableRow key={r.id} className="border-slate-700">
                  <TableCell className="text-white font-mono">{r.refund_no}</TableCell>
                  <TableCell className="text-slate-300">{r.order_no}</TableCell>
                  <TableCell className="text-red-400 font-bold">${(r.refund_amount || 0).toFixed(2)}</TableCell>
                  <TableCell><Badge className={r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>{r.status || 'completed'}</Badge></TableCell>
                  <TableCell className="text-slate-400 text-sm">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
