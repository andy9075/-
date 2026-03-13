import React, { useState, useEffect, useRef } from "react";
import { Printer, Eye, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { InvoicePrint } from "@/components/InvoicePrint";
import { ReceiptPrint } from "@/components/ReceiptPrint";
import { toast } from "sonner";

export default function SalesPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 1, local_currency_symbol: 'Bs.' });
  const [settings, setSettings] = useState({});
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const receiptRef = useRef(null);
  const invoiceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/sales-orders`),
      axios.get(`${API}/exchange-rates`),
      axios.get(`${API}/settings/system`).catch(() => ({ data: {} }))
    ]).then(([o, r, s]) => { setOrders(o.data); setExchangeRates(r.data); setSettings(s.data); })
      .catch(e => { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); })
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = orders.filter(o => {
    if (search && !o.order_no?.toLowerCase().includes(search.toLowerCase())) return false;
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });

  const handlePrintReceipt = (order) => {
    setSelectedOrder(order);
    setTimeout(() => { if (receiptRef.current) { receiptRef.current.style.display = 'block'; window.print(); receiptRef.current.style.display = 'none'; } }, 100);
  };
  const handlePrintInvoice = (order) => {
    setSelectedOrder(order);
    setTimeout(() => { if (invoiceRef.current) { invoiceRef.current.style.display = 'block'; window.print(); invoiceRef.current.style.display = 'none'; } }, 100);
  };
  const viewDetail = (order) => { setSelectedOrder(order); setShowDetail(true); };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('salesManagement')}</h1>
      <div className="flex gap-4 items-end flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder={t('orderNo')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-800 border-slate-700 text-white" data-testid="sales-search" />
        </div>
        <div><label className="text-xs text-slate-400 block mb-1">{t('dateFrom')}</label><Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-40" data-testid="sales-date-from" /></div>
        <div><label className="text-xs text-slate-400 block mb-1">{t('dateTo')}</label><Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-slate-800 border-slate-700 text-white w-40" data-testid="sales-date-to" /></div>
        <Badge className="bg-slate-700 text-slate-300">{filteredOrders.length} / {orders.length}</Badge>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead className="text-slate-300">{t('orderNo')}</TableHead>
              <TableHead className="text-slate-300">{t('itemCount')}</TableHead>
              <TableHead className="text-slate-300">{t('totalAmount')}</TableHead>
              <TableHead className="text-slate-300">{t('paymentMethod')}</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('createTime')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="border-slate-700">
                <TableCell className="text-white font-mono">{order.order_no}</TableCell>
                <TableCell className="text-slate-300">{order.items?.length || 0}</TableCell>
                <TableCell className="text-emerald-400">${order.total_amount?.toFixed(2)}</TableCell>
                <TableCell className="text-slate-300">{order.payment_method === 'cash' ? t('cash') : t('otherPayment')}</TableCell>
                <TableCell>
                  <Badge className={order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {order.status === 'completed' ? t('completedStatus') : t('pendingStatus')}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-400 text-sm">{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => viewDetail(order)} className="text-slate-400 hover:text-white" data-testid={`view-order-${order.id}`}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handlePrintReceipt(order)} className="text-blue-400 hover:text-blue-300" data-testid={`print-receipt-${order.id}`} title={t('printReceipt80mm')}>
                      <Printer className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handlePrintInvoice(order)} className="text-emerald-400 hover:text-emerald-300" data-testid={`print-invoice-${order.id}`} title={t('printInvoiceA4')}>
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader><DialogTitle>{t('salesOrder')} - {selectedOrder?.order_no}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-400">{t('date')}:</span><br/><span className="text-white">{new Date(selectedOrder.created_at).toLocaleString()}</span></div>
                <div><span className="text-slate-400">{t('paymentMethod')}:</span><br/><span className="text-white">{selectedOrder.payment_method}</span></div>
                <div><span className="text-slate-400">{t('status')}:</span><br/><Badge className={selectedOrder.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>{selectedOrder.status}</Badge></div>
              </div>
              <Table>
                <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">{t('productName')}</TableHead><TableHead className="text-right text-slate-300">{t('quantity')}</TableHead><TableHead className="text-right text-slate-300">{t('unitPrice')}</TableHead><TableHead className="text-right text-slate-300">{t('amount')}</TableHead></TableRow></TableHeader>
                <TableBody>{(selectedOrder.items || []).map((item, idx) => (
                  <TableRow key={idx} className="border-slate-700">
                    <TableCell className="text-white">{item.product_name || item.product_id}</TableCell>
                    <TableCell className="text-right text-slate-300">{item.quantity}</TableCell>
                    <TableCell className="text-right text-slate-300">${item.unit_price?.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-emerald-400">${(item.amount || item.unit_price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
              <div className="flex justify-between items-center pt-4 border-t border-slate-700">
                <div className="text-2xl font-bold text-emerald-400">${selectedOrder.total_amount?.toFixed(2)}</div>
                <div className="flex gap-2">
                  <Button onClick={() => handlePrintReceipt(selectedOrder)} className="bg-blue-500 hover:bg-blue-600" data-testid="detail-print-receipt"><Printer className="w-4 h-4 mr-2" /> {t('printReceipt80mm')}</Button>
                  <Button onClick={() => handlePrintInvoice(selectedOrder)} className="bg-emerald-500 hover:bg-emerald-600" data-testid="detail-print-invoice"><Printer className="w-4 h-4 mr-2" /> {t('printInvoiceA4')}</Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print areas */}
      <ReceiptPrint ref={receiptRef} order={selectedOrder} settings={settings} exchangeRates={exchangeRates} t={t} />
      <InvoicePrint ref={invoiceRef} order={selectedOrder} settings={settings} exchangeRates={exchangeRates} t={t} />
    </div>
  );
}
