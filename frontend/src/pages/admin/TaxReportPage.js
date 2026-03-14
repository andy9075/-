import React, { useState } from "react";
import { Search, Download, Printer, Receipt, TrendingUp, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

const StatCard = ({ title, value, sub, color, icon: Icon }) => (
  <Card className="bg-slate-800 border-slate-700">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400">{title}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export default function TaxReportPage() {
  const { t } = useLang();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ start_date: "", end_date: "" });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;
      const res = await axios.get(`${API}/reports/tax`, { params });
      setReport(res.data);
    } catch (e) {
      toast.error("Error al cargar reporte fiscal");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!report) return;
    let csv = "Tasa IVA,Base Imponible ($),IVA ($),Num Facturas\n";
    Object.entries(report.breakdown || {}).sort(([a], [b]) => Number(b) - Number(a)).forEach(([rate, info]) => {
      csv += `${rate}%,$${info.base.toFixed(2)},$${info.tax.toFixed(2)},${info.count}\n`;
    });
    csv += `\nTOTAL,,,\n`;
    csv += `Total Ventas,$${report.total_sales.toFixed(2)},,\n`;
    csv += `Total Base,$${report.total_base.toFixed(2)},,\n`;
    csv += `Total IVA,$${report.total_tax.toFixed(2)},,\n`;
    csv += `Facturas,${report.order_count},,\n`;
    csv += `\nPeriodo: ${filters.start_date || 'Todo'} - ${filters.end_date || 'Todo'}\n`;
    csv += `Generado: ${new Date().toLocaleString()}\n`;

    const blob = new Blob(["\ufeff" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_fiscal_${filters.start_date || 'all'}_${filters.end_date || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const breakdown = report?.breakdown ? Object.entries(report.breakdown).sort(([a], [b]) => Number(b) - Number(a)) : [];
  const rateLabel = (rate) => {
    const r = Number(rate);
    if (r === 16) return "G - General";
    if (r === 8) return "R - Reducido";
    if (r === 0) return "E - Exento";
    return `${rate}%`;
  };
  const rateColor = (rate) => {
    const r = Number(rate);
    if (r === 0) return "text-emerald-400";
    if (r === 8) return "text-blue-400";
    return "text-amber-400";
  };

  return (
    <div className="space-y-6" data-testid="tax-report-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Receipt className="w-6 h-6 text-amber-400" /> Reporte Fiscal / IVA
        </h1>
        <div className="flex gap-2">
          {report && <Button onClick={exportCSV} className="bg-emerald-500 hover:bg-emerald-600" data-testid="export-tax-csv"><Download className="w-4 h-4 mr-2" /> Exportar CSV</Button>}
          {report && <Button onClick={() => window.print()} variant="outline" className="border-slate-600 text-slate-300" data-testid="print-tax-report"><Printer className="w-4 h-4 mr-2" /> Imprimir</Button>}
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700 print:hidden">
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha Inicio</label>
              <Input type="date" value={filters.start_date} onChange={e => setFilters(f => ({...f, start_date: e.target.value}))} className="bg-slate-700 border-slate-600 w-44" data-testid="tax-start-date" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Fecha Fin</label>
              <Input type="date" value={filters.end_date} onChange={e => setFilters(f => ({...f, end_date: e.target.value}))} className="bg-slate-700 border-slate-600 w-44" data-testid="tax-end-date" />
            </div>
            <Button onClick={fetchReport} className="bg-amber-500 hover:bg-amber-600" disabled={loading} data-testid="generate-tax-report">
              <Search className="w-4 h-4 mr-2" /> {loading ? "Cargando..." : "Generar Reporte"}
            </Button>
            <Button onClick={() => { setFilters({ start_date: "", end_date: "" }); setReport(null); }} variant="outline" className="border-slate-600 text-slate-400">Limpiar</Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Ventas" value={`$${report.total_sales.toFixed(2)}`} color="text-white" icon={TrendingUp} />
            <StatCard title="Base Imponible" value={`$${report.total_base.toFixed(2)}`} color="text-blue-400" icon={FileText} />
            <StatCard title="Total IVA" value={`$${report.total_tax.toFixed(2)}`} color="text-amber-400" icon={Receipt} sub={report.total_sales > 0 ? `${((report.total_tax / report.total_sales) * 100).toFixed(1)}% del total` : ''} />
            <StatCard title="Facturas" value={report.order_count} color="text-emerald-400" icon={FileText} sub={filters.start_date ? `${filters.start_date} ~ ${filters.end_date || 'hoy'}` : 'Todas'} />
          </div>

          {/* Tax Breakdown Table */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" /> Desglose por Tasa de IVA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Tasa IVA</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300 text-right">Base Imponible ($)</TableHead>
                    <TableHead className="text-slate-300 text-right">IVA ($)</TableHead>
                    <TableHead className="text-slate-300 text-right">Total ($)</TableHead>
                    <TableHead className="text-slate-300 text-right">Facturas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {breakdown.length > 0 ? breakdown.map(([rate, info]) => (
                    <TableRow key={rate} className="border-slate-700">
                      <TableCell className={`font-bold ${rateColor(rate)}`}>{rate}%</TableCell>
                      <TableCell className={`text-sm ${rateColor(rate)}`}>{rateLabel(rate)}</TableCell>
                      <TableCell className="text-right text-slate-300">${info.base.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-medium ${rateColor(rate)}`}>${info.tax.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-white font-medium">${(info.base + info.tax).toFixed(2)}</TableCell>
                      <TableCell className="text-right text-slate-400">{info.count}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow className="border-slate-700">
                      <TableCell colSpan={6} className="text-center text-slate-500 py-8">No hay datos de IVA en el periodo seleccionado</TableCell>
                    </TableRow>
                  )}
                  {breakdown.length > 0 && (
                    <TableRow className="border-slate-700 bg-slate-700/30">
                      <TableCell className="font-bold text-white" colSpan={2}>TOTAL</TableCell>
                      <TableCell className="text-right font-bold text-blue-400">${report.total_base.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-amber-400">${report.total_tax.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-white">${report.total_sales.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-400">{report.order_count}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Print-only section */}
          <div className="hidden print:block text-black bg-white p-8">
            <h2 className="text-xl font-bold mb-2">Reporte Fiscal / IVA</h2>
            <p className="text-sm mb-1">Periodo: {filters.start_date || 'Inicio'} - {filters.end_date || 'Actualidad'}</p>
            <p className="text-sm mb-4">Generado: {new Date().toLocaleString()}</p>
            <table className="w-full border-collapse text-sm mb-4">
              <thead><tr className="border-b-2 border-black">
                <th className="text-left py-1">Tasa</th><th className="text-left">Tipo</th>
                <th className="text-right">Base Imp.</th><th className="text-right">IVA</th>
                <th className="text-right">Total</th><th className="text-right">Fact.</th>
              </tr></thead>
              <tbody>
                {breakdown.map(([rate, info]) => (
                  <tr key={rate} className="border-b border-gray-300">
                    <td className="py-1">{rate}%</td><td>{rateLabel(rate)}</td>
                    <td className="text-right">${info.base.toFixed(2)}</td>
                    <td className="text-right">${info.tax.toFixed(2)}</td>
                    <td className="text-right">${(info.base + info.tax).toFixed(2)}</td>
                    <td className="text-right">{info.count}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-1" colSpan={2}>TOTAL</td>
                  <td className="text-right">${report.total_base.toFixed(2)}</td>
                  <td className="text-right">${report.total_tax.toFixed(2)}</td>
                  <td className="text-right">${report.total_sales.toFixed(2)}</td>
                  <td className="text-right">{report.order_count}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-xs text-gray-500">Sellox POS - Documento para uso fiscal</p>
          </div>
        </>
      )}

      {!report && (
        <div className="text-center py-16">
          <Receipt className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Seleccione un rango de fechas y haga clic en <strong>"Generar Reporte"</strong></p>
          <p className="text-slate-500 text-sm mt-1">El reporte muestra el desglose de IVA por tasa para el periodo seleccionado</p>
        </div>
      )}
    </div>
  );
}
