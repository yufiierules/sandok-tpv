import { useState, useEffect, useCallback } from 'react';
import Ticket from './Ticket';

// ─── Datos ────────────────────────────────────────────────────────────────────
const INITIAL_PRODUCTS = [
  { id: 1, name: 'Katsu Sando', price: 9.50, category: 'Sandos', emoji: '🥪' },
  { id: 2, name: 'Ebi Sando', price: 10.50, category: 'Sandos', emoji: '🦐' },
  { id: 3, name: 'Wagyu Sando', price: 14.00, category: 'Sandos', emoji: '🥩' },
  { id: 4, name: 'Tamago Sando', price: 7.50, category: 'Sandos', emoji: '🥚' },
  { id: 5, name: 'Miso Soup', price: 3.00, category: 'Extras', emoji: '🍜' },
  { id: 6, name: 'Edamame', price: 4.00, category: 'Extras', emoji: '🫛' },
  { id: 7, name: 'Gyoza (4 pcs)', price: 5.50, category: 'Extras', emoji: '🥟' },
  { id: 8, name: 'Matcha Latte', price: 4.50, category: 'Bebidas', emoji: '🍵' },
  { id: 9, name: 'Ramune', price: 3.50, category: 'Bebidas', emoji: '🫧' },
  { id: 10, name: 'Sake', price: 5.00, category: 'Bebidas', emoji: '🍶' },
  { id: 11, name: 'Agua', price: 1.50, category: 'Bebidas', emoji: '💧' },
  { id: 12, name: 'Menú Sando', price: 13.50, category: 'Menús', emoji: '🍱' },
];

const CATEGORIES = ['Todos', 'Sandos', 'Extras', 'Bebidas', 'Menús'];
const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: '💴' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: '💳' },
  { id: 'Bizum', label: 'Bizum', icon: '📱' },
];

const B = {
  mustard: '#D4A017', mustardDark: '#B8880F',
  red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777',
  white: '#FFFFFF',
};

