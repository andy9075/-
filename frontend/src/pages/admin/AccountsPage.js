import React, { useState, useEffect } from "react";
import { Plus, DollarSign, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function AccountsPage() {
  const { t } = useLang();
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("receivable");
  const [form, setForm] = useState({ party_name: "", amount: 0, due_date: "", notes: "", paid_amount: 0 });
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [payTarget, setPayTarget] = useState(null);
  const [payAmount, setPayAmount] = useState("");

  const fetchData = async () => {
    try {
      const [r, p] = await Promise.all([
        axios.get(`${API}/accounts/receivable`),
        axios.get(`${API}/accounts/payable`)
      ]);
      setReceivables(r.data);
      setPayables(p.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      await axios.post(`${API}/accounts/${formType}`, form);
      toast.success(t('addSuccess'));
      setShowForm(false); fetchData();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const handlePay = async () => {
    if (!payTarget || !payAmount) return;
    try {
      await axios.put(`${API}/accounts/${payTarget.id}/pay?amount=${parseFloat(payAmount)}`);
      toast.success(t('updateSuccess'));
      setShowPayDialog(false); setPayTarget(null); setPayAmount(""); fetchData();
    } catch (e) { toast.error(t('operationFailed')); }
  };

  const statusBadge = (s) => {
    const colors = { pending: "bg-yellow-500/20 text-yellow-400", partial: "bg-blue-500/20 text-blue-400", paid: "bg-emerald-500/20 text-emerald-400" };
    const labels = { pending: t('pending'), partial: t('partialPaid'), paid: t('paid') };
    return <Badge className={colors[s] || ""}>{labels[s] || s}</Badge>;
  };

  const summaryCard = (items, label, icon, color) => {
    const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
    const totalPaid = items.reduce((s, i) => s + (i.paid_amount || 0), 0);
    return (
      <Card className={`bg-gradient-to-br ${color}`}>
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm opacity-80">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">${totalAmount.toFixed(2)}</p>
            <p className="text-xs opacity-60 mt-1">{t('paidAmount')}: ${totalPaid.toFixed(2)}</p>
          </div>
          {icon}
        </CardContent>
      </Card>
    );
  };

  const renderTable = (items) => (
    <Table>
      <TableHeader>
        <TableRow className="border-slate-700">
          <TableHead className="text-slate-300">{t('creditor')}</TableHead>
          <TableHead className="text-slate-300">{t('amount')}</TableHead>
          <TableHead className="text-slate-300">{t('paidAmount')}</TableHead>
          <TableHead className="text-slate-300">{t('remainingAmount')}</TableHead>
          <TableHead className="text-slate-300">{t('dueDate')}</TableHead>
          <TableHead className="text-slate-300">{t('status')}</TableHead>
          <TableHead className="text-slate-300">{t('actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id} className="border-slate-700">
            <TableCell className="text-white">{item.party_name}</TableCell>
            <TableCell className="text-blue-400">${(item.amount || 0).toFixed(2)}</TableCell>
            <TableCell className="text-emerald-400">${(item.paid_amount || 0).toFixed(2)}</TableCell>
            <TableCell className="text-orange-400">${((item.amount || 0) - (item.paid_amount || 0)).toFixed(2)}</TableCell>
            <TableCell className="text-slate-400 text-sm">{item.due_date || '-'}</TableCell>
            <TableCell>{statusBadge(item.status)}</TableCell>
            <TableCell>
              {item.status !== 'paid' && (
                <Button size="sm" onClick={() => { setPayTarget(item); setPayAmount(""); setShowPayDialog(true); }} className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" data-testid={`pay-btn-${item.id}`}>
                  <DollarSign className="w-3 h-3 mr-1" /> {t('markPaid')}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && <TableRow><TableCell colSpan={7} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
      </TableBody>
    </Table>
  );

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6" data-testid="accounts-page">
      <h1 className="text-2xl font-bold text-white">{t('accountsReceivable')} / {t('accountsPayable')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryCard(receivables, t('accountsReceivable'), <ArrowDownLeft className="w-10 h-10 text-emerald-400" />, "from-emerald-500/20 to-emerald-600/20 border-emerald-500/30")}
        {summaryCard(payables, t('accountsPayable'), <ArrowUpRight className="w-10 h-10 text-red-400" />, "from-red-500/20 to-red-600/20 border-red-500/30")}
      </div>

      <Tabs defaultValue="receivable" className="w-full">
        <div className="flex justify-between items-center">
          <TabsList className="bg-slate-800">
            <TabsTrigger value="receivable" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400">{t('accountsReceivable')}</TabsTrigger>
            <TabsTrigger value="payable" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">{t('accountsPayable')}</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={() => { setFormType("receivable"); setForm({ party_name: "", amount: 0, due_date: "", notes: "", paid_amount: 0 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-receivable-btn">
              <Plus className="w-4 h-4 mr-1" /> {t('addReceivable')}
            </Button>
            <Button onClick={() => { setFormType("payable"); setForm({ party_name: "", amount: 0, due_date: "", notes: "", paid_amount: 0 }); setShowForm(true); }} className="bg-red-500 hover:bg-red-600" data-testid="add-payable-btn">
              <Plus className="w-4 h-4 mr-1" /> {t('addPayable')}
            </Button>
          </div>
        </div>
        <TabsContent value="receivable">
          <Card className="bg-slate-800 border-slate-700"><CardContent className="p-0">{renderTable(receivables)}</CardContent></Card>
        </TabsContent>
        <TabsContent value="payable">
          <Card className="bg-slate-800 border-slate-700"><CardContent className="p-0">{renderTable(payables)}</CardContent></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{formType === 'receivable' ? t('addReceivable') : t('addPayable')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder={t('creditor')} value={form.party_name} onChange={e => setForm({...form, party_name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="account-party-input" />
            <Input type="number" placeholder={t('amount')} value={form.amount} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" data-testid="account-amount-input" />
            <Input type="date" placeholder={t('dueDate')} value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="account-due-date" />
            <Input placeholder={t('notes')} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="bg-slate-700 border-slate-600" />
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSubmit} className="flex-1 bg-emerald-500 hover:bg-emerald-600" data-testid="account-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600 text-slate-300">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>{t('markPaid')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-slate-300">{payTarget?.party_name} - {t('remainingAmount')}: <span className="text-orange-400">${((payTarget?.amount || 0) - (payTarget?.paid_amount || 0)).toFixed(2)}</span></p>
            <Input type="number" placeholder={t('amount')} value={payAmount} onChange={e => setPayAmount(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="pay-amount-input" />
            <div className="flex gap-2">
              <Button onClick={handlePay} className="flex-1 bg-emerald-500 hover:bg-emerald-600" data-testid="pay-confirm-btn">{t('confirm')}</Button>
              <Button onClick={() => setShowPayDialog(false)} variant="outline" className="flex-1 border-slate-600 text-slate-300">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
