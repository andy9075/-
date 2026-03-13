import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const venezuelaBanks = [
  { code: "0102", name: "Banco de Venezuela" },{ code: "0104", name: "Venezolano de Credito" },{ code: "0105", name: "Mercantil" },{ code: "0108", name: "Provincial" },{ code: "0114", name: "Bancaribe" },{ code: "0115", name: "Exterior" },{ code: "0128", name: "Banco Caroni" },{ code: "0134", name: "Banesco" },{ code: "0137", name: "Sofitasa" },{ code: "0138", name: "Banco Plaza" },{ code: "0151", name: "BFC Banco Fondo Comun" },{ code: "0156", name: "100% Banco" },{ code: "0157", name: "Del Sur" },{ code: "0163", name: "Banco del Tesoro" },{ code: "0166", name: "Banco Agricola" },{ code: "0168", name: "Bancrecer" },{ code: "0169", name: "Mi Banco" },{ code: "0171", name: "Banco Activo" },{ code: "0172", name: "Bancamiga" },{ code: "0174", name: "Banplus" },{ code: "0175", name: "Bicentenario" },{ code: "0177", name: "Banfanb" },
];

export default function PaymentSettingsPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState({ transfer_enabled: true, transfer_bank_name: "", transfer_account_number: "", transfer_account_holder: "", transfer_rif: "", pago_movil_enabled: true, pago_movil_phone: "", pago_movil_bank_code: "", pago_movil_cedula: "", whatsapp_number: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { axios.get(`${API}/payment-settings`).then(r => setSettings(prev => ({ ...prev, ...r.data }))).catch(console.error).finally(() => setLoading(false)); }, []);
  const handleSave = async () => { setSaving(true); try { await axios.put(`${API}/payment-settings`, settings); toast.success(t('settingsSaved')); } catch (e) { toast.error(t('saveFailed')); } finally { setSaving(false); } };

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">{t('paymentSettings')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white">{t('bankTransfer')}</CardTitle><input type="checkbox" checked={settings.transfer_enabled} onChange={(e) => setSettings({...settings, transfer_enabled: e.target.checked})} className="w-5 h-5 rounded" /></div></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm text-slate-300">{t('bankName')}</label><Select value={settings.transfer_bank_name} onValueChange={(v) => setSettings({...settings, transfer_bank_name: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Seleccione banco" /></SelectTrigger><SelectContent>{venezuelaBanks.map(bank => (<SelectItem key={bank.code} value={bank.name}>{bank.code} - {bank.name}</SelectItem>))}</SelectContent></Select></div>
          <div><label className="text-sm text-slate-300">{t('accountNumber')}</label><Input value={settings.transfer_account_number} onChange={(e) => setSettings({...settings, transfer_account_number: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-sm text-slate-300">{t('accountHolder')}</label><Input value={settings.transfer_account_holder} onChange={(e) => setSettings({...settings, transfer_account_holder: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-sm text-slate-300">RIF</label><Input value={settings.transfer_rif} onChange={(e) => setSettings({...settings, transfer_rif: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardHeader><div className="flex items-center justify-between"><CardTitle className="text-white">{t('mobilePay')}</CardTitle><input type="checkbox" checked={settings.pago_movil_enabled} onChange={(e) => setSettings({...settings, pago_movil_enabled: e.target.checked})} className="w-5 h-5 rounded" /></div></CardHeader><CardContent className="space-y-4">
          <div><label className="text-sm text-slate-300">Telefono</label><Input value={settings.pago_movil_phone} onChange={(e) => setSettings({...settings, pago_movil_phone: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-sm text-slate-300">{t('selectBank')}</label><Select value={settings.pago_movil_bank_code} onValueChange={(v) => setSettings({...settings, pago_movil_bank_code: v})}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Seleccione banco" /></SelectTrigger><SelectContent>{venezuelaBanks.map(bank => (<SelectItem key={bank.code} value={bank.code}>{bank.code} - {bank.name}</SelectItem>))}</SelectContent></Select></div>
          <div><label className="text-sm text-slate-300">{t('idNumber')}</label><Input value={settings.pago_movil_cedula} onChange={(e) => setSettings({...settings, pago_movil_cedula: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
        </CardContent></Card>
      </div>
      <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white">{t('whatsappContact')}</CardTitle></CardHeader><CardContent className="space-y-4">
        <div><label className="text-sm text-slate-300">{t('whatsappNumber')}</label><Input value={settings.whatsapp_number} onChange={(e) => setSettings({...settings, whatsapp_number: e.target.value})} className="bg-slate-700 border-slate-600" placeholder="584121234567" /><p className="text-xs text-slate-500 mt-1">Ingrese el numero con codigo de pais</p></div>
        {settings.whatsapp_number && <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3"><p className="text-sm text-green-400">{t('whatsappEnabled')}</p></div>}
      </CardContent></Card>
      <div className="flex justify-end"><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" disabled={saving} data-testid="save-payment-settings">{saving ? t('saving') : t('saveSettings')}</Button></div>
    </div>
  );
}
