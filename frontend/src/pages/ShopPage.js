import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Search, Package, ShoppingBag, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import axios, { API } from "@/lib/api";
import { useLang } from "@/context/LangContext";
import { toast } from "sonner";

export default function ShopPage() {
  const { tenantId } = useParams();
  const { t, lang, changeLang } = useLang();
  const [shopInfo, setShopInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exchangeRates, setExchangeRates] = useState({ usd_to_ves: 1, local_currency_symbol: 'Bs.' });
  const [checkoutForm, setCheckoutForm] = useState({ customer_id: "", shipping_name: "", shipping_phone: "", shipping_address: "", payment_method: "transfer", payment_reference: "" });
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    if (!tenantId) { setLoading(false); setNotFound(true); return; }
    const base = `${API}/shop/${tenantId}`;
    Promise.all([
      axios.get(`${base}/info`),
      axios.get(`${base}/products`),
      axios.get(`${base}/categories`),
      axios.get(`${base}/payment-settings`),
      axios.get(`${base}/exchange-rates`),
    ]).then(([info, p, c, ps, er]) => {
      setShopInfo(info.data);
      setProducts(p.data);
      setCategories(c.data);
      setPaymentSettings(ps.data);
      setExchangeRates(er.data);
    }).catch((err) => {
      if (err.response?.status === 404) setNotFound(true);
      else console.error(err);
    }).finally(() => setLoading(false));
  }, [tenantId]);

  const addToCart = (product) => { const price = product.price1 || product.retail_price || 0; const existing = cart.find(i => i.product_id === product.id); if (existing) { setCart(cart.map(i => i.product_id === product.id ? {...i, quantity: i.quantity + 1, amount: (i.quantity + 1) * price} : i)); } else { setCart([...cart, { product_id: product.id, product, quantity: 1, unit_price: price, amount: price }]); } toast.success(t('addToCart')); };
  const updateCartItem = (productId, quantity) => { if (quantity <= 0) { setCart(cart.filter(i => i.product_id !== productId)); } else { setCart(cart.map(i => i.product_id === productId ? {...i, quantity, amount: i.unit_price * quantity} : i)); } };
  const cartTotal = cart.reduce((sum, i) => sum + i.amount, 0);
  const shippingFee = cartTotal >= 100 ? 0 : 10;
  const orderTotal = cartTotal + shippingFee;
  const filteredProducts = products.filter(p => { const matchCat = selectedCategory === "all" || p.category_id === selectedCategory; const matchSearch = !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code?.toLowerCase().includes(searchTerm.toLowerCase()); return matchCat && matchSearch; });

  const handleCheckout = async () => {
    if (!checkoutForm.shipping_name || !checkoutForm.shipping_phone || !checkoutForm.shipping_address) { toast.error("Please fill shipping info"); return; }
    if (!checkoutForm.payment_reference) { toast.error("Please enter payment reference"); return; }
    try {
      const res = await axios.post(`${API}/shop/${tenantId}/orders`, { customer_id: checkoutForm.customer_id || "guest", items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price, discount: 0, amount: i.amount })), shipping_name: checkoutForm.shipping_name, shipping_phone: checkoutForm.shipping_phone, shipping_address: checkoutForm.shipping_address, payment_method: checkoutForm.payment_method, payment_reference: checkoutForm.payment_reference });
      setOrderSuccess(res.data); setCart([]); setShowCheckout(false); setShowCart(false); toast.success("Order placed!");
    } catch (e) { toast.error(e.response?.data?.detail || "Order failed"); }
  };

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-slate-400 text-lg">Loading...</div></div>;
  if (notFound) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-16 h-16 text-slate-500 mx-auto mb-4" />
        <h1 className="text-2xl text-white font-bold mb-2">Shop Not Found</h1>
        <p className="text-slate-400">This shop does not exist or is currently inactive.</p>
        <Link to="/login" className="text-emerald-400 hover:underline text-sm mt-4 inline-block">Back to Login</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/sellox-logo.png" alt="Sellox" className="w-10 h-10 rounded-xl" />
            <div>
              <h1 className="text-xl font-bold text-white" data-testid="shop-name">{shopInfo?.name || t('shopTitle')}</h1>
              <p className="text-xs text-slate-500">Powered by Sellox</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-0.5">{[{k:'zh',l:'中'},{k:'en',l:'EN'},{k:'es',l:'ES'}].map(({k,l}) => (<button key={k} onClick={() => changeLang(k)} className={`px-1.5 py-0.5 text-xs rounded ${lang === k ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'}`} data-testid={`shop-lang-${k}`}>{l}</button>))}</div>
            <Button variant="outline" className="relative border-slate-600 text-slate-300" onClick={() => setShowCart(true)} data-testid="cart-btn">
              <ShoppingBag className="w-5 h-5" />
              {cart.length > 0 && <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-500 rounded-full text-xs flex items-center justify-center text-white">{cart.length}</span>}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-2">
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><Input placeholder={t('searchProduct')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-slate-800 border-slate-700 text-white" data-testid="shop-search" /></div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant={selectedCategory === "all" ? "default" : "outline"} onClick={() => setSelectedCategory("all")} className={`h-8 ${selectedCategory === "all" ? "bg-emerald-500" : "border-slate-600 text-slate-300"}`} data-testid="shop-cat-all">{t('all')}</Button>
            {categories.map(cat => (<Button key={cat.id} size="sm" variant={selectedCategory === cat.id ? "default" : "outline"} onClick={() => setSelectedCategory(cat.id)} className={`h-8 ${selectedCategory === cat.id ? "bg-emerald-500" : "border-slate-600 text-slate-300"}`} data-testid={`shop-cat-${cat.id}`}>{cat.name}</Button>))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => { const price = product.price1 || product.retail_price || 0; const sysRate = exchangeRates.usd_to_ves || 1; const localSymbol = exchangeRates.local_currency_symbol || 'Bs.'; return (
            <Card key={product.id} className="bg-slate-800 border-slate-700 overflow-hidden group">
              <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center relative">
                {product.image_url ? <img src={`${API.replace('/api', '')}${product.image_url}`} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-16 h-16 text-slate-600 group-hover:text-slate-500 transition-colors" />}
              </div>
              <CardContent className="p-4">
                <h3 className="text-white font-medium truncate">{product.name}</h3>
                <p className="text-slate-500 text-xs">{product.code}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-emerald-400 font-bold text-lg">${price.toFixed(2)}</span>
                    <span className="text-cyan-400 text-sm">{localSymbol}{(price * sysRate).toFixed(2)}</span>
                  </div>
                  <div className="text-slate-500 text-xs">{t('stock')}: {product.stock}</div>
                </div>
                <Button className="w-full mt-3 bg-emerald-500 hover:bg-emerald-600" onClick={() => addToCart(product)} disabled={product.stock <= 0} data-testid={`add-to-cart-${product.id}`}>{product.stock > 0 ? t('addToCart') : t('noData')}</Button>
              </CardContent>
            </Card>
          ); })}
          {filteredProducts.length === 0 && <div className="col-span-full text-center py-12 text-slate-400">{t('noData')}</div>}
        </div>
      </main>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>{t('cart')}</DialogTitle></DialogHeader>{cart.length === 0 ? <p className="text-slate-400 text-center py-8">{t('noData')}</p> : <div className="space-y-4">{cart.map(item => (<div key={item.product_id} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg"><div className="flex-1"><p className="text-white font-medium">{item.product.name}</p><p className="text-emerald-400">${item.unit_price?.toFixed(2)}</p></div><div className="flex items-center gap-2"><Button size="sm" variant="outline" onClick={() => updateCartItem(item.product_id, item.quantity - 1)} className="border-slate-600">-</Button><span className="w-8 text-center">{item.quantity}</span><Button size="sm" variant="outline" onClick={() => updateCartItem(item.product_id, item.quantity + 1)} className="border-slate-600">+</Button></div></div>))}<div className="border-t border-slate-700 pt-4"><div className="flex justify-between text-lg"><span className="text-slate-300">{t('total')}:</span><span className="text-emerald-400 font-bold">${cartTotal.toFixed(2)}</span></div><Button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600" onClick={() => { setShowCart(false); setShowCheckout(true); }} data-testid="checkout-btn">{t('checkoutTitle')}</Button></div></div>}</DialogContent></Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}><DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{t('paymentInfo')}</DialogTitle></DialogHeader><div className="space-y-4">
        <div className="space-y-3"><h3 className="text-sm font-medium text-emerald-400">{t('shippingInfo')}</h3><div><label className="text-sm text-slate-300">{t('name')}</label><Input value={checkoutForm.shipping_name} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_name: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-name" /></div><div><label className="text-sm text-slate-300">{t('phone')}</label><Input value={checkoutForm.shipping_phone} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_phone: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-phone" /></div><div><label className="text-sm text-slate-300">{t('address')}</label><Input value={checkoutForm.shipping_address} onChange={(e) => setCheckoutForm({...checkoutForm, shipping_address: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="checkout-address" /></div></div>
        <div className="space-y-3 border-t border-slate-700 pt-4"><h3 className="text-sm font-medium text-emerald-400">{t('paymentMethod')}</h3><div className="grid grid-cols-2 gap-3">{paymentSettings?.transfer_enabled && <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${checkoutForm.payment_method === 'transfer' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'}`} onClick={() => setCheckoutForm({...checkoutForm, payment_method: 'transfer'})} data-testid="payment-transfer"><p className="font-medium text-white">Transferencia</p></div>}{paymentSettings?.pago_movil_enabled && <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${checkoutForm.payment_method === 'pago_movil' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600'}`} onClick={() => setCheckoutForm({...checkoutForm, payment_method: 'pago_movil'})} data-testid="payment-pago-movil"><p className="font-medium text-white">Pago Movil</p></div>}</div>
          <div><label className="text-sm text-slate-300">Referencia *</label><Input value={checkoutForm.payment_reference} onChange={(e) => setCheckoutForm({...checkoutForm, payment_reference: e.target.value})} className="bg-slate-700 border-slate-600" data-testid="payment-reference" /></div></div>
        <div className="border-t border-slate-700 pt-4 space-y-2"><div className="flex justify-between"><span className="text-slate-300">Subtotal:</span><span className="text-white">${cartTotal.toFixed(2)}</span></div><div className="flex justify-between"><span className="text-slate-300">Envio:</span><span className="text-white">{shippingFee === 0 ? 'Gratis' : `$${shippingFee.toFixed(2)}`}</span></div><div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-700"><span className="text-slate-300">Total:</span><span className="text-emerald-400">${orderTotal.toFixed(2)}</span></div></div>
      </div><div className="flex justify-end gap-3 mt-4"><Button variant="outline" onClick={() => setShowCheckout(false)} className="border-slate-600">Cancelar</Button><Button onClick={handleCheckout} className="bg-emerald-500 hover:bg-emerald-600" data-testid="place-order-btn">Confirmar Pedido</Button></div></DialogContent></Dialog>

      {/* Order Success */}
      <Dialog open={!!orderSuccess} onOpenChange={() => setOrderSuccess(null)}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle className="text-emerald-400">Pedido Exitoso!</DialogTitle></DialogHeader>{orderSuccess && <div className="space-y-4"><div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 text-center"><Check className="w-12 h-12 text-emerald-400 mx-auto mb-2" /><p className="text-lg font-medium">Pedido #{orderSuccess.order_no}</p></div>{paymentSettings?.whatsapp_number && <a href={`https://wa.me/${paymentSettings.whatsapp_number}?text=${encodeURIComponent(`Hola! Pedido #${orderSuccess.order_no} - Total: $${(orderSuccess.total_amount + orderSuccess.shipping_fee).toFixed(2)}`)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors" data-testid="whatsapp-contact-btn">Contactar por WhatsApp</a>}<Button onClick={() => setOrderSuccess(null)} className="w-full bg-slate-700 hover:bg-slate-600">Cerrar</Button></div>}</DialogContent></Dialog>
    </div>
  );
}
