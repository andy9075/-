import React, { useState, useEffect } from "react";
import { Building2, Plus, Power, Copy, ExternalLink, Eye, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
  const [form, setForm] = useState({ name: "", contact_name: "", contact_phone: "", plan: "basic", max_users: 5, max_stores: 3, admin_username: "", admin_password: "admin123", is_trial: false, trial_days: 7 });

  const fetchTenants = async () => {
    try { const res = await axios.get(`${API}/tenants`); setTenants(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { fetchTenants(); }, []);

  const handleCreate = async () => {
    try {
      const res = await axios.post(`${API}/tenants`, form);
      toast.success(`Tenant created!\nUsername: ${res.data.admin_username}\nPassword: ${res.data.admin_password}\nTenant ID: ${res.data.id}`);
      setShowForm(false); fetchTenants();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const handleToggle = async (id) => {
    try { await axios.put(`${API}/tenants/${id}/toggle`); toast.success("Status updated"); fetchTenants(); }
    catch (e) { toast.error(t('operationFailed')); }
  };

  const copyShopLink = (tenantId) => {
    const url = `${window.location.origin}/shop/${tenantId}`;
    navigator.clipboard.writeText(url);
    toast.success("Shop link copied!");
  };

  const PLAN_COLORS = { basic: "bg-slate-500/20 text-slate-400", pro: "bg-blue-500/20 text-blue-400", enterprise: "bg-purple-500/20 text-purple-400" };

  return (
    <div className="space-y-6" data-testid="tenants-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Building2 className="w-6 h-6 text-blue-400" /> Tenant Management</h1>
        <Button onClick={() => { setForm({ name: "", contact_name: "", contact_phone: "", plan: "basic", max_users: 5, max_stores: 3, admin_username: "", admin_password: "admin123", is_trial: false, trial_days: 7 }); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-tenant-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Tenant
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30">
          <CardContent className="p-6"><p className="text-blue-300 text-sm">Total Tenants</p><p className="text-3xl font-bold text-white mt-1">{tenants.length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
          <CardContent className="p-6"><p className="text-emerald-300 text-sm">Active</p><p className="text-3xl font-bold text-white mt-1">{tenants.filter(t => t.status === 'active').length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/20 to-red-600/10 border-red-500/30">
          <CardContent className="p-6"><p className="text-red-300 text-sm">Inactive</p><p className="text-3xl font-bold text-white mt-1">{tenants.filter(t => t.status !== 'active').length}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30">
          <CardContent className="p-6"><p className="text-amber-300 text-sm">Trial</p><p className="text-3xl font-bold text-white mt-1">{tenants.filter(t => t.is_trial).length}</p></CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Tenant</TableHead>
                <TableHead className="text-slate-300">Contact</TableHead>
                <TableHead className="text-slate-300">Plan</TableHead>
                <TableHead className="text-slate-300">Created</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(tenant => (
                <TableRow key={tenant.id} className="border-slate-700">
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{tenant.name}</p>
                      <p className="text-slate-500 text-xs font-mono">{tenant.id}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{tenant.contact_name || '-'}</TableCell>
                  <TableCell><Badge className={PLAN_COLORS[tenant.plan] || ""}>{tenant.plan}</Badge></TableCell>
                  <TableCell className="text-slate-400 text-sm">{tenant.created_at?.substring(0, 10) || '-'}</TableCell>
                  <TableCell><Badge className={tenant.status === 'active' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}>{tenant.status}</Badge>
                    {tenant.is_trial && (
                      <Badge className={tenant.trial_expired ? "bg-red-500/20 text-red-400 ml-1" : "bg-amber-500/20 text-amber-400 ml-1"}>
                        <Clock className="w-3 h-3 mr-1" />{tenant.trial_expired ? "已过期" : `试用${tenant.trial_days_left || 0}天`}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setSelectedTenant(tenant); setShowDetail(true); }} className="text-blue-400" title="Details"><Eye className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => copyShopLink(tenant.id)} className="text-emerald-400" title="Copy Shop Link"><Copy className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => window.open(`/shop/${tenant.id}`, '_blank')} className="text-purple-400" title="Open Shop"><ExternalLink className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleToggle(tenant.id)} className={tenant.status === 'active' ? "text-red-400" : "text-emerald-400"} title="Toggle Status"><Power className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tenants.length === 0 && <TableRow><TableCell colSpan={6} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader><DialogTitle>Add Tenant</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Business Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-name-input" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Contact Person" value={form.contact_name} onChange={e => setForm({...form, contact_name: e.target.value})} className="bg-slate-700 border-slate-600" />
              <Input placeholder="Phone" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="bg-slate-700 border-slate-600" />
            </div>
            <select value={form.plan} onChange={e => setForm({...form, plan: e.target.value})} className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2">
              <option value="basic">Basic (5 users, 3 stores)</option>
              <option value="pro">Pro (15 users, 10 stores)</option>
              <option value="enterprise">Enterprise (Unlimited)</option>
            </select>
            <hr className="border-slate-700" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">试用账号</span>
              <button onClick={() => setForm({...form, is_trial: !form.is_trial})} className={`w-12 h-6 rounded-full transition-colors ${form.is_trial ? 'bg-amber-500' : 'bg-slate-600'}`} data-testid="trial-toggle">
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${form.is_trial ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>
            {form.is_trial && (
              <div>
                <label className="text-xs text-amber-400">试用天数</label>
                <select value={form.trial_days} onChange={e => setForm({...form, trial_days: parseInt(e.target.value)})} className="w-full bg-slate-700 border border-amber-500/30 text-white rounded-md px-3 py-2" data-testid="trial-days-select">
                  <option value={7}>7 天</option>
                  <option value={14}>14 天</option>
                  <option value={30}>30 天</option>
                  <option value={60}>60 天</option>
                  <option value={90}>90 天</option>
                </select>
              </div>
            )}
            <hr className="border-slate-700" />
            <p className="text-sm text-slate-400">Admin account for tenant</p>
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Username" value={form.admin_username} onChange={e => setForm({...form, admin_username: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-admin-username" />
              <Input placeholder="Password" value={form.admin_password} onChange={e => setForm({...form, admin_password: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="tenant-admin-password" />
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
          <DialogHeader><DialogTitle>{selectedTenant?.name}</DialogTitle></DialogHeader>
          {selectedTenant && (
            <div className="space-y-3 text-sm text-slate-300">
              <div className="space-y-2">
                <p>Tenant ID: <span className="text-blue-400 font-mono">{selectedTenant.id}</span></p>
                <p>Contact: {selectedTenant.contact_name || '-'} {selectedTenant.contact_phone || ''}</p>
                <p>Plan: <Badge className={PLAN_COLORS[selectedTenant.plan] || ""}>{selectedTenant.plan}</Badge></p>
                <p>Created: {selectedTenant.created_at?.substring(0, 10) || '-'}</p>
                {selectedTenant.is_trial && (
                  <p>Trial: <Badge className={selectedTenant.trial_expired ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}>
                    {selectedTenant.trial_expired ? "已过期" : `剩余 ${selectedTenant.trial_days_left || 0} 天`}
                  </Badge> (到期: {selectedTenant.trial_expires_at?.substring(0, 10) || '-'})</p>
                )}
              </div>
              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-400 mb-1">Shop URL:</p>
                <div className="flex items-center gap-2">
                  <code className="text-emerald-400 text-xs bg-slate-900 px-2 py-1.5 rounded flex-1 truncate">{window.location.origin}/shop/{selectedTenant.id}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyShopLink(selectedTenant.id)} className="text-emerald-400"><Copy className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
