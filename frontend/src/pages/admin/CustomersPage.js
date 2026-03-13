import React, { useState, useEffect } from "react";
import { Plus, Search, Eye, Star, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 });
  const [showDetail, setShowDetail] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState({ orders: [], total_spent: 0, order_count: 0 });
  const [showPointsDialog, setShowPointsDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [pointsAction, setPointsAction] = useState("add");
  const [pointsAmount, setPointsAmount] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try { const res = await axios.get(`${API}/customers`, { params: { search: search || undefined } }); setCustomers(res.data); }
    catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    try { await axios.post(`${API}/customers`, formData); toast.success(t('addSuccess')); setShowForm(false); fetchCustomers(); }
    catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const viewDetail = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const res = await axios.get(`${API}/customers/${customer.id}/purchase-history`);
      setPurchaseHistory(res.data);
    } catch (e) { setPurchaseHistory({ orders: [], total_spent: 0, order_count: 0 }); }
    setShowDetail(true);
  };

  const handlePoints = async () => {
    if (!selectedCustomer || !pointsAmount) return;
    try {
      const endpoint = pointsAction === 'add' ? 'points/add' : 'points/redeem';
      const res = await axios.post(`${API}/customers/${selectedCustomer.id}/${endpoint}?amount=${parseInt(pointsAmount)}&reason=manual`);
      toast.success(t('updateSuccess'));
      setSelectedCustomer({ ...selectedCustomer, points: res.data.points });
      setShowPointsDialog(false); setPointsAmount(""); fetchCustomers();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const handleTopup = async () => {
    if (!selectedCustomer || !balanceAmount) return;
    try {
      const res = await axios.post(`${API}/customers/${selectedCustomer.id}/balance/topup?amount=${parseFloat(balanceAmount)}&reason=manual`);
      toast.success(t('updateSuccess'));
      setSelectedCustomer({ ...selectedCustomer, balance: res.data.balance });
      setShowBalanceDialog(false); setBalanceAmount(""); fetchCustomers();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  return (
    <div className="space-y-6" data-testid="customers-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('customerManagement')}</h1>
        <Button onClick={() => { setFormData({ code: "", name: "", phone: "", email: "", address: "", member_level: "normal", points: 0, balance: 0 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-customer-btn"><Plus className="w-4 h-4 mr-2" /> {t('addCustomer')}</Button>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder={t('searchCustomerPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()} className="pl-10 bg-slate-800 border-slate-700 text-white" data-testid="customer-search-input" /></div>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('customerCode')}</TableHead>
              <TableHead className="text-slate-300">{t('customerName')}</TableHead>
              <TableHead className="text-slate-300">{t('phone')}</TableHead>
              <TableHead className="text-slate-300">{t('memberLevel')}</TableHead>
              <TableHead className="text-slate-300">{t('points')}</TableHead>
              <TableHead className="text-slate-300">{t('balance')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((c) => (
              <TableRow key={c.id} className="border-slate-700">
                <TableCell className="text-slate-300">{c.code}</TableCell>
                <TableCell className="text-white font-medium">{c.name}</TableCell>
                <TableCell className="text-slate-300">{c.phone || '-'}</TableCell>
                <TableCell><Badge variant={c.member_level === 'vip' ? 'default' : 'secondary'}>{c.member_level === 'vip' ? t('vip') : t('normal')}</Badge></TableCell>
                <TableCell className="text-purple-400">{c.points}</TableCell>
                <TableCell className="text-emerald-400">${c.balance?.toFixed(2)}</TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost" onClick={() => viewDetail(c)} className="text-blue-400 hover:text-blue-300" data-testid={`view-customer-${c.code}`}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Add Customer Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('addCustomer')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('customerCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="customer-code-input" /></div><div><label className="text-sm text-slate-300">{t('customerName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="customer-name-input" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><label className="text-sm text-slate-300">{t('phone')}</label><Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div><div><label className="text-sm text-slate-300">{t('email')}</label><Input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="bg-slate-700 border-slate-600" /></div></div>
            <div><label className="text-sm text-slate-300">{t('address')}</label><Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button><Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="customer-submit-btn">{t('save')}</Button></div>
        </DialogContent>
      </Dialog>

      {/* Customer Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedCustomer?.name} - {t('detail')}</DialogTitle></DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-xs">{t('totalSpent')}</p>
                    <p className="text-xl font-bold text-emerald-400" data-testid="customer-total-spent">${purchaseHistory.total_spent.toFixed(2)}</p>
                    <p className="text-slate-500 text-xs">{purchaseHistory.order_count} {t('orderCount')}</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-xs">{t('points')}</p>
                    <p className="text-xl font-bold text-purple-400" data-testid="customer-points">{selectedCustomer.points}</p>
                    <div className="flex gap-1 mt-1 justify-center">
                      <Button size="sm" onClick={() => { setPointsAction("add"); setPointsAmount(""); setShowPointsDialog(true); }} className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs h-6 px-2" data-testid="add-points-btn">+ {t('addPoints')}</Button>
                      <Button size="sm" onClick={() => { setPointsAction("redeem"); setPointsAmount(""); setShowPointsDialog(true); }} className="bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs h-6 px-2" data-testid="redeem-points-btn">{t('redeemPoints')}</Button>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/50 border-slate-600">
                  <CardContent className="p-4 text-center">
                    <p className="text-slate-400 text-xs">{t('balance')}</p>
                    <p className="text-xl font-bold text-blue-400" data-testid="customer-balance">${selectedCustomer.balance?.toFixed(2)}</p>
                    <Button size="sm" onClick={() => { setBalanceAmount(""); setShowBalanceDialog(true); }} className="bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs h-6 px-2 mt-1" data-testid="topup-balance-btn">+ {t('topupBalance')}</Button>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">{t('purchaseHistory')}</h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
                      <TableHead className="text-slate-300">{t('date')}</TableHead>
                      <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
                      <TableHead className="text-slate-300">{t('paymentMethod')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseHistory.orders.map((o, idx) => (
                      <TableRow key={idx} className="border-slate-700">
                        <TableCell className="text-slate-300 text-sm">{o.order_no}</TableCell>
                        <TableCell className="text-slate-400 text-sm">{o.created_at?.substring(0, 10)}</TableCell>
                        <TableCell className="text-emerald-400">${o.total_amount?.toFixed(2)}</TableCell>
                        <TableCell><Badge className="bg-slate-600">{o.payment_method}</Badge></TableCell>
                      </TableRow>
                    ))}
                    {purchaseHistory.orders.length === 0 && <TableRow><TableCell colSpan={4} className="text-slate-500 text-center py-4">{t('noData')}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Points Dialog */}
      <Dialog open={showPointsDialog} onOpenChange={setShowPointsDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>{pointsAction === 'add' ? t('addPoints') : t('redeemPoints')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-slate-300">{t('points')}: <span className="text-purple-400 font-bold">{selectedCustomer?.points}</span></p>
            <Input type="number" placeholder={t('quantity')} value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="points-amount-input" />
            <div className="flex gap-2">
              <Button onClick={handlePoints} className="flex-1 bg-purple-500 hover:bg-purple-600" data-testid="points-confirm-btn">{t('confirm')}</Button>
              <Button onClick={() => setShowPointsDialog(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader><DialogTitle>{t('topupBalance')}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-slate-300">{t('balance')}: <span className="text-blue-400 font-bold">${selectedCustomer?.balance?.toFixed(2)}</span></p>
            <Input type="number" placeholder={t('amount')} value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} className="bg-slate-700 border-slate-600" data-testid="balance-amount-input" />
            <div className="flex gap-2">
              <Button onClick={handleTopup} className="flex-1 bg-blue-500 hover:bg-blue-600" data-testid="balance-confirm-btn">{t('confirm')}</Button>
              <Button onClick={() => setShowBalanceDialog(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
