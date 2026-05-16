import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Ticket from './Ticket';

const CATEGORIES = ['Todos', 'Sandos', 'Extras', 'Bebidas', 'Menús'];
const PAYMENT_METHODS = [
  { id: 'Efectivo', label: 'Efectivo', icon: '💴' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: '💳' },
  { id: 'Bizum', label: 'Bizum', icon: '📱' },
];

const B = {
  mustard: '#D4A017', mustardDark: '#B8880F', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
};

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';
const nowStr = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
const todayStr = () => new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const dateStr = () => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

// Hook para detectar si es móvil
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

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
      <div style={{ background: B.black, border: `2px solid ${B.mustard}`, borderRadius: 14, padding: '12px 16px', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>Importe recibido</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: B.white, fontVariantNumeric: 'tabular-nums', letterSpacing: -1, minHeight: 40 }}>
          {value ? value.replace('.', ',') + ' €' : '0,00 €'}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
        {rows.flat().map((k, i) => (
          <button key={i} onClick={() => press(k)} style={{ background: B.mid, border: `1px solid ${B.light}`, borderRadius: 10, color: B.white, fontSize: 20, fontWeight: 700, padding: '15px 0', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation' }}>{k}</button>
        ))}
        <button onClick={() => press('⌫')} style={{ background: B.red, border: 'none', borderRadius: 10, color: B.white, fontSize: 20, fontWeight: 700, padding: '15px 0', cursor: 'pointer', fontFamily: 'inherit', gridColumn: '3', touchAction: 'manipulation' }}>⌫</button>
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
  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 8, padding: '12px 14px', color: B.white, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 14, fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000 }} onClick={onClose}>
      <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: '20px 20px 0 0', padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, background: B.mid, borderRadius: 2, margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 36 }}>{form.emoji || '🥪'}</span>
          <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</h3>
        </div>
        <label style={lbl}>Nombre</label>
        <input style={inp} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Nombre del producto" />
        <label style={lbl}>Precio (€)</label>
        <input style={inp} type="number" step="0.01" inputMode="decimal" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value) || '')} placeholder="0,00" />
        <label style={lbl}>Categoría</label>
        <select style={inp} value={form.category || 'Sandos'} onChange={e => set('category', e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
        <label style={lbl}>Emoji</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
          {emojis.map(e => (
            <button key={e} onClick={() => set('emoji', e)} style={{ width: 42, height: 42, borderRadius: 8, border: `2px solid ${form.emoji === e ? B.mustard : 'transparent'}`, background: form.emoji === e ? '#2A2200' : B.black, cursor: 'pointer', fontSize: 22 }}>{e}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isEdit && <button onClick={() => { if (window.confirm('¿Eliminar?')) onDelete(form.id); }} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>Eliminar</button>}
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '13px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 15 }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex: 2, background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 15 }}>{isEdit ? 'Guardar' : 'Añadir'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [ticket, setTicket] = useState([]);
  const [cat, setCat] = useState('Todos');
  // En móvil: 'catalog' | 'ticket' | 'checkout' | 'history' | 'manage'
  // En desktop: 'pos' | 'checkout' | 'history' | 'manage'
  const [view, setView] = useState('catalog');
  const [desktopView, setDesktopView] = useState('pos');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [cash, setCash] = useState('');
  const [notif, setNotif] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(nowStr());
  const [printSale, setPrintSale] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = sessionStorage.getItem('sandok_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(nowStr()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProducts();
    loadSales();
  }, [user]);

  const loadProducts = async () => {
    const { data } = await supabase.from('tpv_products').select('*').eq('active', true).order('id');
    if (data) setProducts(data);
    setLoading(false);
  };

  const loadSales = async () => {
    const { data } = await supabase.from('tpv_sales').select('*').eq('date', dateStr()).order('created_at', { ascending: false });
    if (data) setSales(data);
  };

  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('sales-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tpv_sales' }, (payload) => {
        setSales(prev => [payload.new, ...prev.filter(s => s.id !== payload.new.id)]);
      }).subscribe();
    return () => supabase.removeChannel(channel);
  }, [user]);

  const notify = useCallback((msg, type = 'ok') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 2200);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    sessionStorage.setItem('sandok_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('sandok_user');
    setTicket([]);
  };

  const addItem = (p) => {
    setTicket(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }];
    });
    if (isMobile) notify(`+ ${p.name}`);
  };
  const chgQty = (id, d) => setTicket(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  const clear = () => { setTicket([]); if (isMobile) setView('catalog'); };

  const total = ticket.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const cashNum = parseFloat(cash.replace(',', '.')) || 0;
  const change = cashNum - total;
  const count = ticket.reduce((s, i) => s + i.qty, 0);

  const pay = async () => {
    if (!ticket.length) return;
    if (payMethod === 'Efectivo' && cashNum < total) { notify('Importe insuficiente', 'err'); return; }
    const sale = {
      id: Date.now(), time: nowStr(), date: dateStr(),
      items: ticket.map(i => ({ name: i.name, qty: i.qty, price: Number(i.price) })),
      total: Math.round(total * 100) / 100, method: payMethod,
      change_amount: payMethod === 'Efectivo' ? Math.max(0, Math.round(change * 100) / 100) : 0,
      seller: user?.username || 'employee',
    };
    const { error } = await supabase.from('tpv_sales').insert([sale]);
    if (error) { notify('Error al guardar venta', 'err'); return; }
    setSales(prev => [sale, ...prev]);
    clear(); setCash(''); setPayMethod('Efectivo');
    if (isMobile) setView('catalog'); else setDesktopView('pos');
    notify(`✓ Cobrado ${fmt(total)}`);
    setPrintSale(sale);
  };

  const saveProduct = async (d) => {
    if (!d.name || !d.price) return;
    if (d.id) {
      const { error } = await supabase.from('tpv_products').update({ name: d.name, price: d.price, category: d.category, emoji: d.emoji }).eq('id', d.id);
      if (!error) { setProducts(prev => prev.map(p => p.id === d.id ? { ...p, ...d } : p)); notify('Actualizado'); }
    } else {
      const newId = Date.now();
      const { error } = await supabase.from('tpv_products').insert([{ id: newId, name: d.name, price: d.price, category: d.category, emoji: d.emoji || '🥪' }]);
      if (!error) { setProducts(prev => [...prev, { id: newId, ...d }]); notify('Añadido'); }
    }
    setModal(null);
  };

  const delProduct = async (id) => {
    await supabase.from('tpv_products').update({ active: false }).eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    notify('Eliminado', 'warn'); setModal(null);
  };

  const filtered = products.filter(p => (cat === 'Todos' || p.category === cat) && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  const todaySales = sales.filter(s => s.date === dateStr());
  const todayTotal = todaySales.reduce((s, x) => s + Number(x.total), 0);

  if (!user) return <Login onLogin={handleLogin} />;
  if (loading) return (
    <div style={{ background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontSize: 40, fontWeight: 300, color: '#fff' }}>Sand</span>
        <span style={{ fontSize: 28, color: '#CC0000' }}>●</span>
        <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>K</span>
      </div>
      <div style={{ color: B.mustard, fontSize: 14 }}>Cargando...</div>
    </div>
  );

  // ── COBRO (compartido móvil y desktop) ──────────────────────────────────────
  const CheckoutView = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 100px' : 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: isMobile ? '100%' : 500, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Total a cobrar</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: B.white, letterSpacing: -1 }}>{fmt(total)}</div>
        </div>
        <button onClick={() => { isMobile ? setView('ticket') : setDesktopView('pos'); }} style={{ background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>← Volver</button>
      </div>

      {/* Resumen ticket */}
      <div style={{ background: B.black, borderRadius: 14, padding: '12px 16px' }}>
        {ticket.map(i => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.dark}`, fontSize: 14 }}>
            <span>{i.emoji} {i.name} <span style={{ color: B.muted }}>×{i.qty}</span></span>
            <span style={{ color: B.mustard, fontWeight: 700 }}>{fmt(Number(i.price) * i.qty)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${B.mustard}` }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>TOTAL</span>
          <span style={{ fontWeight: 900, fontSize: 20, color: B.mustard }}>{fmt(total)}</span>
        </div>
      </div>

      {/* Método */}
      <div style={{ display: 'flex', gap: 8 }}>
        {PAYMENT_METHODS.map(m => (
          <button key={m.id} onClick={() => { setPayMethod(m.id); setCash(''); }}
            style={{ flex: 1, background: payMethod === m.id ? '#2A2200' : B.dark, border: `2px solid ${payMethod === m.id ? B.mustard : B.mid}`, borderRadius: 12, padding: '13px 0', color: payMethod === m.id ? B.mustard : B.muted, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, fontFamily: 'inherit' }}>
            {m.icon}<br /><span style={{ fontSize: 11 }}>{m.label}</span>
          </button>
        ))}
      </div>

      {/* Teclado */}
      {payMethod === 'Efectivo' && (
        <div>
          <NumPad value={cash} onChange={setCash} />
          {cashNum >= total && cashNum > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0F2200', border: '1px solid #4A8A00', borderRadius: 12, padding: '14px 20px', marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#8BC34A', fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Cambio</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: '#8BC34A', letterSpacing: -1 }}>{fmt(Math.max(0, change))}</div>
              </div>
              <span style={{ fontSize: 30 }}>✅</span>
            </div>
          )}
        </div>
      )}

      {payMethod !== 'Efectivo' && (
        <div style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 20, color: B.muted, fontSize: 15, textAlign: 'center' }}>
          {payMethod === 'Tarjeta' ? '💳 Pasa la tarjeta por el datáfono' : '📱 Muestra el QR de Bizum al cliente'}
        </div>
      )}

      <button onClick={pay} style={{ width: '100%', background: payMethod === 'Efectivo' && cashNum < total ? B.mid : B.mustard, border: 'none', borderRadius: 14, color: payMethod === 'Efectivo' && cashNum < total ? B.muted : B.black, padding: '17px 0', cursor: 'pointer', fontWeight: 900, fontSize: 18, fontFamily: 'inherit', marginTop: 4 }}>
        ✓ Confirmar cobro
      </button>
    </div>
  );

  // ── HISTORIAL ───────────────────────────────────────────────────────────────
  const HistoryView = () => (
    <div style={{ flex: 1, padding: isMobile ? '16px 16px 100px' : 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Hoy</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>{todaySales.length} ventas</span>
          <span style={{ background: B.mustard, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 800, color: B.black }}>{fmt(todayTotal)}</span>
        </div>
      </div>
      {todaySales.length === 0 ? <div style={{ color: B.muted, textAlign: 'center', padding: 60, fontSize: 14 }}>No hay ventas hoy</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {todaySales.map(sale => (
            <div key={sale.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{ color: B.muted, fontSize: 13 }}>{sale.time}</span>
                <span style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{PAYMENT_METHODS.find(m => m.id === sale.method)?.icon} {sale.method}</span>
                {sale.seller && <span style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: B.muted }}>👤 {sale.seller}</span>}
                <span style={{ marginLeft: 'auto', fontSize: 18, fontWeight: 900, color: B.mustard }}>{fmt(sale.total)}</span>
                <button onClick={() => setPrintSale(sale)} style={{ background: B.mustard, border: 'none', borderRadius: 8, color: B.black, padding: '5px 10px', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: 'inherit' }}>🖨️</button>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {sale.items.map((it, i) => <span key={i} style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 12, color: B.muted }}>{it.name} ×{it.qty}</span>)}
              </div>
              {sale.change_amount > 0 && <div style={{ fontSize: 12, color: '#8BC34A', marginTop: 6, fontWeight: 600 }}>Cambio: {fmt(sale.change_amount)}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ── GESTIÓN ─────────────────────────────────────────────────────────────────
  const ManageView = () => (
    <div style={{ flex: 1, padding: isMobile ? '16px 16px 100px' : 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Productos</h2>
        <button onClick={() => setModal({ name: '', price: '', category: 'Sandos', emoji: '🥪' })} style={{ background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>+ Nuevo</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map(p => (
          <div key={p.id} onClick={() => setModal({ ...p })} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <span style={{ fontSize: 28 }}>{p.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ color: B.muted, fontSize: 12 }}>{p.category}</div>
            </div>
            <div style={{ color: B.mustard, fontWeight: 900, fontSize: 16 }}>{fmt(p.price)}</div>
          </div>
        ))}
      </div>
      {modal && <ProductModal data={modal} onSave={saveProduct} onDelete={delProduct} onClose={() => setModal(null)} />}
    </div>
  );

  // ── CATÁLOGO ─────────────────────────────────────────────────────────────────
  const CatalogPanel = ({ fullWidth }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: fullWidth ? '12px 12px 0' : '16px 16px 0' }}>
      <input style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '11px 16px', color: B.white, fontSize: 15, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', marginBottom: 10 }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? B.mustard : B.dark, border: `1px solid ${cat === c ? B.mustard : B.mid}`, borderRadius: 20, padding: '7px 16px', color: cat === c ? B.black : B.muted, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, touchAction: 'manipulation' }}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: fullWidth ? 'repeat(auto-fill, minmax(110px, 1fr))' : 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, overflowY: 'auto', flex: 1, paddingBottom: fullWidth ? 90 : 12 }}>
        {filtered.map(p => (
          <button key={p.id} onClick={() => addItem(p)} style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 12, padding: '14px 8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: B.white, fontFamily: 'inherit', touchAction: 'manipulation' }}>
            <span style={{ fontSize: 30 }}>{p.emoji}</span>
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', lineHeight: 1.3 }}>{p.name}</span>
            <span style={{ fontSize: 14, color: B.mustard, fontWeight: 900 }}>{fmt(p.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── TICKET PANEL ─────────────────────────────────────────────────────────────
  const TicketPanel = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${B.mid}` }}>
        <span style={{ fontWeight: 900, fontSize: 17 }}>🧾 Ticket</span>
        {ticket.length > 0 && <button onClick={clear} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Limpiar</button>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {ticket.length === 0 ? (
          <div style={{ color: B.muted, textAlign: 'center', marginTop: 50, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 36 }}>🥪</span>Selecciona productos
          </div>
        ) : ticket.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: `1px solid ${B.dark}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: B.muted }}>{fmt(item.price)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <button onClick={() => chgQty(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 7, background: B.mid, border: 'none', color: B.white, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', touchAction: 'manipulation' }}>−</button>
              <span style={{ fontSize: 14, fontWeight: 800, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
              <button onClick={() => chgQty(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 7, background: B.mustard, border: 'none', color: B.black, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', touchAction: 'manipulation' }}>+</button>
              <span style={{ fontSize: 12, fontWeight: 800, color: B.mustard, minWidth: 52, textAlign: 'right' }}>{fmt(Number(item.price) * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderTop: `2px solid ${B.mustard}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ color: B.muted, fontSize: 13 }}>{count} artículo{count !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: -1 }}>{fmt(total)}</span>
        </div>
        <button onClick={() => { isMobile ? setView('checkout') : setDesktopView('checkout'); }} disabled={!ticket.length} style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: ticket.length ? 'pointer' : 'default', opacity: ticket.length ? 1 : 0.35, fontFamily: 'inherit', touchAction: 'manipulation' }}>
          Cobrar {fmt(total)}
        </button>
      </div>
    </div>
  );

  // ── HEADER ──────────────────────────────────────────────────────────────────
  const Header = () => (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 14px' : '0 20px', height: isMobile ? 54 : 62, background: B.black, borderBottom: `3px solid ${B.mustard}`, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ fontSize: isMobile ? 22 : 26, fontWeight: 300, color: B.white, letterSpacing: -0.5 }}>Sand</span>
          <span style={{ fontSize: isMobile ? 15 : 18, color: B.red, margin: '0 1px' }}>●</span>
          <span style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: B.white, letterSpacing: -1 }}>K</span>
        </div>
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${B.mid}`, paddingLeft: 16 }}>
            <span style={{ fontSize: 7, letterSpacing: 2.5, color: B.mustard, fontWeight: 700 }}>JAPANESE GOURMET FRIED SANDWICHES</span>
            <span style={{ fontSize: 11, color: B.muted, textTransform: 'capitalize' }}>{todayStr()}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8 }}>
        <span style={{ fontSize: isMobile ? 13 : 14, color: B.mustard, fontWeight: 900, background: B.dark, padding: isMobile ? '4px 10px' : '5px 12px', borderRadius: 20, fontVariantNumeric: 'tabular-nums' }}>{time}</span>
        {!isMobile && (
          <>
            <span style={{ fontSize: 12, color: B.muted, background: B.dark, padding: '5px 10px', borderRadius: 20 }}>👤 {user.username}</span>
            <button style={{ background: desktopView === 'pos' ? B.mustard : 'none', border: `1px solid ${desktopView === 'pos' ? B.mustard : B.mid}`, color: desktopView === 'pos' ? B.black : B.muted, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: desktopView === 'pos' ? 800 : 600, fontFamily: 'inherit' }} onClick={() => setDesktopView('pos')}>🏠 Venta</button>
            <button style={{ background: desktopView === 'history' ? B.mustard : 'none', border: `1px solid ${desktopView === 'history' ? B.mustard : B.mid}`, color: desktopView === 'history' ? B.black : B.muted, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: desktopView === 'history' ? 800 : 600, fontFamily: 'inherit' }} onClick={() => { setDesktopView('history'); loadSales(); }}>📋 Historial{todaySales.length > 0 ? ` (${todaySales.length})` : ''}</button>
            {user.role === 'admin' && <button style={{ background: desktopView === 'manage' ? B.mustard : 'none', border: `1px solid ${desktopView === 'manage' ? B.mustard : B.mid}`, color: desktopView === 'manage' ? B.black : B.muted, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: desktopView === 'manage' ? 800 : 600, fontFamily: 'inherit' }} onClick={() => setDesktopView('manage')}>⚙️ Productos</button>}
          </>
        )}
        <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, padding: isMobile ? '5px 10px' : '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: isMobile ? 12 : 12, fontWeight: 700, fontFamily: 'inherit' }}>Salir</button>
      </div>
    </header>
  );

  // ── BARRA INFERIOR MÓVIL ─────────────────────────────────────────────────────
  const MobileBottomBar = () => {
    const tabs = [
      { id: 'catalog', icon: '🏠', label: 'Venta' },
      { id: 'ticket', icon: '🧾', label: `Ticket${count > 0 ? ` (${count})` : ''}` },
      { id: 'history', icon: '📋', label: 'Historial' },
      ...(user.role === 'admin' ? [{ id: 'manage', icon: '⚙️', label: 'Productos' }] : []),
    ];
    return (
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: B.black, borderTop: `2px solid ${B.mustard}`, display: 'flex', zIndex: 100, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setView(tab.id); if (tab.id === 'history') loadSales(); }}
            style={{ flex: 1, background: view === tab.id ? '#2A2200' : 'none', border: 'none', color: view === tab.id ? B.mustard : B.muted, padding: '10px 0 8px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, touchAction: 'manipulation', borderTop: view === tab.id ? `2px solid ${B.mustard}` : '2px solid transparent', marginTop: -2 }}>
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 700 }}>{tab.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // ── RENDER MÓVIL ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: B.offBlack, color: B.white, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", display: 'flex', flexDirection: 'column' }}>
        {notif && (
          <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: notif.type === 'err' ? B.red : notif.type === 'warn' ? B.mustardDark : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>
            {notif.msg}
          </div>
        )}
        {printSale && <Ticket sale={printSale} onClose={() => setPrintSale(null)} />}
        <Header />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {view === 'catalog' && <CatalogPanel fullWidth />}
          {view === 'ticket' && <TicketPanel />}
          {view === 'checkout' && <CheckoutView />}
          {view === 'history' && <HistoryView />}
          {view === 'manage' && user.role === 'admin' && <ManageView />}
        </div>
        {view !== 'checkout' && <MobileBottomBar />}
      </div>
    );
  }

  // ── RENDER DESKTOP ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: B.offBlack, color: B.white, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", display: 'flex', flexDirection: 'column' }}>
      {notif && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', padding: '12px 28px', borderRadius: 50, fontWeight: 800, fontSize: 14, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', background: notif.type === 'err' ? B.red : notif.type === 'warn' ? B.mustardDark : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>
          {notif.msg}
        </div>
      )}
      {printSale && <Ticket sale={printSale} onClose={() => setPrintSale(null)} />}
      <Header />
      {desktopView === 'pos' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <CatalogPanel />
          <div style={{ width: 320, background: B.black, borderLeft: `3px solid ${B.mustard}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <TicketPanel />
          </div>
        </div>
      )}
      {desktopView === 'checkout' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <CheckoutView />
        </div>
      )}
      {desktopView === 'history' && <HistoryView />}
      {desktopView === 'manage' && user.role === 'admin' && <ManageView />}
    </div>
  );
}
