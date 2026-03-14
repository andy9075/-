import React, { useState, useEffect } from "react";
import { DollarSign, Award, TrendingUp, Edit2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const TIER_COLORS = { base: "bg-slate-500/20 text-slate-400", standard: "bg-blue-500/20 text-blue-400", excellent: "bg-emerald-500/20 text-emerald-400" };
const BAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function CommissionPage() {
  const { t } = useLang();
  const [report, setReport] = useState(null);
  const [rules, setRules] = useState({ tiers: [] });
  const [editingRules, setEditingRules] = useState(false);
  const [month, setMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rep, rul] = await Promise.all([
        axios.get(`${API}/reports/commission`, { params: { month } }),
        axios.get(`${API}/settings/commission-rules`)
      ]);
      setReport(rep.data);
      setRules(rul.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [month]);

  const saveRules = async () => {
    try {
      await axios.put(`${API}/settings/commission-rules`, rules);
      toast.success(t('updateSuccess'));
      setEditingRules(false);
      fetchData();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const updateTier = (idx, field, value) => {
    const newTiers = [...rules.tiers];
    newTiers[idx] = { ...newTiers[idx], [field]: field === 'name' ? value : parseFloat(value) || 0 };
    setRules({ ...rules, tiers: newTiers });
  };

  if (loading) return <div className="text-white">{t('loading')}</div>;

  const chartData = (report?.employees || []).filter(e => e.sales > 0).slice(0, 10).map(e => ({
    name: e.employee_name?.substring(0, 6),
    commission: e.commission,
    sales: e.sales,
  }));

  return (
    <div className="space-y-6" data-testid="commission-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-emerald-400" /> {t('commissionReport')}
        </h1>
        <div className="flex items-center gap-2">
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="bg-slate-700 border-slate-600 text-white w-44" data-testid="commission-month-input" />
        </div>
      </div>

      {/* Commission Rules Card - Editable */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-base">{t('commissionRules')}</CardTitle>
            {editingRules ? (
              <Button size="sm" onClick={saveRules} className="bg-emerald-500 hover:bg-emerald-600" data-testid="save-rules-btn">
                <Save className="w-4 h-4 mr-1" /> {t('save')}
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditingRules(true)} className="border-slate-600 text-slate-300" data-testid="edit-rules-btn">
                <Edit2 className="w-4 h-4 mr-1" /> {t('edit')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(rules.tiers || []).map((tier, idx) => (
              <div key={idx} className={`rounded-lg p-4 border ${idx === 0 ? 'bg-slate-700/30 border-slate-600' : idx === 1 ? 'bg-blue-500/5 border-blue-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                {editingRules ? (
                  <div className="space-y-2">
                    <Input value={tier.name} onChange={e => updateTier(idx, 'name', e.target.value)} className="bg-slate-700 border-slate-600 text-sm" placeholder="Tier name" />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs whitespace-nowrap">{t('progress')} &ge;</span>
                      <Input type="number" value={tier.min_progress} onChange={e => updateTier(idx, 'min_progress', e.target.value)} className="bg-slate-700 border-slate-600 w-20 text-sm" data-testid={`tier-${idx}-progress`} />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs whitespace-nowrap">{t('commissionRate')}</span>
                      <Input type="number" value={tier.rate} onChange={e => updateTier(idx, 'rate', e.target.value)} className="bg-slate-700 border-slate-600 w-20 text-sm" data-testid={`tier-${idx}-rate`} />
                      <span className="text-slate-400 text-xs">%</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-white font-medium capitalize">{tier.name === 'base' ? t('baseTier') : tier.name === 'standard' ? t('standardTier') : tier.name === 'excellent' ? t('excellentTier') : tier.name}</p>
                    <p className="text-slate-400 text-sm mt-1">{t('progress')} &ge; {tier.min_progress}%</p>
                    <p className="text-3xl font-bold mt-2" style={{ color: idx === 0 ? '#94a3b8' : idx === 1 ? '#3b82f6' : '#10b981' }}>{tier.rate}%</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6">
            <p className="text-emerald-300 text-sm">{t('totalCommission')}</p>
            <p className="text-3xl font-bold text-white mt-1" data-testid="total-commission">${report?.total_commission?.toFixed(2)}</p>
            <p className="text-emerald-400 text-xs mt-1">{month}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6">
            <p className="text-blue-300 text-sm">{t('employees')}</p>
            <p className="text-3xl font-bold text-white mt-1">{(report?.employees || []).filter(e => e.sales > 0).length}</p>
            <p className="text-blue-400 text-xs mt-1">{t('present')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6">
            <p className="text-purple-300 text-sm">{t('totalRevenue')}</p>
            <p className="text-3xl font-bold text-white mt-1">${(report?.employees || []).reduce((s, e) => s + e.sales, 0).toFixed(2)}</p>
            <p className="text-purple-400 text-xs mt-1">{month}</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Chart */}
      {chartData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white">{t('commission')} TOP 10</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} formatter={(v) => `$${Number(v).toFixed(2)}`} />
                <Bar dataKey="commission" name={t('commission')} radius={[6, 6, 0, 0]}>
                  {chartData.map((_, idx) => <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detail Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader><CardTitle className="text-white">{t('commissionReport')} - {month}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">#</TableHead>
                <TableHead className="text-slate-300">{t('employees')}</TableHead>
                <TableHead className="text-slate-300">{t('role')}</TableHead>
                <TableHead className="text-slate-300">{t('salesAmount')}</TableHead>
                <TableHead className="text-slate-300">{t('salesTarget')}</TableHead>
                <TableHead className="text-slate-300">{t('progress')}</TableHead>
                <TableHead className="text-slate-300">{t('tier')}</TableHead>
                <TableHead className="text-slate-300">{t('commissionRate')}</TableHead>
                <TableHead className="text-slate-300">{t('commission')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report?.employees || []).map((emp, idx) => (
                <TableRow key={idx} className="border-slate-700">
                  <TableCell className="text-slate-400">{idx + 1}</TableCell>
                  <TableCell className="text-white font-medium">{emp.employee_name}</TableCell>
                  <TableCell><Badge className="bg-slate-600">{emp.role}</Badge></TableCell>
                  <TableCell className="text-blue-400">${emp.sales.toFixed(2)}</TableCell>
                  <TableCell className="text-slate-300">{emp.target > 0 ? `$${emp.target.toFixed(2)}` : '-'}</TableCell>
                  <TableCell className={emp.progress >= 100 ? "text-emerald-400" : emp.progress >= 60 ? "text-blue-400" : "text-yellow-400"}>{emp.progress}%</TableCell>
                  <TableCell><Badge className={TIER_COLORS[emp.tier] || "bg-slate-500/20 text-slate-400"}>{emp.tier === 'base' ? t('baseTier') : emp.tier === 'standard' ? t('standardTier') : emp.tier === 'excellent' ? t('excellentTier') : emp.tier || '-'}</Badge></TableCell>
                  <TableCell className="text-purple-400">{emp.rate}%</TableCell>
                  <TableCell className="text-emerald-400 font-bold">${emp.commission.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {(!report?.employees || report.employees.length === 0) && <TableRow><TableCell colSpan={9} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
