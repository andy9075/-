import React, { forwardRef } from "react";

// 80mm thermal receipt (approx 48 chars wide)
export const ReceiptPrint = forwardRef(({ order, settings, exchangeRates, t }, ref) => {
  const sysRate = exchangeRates?.usd_to_ves || 1;
  const localSymbol = exchangeRates?.local_currency_symbol || 'Bs.';
  const now = order?.date ? new Date(order.date) : new Date();

  return (
    <div ref={ref} className="receipt-print-area" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          body * { visibility: hidden !important; }
          .receipt-print-area, .receipt-print-area * { visibility: visible !important; }
          .receipt-print-area {
            display: block !important;
            position: fixed !important;
            left: 0; top: 0;
            width: 76mm;
            font-family: 'Courier New', monospace;
            font-size: 11px;
            color: #000;
            background: #fff;
            line-height: 1.4;
          }
        }
      `}</style>
      <div style={{ width: '76mm', fontFamily: "'Courier New', monospace", fontSize: '11px', color: '#000', background: '#fff', padding: '2mm' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{settings?.company_name || 'POS System'}</div>
          {settings?.company_tax_id && <div>RIF: {settings.company_tax_id}</div>}
          {settings?.company_address && <div>{settings.company_address}</div>}
          {settings?.company_phone && <div>Tel: {settings.company_phone}</div>}
          {settings?.invoice_header && <div>{settings.invoice_header}</div>}
        </div>

        {/* Order info */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('orderNo')}:</span>
            <span style={{ fontWeight: 'bold' }}>{order?.order_no || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('date')}:</span>
            <span>{now.toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('time')}:</span>
            <span>{now.toLocaleTimeString()}</span>
          </div>
          {order?.cashier && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('username')}:</span>
            <span>{order.cashier}</span>
          </div>}
          {order?.store && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('storeManagement')}:</span>
            <span>{order.store}</span>
          </div>}
        </div>

        {/* Items */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '2px 0' }}>{t('productName')}</th>
                <th style={{ textAlign: 'center', padding: '2px', width: '30px' }}>{t('quantity')}</th>
                <th style={{ textAlign: 'right', padding: '2px', width: '50px' }}>{t('unitPrice')}</th>
                <th style={{ textAlign: 'right', padding: '2px 0', width: '60px' }}>{t('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {(order?.items || []).map((item, idx) => {
                const amt = item.amount || (item.unit_price * item.quantity);
                return (
                  <tr key={idx}>
                    <td style={{ padding: '2px 0', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name || item.name}</td>
                    <td style={{ textAlign: 'center', padding: '2px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '2px' }}>${item.unit_price?.toFixed(2)}</td>
                    <td style={{ textAlign: 'right', padding: '2px 0' }}>${amt.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>${(order?.subtotal || order?.total_amount || 0).toFixed(2)}</span>
          </div>
          {order?.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('discount')} ({order.discount}%):</span>
            <span>-${((order.subtotal || order.total_amount || 0) * order.discount / 100).toFixed(2)}</span>
          </div>}
          {/* Tax breakdown */}
          {order?.tax_breakdown && Object.keys(order.tax_breakdown).length > 0 && (
            <div style={{ borderTop: '1px dotted #000', marginTop: '2px', paddingTop: '2px' }}>
              {Object.entries(order.tax_breakdown).sort(([a],[b]) => Number(b) - Number(a)).map(([rate, info]) => (
                <div key={rate}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>Base {rate}%:</span>
                    <span>${(info.base || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                    <span>IVA {rate}%:</span>
                    <span>${(info.tax || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '4px' }}>
            <span>TOTAL $:</span>
            <span>${(order?.total_amount || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' }}>
            <span>TOTAL {localSymbol}:</span>
            <span>{localSymbol}{((order?.total_amount || 0) * sysRate).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment info */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '4px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{t('paymentMethod')}:</span>
            <span style={{ fontWeight: 'bold' }}>{order?.payment_method === 'cash' ? t('cash') : order?.payment_method === 'card' ? t('card') : order?.payment_method || '-'}</span>
          </div>
          {order?.payment_method === 'cash' && order?.paid_amount > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('received')}:</span>
              <span>${(order.paid_amount || 0).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>{t('change')}:</span>
              <span>${((order.paid_amount || 0) - (order.total_amount || 0)).toFixed(2)}</span>
            </div>
          </>}
        </div>

        {/* Rate info */}
        <div style={{ textAlign: 'center', fontSize: '9px', color: '#666', marginBottom: '4px' }}>
          <div>$1 = {localSymbol}{sysRate}</div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '4px' }}>
          {settings?.invoice_footer && <div style={{ marginBottom: '4px' }}>{settings.invoice_footer}</div>}
          <div style={{ fontSize: '10px' }}>*** {t('confirm')} ***</div>
        </div>
      </div>
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';
