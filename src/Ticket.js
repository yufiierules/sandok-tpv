import React from 'react';

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';

export default function Ticket({ sale, onClose }) {
  if (!sale) return null;

  const handlePrint = () => window.print();

  return (
    <>
      {/* Overlay en pantalla */}
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.previewCard} onClick={e => e.stopPropagation()}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>Vista previa del ticket</span>
            <div style={styles.previewActions}>
              <button style={styles.printBtn} onClick={handlePrint}>🖨️ Imprimir</button>
              <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Ticket visual */}
          <div style={styles.ticketWrap}>
            <TicketBody sale={sale} />
          </div>
        </div>
      </div>

      {/* Versión para imprimir — solo visible al hacer print */}
      <div id="ticket-print" style={styles.printOnly}>
        <TicketBody sale={sale} forPrint />
      </div>
    </>
  );
}

function TicketBody({ sale, forPrint }) {
  const t = forPrint ? tp : ts;

  return (
    <div style={t.paper}>
      {/* Cabecera */}
      <div style={t.header}>
        <div style={t.logo}>
          <span style={t.logoText}>Sand</span>
          <span style={t.logoDot}>●</span>
          <span style={t.logoK}>K</span>
        </div>
        <div style={t.tagline}>JAPANESE GOURMET FRIED SANDWICHES</div>
        <div style={t.separator}>{'─'.repeat(32)}</div>
        <div style={t.meta}>
          <span>{sale.date}</span>
          <span>{sale.time}</span>
        </div>
        <div style={t.ticketNum}>Ticket #{String(sale.id).slice(-6)}</div>
      </div>

      <div style={t.separator}>{'─'.repeat(32)}</div>

      {/* Líneas de producto */}
      <div style={t.items}>
        <div style={t.colHeader}>
          <span>ARTÍCULO</span>
          <span style={{ textAlign: 'right' }}>IMPORTE</span>
        </div>
        <div style={t.separator}>{'─'.repeat(32)}</div>
        {sale.items.map((item, i) => (
          <div key={i} style={t.itemRow}>
            <div style={t.itemName}>{item.name}</div>
            <div style={t.itemDetail}>
              <span style={t.itemQty}>{item.qty} × {fmt(item.price)}</span>
              <span style={t.itemTotal}>{fmt(item.price * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={t.separator}>{'═'.repeat(32)}</div>

      {/* Total */}
      <div style={t.totalSection}>
        <div style={t.totalRow}>
          <span style={t.totalLabel}>TOTAL</span>
          <span style={t.totalAmount}>{fmt(sale.total)}</span>
        </div>
        <div style={t.payRow}>
          <span style={t.payLabel}>Forma de pago</span>
          <span style={t.payMethod}>{sale.method}</span>
        </div>
        {sale.change > 0 && (
          <div style={t.changeRow}>
            <span>Entregado</span>
            <span>{fmt(sale.total + sale.change)}</span>
          </div>
        )}
        {sale.change > 0 && (
          <div style={t.changeRow}>
            <span>Cambio</span>
            <span style={{ fontWeight: 700 }}>{fmt(sale.change)}</span>
          </div>
        )}
      </div>

      <div style={t.separator}>{'─'.repeat(32)}</div>

      {/* IVA */}
      <div style={t.taxSection}>
        <div style={t.taxRow}>
          <span>Base imponible (IVA 10%)</span>
          <span>{fmt(sale.total / 1.1)}</span>
        </div>
        <div style={t.taxRow}>
          <span>IVA (10%)</span>
          <span>{fmt(sale.total - sale.total / 1.1)}</span>
        </div>
      </div>

      <div style={t.separator}>{'─'.repeat(32)}</div>

      {/* Pie */}
      <div style={t.footer}>
        <div style={t.footerLine}>¡Gracias por tu visita!</div>
        <div style={t.footerLine}>Arigato gozaimasu 🙏</div>
        <div style={t.footerSub}>sandok.es</div>
        <div style={t.redBar} />
      </div>
    </div>
  );
}

// ─── Estilos pantalla ─────────────────────────────────────────────────────────
const ts = {
  paper: { background: '#FAFAF7', width: 300, fontFamily: "'Courier New', monospace", padding: '24px 20px', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.5)', color: '#1A1A1A' },
  header: { textAlign: 'center', marginBottom: 8 },
  logo: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: 4 },
  logoText: { fontSize: 28, fontWeight: 300, fontFamily: "'DM Sans', sans-serif", letterSpacing: -0.5 },
  logoDot: { fontSize: 20, color: '#CC0000', margin: '0 2px' },
  logoK: { fontSize: 28, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", letterSpacing: -1 },
  tagline: { fontSize: 7, letterSpacing: 2, color: '#555', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" },
  separator: { fontSize: 11, color: '#999', letterSpacing: 0, lineHeight: 1.8 },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', marginTop: 6 },
  ticketNum: { fontSize: 11, color: '#999', marginTop: 2 },
  items: { margin: '8px 0' },
  colHeader: { display: 'flex', justifyContent: 'space-between', fontSize: 9, letterSpacing: 1.5, color: '#888', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, marginBottom: 4 },
  itemRow: { marginBottom: 8 },
  itemName: { fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 },
  itemDetail: { display: 'flex', justifyContent: 'space-between', fontSize: 11 },
  itemQty: { color: '#666' },
  itemTotal: { fontWeight: 700 },
  totalSection: { margin: '10px 0 8px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  totalLabel: { fontSize: 16, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", letterSpacing: 1 },
  totalAmount: { fontSize: 24, fontWeight: 900, fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' },
  payRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 },
  payLabel: { color: '#888' },
  payMethod: { fontWeight: 700, fontFamily: "'DM Sans', sans-serif" },
  changeRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555' },
  taxSection: { margin: '8px 0' },
  taxRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#888', marginBottom: 3 },
  footer: { textAlign: 'center', marginTop: 10 },
  footerLine: { fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", marginBottom: 2 },
  footerSub: { fontSize: 10, color: '#999', marginTop: 4, marginBottom: 10 },
  redBar: { height: 4, background: '#CC0000', borderRadius: 2, margin: '0 20px' },
  printOnly: { display: 'none' },
};

// ─── Estilos impresión (80mm) ─────────────────────────────────────────────────
const tp = {
  ...ts,
  paper: { ...ts.paper, width: '76mm', padding: '4mm 3mm', boxShadow: 'none', borderRadius: 0 },
  logo: { ...ts.logo },
  logoText: { ...ts.logoText, fontSize: 22 },
  logoDot: { ...ts.logoDot, fontSize: 16 },
  logoK: { ...ts.logoK, fontSize: 22 },
  tagline: { ...ts.tagline, fontSize: 6 },
  totalAmount: { ...ts.totalAmount, fontSize: 20 },
};

// ─── Overlay y card de preview ────────────────────────────────────────────────
const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 },
  previewCard: { background: '#1A1A1A', border: '1px solid #333', borderRadius: 20, padding: 24, maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 },
  previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  previewTitle: { fontSize: 14, fontWeight: 700, color: '#D4A017', letterSpacing: 1, textTransform: 'uppercase' },
  previewActions: { display: 'flex', gap: 10 },
  printBtn: { background: '#D4A017', border: 'none', color: '#111', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' },
  closeBtn: { background: 'none', border: '1px solid #444', color: '#888', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  ticketWrap: { display: 'flex', justifyContent: 'center' },
  printOnly: { display: 'none' },
};
