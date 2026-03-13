import React, { forwardRef } from "react";

// Price labels for printing (grid layout)
export const PriceLabelPrint = forwardRef(({ products, exchangeRates, categories, t }, ref) => {
  const sysRate = exchangeRates?.usd_to_ves || 1;
  const localSymbol = exchangeRates?.local_currency_symbol || 'Bs.';

  const getCatRate = (categoryId) => {
    const cat = categories?.find(c => c.id === categoryId);
    return (cat?.exchange_rate && cat.exchange_rate > 1) ? cat.exchange_rate : sysRate;
  };

  return (
    <div ref={ref} className="pricelabel-print-area" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 8mm; }
          body * { visibility: hidden !important; }
          .pricelabel-print-area, .pricelabel-print-area * { visibility: visible !important; }
          .pricelabel-print-area {
            display: block !important;
            position: fixed !important;
            left: 0; top: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            color: #000;
            background: #fff;
          }
        }
      `}</style>
      <div style={{ width: '100%', fontFamily: 'Arial, sans-serif', color: '#000', background: '#fff', padding: '4mm' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {(products || []).map((product, idx) => {
            const p1 = product.price1 || product.retail_price || 0;
            const p2 = product.price2 || p1;
            const p3 = product.price3 || product.wholesale_price || p1;
            const catRate = getCatRate(product.category_id);

            return (
              <div key={idx} style={{ border: '1.5px solid #000', borderRadius: '4px', padding: '6px', pageBreakInside: 'avoid' }}>
                {/* Product Name */}
                <div style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center', borderBottom: '1px solid #ccc', paddingBottom: '3px', marginBottom: '3px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                {/* Code */}
                <div style={{ fontSize: '9px', textAlign: 'center', color: '#666', marginBottom: '4px' }}>
                  {product.code}
                </div>
                {/* Prices */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2px', fontSize: '9px', textAlign: 'center' }}>
                  <div style={{ background: '#e8f5e9', padding: '2px', borderRadius: '2px' }}>
                    <div style={{ color: '#666', fontSize: '7px' }}>{t('price1')}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>${p1.toFixed(2)}</div>
                    <div style={{ color: '#1565c0', fontSize: '8px' }}>{localSymbol}{(p1 * catRate).toFixed(2)}</div>
                  </div>
                  <div style={{ background: '#fff8e1', padding: '2px', borderRadius: '2px' }}>
                    <div style={{ color: '#666', fontSize: '7px' }}>{t('price2')}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>${p2.toFixed(2)}</div>
                    <div style={{ color: '#1565c0', fontSize: '8px' }}>{localSymbol}{(p2 * catRate).toFixed(2)}</div>
                  </div>
                  <div style={{ background: '#e3f2fd', padding: '2px', borderRadius: '2px' }}>
                    <div style={{ color: '#666', fontSize: '7px' }}>{t('price3Box')}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '12px' }}>${p3.toFixed(2)}</div>
                    <div style={{ color: '#1565c0', fontSize: '8px' }}>{localSymbol}{(p3 * catRate).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

PriceLabelPrint.displayName = 'PriceLabelPrint';
