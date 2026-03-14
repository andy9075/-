import React, { useState, useEffect } from "react";
import { UserPlus, Edit, Trash2, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const PERM_KEYS = [
  { key: "can_access_pos", labelKey: "permPOS", group: "pos", descKey: "permDescPOS" },
  { key: "can_discount", labelKey: "permDiscount", group: "pos", descKey: "permDescDiscount" },
  { key: "can_refund", labelKey: "permRefund", group: "pos", descKey: "permDescRefund" },
  { key: "can_void", labelKey: "permVoid", group: "pos", descKey: "permDescVoid" },
  { key: "can_manage_products", labelKey: "permProducts", group: "catalog", descKey: "permDescProducts" },
  { key: "can_manage_inventory", labelKey: "permInventory", group: "catalog", descKey: "permDescInventory" },
  { key: "can_manage_purchases", labelKey: "permPurchases", group: "catalog", descKey: "permDescPurchases" },
  { key: "can_manage_customers", labelKey: "permCustomers", group: "crm", descKey: "permDescCustomers" },
  { key: "can_view_reports", labelKey: "permReports", group: "reports", descKey: "permDescReports" },
  { key: "can_export", labelKey: "permExport", group: "reports", descKey: "permDescExport" },
  { key: "can_view_cost_price", labelKey: "permCostPrice", group: "reports", descKey: "permDescCostPrice" },
  { key: "can_manage_employees", labelKey: "permEmployees", group: "system", descKey: "permDescEmployees" },
  { key: "can_manage_settings", labelKey: "permSettings", group: "system", descKey: "permDescSettings" },
  { key: "can_manage_promotions", labelKey: "permPromotions", group: "crm", descKey: "permDescPromotions" },
];

const PERM_GROUP_KEYS = {
  pos: { labelKey: "permGroupPOS", color: "text-emerald-400" },
  catalog: { labelKey: "permGroupCatalog", color: "text-blue-400" },
  crm: { labelKey: "permGroupCRM", color: "text-purple-400" },
  reports: { labelKey: "permGroupReports", color: "text-amber-400" },
  system: { labelKey: "permGroupSystem", color: "text-red-400" },
};

const ROLE_PRESETS = {
  admin: PERM_KEYS.map(p => p.key),
  manager: ["can_access_pos", "can_discount", "can_refund", "can_void", "can_manage_products", "can_manage_inventory", "can_manage_purchases", "can_manage_customers", "can_view_reports", "can_export", "can_view_cost_price", "can_manage_promotions"],
  cashier: ["can_access_pos"],
  staff: ["can_access_pos", "can_manage_inventory"],
};

export default function EmployeesPage() {
  const { t } = useLang();
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: {} });
  const [stores, setStores] = useState([]);

  const fetchData = async () => { try { const [empRes, storesRes] = await Promise.all([axios.get(`${API}/employees`), axios.get(`${API}/stores`)]); setEmployees(empRes.data); setStores(storesRes.data); } catch (e) { console.error(e); } };
  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing) { await axios.put(`${API}/employees/${editing}`, form); }
      else { await axios.post(`${API}/employees`, form); }
      toast.success(t('save') + " OK"); setShowForm(false); fetchData();
    } catch (e) { toast.error(e.response?.data?.detail || "Error"); }
  };
  const handleDelete = async (id) => { if (!confirm(t('deleteEmployeeConfirm'))) return; try { await axios.delete(`${API}/employees/${id}`); toast.success(t('deleteSuccess')); fetchData(); } catch (e) { toast.error(e.response?.data?.detail || "Error"); } };

  const togglePerm = (key) => {
    setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [key]: !prev.permissions[key] } }));
  };

  const applyRolePreset = (role) => {
    const preset = ROLE_PRESETS[role] || [];
    const perms = {};
    PERM_KEYS.forEach(p => { perms[p.key] = preset.includes(p.key); });
    perms.max_discount = role === 'admin' ? 100 : role === 'manager' ? 50 : 0;
    setForm(prev => ({ ...prev, role, permissions: perms }));
  };

  const openForm = (emp = null) => {
    if (emp) {
      setForm({ ...emp, password: "" }); setEditing(emp.id);
    } else {
      const defaultPerms = {};
      PERM_KEYS.forEach(p => { defaultPerms[p.key] = false; });
      defaultPerms.can_access_pos = true;
      defaultPerms.max_discount = 0;
      setForm({ username: "", password: "", name: "", phone: "", role: "cashier", store_id: "", permissions: defaultPerms });
      setEditing(null);
    }
    setShowForm(true);
  };

  const roleColors = { admin: "bg-red-500/20 text-red-400", manager: "bg-purple-500/20 text-purple-400", cashier: "bg-blue-500/20 text-blue-400", staff: "bg-slate-500/20 text-slate-400" };
  const enabledPerms = (perms) => PERM_KEYS.filter(p => perms?.[p.key]).map(p => t(p.labelKey));

  return (
    <div className="space-y-6" data-testid="employees-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-blue-400" /> {t('employees')}</h1>
        <Button onClick={() => openForm()} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-employee-btn"><UserPlus className="w-4 h-4 mr-2" /> {t('add')}</Button>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <Table>
          <TableHeader><TableRow className="border-slate-700">
            <TableHead className="text-slate-300">{t('username')}</TableHead>
            <TableHead className="text-slate-300">{t('name')}</TableHead>
            <TableHead className="text-slate-300">{t('phone')}</TableHead>
            <TableHead className="text-slate-300">{t('role')}</TableHead>
            <TableHead className="text-slate-300">{t('permission')}</TableHead>
            <TableHead className="text-slate-300">{t('actions')}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {employees.map(emp => (
              <TableRow key={emp.id} className="border-slate-700">
                <TableCell className="text-white font-medium">{emp.username}</TableCell>
                <TableCell className="text-slate-300">{emp.name}</TableCell>
                <TableCell className="text-slate-400">{emp.phone}</TableCell>
                <TableCell><Badge className={roleColors[emp.role] || roleColors.staff}>{t(emp.role)}</Badge></TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {enabledPerms(emp.permissions).map(label => (
                      <Badge key={label} className="bg-slate-700 text-slate-300 text-xs">{label}</Badge>
                    ))}
                    {emp.permissions?.max_discount > 0 && <Badge className="bg-amber-500/20 text-amber-400 text-xs">{t('maxDiscount')} {emp.permissions.max_discount}%</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openForm(emp)} data-testid={`edit-emp-${emp.id}`}><Edit className="w-4 h-4 text-blue-400" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(emp.id)} data-testid={`del-emp-${emp.id}`}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {employees.length === 0 && <TableRow><TableCell colSpan={6} className="text-slate-400 text-center py-8">{t('noData')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>

      {/* Employee Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('editEmployee') : t('addEmployee')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-400">{t('username')} *</label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="emp-username" /></div>
              <div><label className="text-xs text-slate-400">{t('password')} {editing ? `(${t('passwordKeepHint')})` : '*'}</label><Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="emp-password" /></div>
              <div><label className="text-xs text-slate-400">{t('name')}</label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
              <div><label className="text-xs text-slate-400">{t('phone')}</label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            </div>

            {/* Role with Preset */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">{t('rolePresetHint')}</label>
                <div className="flex gap-2 mt-1">
                  {['admin', 'manager', 'cashier', 'staff'].map(r => (
                    <button key={r} onClick={() => applyRolePreset(r)} className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${form.role === r ? (roleColors[r] || '') + ' ring-1 ring-white/20' : 'bg-slate-700 text-slate-400 hover:text-white'}`} data-testid={`role-${r}`}>{t(r)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">{t('storeManagement')}</label>
                <Select value={form.store_id || "all"} onValueChange={v => setForm({...form, store_id: v === "all" ? "" : v})}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('all')} /></SelectTrigger>
                  <SelectContent><SelectItem value="all">{t('all')}</SelectItem>{stores.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="bg-slate-900 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-emerald-400 flex items-center gap-2"><Shield className="w-4 h-4" /> {t('permission')}</h4>
                <span className="text-xs text-slate-500">{PERM_KEYS.filter(p => form.permissions?.[p.key]).length}/{PERM_KEYS.length} {t('enabledCount')}</span>
              </div>

              {Object.entries(PERM_GROUP_KEYS).map(([groupKey, group]) => (
                <div key={groupKey}>
                  <p className={`text-xs font-medium ${group.color} mb-1.5`}>{t(group.labelKey)}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERM_KEYS.filter(p => p.group === groupKey).map(perm => (
                      <label key={perm.key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all ${form.permissions?.[perm.key] ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-slate-800 border border-slate-700 hover:border-slate-600'}`} data-testid={`perm-${perm.key}`}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.permissions?.[perm.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                          {form.permissions?.[perm.key] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input type="checkbox" checked={!!form.permissions?.[perm.key]} onChange={() => togglePerm(perm.key)} className="sr-only" />
                        <div>
                          <p className="text-sm text-white">{t(perm.labelKey)}</p>
                          <p className="text-xs text-slate-500">{t(perm.descKey)}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Max Discount */}
              <div className="border-t border-slate-700 pt-3">
                <label className="text-xs text-slate-400">{t('maxDiscountPercent')} %</label>
                <Input type="number" min="0" max="100" value={form.permissions?.max_discount || 0} onChange={e => setForm({...form, permissions: {...form.permissions, max_discount: parseInt(e.target.value) || 0}})} className="bg-slate-700 border-slate-600 w-24 mt-1" data-testid="max-discount" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
              <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="emp-submit">{t('save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
