import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Edit, Trash2, Upload, Download, Printer, Tag } from "lucide-react";
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
import { PriceLabelPrint } from "@/components/PriceLabelPrint";

export default function ProductsPage() {
  const { t } = useLang();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 1, local_currency_symbol: 'Bs.' });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    code: "", barcode: "", name: "", category_id: "", unit: "件",
    cost_price: 0, margin1: 0, margin2: 0, margin3: 0,
    price1: 0, price2: 0, price3: 0, wholesale_price: 0, box_quantity: 1,
    retail_price: 0, min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active",
    tax_rate: 16
  });
  const [showImport, setShowImport] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importMode, setImportMode] = useState("skip");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [selectedForLabels, setSelectedForLabels] = useState(new Set());
  const [showLabelSelect, setShowLabelSelect] = useState(false);
  const priceLabelRef = useRef(null);

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API}/products`, { params: { search } });
      setProducts(res.data);
    } catch (e) {
      if (e.response?.status !== 401 && e.response?.status !== 403) toast.error(t('loadFailed'));
    } finally { setLoading(false); }
  };

  const fetchCategories = async () => {
    try {
      const [catRes, rateRes] = await Promise.all([axios.get(`${API}/categories`), axios.get(`${API}/exchange-rates`)]);
      setCategories(catRes.data);
      setExchangeRates(rateRes.data);
    } catch (e) { console.error(e); }
  };

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await axios.put(`${API}/products/${editingProduct.id}`, formData);
        toast.success(t('updateSuccess'));
      } else {
        await axios.post(`${API}/products`, formData);
        toast.success(t('addSuccess'));
      }
      setShowForm(false); setEditingProduct(null); resetForm(); fetchProducts();
    } catch (e) { toast.error(e.response?.data?.detail || t('operationFailed')); }
  };

  const handleEdit = (product) => { setEditingProduct(product); setFormData(product); setShowForm(true); };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirm'))) return;
    try { await axios.delete(`${API}/products/${id}`); toast.success(t('deleteSuccess')); fetchProducts(); } catch (e) { toast.error(t('deleteFailed')); }
  };

  const resetForm = () => setFormData({ code: "", barcode: "", name: "", category_id: "", unit: "件", cost_price: 0, margin1: 0, margin2: 0, margin3: 0, price1: 0, price2: 0, price3: 0, wholesale_price: 0, box_quantity: 1, retail_price: 0, min_stock: 0, max_stock: 9999, image_url: "", description: "", status: "active", tax_rate: 16 });

  const getCategoryRate = (categoryId) => {
    const cat = categories.find(c => c.id === categoryId);
    const catRate = cat?.exchange_rate || 0;
    return catRate > 1 ? catRate : (exchangeRates.usd_to_ves || 1);
  };
  const localSymbol = exchangeRates.local_currency_symbol || 'Bs.';
  const sysRate = exchangeRates.usd_to_ves || 1;
  const selectedCatRate = getCategoryRate(formData.category_id);
  const toBs = (usd) => (usd * selectedCatRate).toFixed(2);
  const autoCalcPrice = (cost, catRate) => {
    if (!cost || !catRate || catRate <= 1 || !sysRate) return 0;
    return Math.round(cost * catRate / sysRate * 100) / 100;
  };

  const toggleLabelSelect = (productId) => {
    setSelectedForLabels(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId); else next.add(productId);
      return next;
    });
  };
  const selectAllForLabels = () => { setSelectedForLabels(new Set(products.map(p => p.id))); };
  const deselectAllForLabels = () => { setSelectedForLabels(new Set()); };
  const handlePrintLabels = () => {
    if (selectedForLabels.size === 0) { toast.error(t('selectProducts')); return; }
    if (priceLabelRef.current) { priceLabelRef.current.style.display = 'block'; window.print(); priceLabelRef.current.style.display = 'none'; }
  };
  const selectedProducts = products.filter(p => selectedForLabels.has(p.id));

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true); setImportResult(null);
    try {
      const fd = new FormData();
      fd.append('file', importFile);
      const res = await axios.post(`${API}/products/import?mode=${importMode}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImportResult(res.data); toast.success(t('importSuccess')); fetchProducts();
    } catch (e) { toast.error(e.response?.data?.detail || t('importFailed')); }
    finally { setImporting(false); }
  };

  const downloadTemplate = () => window.open(`${API}/products/import/template`, '_blank');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{t('productManagement')}</h1>
        <div className="flex gap-2">
          <Button onClick={() => { setShowLabelSelect(!showLabelSelect); if (!showLabelSelect) selectAllForLabels(); }} variant="outline" className="border-slate-600 text-slate-300" data-testid="price-labels-btn">
            <Tag className="w-4 h-4 mr-2" /> {t('printPriceLabels')}
          </Button>
          <Button onClick={() => { setShowImport(true); setImportResult(null); setImportFile(null); }} variant="outline" className="border-slate-600 text-slate-300" data-testid="import-products-btn">
            <Upload className="w-4 h-4 mr-2" /> {t('importProducts')}
          </Button>
          <Button onClick={() => { resetForm(); setEditingProduct(null); setShowForm(true); }} className="bg-emerald-500 hover:bg-emerald-600" data-testid="add-product-btn">
            <Plus className="w-4 h-4 mr-2" /> {t('addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder={t('searchProduct')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchProducts()} className="pl-10 bg-slate-800 border-slate-700 text-white" data-testid="product-search" />
        </div>
      </div>

      {showLabelSelect && (
        <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium"><Tag className="w-4 h-4 inline mr-1" /> {t('printPriceLabels')}</span>
            <span className="text-blue-400 text-sm">{selectedForLabels.size} {t('selectedCount')}</span>
            <Button size="sm" variant="outline" onClick={selectAllForLabels} className="border-slate-600 text-slate-300 h-7 text-xs" data-testid="select-all-labels">{t('selectAll')}</Button>
            <Button size="sm" variant="outline" onClick={deselectAllForLabels} className="border-slate-600 text-slate-300 h-7 text-xs" data-testid="deselect-all-labels">{t('deselectAll')}</Button>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrintLabels} disabled={selectedForLabels.size === 0} className="bg-blue-500 hover:bg-blue-600" data-testid="print-labels-btn">
              <Printer className="w-4 h-4 mr-2" /> {t('printSelected')} ({selectedForLabels.size})
            </Button>
            <Button variant="outline" onClick={() => { setShowLabelSelect(false); deselectAllForLabels(); }} className="border-slate-600 text-slate-300">X</Button>
          </div>
        </div>
      )}

      <Card className="bg-slate-800 border-slate-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              {showLabelSelect && <TableHead className="text-slate-300 w-10"><input type="checkbox" checked={selectedForLabels.size === products.length && products.length > 0} onChange={(e) => e.target.checked ? selectAllForLabels() : deselectAllForLabels()} className="rounded" /></TableHead>}
              <TableHead className="text-slate-300">{t('productCode')}</TableHead>
              <TableHead className="text-slate-300">{t('productName')}</TableHead>
              <TableHead className="text-slate-300">{t('category')}</TableHead>
              <TableHead className="text-slate-300">{t('costPrice')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}1%</TableHead>
              <TableHead className="text-slate-300">{t('price1')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}2%</TableHead>
              <TableHead className="text-slate-300">{t('price2')}</TableHead>
              <TableHead className="text-slate-300">{t('margin')}3%</TableHead>
              <TableHead className="text-slate-300">{t('price3Box')}</TableHead>
              <TableHead className="text-slate-300">IVA</TableHead>
              <TableHead className="text-slate-300">{t('status')}</TableHead>
              <TableHead className="text-slate-300">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const catRate = getCategoryRate(product.category_id);
              const cat = categories.find(c => c.id === product.category_id);
              return (
                <TableRow key={product.id} className="border-slate-700">
                  {showLabelSelect && <TableCell><input type="checkbox" checked={selectedForLabels.has(product.id)} onChange={() => toggleLabelSelect(product.id)} className="rounded" data-testid={`label-check-${product.id}`} /></TableCell>}
                  <TableCell className="text-slate-300">{product.code}</TableCell>
                  <TableCell className="text-white font-medium">{product.name}</TableCell>
                  <TableCell className="text-slate-400 text-xs">{cat?.name || '-'}</TableCell>
                  <TableCell className="text-slate-400">
                    <div>${(product.cost_price || 0).toFixed(2)}</div>
                    <div className="text-cyan-400 text-xs">{localSymbol}{((product.cost_price || 0) * catRate).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-orange-400">{(product.margin1 || 0).toFixed(1)}%</TableCell>
                  <TableCell className="text-emerald-400">
                    <div>${(product.price1 || product.retail_price || 0).toFixed(2)}</div>
                    <div className="text-cyan-400 text-xs">{localSymbol}{((product.price1 || product.retail_price || 0) * catRate).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-orange-400">{(product.margin2 || 0).toFixed(1)}%</TableCell>
                  <TableCell className="text-yellow-400">
                    <div>${(product.price2 || 0).toFixed(2)}</div>
                    <div className="text-cyan-400 text-xs">{localSymbol}{((product.price2 || 0) * catRate).toFixed(2)}</div>
                  </TableCell>
                  <TableCell className="text-orange-400">{(product.margin3 || 0).toFixed(1)}%</TableCell>
                  <TableCell className="text-blue-400">
                    <div>${(product.price3 || product.wholesale_price || 0).toFixed(2)}</div>
                    <div className="text-cyan-400 text-xs">{localSymbol}{((product.price3 || product.wholesale_price || 0) * catRate).toFixed(2)}</div>
                  </TableCell>
                  <TableCell><span className={`text-xs font-medium ${(product.tax_rate ?? 16) === 0 ? 'text-emerald-400' : (product.tax_rate ?? 16) === 8 ? 'text-blue-400' : 'text-amber-400'}`}>{product.tax_rate ?? 16}%</span></TableCell>
                  <TableCell><Badge variant={product.status === 'active' ? 'default' : 'secondary'}>{product.status === 'active' ? t('active') : t('inactive')}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(product)} className="text-blue-400 hover:text-blue-300"><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingProduct ? t('editProduct') : t('addProduct')}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-300">{t('productCode')}</label><Input value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-code" /></div>
            <div><label className="text-sm text-slate-300">Barcode</label><Input value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div className="col-span-2"><label className="text-sm text-slate-300">{t('productName')}</label><Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="product-name" /></div>
            <div>
              <label className="text-sm text-slate-300">{t('category')}</label>
              <Select value={formData.category_id} onValueChange={(v) => {
                const newCatRate = getCategoryRate(v);
                const cost = formData.cost_price || 0;
                const autoPrice = autoCalcPrice(cost, newCatRate);
                if (autoPrice > 0) { setFormData({...formData, category_id: v, price1: autoPrice, price2: autoPrice, price3: autoPrice}); }
                else { setFormData({...formData, category_id: v}); }
              }}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={t('category')} /></SelectTrigger>
                <SelectContent>{categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name} {cat.exchange_rate > 1 ? `(${localSymbol}${cat.exchange_rate})` : ''}</SelectItem>))}</SelectContent>
              </Select>
              {formData.category_id && <p className="text-xs text-cyan-400 mt-1" data-testid="category-rate-display">{t('exchangeRates')}: $1 = {localSymbol}{selectedCatRate}</p>}
            </div>
            <div><label className="text-sm text-slate-300">{t('unit')}</label><Input value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            <div className="col-span-2 bg-slate-900 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-400">{t('priceSettings')} ({t('marginFormula')})</h4>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-slate-400">{t('costPrice')} ($)</label>
                  <Input type="number" step="0.01" value={formData.cost_price} onChange={(e) => {
                    const cost = parseFloat(e.target.value) || 0;
                    const autoPrice = autoCalcPrice(cost, selectedCatRate);
                    if (autoPrice > 0) { setFormData({...formData, cost_price: cost, price1: autoPrice, price2: autoPrice, price3: autoPrice}); }
                    else {
                      const m1 = formData.margin1 || 0, m2 = formData.margin2 || 0, m3 = formData.margin3 || 0;
                      setFormData({...formData, cost_price: cost,
                        price1: m1 > 0 ? Math.round(cost * (1 + m1/100) * 100) / 100 : formData.price1,
                        price2: m2 > 0 ? Math.round(cost * (1 + m2/100) * 100) / 100 : formData.price2,
                        price3: m3 > 0 ? Math.round(cost * (1 + m3/100) * 100) / 100 : formData.price3
                      });
                    }
                  }} className="bg-slate-700 border-slate-600" data-testid="product-cost" />
                  {formData.cost_price > 0 && formData.category_id && <p className="text-xs text-cyan-400 mt-0.5">{localSymbol}{toBs(formData.cost_price)}</p>}
                  {formData.cost_price > 0 && selectedCatRate > 1 && <p className="text-xs text-emerald-400 mt-0.5">{t('pricingLocalBased')}: ${formData.cost_price}x{selectedCatRate}/{sysRate} = ${autoCalcPrice(formData.cost_price, selectedCatRate).toFixed(2)}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[{key:'margin1',price:'price1',label:'1',color:'emerald'},{key:'margin2',price:'price2',label:'2',color:'yellow'},{key:'margin3',price:'price3',label:`3 (%) ${t('box')}`,color:'blue'}].map(({key,price,label,color}) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-slate-400">{t('margin')}{label}</label>
                    <Input type="number" step="0.1" value={formData[key]} onChange={(e) => {
                      const m = parseFloat(e.target.value) || 0;
                      const cost = formData.cost_price || 0;
                      setFormData({...formData, [key]: m, [price]: cost > 0 && m > 0 ? Math.round(cost * (1 + m/100) * 100) / 100 : formData[price]});
                    }} className="bg-slate-700 border-slate-600" data-testid={`product-${key}`} />
                    <div className={`text-xs text-${color}-400 font-medium`}>
                      {t(price === 'price3' ? 'price3Box' : price)}: ${(formData[price] || 0).toFixed(2)}
                      {formData.category_id && <span className="text-cyan-400 ml-1">({localSymbol}{toBs(formData[price] || 0)})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div><label className="text-sm text-slate-300">{t('wholesale')} ($)</label><Input type="number" step="0.01" value={formData.wholesale_price} onChange={(e) => setFormData({...formData, wholesale_price: parseFloat(e.target.value) || 0})} className="bg-slate-700 border-slate-600" />{formData.wholesale_price > 0 && formData.category_id && <p className="text-xs text-cyan-400 mt-0.5">{localSymbol}{toBs(formData.wholesale_price)}</p>}</div>
            <div><label className="text-sm text-slate-300">{t('boxQuantity')}</label><Input type="number" value={formData.box_quantity} onChange={(e) => setFormData({...formData, box_quantity: parseInt(e.target.value) || 1})} className="bg-slate-700 border-slate-600" /></div>
            <div><label className="text-sm text-slate-300">{t('stockAlerts')} ({t('quantity')})</label><Input type="number" value={formData.min_stock} onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})} className="bg-slate-700 border-slate-600" placeholder="0" /></div>
            <div><label className="text-sm text-slate-300">IVA (%)</label>
              <Select value={String(formData.tax_rate ?? 16)} onValueChange={(v) => setFormData({...formData, tax_rate: parseFloat(v)})}>
                <SelectTrigger className="bg-slate-700 border-slate-600" data-testid="product-tax-rate"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="16">16% General</SelectItem>
                  <SelectItem value="8">8% Reducido</SelectItem>
                  <SelectItem value="0">0% Exento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-sm text-slate-300">{t('status')}</label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">{t('active')}</SelectItem><SelectItem value="inactive">{t('inactive')}</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><label className="text-sm text-slate-300">{t('notes')}</label><Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="bg-slate-700 border-slate-600" /></div>
            {/* Product Image */}
            {editingProduct && (
              <div className="col-span-2 space-y-2">
                <label className="text-sm text-slate-300">{t('uploadImage')}</label>
                <div className="flex items-center gap-4">
                  {formData.image_url && <img src={`${API.replace('/api', '')}${formData.image_url}`} alt="" className="w-16 h-16 rounded object-cover border border-slate-600" />}
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files[0]; if (!file) return;
                    const fd = new FormData(); fd.append('file', file);
                    try {
                      const res = await axios.post(`${API}/products/${editingProduct.id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                      setFormData({...formData, image_url: res.data.image_url});
                      toast.success(t('uploadImage') + ' OK');
                    } catch (err) { toast.error(t('operationFailed')); }
                  }} className="text-sm text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-blue-500 file:text-white file:cursor-pointer hover:file:bg-blue-600" data-testid="product-image-upload" />
                  {formData.image_url && <Button size="sm" variant="ghost" className="text-red-400" onClick={async () => {
                    try { await axios.delete(`${API}/products/${editingProduct.id}/image`); setFormData({...formData, image_url: ''}); toast.success(t('deleteImage') + ' OK'); }
                    catch (err) { toast.error(t('operationFailed')); }
                  }}>{t('deleteImage')}</Button>}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowForm(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleSubmit} className="bg-emerald-500 hover:bg-emerald-600" data-testid="product-submit">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader><DialogTitle>{t('importProducts')}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={(e) => setImportFile(e.target.files[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 file:cursor-pointer" data-testid="import-file-input" />
              <p className="text-xs text-slate-400 mt-2">{t('supportedFormats')}: Excel (.xlsx/.xls), CSV, JSON</p>
            </div>
            <div><label className="text-sm text-slate-300 block mb-1">{t('duplicateHandling')}</label>
              <Select value={importMode} onValueChange={setImportMode}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="skip">{t('skipDuplicate')}</SelectItem><SelectItem value="overwrite">{t('overwriteDuplicate')}</SelectItem></SelectContent>
              </Select>
            </div>
            <Button onClick={downloadTemplate} variant="outline" className="w-full border-slate-600 text-slate-300" data-testid="download-template-btn"><Download className="w-4 h-4 mr-2" /> {t('downloadTemplate')}</Button>
            {importResult && (
              <div className="bg-slate-700 rounded-lg p-4 space-y-1">
                <h4 className="font-medium text-white mb-2">{t('importResult')}</h4>
                <p className="text-emerald-400 text-sm">{t('created')}: {importResult.created}</p>
                <p className="text-blue-400 text-sm">{t('updated')}: {importResult.updated}</p>
                <p className="text-yellow-400 text-sm">{t('skipped')}: {importResult.skipped}</p>
                <p className="text-red-400 text-sm">{t('failed')}: {importResult.failed}</p>
                {importResult.errors?.length > 0 && <div className="mt-2 text-xs text-red-300 space-y-1">{importResult.errors.map((err, i) => <p key={i}>{err}</p>)}</div>}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowImport(false)} className="border-slate-600">{t('cancel')}</Button>
            <Button onClick={handleImport} disabled={!importFile || importing} className="bg-emerald-500 hover:bg-emerald-600" data-testid="start-import-btn">{importing ? t('importing') : t('startImport')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden price label print */}
      <PriceLabelPrint ref={priceLabelRef} products={selectedProducts} exchangeRates={exchangeRates} categories={categories} t={t} />
    </div>
  );
}
