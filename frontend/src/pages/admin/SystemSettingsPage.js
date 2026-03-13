import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function SystemSettingsPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { axios.get(`${API}/settings/system`).then(r => setSettings(r.data)).catch(console.error).finally(() => setLoading(false)); }, []);
  const handleSave = async () => { try { await axios.put(`${API}/settings/system`, settings); toast.success(t('save') + " OK"); } catch (e) { toast.error("Error saving"); } };
  const updateField = (key, value) => setSettings(prev => ({...prev, [key]: value}));

  if (loading) return <div className="text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-bold text-white">{t('systemSettings')}</h1><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" data-testid="save-settings">{t('save')}</Button></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">{t('invoiceHeader')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><label className="text-xs text-slate-400">{t('companyName')}</label><Input value={settings.company_name || ""} onChange={e => updateField("company_name", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-xs text-slate-400">{t('taxId')}</label><Input value={settings.company_tax_id || ""} onChange={e => updateField("company_tax_id", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-xs text-slate-400">{t('companyAddress')}</label><Input value={settings.company_address || ""} onChange={e => updateField("company_address", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-xs text-slate-400">{t('companyPhone')}</label><Input value={settings.company_phone || ""} onChange={e => updateField("company_phone", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-xs text-slate-400">{t('invoiceFooter')}</label><Input value={settings.invoice_footer || ""} onChange={e => updateField("invoice_footer", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">{t('printFormat')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><label className="text-xs text-slate-400">{t('printFormat')}</label><Select value={settings.default_print_format || "80mm"} onValueChange={v => updateField("default_print_format", v)}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="80mm">{t('receipt80mm')}</SelectItem><SelectItem value="A4">{t('receiptA4')}</SelectItem></SelectContent></Select></div>
          <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('autoPrint')}</span><button onClick={() => updateField("auto_print_receipt", !settings.auto_print_receipt)} className={`w-12 h-6 rounded-full transition-colors ${settings.auto_print_receipt ? 'bg-emerald-500' : 'bg-slate-600'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.auto_print_receipt ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></div>
          <div><label className="text-xs text-slate-400">{t('receiptCopies')}</label><Input type="number" value={settings.receipt_copies || 1} onChange={e => updateField("receipt_copies", parseInt(e.target.value) || 1)} className="bg-slate-700 border-slate-600" /></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">{t('scannerEnabled')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('scannerEnabled')}</span><button onClick={() => updateField("barcode_scanner_enabled", !settings.barcode_scanner_enabled)} className={`w-12 h-6 rounded-full transition-colors ${settings.barcode_scanner_enabled !== false ? 'bg-emerald-500' : 'bg-slate-600'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.barcode_scanner_enabled !== false ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">{t('wholesale')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex items-center justify-between"><span className="text-sm text-slate-300">{t('wholesaleEnabled')}</span><button onClick={() => updateField("wholesale_enabled", !settings.wholesale_enabled)} className={`w-12 h-6 rounded-full transition-colors ${settings.wholesale_enabled !== false ? 'bg-emerald-500' : 'bg-slate-600'}`}><div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.wholesale_enabled !== false ? 'translate-x-6' : 'translate-x-0.5'}`} /></button></div>
          <div><label className="text-xs text-slate-400">{t('wholesaleMinQty')}</label><Input type="number" value={settings.wholesale_min_quantity || 10} onChange={e => updateField("wholesale_min_quantity", parseInt(e.target.value) || 10)} className="bg-slate-700 border-slate-600" /></div>
          <div><label className="text-xs text-slate-400">{t('wholesaleDiscount')} %</label><Input type="number" value={settings.wholesale_discount_percent || 0} onChange={e => updateField("wholesale_discount_percent", parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600" /></div>
        </CardContent></Card>
        <Card className="bg-slate-800 border-slate-700"><CardHeader><CardTitle className="text-white text-base">{t('pricingMode')}</CardTitle></CardHeader><CardContent className="space-y-3">
          <div onClick={() => updateField("pricing_mode", "local_based")} className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`} data-testid="pricing-local-based">
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500' : 'border-slate-500'}`}>{(settings.pricing_mode === 'local_based' || !settings.pricing_mode) && <div className="w-2 h-2 rounded-full bg-emerald-500" />}</div><span className="text-white font-medium text-sm">{t('pricingLocalBased')}</span></div>
            <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingLocalDesc')}</p><p className="text-cyan-400 text-xs mt-1 ml-6">Bs. = $Cost x Dept.Rate | USD = Bs. / Sales Rate</p>
          </div>
          <div onClick={() => updateField("pricing_mode", "foreign_direct")} className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`} data-testid="pricing-foreign-direct">
            <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500' : 'border-slate-500'}`}>{settings.pricing_mode === 'foreign_direct' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}</div><span className="text-white font-medium text-sm">{t('pricingForeignDirect')}</span></div>
            <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingForeignDesc')}</p><p className="text-cyan-400 text-xs mt-1 ml-6">USD = $Price | Bs. = $Price x Sales Rate</p>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
