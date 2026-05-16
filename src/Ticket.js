import React from 'react';

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

// ─── Datos legales del negocio ────────────────────────────────────────────────
const NEGOCIO = {
  nombre: 'SandoK Écija',
  nombreComercial: 'SandoK',
  direccion: 'Av. Miguel de Cervantes, 13',
  cp: '41400',
  ciudad: 'Écija (Sevilla)',
  actividad: 'Restauración y hostelería',
  iva: 10,
};

export default function Ticket({ sale, onClose }) {
  if (!sale) return null;
  const handlePrint = () => window.print();

  return (
    <>
      {/* Vista previa en pantalla */}
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.previewCard} onClick={e => e.stopPropagation()}>
          <div style={styles.previewHeader}>
            <span style={styles.previewTitle}>Vista previa del ticket</span>
            <div style={styles.previewActions}>
              <button style={styles.printBtn} onClick={handlePrint}>🖨️ Imprimir</button>
              <button style={styles.closeBtn} onClick={onClose}>✕</button>
            </div>
          </div>
          <div style={styles.ticketWrap}>
            <TicketBody sale={sale} />
          </div>
        </div>
      </div>

      {/* Versión para imprimir */}
      <div id="ticket-print" style={{ display: 'none' }}>
        <TicketBody sale={sale} forPrint />
      </div>
    </>
  );
}

function TicketBody({ sale }) {
  const baseImponible = Number(sale.total) / (1 + NEGOCIO.iva / 100);
  const cuotaIva = Number(sale.total) - baseImponible;
  const numTicket = String(sale.id).slice(-8).toUpperCase();

  return (
    <div style={ts.paper}>

      {/* ── CABECERA LEGAL ── */}
      <div style={ts.header}>
        {/* Logo */}
        <div style={ts.logo}>
          <span style={ts.logoText}>Sand</span>
          <span style={ts.logoDot}>●</span>
          <span style={ts.logoK}>K</span>
        </div>
        <div style={ts.tagline}>JAPANESE GOURMET FRIED SANDWICHES</div>

        <div style={ts.sep}>{'─'.repeat(34)}</div>

        {/* Datos fiscales obligatorios */}
        <div style={ts.legalBlock}>
          <div style={ts.legalLine}>{NEGOCIO.nombre}</div>
          <div style={ts.legalLine}>{NEGOCIO.direccion}</div>
          <div style={ts.legalLine}>{NEGOCIO.cp} {NEGOCIO.ciudad}</div>
        </div>

        <div style={ts.sep}>{'─'.repeat(34)}</div>

        {/* Número y fecha */}
        <div style={ts.metaRow}>
          <span style={ts.metaLabel}>Nº TICKET</span>
          <span style={ts.metaVal}>{numTicket}</span>
        </div>
        <div style={ts.metaRow}>
          <span style={ts.metaLabel}>FECHA</span>
          <span style={ts.metaVal}>{sale.date}</span>
        </div>
        <div style={ts.metaRow}>
          <span style={ts.metaLabel}>HORA</span>
          <span style={ts.metaVal}>{sale.time}</span>
        </div>
        {sale.seller && (
          <div style={ts.metaRow}>
            <span style={ts.metaLabel}>ATENDIDO POR</span>
            <span style={ts.metaVal}>{sale.seller}</span>
          </div>
        )}
      </div>

      <div style={ts.sep}>{'─'.repeat(34)}</div>

      {/* ── LÍNEAS DE PRODUCTO ── */}
      <div style={ts.colHeader}>
        <span style={{ flex: 1 }}>ARTÍCULO</span>
        <span style={{ width: 40, textAlign: 'center' }}>UDS</span>
        <span style={{ width: 55, textAlign: 'right' }}>IMPORTE</span>
      </div>
      <div style={ts.sep}>{'─'.repeat(34)}</div>

      {sale.items.map((item, i) => (
        <div key={i} style={ts.itemWrap}>
          <div style={ts.itemName}>{item.name}</div>
          <div style={ts.itemRow}>
            <span style={{ flex: 1, color: '#888', fontSize: 11 }}>{fmt(item.price)} × {item.qty}</span>
            <span style={ts.itemTotal}>{fmt(item.price * item.qty)}</span>
          </div>
        </div>
      ))}

      <div style={ts.sep}>{'═'.repeat(34)}</div>

      {/* ── TOTALES ── */}
      <div style={ts.totalSection}>
        <div style={ts.totalRow}>
          <span style={ts.totalLabel}>TOTAL</span>
          <span style={ts.totalAmount}>{fmt(sale.total)}</span>
        </div>
        <div style={ts.subRow}>
          <span>Forma de pago</span>
          <span style={{ fontWeight: 700 }}>{sale.method}</span>
        </div>
        {Number(sale.change_amount) > 0 && (
          <>
            <div style={ts.subRow}>
              <span>Entregado</span>
              <span>{fmt(Number(sale.total) + Number(sale.change_amount))}</span>
            </div>
            <div style={ts.subRow}>
              <span>Cambio</span>
              <span style={{ fontWeight: 700 }}>{fmt(sale.change_amount)}</span>
            </div>
          </>
        )}
      </div>

      <div style={ts.sep}>{'─'.repeat(34)}</div>

      {/* ── DESGLOSE IVA (obligatorio por ley) ── */}
      <div style={ts.ivaSection}>
        <div style={ts.ivaTitle}>DESGLOSE FISCAL</div>
        <div style={ts.ivaHeader}>
          <span style={{ flex: 1 }}>% IVA</span>
          <span style={{ width: 70, textAlign: 'right' }}>BASE IMP.</span>
          <span style={{ width: 55, textAlign: 'right' }}>CUOTA</span>
          <span style={{ width: 60, textAlign: 'right' }}>TOTAL</span>
        </div>
        <div style={ts.ivaRow}>
          <span style={{ flex: 1 }}>{NEGOCIO.iva}%</span>
          <span style={{ width: 70, textAlign: 'right' }}>{fmt(baseImponible)}</span>
          <span style={{ width: 55, textAlign: 'right' }}>{fmt(cuotaIva)}</span>
          <span style={{ width: 60, textAlign: 'right' }}>{fmt(sale.total)}</span>
        </div>
      </div>

      <div style={ts.sep}>{'─'.repeat(34)}</div>

      {/* ── PIE LEGAL ── */}
      <div style={ts.footer}>
        <div style={ts.footerLine}>¡Gracias por su visita!</div>
        <div style={ts.footerLine}>Arigato gozaimasu 🙏</div>
        <div style={{ ...ts.footerSub, marginTop: 8 }}>
          Ticket simplificado emitido conforme al
        </div>
        <div style={ts.footerSub}>
          R.D. 1619/2012 de facturación
        </div>
        <div style={{ ...ts.footerSub, marginTop: 6 }}>
          Actividad: {NEGOCIO.actividad}
        </div>
        <div style={ts.redBar} />
      </div>
    </div>
  );
}