const fmt = (n) => n.toFixed(2).replace('.', ',') + ' €';
const nowStr = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const todayStr = () => new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const dateStr = () => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Teclado numérico ─────────────────────────────────────────────────────────
function NumPad({ value, onChange }) {
  const press = (k) => {
    if (k === '⌫') { onChange(value.slice(0, -1)); return; }
    if (k === '.') { if (value.includes('.')) return; onChange((value || '0') + '.'); return; }
    if (k === '00') { if (!value || value === '0') return; onChange(value + '00'); return; }
    if (value === '0') { onChange(k); return; }
    if (value.includes('.') && value.split('.')[1]?.length >= 2) return;
    onChange(value + k);
  };
  const rows = [['7','8','9'],['4','5','6'],['1','2','3'],['00','0','.']];
  return (
    <div>
      <div style={{ background: B.black, border: `2px solid ${B.mustard}`, borderRadius: 14, padding: '14px 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Importe recibido</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: B.white, fontVariantNumeric: 'tabular-nums', letterSpacing: -1, minHeight: 44 }}>
          {value ? value.replace('.', ',') + ' €' : '0,00 €'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {rows.flat().map((k, i) => (
          <button key={i} onClick={() => press(k)} style={{ background: B.mid, border: `1px solid ${B.light}`, borderRadius: 12, color: B.white, fontSize: 22, fontWeight: 700, padding: '17px 0', cursor: 'pointer', fontFamily: 'inherit' }}>{k}</button>
        ))}
        <button onClick={() => press('⌫')} style={{ background: B.red, border: 'none', borderRadius: 12, color: B.white, fontSize: 22, fontWeight: 700, padding: '17px 0', cursor: 'pointer', fontFamily: 'inherit', gridColumn: '3' }}>⌫</button>
      </div>
    </div>
  );
}

// ─── Modal producto ───────────────────────────────────────────────────────────
function ProductModal({ data, onSave, onDelete, onClose }) {
  const [form, setForm] = useState(data);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!form.id;
  const cats = ['Sandos', 'Extras', 'Bebidas', 'Menús', 'Otros'];
  const emojis = ['🥪','🦐','🥩','🥚','🍜','🫛','🥟','🍵','🫧','🍶','💧','🍱','🧃','🍺','🍷','🍰','🎂','🍡','🥗','🍣'];
  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 8, padding: '10px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: 20, padding: 28, width: 420, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>{form.emoji || '🥪'}</span>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
        </div>
        <label style={lbl}>Nombre</label>
        <input style={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nombre del producto" />
        <label style={lbl}>Precio (€)</label>
        <input style={inp} type="number" step="0.01" value={form.price} onChange={e => set('price', parseFloat(e.target.value) || '')} placeholder="0,00" />
        <label style={lbl}>Categoría</label>
        <select style={inp} value={form.category} onChange={e => set('category', e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={lbl}>Emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {emojis.map(e => (
            <button key={e} onClick={() => set('emoji', e)} style={{ width: 38, height: 38, borderRadius: 8, border: `2px solid ${form.emoji === e ? B.mustard : 'transparent'}`, background: form.emoji === e ? '#2A2200' : B.black, cursor: 'pointer', fontSize: 20 }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && <button onClick={() => { if (window.confirm('¿Eliminar?')) onDelete(form.id); }} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Eliminar</button>}
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '11px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex: 2, background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '11px 0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 15 }}>{isEdit ? 'Guardar' : 'Añadir'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const [products, setProducts] = useState(() => { try { return JSON.parse(localStorage.getItem('sk_products')) || INITIAL_PRODUCTS; } catch { return INITIAL_PRODUCTS; } });
  const [ticket, setTicket] = useState([]);
  const [cat, setCat] = useState('Todos');
  const [view, setView] = useState('pos');
  const [sales, setSales] = useState(() => { try { return JSON.parse(localStorage.getItem('sk_sales')) || []; } catch { return []; } });
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [cash, setCash] = useState('');
  const [notif, setNotif] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(nowStr());
  const [printSale, setPrintSale] = useState(null); // ticket a imprimir

  useEffect(() => { const t = setInterval(() => setTime(nowStr()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => { localStorage.setItem('sk_products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('sk_sales', JSON.stringify(sales)); }, [sales]);

  const notify = useCallback((msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2200); }, []);

  const addItem = (p) => setTicket(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]; });
  const chgQty = (id, d) => setTicket(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  const clear = () => setTicket([]);

  const total = ticket.reduce((s, i) => s + i.price * i.qty, 0);
  const cashNum = parseFloat(cash.replace(',', '.')) || 0;
  const change = cashNum - total;
  const count = ticket.reduce((s, i) => s + i.qty, 0);

  const pay = () => {
    if (!ticket.length) return;
    if (payMethod === 'Efectivo' && cashNum < total) { notify('Importe insuficiente', 'err'); return; }
    const sale = {
      id: Date.now(),
      time: nowStr(),
      date: dateStr(),
      items: ticket.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      method: payMethod,
      change: payMethod === 'Efectivo' ? Math.max(0, change) : 0,
    };
    setSales(prev => [sale, ...prev]);
    clear(); setCash(''); setPayMethod('Efectivo'); setView('pos');
    notify(`✓ Cobrado ${fmt(total)}`);
    // Mostrar ticket para imprimir
    setPrintSale(sale);
  };

  const saveProduct = (d) => {
    if (!d.name || !d.price) return;
    if (d.id) { setProducts(prev => prev.map(p => p.id === d.id ? d : p)); notify('Actualizado'); }
    else { setProducts(prev => [...prev, { ...d, id: Date.now() }]); notify('Añadido'); }
    setModal(null);
  };
  const delProduct = (id) => { setProducts(prev => prev.filter(p => p.id !== id)); notify('Eliminado', 'warn'); setModal(null); };

  const filtered = products.filter(p => (cat === 'Todos' || p.category === cat) && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  const todaySales = sales.filter(s => s.date === dateStr());
  const todayTotal = todaySales.reduce((s, x) => s + x.total, 0);

  const navBtn = (active) => ({ background: active ? B.mustard : 'none', border: `1px solid ${active ? B.mustard : B.mid}`, color: active ? B.black : B.muted, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 800 : 600, fontFamily: 'inherit' });

  return (
    <div style={{ minHeight: '100vh', background: B.offBlack, color: B.white, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Notif */}
      {notif && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', padding: '12px 28px', borderRadius: 50, fontWeight: 800, fontSize: 14, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: notif.type === 'err' ? B.red : notif.type === 'warn' ? B.mustardDark : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>
          {notif.msg}
        </div>
      )}

      {/* Ticket de impresión */}
      {printSale && <Ticket sale={printSale} onClose={() => setPrintSale(null)} />}

      {/* HEADER */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 62, background: B.black, borderBottom: `3px solid ${B.mustard}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{ fontSize: 26, fontWeight: 300, color: B.white, letterSpacing: -0.5 }}>Sand</span>
            <span style={{ fontSize: 18, color: B.red, margin: '0 2px' }}>●</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: B.white, letterSpacing: -1 }}>K</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${B.mid}`, paddingLeft: 16 }}>
            <span style={{ fontSize: 7, letterSpacing: 2.5, color: B.mustard, fontWeight: 700 }}>JAPANESE GOURMET FRIED SANDWICHES</span>
            <span style={{ fontSize: 11, color: B.muted, textTransform: 'capitalize' }}>{todayStr()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: B.mustard, fontWeight: 900, background: B.dark, padding: '5px 12px', borderRadius: 20, marginRight: 4, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
          <button style={navBtn(view === 'pos')} onClick={() => setView('pos')}>🏠 Venta</button>
          <button style={navBtn(view === 'history')} onClick={() => setView('history')}>
            📋 Historial{todaySales.length > 0 ? ` (${todaySales.length})` : ''}
          </button>
          <button style={navBtn(view === 'manage')} onClick={() => setView('manage')}>⚙️ Productos</button>
        </div>
      </header>

      {/* ── COBRO ── */}
      {view === 'checkout' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: 22, padding: 28, width: 500, maxHeight: '94vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Total a cobrar</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: B.white, letterSpacing: -1 }}>{fmt(total)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ fontSize: 20, fontWeight: 300 }}>Sand</span>
                <span style={{ fontSize: 14, color: B.red }}>●</span>
                <span style={{ fontSize: 20, fontWeight: 900, letterSpacing: -1 }}>K</span>
              </div>
            </div>

            {/* Resumen */}
            <div style={{ background: B.black, borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
              {ticket.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${B.dark}`, fontSize: 13 }}>
                  <span>{i.emoji} {i.name} <span style={{ color: B.muted }}>×{i.qty}</span></span>
                  <span style={{ color: B.mustard, fontWeight: 700 }}>{fmt(i.price * i.qty)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 6, borderTop: `2px solid ${B.mustard}` }}>
                <span style={{ fontWeight: 900, fontSize: 16 }}>TOTAL</span>
                <span style={{ fontWeight: 900, fontSize: 20, color: B.mustard }}>{fmt(total)}</span>
              </div>
            </div>

            {/* Método */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {PAYMENT_METHODS.map(m => (
                <button key={m.id} onClick={() => { setPayMethod(m.id); setCash(''); }} style={{ flex: 1, background: payMethod === m.id ? '#2A2200' : B.dark, border: `2px solid ${payMethod === m.id ? B.mustard : B.mid}`, borderRadius: 10, padding: '11px 0', color: payMethod === m.id ? B.mustard : B.muted, cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit' }}>
                  {m.icon} {m.label}
                </button>
              ))}
            </div>

            {payMethod === 'Efectivo' && (
              <div style={{ marginBottom: 18 }}>
                <NumPad value={cash} onChange={setCash} />
                {cashNum >= total && cashNum > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F2200', border: '1px solid #4A8A00', borderRadius: 12, padding: '14px 20px', marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#8BC34A', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Cambio</div>
                      <div style={{ fontSize: 30, fontWeight: 900, color: '#8BC34A', letterSpacing: -1 }}>{fmt(Math.max(0, change))}</div>
                    </div>
                    <span style={{ fontSize: 32 }}>✅</span>
                  </div>
                )}
              </div>
            )}

            {payMethod !== 'Efectivo' && (
              <div style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 20, color: B.muted, fontSize: 15, textAlign: 'center', marginBottom: 18 }}>
                {payMethod === 'Tarjeta' ? '💳 Pasa la tarjeta por el datáfono' : '📱 Muestra el QR de Bizum al cliente'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setView('pos')} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 12, color: B.muted, padding: '14px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>← Volver</button>
              <button onClick={pay} style={{ flex: 2, background: payMethod === 'Efectivo' && cashNum < total ? B.mid : B.mustard, border: 'none', borderRadius: 12, color: payMethod === 'Efectivo' && cashNum < total ? B.muted : B.black, padding: '14px 0', cursor: 'pointer', fontWeight: 900, fontSize: 16, fontFamily: 'inherit' }}>
                ✓ Confirmar cobro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORIAL ── */}
      {view === 'history' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Historial de hoy</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 20, padding: '6px 16px', fontSize: 14, fontWeight: 700 }}>{todaySales.length} ventas</span>
              <span style={{ background: B.mustard, borderRadius: 20, padding: '6px 16px', fontSize: 14, fontWeight: 800, color: B.black }}>{fmt(todayTotal)}</span>
            </div>
          </div>
          {todaySales.length === 0 ? <div style={{ color: B.muted, textAlign: 'center', padding: 60 }}>No hay ventas registradas hoy</div> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {todaySales.map(sale => (
                <div key={sale.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 14, padding: 18 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ color: B.muted, fontSize: 13 }}>{sale.time}</span>
                    <span style={{ background: B.dark, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>{PAYMENT_METHODS.find(m => m.id === sale.method)?.icon} {sale.method}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 900, color: B.mustard }}>{fmt(sale.total)}</span>
                    <button onClick={() => setPrintSale(sale)} style={{ background: B.mustard, border: 'none', borderRadius: 8, color: B.black, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>🖨️ Ticket</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {sale.items.map((it, i) => <span key={i} style={{ background: B.dark, borderRadius: 6, padding: '3px 10px', fontSize: 12, color: B.muted }}>{it.name} ×{it.qty}</span>)}
                  </div>
                  {sale.change > 0 && <div style={{ fontSize: 12, color: '#8BC34A', marginTop: 8, fontWeight: 600 }}>Cambio: {fmt(sale.change)}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── GESTIÓN ── */}
      {view === 'manage' && (
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>Gestión de productos</h2>
            <button onClick={() => setModal({ name: '', price: '', category: 'Sandos', emoji: '🥪' })} style={{ background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '10px 22px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>+ Nuevo producto</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 10 }}>
            {products.map(p => (
              <div key={p.id} onClick={() => setModal({ ...p })} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
                <span style={{ fontSize: 30 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: B.muted, fontSize: 12 }}>{p.category}</div>
                </div>
                <div style={{ color: B.mustard, fontWeight: 900, fontSize: 16 }}>{fmt(p.price)}</div>
              </div>
            ))}
          </div>
          {modal && <ProductModal data={modal} onSave={saveProduct} onDelete={delProduct} onClose={() => setModal(null)} />}
        </div>
      )}

      {/* ── POS ── */}
      {view === 'pos' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflow: 'hidden' }}>
            <input style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '10px 16px', color: B.white, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? B.mustard : B.dark, border: `1px solid ${cat === c ? B.mustard : B.mid}`, borderRadius: 8, padding: '7px 18px', color: cat === c ? B.black : B.muted, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>{c}</button>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px,1fr))', gap: 10, overflowY: 'auto', flex: 1 }}>
              {filtered.map(p => (
                <button key={p.id} onClick={() => addItem(p)} style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 14, padding: '18px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: B.white, fontFamily: 'inherit' }}>
                  <span style={{ fontSize: 34 }}>{p.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{p.name}</span>
                  <span style={{ fontSize: 15, color: B.mustard, fontWeight: 900 }}>{fmt(p.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket lateral */}
          <div style={{ width: 330, background: B.black, borderLeft: `3px solid ${B.mustard}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: `1px solid ${B.mid}` }}>
              <span style={{ fontWeight: 900, fontSize: 17 }}>🧾 Ticket</span>
              {ticket.length > 0 && <button onClick={clear} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Limpiar</button>}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
              {ticket.length === 0 ? (
                <div style={{ color: B.muted, textAlign: 'center', marginTop: 60, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 40 }}>🥪</span>Selecciona productos
                </div>
              ) : ticket.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 18px', borderBottom: `1px solid ${B.dark}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{item.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: B.muted }}>{fmt(item.price)} / ud</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => chgQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 7, background: B.mid, border: 'none', color: B.white, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit' }}>−</button>
                    <span style={{ fontSize: 14, fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => chgQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 7, background: B.mustard, border: 'none', color: B.black, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit' }}>+</button>
                    <span style={{ fontSize: 13, fontWeight: 800, color: B.mustard, minWidth: 58, textAlign: 'right' }}>{fmt(item.price * item.qty)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: 18, borderTop: `2px solid ${B.mustard}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ color: B.muted }}>{count} artículo{count !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>{fmt(total)}</span>
              </div>
              <button onClick={() => setView('checkout')} disabled={!ticket.length} style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: ticket.length ? 'pointer' : 'default', opacity: ticket.length ? 1 : 0.35, fontFamily: 'inherit' }}>
                Cobrar {fmt(total)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
