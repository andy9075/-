import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function OnlineOrdersPage() {
  const { t } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => { fetchOrders(); }, [statusFilter]);
  const fetchOrders = async () => { try { const params = statusFilter !== "all" ? { status: statusFilter } : {}; const res = await axios.get(`${API}/shop/orders`, { params }); setOrders(res.data); } catch (e) { if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed')); } finally { setLoading(false); } };
  const handleConfirmPayment = async (orderId) => { try { await axios.put(`${API}/shop/orders/${orderId}/confirm-payment`); toast.success(t('confirm') + " OK"); fetchOrders(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };
  const handleShip = async (orderId) => { try { await axios.put(`${API}/shop/orders/${orderId}/ship`); toast.success(t('shipped') || "Shipped"); fetchOrders(); } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); } };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('onlineOrders')}</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white"><SelectValue placeholder={t('all')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('all')}</SelectItem><SelectItem value="pending">{t('pending')}</SelectItem><SelectItem value="processing">{t('processing')}</SelectItem><SelectItem value="shipped">{t('shipped')}</SelectItem><SelectItem value="completed">{t('completed')}</SelectItem></SelectContent></Select>
      </div>
      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700"><TableHead className="text-slate-300">#</TableHead><TableHead className="text-slate-300">{t('customer')}</TableHead><TableHead className="text-slate-300">{t('paymentMethod')}</TableHead><TableHead className="text-slate-300">Ref</TableHead><TableHead className="text-slate-300">{t('total')}</TableHead><TableHead className="text-slate-300">{t('status')}</TableHead><TableHead className="text-slate-300">{t('date')}</TableHead><TableHead className="text-slate-300">{t('actions')}</TableHead></TableRow></TableHeader>
          <TableBody>
            {orders.map((order) => (
              <React.Fragment key={order.id}>
                <TableRow className="border-slate-700 cursor-pointer hover:bg-slate-700/50" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                  <TableCell className="text-white font-mono text-xs">{order.order_no}</TableCell>
                  <TableCell><p className="text-white text-sm">{order.shipping_name}</p><p className="text-slate-400 text-xs">{order.shipping_phone}</p></TableCell>
                  <TableCell className="text-slate-300 text-sm">{order.payment_method === 'pago_movil' ? 'Pago Movil' : order.payment_method}</TableCell>
                  <TableCell className="text-yellow-400 font-mono text-sm">{order.payment_reference || '-'}</TableCell>
                  <TableCell className="text-emerald-400 font-medium">${(order.total_amount + order.shipping_fee).toFixed(2)}</TableCell>
                  <TableCell><Badge className={order.payment_status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}>{order.payment_status === 'paid' ? t('paid') : t('pending')}</Badge></TableCell>
                  <TableCell className="text-slate-400 text-xs">{new Date(order.created_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {order.payment_status === 'pending' && <Button size="sm" onClick={(e) => { e.stopPropagation(); handleConfirmPayment(order.id); }} className="bg-emerald-500 hover:bg-emerald-600 text-xs" data-testid={`confirm-payment-${order.id}`}>{t('confirm')}</Button>}
                      {order.payment_status === 'paid' && order.order_status === 'processing' && <Button size="sm" onClick={(e) => { e.stopPropagation(); handleShip(order.id); }} className="bg-purple-500 hover:bg-purple-600 text-xs" data-testid={`ship-order-${order.id}`}>{t('shipped')}</Button>}
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} />
                    </div>
                  </TableCell>
                </TableRow>
                {expandedOrder === order.id && (
                  <TableRow className="border-slate-700 bg-slate-900/50">
                    <TableCell colSpan={8} className="p-4">
                      <h4 className="text-sm font-medium text-emerald-400 mb-2">{t('orderDetail')}</h4>
                      <table className="w-full text-sm"><thead><tr className="text-slate-400 text-xs border-b border-slate-700"><th className="text-left py-1 px-2">{t('productName')}</th><th className="text-right py-1 px-2">{t('unitPrice')}</th><th className="text-center py-1 px-2">{t('quantity')}</th><th className="text-right py-1 px-2">{t('amount')}</th></tr></thead>
                        <tbody>{(order.items || []).map((item, idx) => (<tr key={idx} className="border-b border-slate-700/30"><td className="py-1.5 px-2 text-white">{item.product_name || item.product_id}</td><td className="py-1.5 px-2 text-right text-slate-300">${(item.unit_price || 0).toFixed(2)}</td><td className="py-1.5 px-2 text-center text-slate-300">{item.quantity}</td><td className="py-1.5 px-2 text-right text-emerald-400">${(item.amount || item.unit_price * item.quantity).toFixed(2)}</td></tr>))}</tbody>
                        <tfoot><tr className="border-t border-slate-600"><td colSpan={3} className="py-1.5 px-2 text-right text-slate-400">{t('total')}:</td><td className="py-1.5 px-2 text-right text-emerald-400 font-bold">${order.total_amount?.toFixed(2)}</td></tr></tfoot>
                      </table>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
            {orders.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-slate-400 py-8">{t('noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
