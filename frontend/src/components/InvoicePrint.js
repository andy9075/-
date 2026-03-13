import React, { forwardRef } from "react";

// A4 Invoice
export const InvoicePrint = forwardRef(({ order, settings, exchangeRates, t }, ref) => {
  const sysRate = exchangeRates?.usd_to_ves || 1;
  const localSymbol = exchangeRates?.local_currency_symbol || 'Bs.';
  const now = order?.created_at ? new Date(order.created_at) : new Date();
  const subtotal = (order?.items || []).reduce((s, i) => s + (i.amount || i.unit_price * i.quantity), 0);
  const totalAmount = order?.total_amount || subtotal;

  return (
    <div ref={ref} className="invoice-print-area" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body * { visibility: hidden !important; }
          .invoice-print-area, .invoice-print-area * { visibility: visible !important; }
          .invoice-print-area {
            display: block !important;
            position: fixed !important;
            left: 0; top: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            background: #fff;
          }
        }
      `}</style>
      <div style={{ width: '100%', fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#000', background: '#fff', padding: '10mm' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{settings?.company_name || 'POS System'}</h1>
            {settings?.company_tax_id && <p style={{ margin: '2px 0', color: '#444' }}>RIF: {settings.company_tax_id}</p>}
            {settings?.company_address && <p style={{ margin: '2px 0', color: '#444' }}>{settings.company_address}</p>}
            {settings?.company_phone && <p style={{ margin: '2px 0', color: '#444' }}>Tel: {settings.company_phone}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, color: '#333' }}>FACTURA</h2>
            <p style={{ margin: '4px 0', fontWeight: 'bold', fontSize: '14px' }}>N&deg; {order?.order_no || '-'}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>{t('date')}: {now.toLocaleDateString()}</p>
            <p style={{ margin: '2px 0', color: '#666' }}>{t('time')}: {now.toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Customer & Store info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '20px' }}>
          <div style={{ flex: 1, background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', color: '#666' }}>{t('customer')}</h3>
            <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{order?.customer_name || 'Cliente General'}</p>
            {order?.customer_phone && <p style={{ margin: '2px 0' }}>Tel: {order.customer_phone}</p>}
          </div>
          <div style={{ flex: 1, background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            <h3 style={{ fontSize: '12px', fontWeight: 'bold', margin: '0 0 4px 0', textTransform: 'uppercase', color: '#666' }}>{t('storeManagement')}</h3>
            <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{order?.store_name || '-'}</p>
            <p style={{ margin: '2px 0' }}>{t('username')}: {order?.cashier || '-'}</p>
          </div>
        </div>

        {/* Items table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
          <thead>
            <tr style={{ background: '#333', color: '#fff' }}>
              <th style={{ padding: '8px', textAlign: 'left', width: '40px' }}>#</th>
              <th style={{ padding: '8px', textAlign: 'left' }}>{t('productName')}</th>
              <th style={{ padding: '8px', textAlign: 'center', width: '60px' }}>{t('quantity')}</th>
              <th style={{ padding: '8px', textAlign: 'right', width: '90px' }}>{t('unitPrice')} ($)</th>
              <th style={{ padding: '8px', textAlign: 'right', width: '90px' }}>{t('unitPrice')} ({localSymbol})</th>
              <th style={{ padding: '8px', textAlign: 'right', width: '100px' }}>{t('amount')} ($)</th>
              <th style={{ padding: '8px', textAlign: 'right', width: '100px' }}>{t('amount')} ({localSymbol})</th>
            </tr>
          </thead>
          <tbody>
            {(order?.items || []).map((item, idx) => {
              const amt = item.amount || (item.unit_price * item.quantity);
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                  <td style={{ padding: '6px 8px', fontWeight: '500' }}>{item.product_name || item.name}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>${item.unit_price?.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{localSymbol}{(item.unit_price * sysRate).toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>${amt.toFixed(2)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{localSymbol}{(amt * sysRate).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '320px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)} / {localSymbol}{(subtotal * sysRate).toFixed(2)}</span>
            </div>
            {order?.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee', color: 'red' }}>
              <span>{t('discount')} ({order.discount}%):</span>
              <span>-${(subtotal * order.discount / 100).toFixed(2)}</span>
            </div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 'bold', fontSize: '16px', borderTop: '2px solid #000', marginTop: '4px' }}>
              <span>TOTAL:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontWeight: 'bold', fontSize: '14px', color: '#555' }}>
              <span>TOTAL {localSymbol}:</span>
              <span>{localSymbol}{(totalAmount * sysRate).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment info */}
        <div style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            <span><strong>{t('paymentMethod')}:</strong> {order?.payment_method === 'cash' ? t('cash') : order?.payment_method === 'card' ? t('card') : order?.payment_method || '-'}</span>
            <span><strong>Tasa:</strong> $1 = {localSymbol}{sysRate}</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '12px', color: '#888', fontSize: '10px' }}>
          {settings?.invoice_footer && <p style={{ margin: '4px 0' }}>{settings.invoice_footer}</p>}
          <p style={{ margin: '4px 0' }}>{settings?.company_name || 'POS'} - {now.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
});

InvoicePrint.displayName = 'InvoicePrint';
