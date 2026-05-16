import React from 'react';

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

export default function Ticket({ sale, onClose }) {
  if (!sale) return null;
  const handlePrint = () => window.print();

  return (
    <>
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.previewCard} onClick={e => e.stopPropagation()}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>Vista previa del ticket</span>
            <div style={styles.previewActions}>
              <button style={styles.printBtn} onClick={handlePrint}>🖨️ Imprimir</button>
              <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>
          <div style={styles.ticketWrap}><TicketBody sale={sale} /></div>
        </div>
      </div>
      <div id="ticket-print" style={{ display: 'none' }}><TicketBody sale={sale} forPrint /></div>
    </>
  );
}

function TicketBody({ sale }) {
  return (
    <div style={ts.paper}>
      <div style={ts.header}>
        <div style={ts.logo}>
          <span style={ts.logoText}>Sand</span>
          <span style={ts.logoDot}>●</span>
          <span style={ts.logoK}>K</span>
        </div>
        <div style={ts.tagline}>JAPANESE GOURMET FRIED SANDWICHES</div>
        <div style={ts.separator}>{'─'.repeat(32)}</div>
        <div style={ts.meta}><span>{sale.date}</span><span>{sale.time}</span></div>
        <div style={ts.ticketNum}>Ticket #{String(sale.id).slice(-6)}</div>
        {sale.seller && <div style={ts.seller}>Vendedor: {sale.seller}</div>}
      </div>
      <div style={ts.separator}>{'─'.repeat(32)}</div>
      <div style={ts.items}>
        <div style={ts.colHeader}><span>ARTÍCULO</span><span>IMPORTE</span></div>
        <div style={ts.separator}>{'─'.repeat(32)}</div>
        {sale.items.map((item, i) => (
          <div key={i} style={ts.itemRow}>
            <div style={ts.itemName}>{item.name}</div>
            <div style={ts.itemDetail}>
              <span style={ts.itemQty}>{item.qty} × {fmt(item.price)}</span>
              <span style={ts.itemTotal}>{fmt(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={ts.separator}>{'═'.repeat(32)}</div>
      <div style={ts.totalSection}>
        <div style={ts.totalRow}>
          <span style={ts.totalLabel}>TOTAL</span>
          <span style={ts.totalAmount}>{fmt(sale.total)}</span>
        </div>
        <div style={ts.payRow}>
          <span style={ts.payLabel}>Forma de pago</span>
          <span style={ts.payMethod}>{sale.method}</span>
        </div>
        {sale.change_amount > 0 && <div style={ts.changeRow}><span>Cambio</span><span style={{ fontWeight: 700 }}>{fmt(sale.change_amount)}</span></div>}
      </div>
      <div style={ts.separator}>{'─'.repeat(32)}</div>
      <div style={ts.taxSection}>
        <div style={ts.taxRow}><span>Base imponible (IVA 10%)</span><span>{fmt(sale.total / 1.1)}</span></div>
        <div style={ts.taxRow}><span>IVA (10%)</span><span>{fmt(sale.total - sale.total / 1.1)}</span></div>
      </div>
      <div style={ts.separator}>{'─'.repeat(32)}</div>
      <div style={ts.footer}>
        <div style={ts.footerLine}>¡Gracias por tu visita!</div>
        <div style={ts.footerLine}>Arigato gozaimasu 🙏</div>
        <div style={ts.footerSub}>sandok.es</div>
        <div style={ts.redBar} />
      </div>
    </div>
  );
}

const ts = {
  paper: { background: '#FAFAF7', width: 300, fontFamily: "'Courier New', monospace", padding: '24px 20px', borderRadius: 4, color: '#1A1A1A' },
  header: { textAlign: 'center', marginBottom: 8 },
  logo: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: 4 },
  logoText: { fontSize: 28, fontWeight: 300, fontFamily: "'DM Sans',sans-serif", letterSpacing: -0.5 },
  logoDot: { fontSize: 20, color: '#CC0000', margin: '0 2px' },
  logoK: { fontSize: 28, fontWeight: 900, fontFamily: "'DM Sans',sans-serif", letterSpacing: -1 },
  tagline: { fontSize: 7, letterSpacing: 2, color: '#555', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" },
  separator: { fontSize: 11, color: '#999', lineHeight: 1.8 },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 6 },
  ticketNum: { fontSize: 11, color: '#999', marginTop: 2 },
  seller: { fontSize: 11, color: '#888', marginTop: 2 },
  items: { margin: '8px 0' },
  colHeader: { display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: 1.5, color: '#888', fontFamily: "'DM Sans',sans-serif", fontWeight: 700, marginBottom: 4 },
  itemRow: { marginBottom: 8 },
  itemName: { fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginBottom: 2 },
  itemDetail: { display: 'flex', justifyContent: 'space-between', fontSize: 11 },
  itemQty: { color: '#666' },
  itemTotal: { fontWeight: 700 },
  totalSection: { margin: '10px 0 8px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  totalLabel: { fontSize: 16, fontWeight: 900, fontFamily: "'DM Sans',sans-serif", letterSpacing: 1 },
  totalAmount: { fontSize: 24, fontWeight: 900, fontFamily: "'DM Sans',sans-serif" },
  payRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 },
  payLabel: { color: '#888' },
  payMethod: { fontWeight: 700, fontFamily: "'DM Sans',sans-serif" },
  changeRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555' },
  taxSection: { margin: '8px 0' },
  taxRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 3 },
  footer: { textAlign: 'center', marginTop: 10 },
  footerLine: { fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginBottom: 2 },
  footerSub: { fontSize: 10, color: '#999', marginTop: 4, marginBottom: 10 },
  redBar: { height: 4, background: '#CC0000', borderRadius: 2, margin: '0 20px' },
};

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 },
  previewCard: { background: '#1A1A1A', border: '1px solid #333', borderRadius: 20, padding: 24, maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 },
  previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  previewTitle: { fontSize: 14, fontWeight: 700, color: '#D4A017', letterSpacing: 1, textTransform: 'uppercase' },
  previewActions: { display: 'flex', gap: 10 },
  printBtn: { background: '#D4A017', border: 'none', color: '#111', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' },
  closeBtn: { background: 'none', border: '1px solid #444', color: '#888', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  ticketWrap: { display: 'flex', justifyContent: 'center' },
};