// ─── Estilos ticket ────────────────────────────────────────────────────────────
const ts = {
  paper: {
    background: '#FAFAF7',
    width: 300,
    fontFamily: "'Courier New', Courier, monospace",
    padding: '20px 16px',
    borderRadius: 4,
    color: '#1A1A1A',
    fontSize: 12,
  },
  header: { marginBottom: 6 },
  logo: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: 2 },
  logoText: { fontSize: 26, fontWeight: 300, fontFamily: "'DM Sans',sans-serif", letterSpacing: -0.5 },
  logoDot: { fontSize: 18, color: '#CC0000', margin: '0 2px' },
  logoK: { fontSize: 26, fontWeight: 900, fontFamily: "'DM Sans',sans-serif", letterSpacing: -1 },
  tagline: { textAlign: 'center', fontSize: 7, letterSpacing: 2, color: '#666', marginBottom: 8, fontFamily: "'DM Sans',sans-serif" },
  sep: { fontSize: 11, color: '#bbb', lineHeight: 1.6, letterSpacing: 0 },
  legalBlock: { margin: '8px 0', textAlign: 'center' },
  legalLine: { fontSize: 11, color: '#333', lineHeight: 1.6 },
  metaRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' },
  metaLabel: { color: '#888', letterSpacing: 0.5 },
  metaVal: { fontWeight: 700 },
  colHeader: { display: 'flex', fontSize: 9, color: '#888', letterSpacing: 1, fontFamily: "'DM Sans',sans-serif", fontWeight: 700, padding: '4px 0' },
  itemWrap: { marginBottom: 6 },
  itemName: { fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans',sans-serif" },
  itemRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11 },
  itemTotal: { fontWeight: 700, width: 55, textAlign: 'right' },
  totalSection: { padding: '6px 0' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  totalLabel: { fontSize: 15, fontWeight: 900, fontFamily: "'DM Sans',sans-serif", letterSpacing: 1 },
  totalAmount: { fontSize: 22, fontWeight: 900, fontFamily: "'DM Sans',sans-serif" },
  subRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#555', padding: '2px 0' },
  ivaSection: { padding: '6px 0' },
  ivaTitle: { fontSize: 9, letterSpacing: 1.5, color: '#888', fontWeight: 700, marginBottom: 4, fontFamily: "'DM Sans',sans-serif" },
  ivaHeader: { display: 'flex', fontSize: 9, color: '#aaa', marginBottom: 2 },
  ivaRow: { display: 'flex', fontSize: 11, fontWeight: 600 },
  footer: { textAlign: 'center', marginTop: 8 },
  footerLine: { fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans',sans-serif", marginBottom: 2 },
  footerSub: { fontSize: 9, color: '#999', lineHeight: 1.5 },
  redBar: { height: 4, background: '#CC0000', borderRadius: 2, margin: '10px 20px 0' },
};

// ─── Estilos overlay ──────────────────────────────────────────────────────────
const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 16 },
  previewCard: { background: '#1A1A1A', border: '1px solid #333', borderRadius: 20, padding: 24, maxHeight: '95vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 },
  previewHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  previewTitle: { fontSize: 13, fontWeight: 700, color: '#D4A017', letterSpacing: 1, textTransform: 'uppercase' },
  previewActions: { display: 'flex', gap: 10 },
  printBtn: { background: '#D4A017', border: 'none', color: '#111', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' },
  closeBtn: { background: 'none', border: '1px solid #444', color: '#888', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' },
  ticketWrap: { display: 'flex', justifyContent: 'center' },
};
