import React, { forwardRef } from "react";

// SENIAT Fiscal Document (80mm thermal with fiscal fields)
export const FiscalPrint = forwardRef(({ order, settings, exchangeRates, t }, ref) => {
  const sysRate = exchangeRates?.usd_to_ves || 1;
  const localSymbol = exchangeRates?.local_currency_symbol || 'Bs.';
  const now = order?.date ? new Date(order.date) : new Date();

  // Group items by tax rate
  const taxGroups = {};
  (order?.items || []).forEach(item => {
    const rate = item.tax_rate ?? 16;
    if (!taxGroups[rate]) taxGroups[rate] = { items: [], base: 0, tax: 0, total: 0 };
    const amt = item.amount || (item.unit_price * item.quantity);
    const base = amt / (1 + rate / 100);
    const tax = amt - base;
    taxGroups[rate].items.push(item);
    taxGroups[rate].base += base;
    taxGroups[rate].tax += tax;
    taxGroups[rate].total += amt;
  });

  const totalBase = Object.values(taxGroups).reduce((s, g) => s + g.base, 0);
  const totalTax = Object.values(taxGroups).reduce((s, g) => s + g.tax, 0);

  return (
    <div ref={ref} className="fiscal-print-area" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 2mm; }
          body * { visibility: hidden !important; }
          .fiscal-print-area, .fiscal-print-area * { visibility: visible !important; }
          .fiscal-print-area {
            display: block !important;
            position: fixed !important;
            left: 0; top: 0;
            width: 76mm;
            font-family: 'Courier New', monospace;
            font-size: 10px;
            color: #000;
            background: #fff;
            line-height: 1.3;
          }
        }
      `}</style>
      <div style={{ width: '76mm', fontFamily: "'Courier New', monospace", fontSize: '10px', color: '#000', background: '#fff', padding: '2mm' }}>
        {/* SENIAT Header */}
        <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{settings?.company_name || 'EMPRESA'}</div>
          {settings?.company_tax_id && <div style={{ fontWeight: 'bold' }}>RIF: {settings.company_tax_id}</div>}
          {settings?.company_address && <div>{settings.company_address}</div>}
          {settings?.company_phone && <div>Tel: {settings.company_phone}</div>}
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '3px', letterSpacing: '1px' }}>DOCUMENTO FISCAL</div>
          {settings?.seniat_machine_serial && <div>MF: {settings.seniat_machine_serial}</div>}
          {settings?.seniat_authorization_number && <div>NIT: {settings.seniat_authorization_number}</div>}
        </div>

        {/* Document info */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>FACTURA N:</span>
            <span style={{ fontWeight: 'bold' }}>{order?.fiscal_no || order?.order_no || '-'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>FECHA:</span>
            <span>{now.toLocaleDateString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>HORA:</span>
            <span>{now.toLocaleTimeString()}</span>
          </div>
          {order?.cashier && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>CAJERO:</span><span>{order.cashier}</span>
          </div>}
          {order?.customer_name && order.customer_name !== 'Cliente General' && <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>CLIENTE:</span><span>{order.customer_name}</span>
          </div>}
        </div>

        {/* Items */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th style={{ textAlign: 'left', padding: '1px 0' }}>DESC</th>
                <th style={{ textAlign: 'center', padding: '1px', width: '25px' }}>C</th>
                <th style={{ textAlign: 'right', padding: '1px', width: '40px' }}>P/U</th>
                <th style={{ textAlign: 'center', padding: '1px', width: '20px' }}>T</th>
                <th style={{ textAlign: 'right', padding: '1px 0', width: '50px' }}>MONTO</th>
              </tr>
            </thead>
            <tbody>
              {(order?.items || []).map((item, idx) => {
                const amt = item.amount || (item.unit_price * item.quantity);
                const rate = item.tax_rate ?? 16;
                const taxLabel = rate === 0 ? 'E' : rate === 8 ? 'R' : 'G';
                return (
                  <tr key={idx}>
                    <td style={{ padding: '1px 0', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name || item.name}</td>
                    <td style={{ textAlign: 'center', padding: '1px' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: '1px' }}>{(item.unit_price * sysRate).toFixed(2)}</td>
                    <td style={{ textAlign: 'center', padding: '1px', fontWeight: 'bold' }}>{taxLabel}</td>
                    <td style={{ textAlign: 'right', padding: '1px 0' }}>{(amt * sysRate).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tax Legend */}
        <div style={{ fontSize: '9px', borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <div>G=General 16% | R=Reducido 8% | E=Exento 0%</div>
        </div>

        {/* Tax Breakdown */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          {Object.entries(taxGroups).sort(([a],[b]) => Number(b) - Number(a)).map(([rate, group]) => (
            <div key={rate}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Base Imp. {rate}%:</span>
                <span>{localSymbol}{(group.base * sysRate).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>IVA {rate}%:</span>
                <span>{localSymbol}{(group.tax * sysRate).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', borderTop: '1px solid #000', paddingTop: '2px' }}>
            <span>Total Base:</span>
            <span>{localSymbol}{(totalBase * sysRate).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total IVA:</span>
            <span>{localSymbol}{(totalTax * sysRate).toFixed(2)}</span>
          </div>
        </div>

        {/* Totals */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 'bold' }}>
            <span>TOTAL {localSymbol}:</span>
            <span>{localSymbol}{((order?.total_amount || 0) * sysRate).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
            <span>TOTAL $:</span>
            <span>${(order?.total_amount || 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#666' }}>
            <span>Tasa: $1 = {localSymbol}{sysRate}</span>
          </div>
        </div>

        {/* Payment */}
        <div style={{ borderBottom: '1px dashed #000', paddingBottom: '3px', marginBottom: '3px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>PAGO:</span>
            <span style={{ fontWeight: 'bold' }}>{order?.payment_method === 'cash' ? 'EFECTIVO' : order?.payment_method === 'card' ? 'TARJETA' : order?.payment_method === 'transfer' ? 'TRANSFERENCIA' : (order?.payment_method || '-').toUpperCase()}</span>
          </div>
        </div>

        {/* Fiscal Footer */}
        <div style={{ textAlign: 'center', paddingTop: '3px', fontSize: '9px' }}>
          <div style={{ fontWeight: 'bold' }}>*** DOCUMENTO FISCAL ***</div>
          <div>SENIAT</div>
          {settings?.invoice_footer && <div style={{ marginTop: '2px' }}>{settings.invoice_footer}</div>}
          <div style={{ marginTop: '2px' }}>{settings?.company_name} - {now.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
});

FiscalPrint.displayName = 'FiscalPrint';
