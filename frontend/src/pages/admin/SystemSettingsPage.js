import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Database, Receipt, Printer, Shield } from "lucide-react";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const Toggle = ({ value, onChange, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-300">{label}</span>
    <button onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-600'}`}>
      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  </div>
);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('systemSettings')}</h1>
        <Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600" data-testid="save-settings">{t('save')}</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('invoiceHeader')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('companyName')}</label><Input value={settings.company_name || ""} onChange={e => updateField("company_name", e.target.value)} className="bg-slate-700 border-slate-600" data-testid="company-name" /></div>
            <div><label className="text-xs text-slate-400">{t('taxId')} (RIF)</label><Input value={settings.company_tax_id || ""} onChange={e => updateField("company_tax_id", e.target.value)} className="bg-slate-700 border-slate-600" placeholder="J-12345678-9" data-testid="company-tax-id" /></div>
            <div><label className="text-xs text-slate-400">{t('companyAddress')}</label><Input value={settings.company_address || ""} onChange={e => updateField("company_address", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('companyPhone')}</label><Input value={settings.company_phone || ""} onChange={e => updateField("company_phone", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('invoiceFooter')}</label><Input value={settings.invoice_footer || ""} onChange={e => updateField("invoice_footer", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Tax / IVA Settings */}
        <Card className="bg-slate-800 border-slate-700 border-amber-500/30">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-400" /> IVA / Impuestos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle value={settings.tax_enabled !== false} onChange={v => updateField("tax_enabled", v)} label="IVA habilitado" />
            <Toggle value={settings.tax_included_in_price !== false} onChange={v => updateField("tax_included_in_price", v)} label="IVA incluido en precio" />
            <div><label className="text-xs text-slate-400">Tasa IVA predeterminada (%)</label>
              <Select value={String(settings.default_tax_rate ?? 16)} onValueChange={v => updateField("default_tax_rate", parseFloat(v))}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16% (General)</SelectItem>
                  <SelectItem value="8">8% (Reducido)</SelectItem>
                  <SelectItem value="0">0% (Exento)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs text-slate-400">Tasas disponibles (separadas por coma)</label>
              <Input value={settings.tax_rates || "16,8,0"} onChange={e => updateField("tax_rates", e.target.value)} className="bg-slate-700 border-slate-600" placeholder="16,8,0" data-testid="tax-rates" />
            </div>
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400">
              <p><strong className="text-amber-400">G</strong> = General (16%) | <strong className="text-blue-400">R</strong> = Reducido (8%) | <strong className="text-emerald-400">E</strong> = Exento (0%)</p>
              <p className="mt-1">Cada producto puede tener su propia tasa de IVA.</p>
            </div>
          </CardContent>
        </Card>

        {/* Print Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Printer className="w-4 h-4" /> {t('printFormat')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('printFormat')}</label>
              <Select value={settings.default_print_format || "80mm"} onValueChange={v => updateField("default_print_format", v)}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="80mm">{t('receipt80mm')}</SelectItem>
                  <SelectItem value="A4">{t('receiptA4')}</SelectItem>
                  <SelectItem value="fiscal">Fiscal SENIAT</SelectItem>
                  <SelectItem value="dotmatrix">Matriz de Puntos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Toggle value={settings.auto_print_receipt !== false} onChange={v => updateField("auto_print_receipt", v)} label={t('autoPrint')} />
            <div><label className="text-xs text-slate-400">{t('receiptCopies')}</label><Input type="number" value={settings.receipt_copies || 1} onChange={e => updateField("receipt_copies", parseInt(e.target.value) || 1)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* SENIAT Fiscal Printer */}
        <Card className="bg-slate-800 border-slate-700 border-red-500/30">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Shield className="w-4 h-4 text-red-400" /> SENIAT - Impresora Fiscal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle value={settings.seniat_enabled === true} onChange={v => updateField("seniat_enabled", v)} label="Habilitar SENIAT" />
            <div><label className="text-xs text-slate-400">Serial Maquina Fiscal (MF)</label>
              <Input value={settings.seniat_machine_serial || ""} onChange={e => updateField("seniat_machine_serial", e.target.value)} className="bg-slate-700 border-slate-600" placeholder="MF-000-00000" data-testid="seniat-serial" /></div>
            <div><label className="text-xs text-slate-400">NIT / Numero de Autorizacion</label>
              <Input value={settings.seniat_authorization_number || ""} onChange={e => updateField("seniat_authorization_number", e.target.value)} className="bg-slate-700 border-slate-600" data-testid="seniat-auth" /></div>
            <div><label className="text-xs text-slate-400">IP Impresora Fiscal</label>
              <Input value={settings.seniat_printer_ip || ""} onChange={e => updateField("seniat_printer_ip", e.target.value)} className="bg-slate-700 border-slate-600" placeholder="192.168.1.100" /></div>
            <div><label className="text-xs text-slate-400">Puerto</label>
              <Input type="number" value={settings.seniat_printer_port || 9100} onChange={e => updateField("seniat_printer_port", parseInt(e.target.value) || 9100)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">Prefijo Fiscal</label>
              <Input value={settings.fiscal_prefix || "FC"} onChange={e => updateField("fiscal_prefix", e.target.value)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Dot Matrix Printer */}
        <Card className="bg-slate-800 border-slate-700 border-orange-500/30">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Printer className="w-4 h-4 text-orange-400" /> Impresora Matriz de Puntos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle value={settings.dot_matrix_enabled === true} onChange={v => updateField("dot_matrix_enabled", v)} label="Habilitar Matriz de Puntos" />
            <div><label className="text-xs text-slate-400">IP Impresora</label>
              <Input value={settings.dot_matrix_printer_ip || ""} onChange={e => updateField("dot_matrix_printer_ip", e.target.value)} className="bg-slate-700 border-slate-600" placeholder="192.168.1.101" /></div>
            <div><label className="text-xs text-slate-400">Puerto</label>
              <Input type="number" value={settings.dot_matrix_printer_port || 9100} onChange={e => updateField("dot_matrix_printer_port", parseInt(e.target.value) || 9100)} className="bg-slate-700 border-slate-600" /></div>
            <div className="p-3 bg-slate-900 rounded-lg text-xs text-slate-400">
              <p>Para facturas de venta al mayor.</p>
              <p>Compatible: Epson LX-350, LX-300+, FX-890</p>
              <p>Papel: Continuo con perforaciones (tractor feed)</p>
            </div>
          </CardContent>
        </Card>

        {/* Scanner */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('scannerEnabled')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle value={settings.barcode_scanner_enabled !== false} onChange={v => updateField("barcode_scanner_enabled", v)} label={t('scannerEnabled')} />
          </CardContent>
        </Card>

        {/* Wholesale */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('wholesale')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Toggle value={settings.wholesale_enabled !== false} onChange={v => updateField("wholesale_enabled", v)} label={t('wholesaleEnabled')} />
            <div><label className="text-xs text-slate-400">{t('wholesaleMinQty')}</label><Input type="number" value={settings.wholesale_min_quantity || 10} onChange={e => updateField("wholesale_min_quantity", parseInt(e.target.value) || 10)} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-xs text-slate-400">{t('wholesaleDiscount')} %</label><Input type="number" value={settings.wholesale_discount_percent || 0} onChange={e => updateField("wholesale_discount_percent", parseFloat(e.target.value) || 0)} className="bg-slate-700 border-slate-600" /></div>
          </CardContent>
        </Card>

        {/* Points/Loyalty Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('pointsRate')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><label className="text-xs text-slate-400">{t('addPoints')} / $1</label><Input type="number" value={settings.points_per_dollar || 1} onChange={e => updateField("points_per_dollar", parseInt(e.target.value) || 1)} className="bg-slate-700 border-slate-600" data-testid="points-per-dollar" /></div>
            <div><label className="text-xs text-slate-400">{t('usePoints')} = $1</label><Input type="number" value={settings.points_value_rate || 100} onChange={e => updateField("points_value_rate", parseInt(e.target.value) || 100)} className="bg-slate-700 border-slate-600" data-testid="points-value-rate" /></div>
            <p className="text-slate-500 text-xs">{t('pointsRate')}: {settings.points_per_dollar || 1} pts/$1 | {settings.points_value_rate || 100} pts = $1</p>
          </CardContent>
        </Card>

        {/* Pricing Mode */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base">{t('pricingMode')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div onClick={() => updateField("pricing_mode", "local_based")} className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`} data-testid="pricing-local-based">
              <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'local_based' || !settings.pricing_mode ? 'border-emerald-500' : 'border-slate-500'}`}>{(settings.pricing_mode === 'local_based' || !settings.pricing_mode) && <div className="w-2 h-2 rounded-full bg-emerald-500" />}</div><span className="text-white font-medium text-sm">{t('pricingLocalBased')}</span></div>
              <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingLocalDesc')}</p><p className="text-cyan-400 text-xs mt-1 ml-6">Bs. = $Cost x Dept.Rate | USD = Bs. / Sales Rate</p>
            </div>
            <div onClick={() => updateField("pricing_mode", "foreign_direct")} className={`p-3 rounded-lg cursor-pointer border-2 transition-colors ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 hover:border-slate-500'}`} data-testid="pricing-foreign-direct">
              <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${settings.pricing_mode === 'foreign_direct' ? 'border-emerald-500' : 'border-slate-500'}`}>{settings.pricing_mode === 'foreign_direct' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}</div><span className="text-white font-medium text-sm">{t('pricingForeignDirect')}</span></div>
              <p className="text-slate-400 text-xs mt-1 ml-6">{t('pricingForeignDesc')}</p><p className="text-cyan-400 text-xs mt-1 ml-6">USD = $Price | Bs. = $Price x Sales Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Data Backup */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader><CardTitle className="text-white text-base flex items-center gap-2"><Database className="w-4 h-4" /> {t('dataBackup')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-slate-400 text-sm">{t('backupDesc')}</p>
            <Button onClick={() => { const a = document.createElement('a'); a.href = `${API}/backup/export`; a.download = 'backup.json'; document.body.appendChild(a); a.click(); a.remove(); toast.success(t('exporting')); }} className="w-full bg-blue-500 hover:bg-blue-600" data-testid="backup-export-btn">
              <Download className="w-4 h-4 mr-2" /> {t('exportBackup')}
            </Button>
            <hr className="border-slate-700" />
            <p className="text-slate-400 text-sm">{t('restoreDesc')}</p>
            <p className="text-red-400 text-xs">{t('restoreWarning')}</p>
            <input type="file" accept=".json" onChange={async (e) => {
              const file = e.target.files[0]; if (!file) return;
              if (!window.confirm(t('restoreWarning'))) return;
              const formData = new FormData(); formData.append('file', file);
              try { await axios.post(`${API}/backup/restore`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }); toast.success(`${t('restoreBackup')} OK`); } catch (err) { toast.error(t('operationFailed')); }
            }} className="w-full text-slate-300 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-orange-500 file:text-white file:cursor-pointer hover:file:bg-orange-600" data-testid="backup-restore-input" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
