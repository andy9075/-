import React, { useState, useEffect } from "react";
import { Building2, Plus, Users, ShoppingCart, Edit2, Power } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function TenantsPage() {
  const { t } = useLang();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [form, setForm] = useState({ name: "", contact_name: "", contact_phone: "", plan: "basic", max_users: 5, max_stores: 3, admin_username: "", admin_password: "admin123" });

  const fetchTenants = async () => {
    try { const res = await axios.get(`${API}/tenants`); setTenants(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${API}/tenants`, form);
      toast.success(`商家创建成功！\n账号: ${res.data.admin_username}\n密码: ${res.data.admin_password}\n商家ID: ${res.data.id}`);
      setShowForm(false); fetchTenants();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const handleToggle = async (id) => {
    try { const res = await axios.put(`${API}/tenants/${id}/toggle`); toast.success(`Status: ${res.data.status}`); fetchTenants(); }
    catch (e) { toast.error(t('operationFailed')); }
  };

  const viewDetail = async (tenant) => {
    setSelectedTenant(tenant);
    try { const res = await axios.get(`${API}/tenants/${tenant.id}/stats`); setTenantStats(res.data); }
    catch (e) { setTenantStats(null); }
    setShowDetail(true);
  };

  const PLAN_COLORS = { basic: "bg-slate-500/20 text-slate-400", pro: "bg-blue-500/20 text-blue-400", enterprise: "bg-purple-500/20 text-purple-400" };

  return (
    <div className="space-y-6" data-testid="tenants-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" /> 商家管理 (SaaS)</h1>
        <Button onClick={() => { setForm({ name: "", contact_name: "", contact_phone: "", plan: "basic", max_users: 5, max_stores: 3, admin_username: "", admin_password: "admin123" }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-tenant-btn">
          <Plus className="w-4 h-4 mr-2" /> 添加商家
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-500/30">
          <CardContent className="p-6"><p className="text-blue-300 text-sm">总商家数</p><p className="text-3xl font-bold text-white mt-1">{tenants.length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border-emerald-500/30">
          <CardContent className="p-6"><p className="text-emerald-300 text-sm">活跃商家</p><p className="text-3xl font-bold text-white mt-1">{tenants.filter(t => t.status === 'active').length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-500/30">
          <CardContent className="p-6"><p className="text-purple-300 text-sm">总订单数</p><p className="text-3xl font-bold text-white mt-1">{tenants.reduce((s, t) => s + (t.orders_count || 0), 0)}</p></CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">商家ID</TableHead>
                <TableHead className="text-slate-300">商家名称</TableHead>
                <TableHead className="text-slate-300">联系人</TableHead>
                <TableHead className="text-slate-300">套餐</TableHead>
                <TableHead className="text-slate-300">用户数</TableHead>
                <TableHead className="text-slate-300">订单数</TableHead>
                <TableHead className="text-slate-300">状态</TableHead>
                <TableHead className="text-slate-300">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id} className="border-slate-700">
                  <TableCell className="text-blue-400 font-mono text-sm">{t.id}</TableCell>
                  <TableCell className="text-white font-medium">{t.name}</TableCell>
                  <TableCell className="text-slate-300">{t.contact_name || '-'}</TableCell>
                  <TableCell><Badge className={PLAN_COLORS[t.plan] || ""}>{t.plan}</Badge></TableCell>
                  <TableCell className="text-slate-300">{t.users_count || 0}/{t.max_users}</TableCell>
                  <TableCell className="text-slate-300">{t.orders_count || 0}</TableCell>
                  <TableCell><Badge className={t.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>{t.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => viewDetail(t)} className="text-blue-400"><Edit2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(t.id)} className={t.status === 'active' ? "text-red-400" : "text-emerald-400"}><Power className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tenants.length === 0 && <TableRow><TableCell colSpan={8} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>添加商家</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="商家名称（如：小明便利店）" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-name-input" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="联系人" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="bg-slate-700 border-slate-600" />
              <Input placeholder="电话" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
              <option value="basic">基础版 (5用户, 3门店)</option>
              <option value="pro">专业版 (15用户, 10门店)</option>
              <option value="enterprise">企业版 (不限)</option>
            </select>
            <hr className="border-slate-700" />
            <p className="text-sm text-slate-400">管理员账号（给商家用的）</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="登录账号" value={form.admin_username} onChange={e => setForm({...form, admin_username: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-admin-username" />
              <Input placeholder="登录密码" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-admin-password" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreate} className="flex-1 bg-emerald-500 hover:bg-emerald-600" data-testid="tenant-submit-btn">{t('save')}</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" className="flex-1 border-slate-600">{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenant Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>{selectedTenant?.name} - 详情</DialogTitle></DialogHeader>
          {selectedTenant && tenantStats && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-700/50 rounded p-3 text-center"><p className="text-slate-400 text-xs">用户</p><p className="text-xl font-bold text-blue-400">{tenantStats.users}</p></div>
                <div className="bg-slate-700/50 rounded p-3 text-center"><p className="text-slate-400 text-xs">商品</p><p className="text-xl font-bold text-purple-400">{tenantStats.products}</p></div>
                <div className="bg-slate-700/50 rounded p-3 text-center"><p className="text-slate-400 text-xs">门店</p><p className="text-xl font-bold text-orange-400">{tenantStats.stores}</p></div>
                <div className="bg-slate-700/50 rounded p-3 text-center"><p className="text-slate-400 text-xs">总订单</p><p className="text-xl font-bold text-emerald-400">{tenantStats.total_orders}</p></div>
              </div>
              <div className="bg-emerald-500/10 rounded p-3 text-center"><p className="text-slate-400 text-xs">今日销售</p><p className="text-2xl font-bold text-emerald-400">${tenantStats.today_sales}</p></div>
              <div className="text-sm text-slate-400 space-y-1">
                <p>商家ID: <span className="text-blue-400 font-mono">{selectedTenant.id}</span></p>
                <p>联系人: {selectedTenant.contact_name || '-'} {selectedTenant.contact_phone || ''}</p>
                <p>创建时间: {selectedTenant.created_at?.substring(0, 10)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
