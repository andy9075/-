import React, { useState, useEffect } from "react";
import { Shield, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";

const ACTION_COLORS = {
  create: "bg-emerald-500/20 text-emerald-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  export: "bg-purple-500/20 text-purple-400",
  payment: "bg-yellow-500/20 text-yellow-400",
  points_add: "bg-cyan-500/20 text-cyan-400",
  points_redeem: "bg-orange-500/20 text-orange-400",
  balance_topup: "bg-emerald-500/20 text-emerald-400",
  backup: "bg-indigo-500/20 text-indigo-400",
};

export default function AuditLogPage() {
  const { t } = useLang();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterType, setFilterType] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (filterAction) params.action = filterAction;
      if (filterType) params.target_type = filterType;
      const res = await axios.get(`${API}/audit-logs`, { params });
      setLogs(res.data.items);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [page, filterAction, filterType]);

  return (
    <div className="space-y-6" data-testid="audit-log-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-400" /> {t('auditLog')}
        </h1>
        <div className="flex gap-2">
          <select value={filterAction} onChange={e => { setFilterAction(e.target.value); setPage(1); }} className="bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm" data-testid="audit-action-filter">
            <option value="">{t('all')} {t('action')}</option>
            <option value="create">{t('add')}</option>
            <option value="update">{t('edit')}</option>
            <option value="delete">{t('delete')}</option>
            <option value="export">{t('export')}</option>
            <option value="payment">{t('markPaid')}</option>
            <option value="backup">{t('dataBackup')}</option>
          </select>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className="bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2 text-sm" data-testid="audit-type-filter">
            <option value="">{t('all')} {t('targetType')}</option>
            <option value="product">{t('products')}</option>
            <option value="customer">{t('customer')}</option>
            <option value="promotion">{t('promotions')}</option>
            <option value="receivable">{t('receivable')}</option>
            <option value="payable">{t('payable')}</option>
            <option value="report">{t('reports')}</option>
            <option value="system">{t('systemSettings')}</option>
          </select>
        </div>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">{t('time')}</TableHead>
                <TableHead className="text-slate-300">{t('operator')}</TableHead>
                <TableHead className="text-slate-300">{t('action')}</TableHead>
                <TableHead className="text-slate-300">{t('targetType')}</TableHead>
                <TableHead className="text-slate-300">{t('detail')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log, idx) => (
                <TableRow key={idx} className="border-slate-700">
                  <TableCell className="text-slate-400 text-sm">{log.created_at?.substring(0, 19).replace('T', ' ')}</TableCell>
                  <TableCell className="text-white">{log.username}</TableCell>
                  <TableCell><Badge className={ACTION_COLORS[log.action] || "bg-slate-500/20 text-slate-400"}>{log.action}</Badge></TableCell>
                  <TableCell className="text-slate-300">{log.target_type}</TableCell>
                  <TableCell className="text-slate-400 text-sm max-w-[300px] truncate">{log.detail || '-'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > 30 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="border-slate-600 text-slate-300" data-testid="audit-prev-page">Prev</Button>
          <span className="text-slate-400 py-2 px-4">{page} / {Math.ceil(total / 30)}</span>
          <Button variant="outline" disabled={page >= Math.ceil(total / 30)} onClick={() => setPage(p => p + 1)} className="border-slate-600 text-slate-300" data-testid="audit-next-page">Next</Button>
        </div>
      )}
    </div>
  );
}
