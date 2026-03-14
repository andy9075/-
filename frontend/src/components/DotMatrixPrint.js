import React, { forwardRef } from "react";

// Dot Matrix / Continuous Form Invoice (tractor feed paper, ~80 columns)
export const DotMatrixPrint = forwardRef(({ order, settings, exchangeRates, t }, ref) => {
  const sysRate = exchangeRates?.usd_to_ves || 1;
  const localSymbol = exchangeRates?.local_currency_symbol || 'Bs.';
  const now = order?.date ? new Date(order.date) : new Date();
  const items = order?.items || [];

  // Tax groups
  const taxGroups = {};
  items.forEach(item => {
    const rate = item.tax_rate ?? 16;
    if (!taxGroups[rate]) taxGroups[rate] = { base: 0, tax: 0 };
    const amt = item.amount || (item.unit_price * item.quantity);
    const base = amt / (1 + rate / 100);
    taxGroups[rate].base += base;
    taxGroups[rate].tax += amt - base;
  });
  const totalBase = Object.values(taxGroups).reduce((s, g) => s + g.base, 0);
  const totalTax = Object.values(taxGroups).reduce((s, g) => s + g.tax, 0);

  // Repeat '-' for separator
  const sep = '-'.repeat(78);

  return (
    <div ref={ref} className="dotmatrix-print-area" style={{ display: 'none' }}>
      <style>{`
        @media print {
          @page { size: 241mm 280mm; margin: 10mm 5mm; }
          body * { visibility: hidden !important; }
          .dotmatrix-print-area, .dotmatrix-print-area * { visibility: visible !important; }
          .dotmatrix-print-area {
            display: block !important;
            position: fixed !important;
            left: 0; top: 0;
            width: 100%;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            line-height: 1.5;
            white-space: pre;
          }
        }
      `}</style>
      <div style={{ width: '100%', fontFamily: "'Courier New', Courier, monospace", fontSize: '12px', color: '#000', background: '#fff', padding: '5mm', whiteSpace: 'pre', lineHeight: '1.5' }}>
{/* Header */}
{`${sep}
  ${(settings?.company_name || 'EMPRESA').toUpperCase().padStart(40 + (settings?.company_name || 'EMPRESA').length / 2).padEnd(78)}
  ${settings?.company_tax_id ? ('RIF: ' + settings.company_tax_id).padStart(40 + ('RIF: ' + settings.company_tax_id).length / 2).padEnd(78) : ''}
  ${settings?.company_address ? settings.company_address.padStart(40 + settings.company_address.length / 2).padEnd(78) : ''}
  ${settings?.company_phone ? ('Tel: ' + settings.company_phone).padStart(40 + ('Tel: ' + settings.company_phone).length / 2).padEnd(78) : ''}
${'FACTURA DE VENTA AL MAYOR'.padStart(40 + 25/2).padEnd(78)}
${sep}
  FACTURA No.: ${(order?.order_no || '-').padEnd(25)} FECHA: ${now.toLocaleDateString()}
  VENDEDOR: ${(order?.cashier || '-').padEnd(27)}   HORA: ${now.toLocaleTimeString()}
  TIENDA: ${(order?.store || '-').padEnd(29)}
  CLIENTE: ${(order?.customer_name || 'Cliente General').padEnd(28)}
${sep}
  ${'CODIGO'.padEnd(12)} ${'DESCRIPCION'.padEnd(22)} ${'CANT'.padStart(6)} ${'P/UNIT'.padStart(10)} ${'IVA%'.padStart(5)} ${'MONTO'.padStart(12)}  
${sep}
`}
{items.map((item, idx) => {
  const amt = item.amount || (item.unit_price * item.quantity);
  const code = (item.product_code || item.product_id || '').substring(0, 12);
  const name = (item.product_name || item.name || '').substring(0, 22);
  const rate = item.tax_rate ?? 16;
  return `  ${code.padEnd(12)} ${name.padEnd(22)} ${String(item.quantity).padStart(6)} ${('$' + (item.unit_price || 0).toFixed(2)).padStart(10)} ${(rate + '%').padStart(5)} ${('$' + amt.toFixed(2)).padStart(12)}\n`;
}).join('')}
{`${sep}
`}
{/* Tax Breakdown */}
{Object.entries(taxGroups).sort(([a],[b]) => Number(b) - Number(a)).map(([rate, group]) => 
  `  Base Imponible ${rate.padStart(3)}%: $${group.base.toFixed(2).padStart(12)}   IVA ${rate.padStart(3)}%: $${group.tax.toFixed(2).padStart(10)}\n`
).join('')}
{`${sep}
  ${'SUBTOTAL:'.padEnd(20)} ${'$' + (order?.subtotal || order?.total_amount || 0).toFixed(2)}
  ${'TOTAL BASE:'.padEnd(20)} ${'$' + totalBase.toFixed(2)}
  ${'TOTAL IVA:'.padEnd(20)} ${'$' + totalTax.toFixed(2)}
${order?.discount > 0 ? `  ${'DESCUENTO (' + order.discount + '%):'.padEnd(20)} -$${((order.subtotal || order.total_amount || 0) * order.discount / 100).toFixed(2)}\n` : ''}${sep}
  ${'*** TOTAL USD:'.padEnd(20)} ${'$' + (order?.total_amount || 0).toFixed(2)}
  ${'*** TOTAL ' + localSymbol + ':'.padEnd(17)} ${localSymbol + ((order?.total_amount || 0) * sysRate).toFixed(2)}
  ${'TASA:'.padEnd(20)} $1 = ${localSymbol}${sysRate}
${sep}
  FORMA DE PAGO: ${(order?.payment_method === 'cash' ? 'EFECTIVO' : order?.payment_method === 'card' ? 'TARJETA' : order?.payment_method === 'transfer' ? 'TRANSFERENCIA' : (order?.payment_method || '-')).toUpperCase()}
${sep}


  _____________________________          _____________________________
        FIRMA DEL CLIENTE                      FIRMA DEL VENDEDOR


${settings?.invoice_footer ? '  ' + settings.invoice_footer + '\n' : ''}  ${settings?.company_name || 'POS'} - ${now.toLocaleString()}
${sep}
`}
      </div>
    </div>
  );
});

DotMatrixPrint.displayName = 'DotMatrixPrint';
