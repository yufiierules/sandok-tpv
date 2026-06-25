import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import Login from './Login';
import Ticket from './Ticket';
import Gastos from './Gastos';
import Usuarios from './Usuarios';
import Categorias from './Categorias';

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

const MOBILE_BREAKPOINT = 1100; // cubre iPad en cualquier orientación
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', h);
    window.addEventListener('orientationchange', h);
    return () => { window.removeEventListener('resize', h); window.removeEventListener('orientationchange', h); };
  }, []);
  return isMobile;
}

// ─── NumPad ───────────────────────────────────────────────────────────────────
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

// ─── ProductModal ─────────────────────────────────────────────────────────────
function ProductModal({ data, onSave, onDelete, onClose, categories }) {
  const [form, setForm] = useState(data);
  const [uploading, setUploading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isEdit = !!form.id;

  const handleImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filename = `product_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(filename, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename);
      set('image_url', urlData.publicUrl);
    }
    setUploading(false);
  };

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 8, padding: '12px 14px', color: B.white, fontSize: 16, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2000, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '20px 0 40px' }} onClick={onClose}>
      <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, margin: 'auto', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>{isEdit ? 'Editar producto' : 'Nuevo producto'}</span>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid #444', color: '#888', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>✕</button>
        </div>
        <div style={{ width: 100, height: 100, borderRadius: 12, background: B.dark, border: `2px dashed ${B.mid}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
          onClick={() => document.getElementById('img-upload').click()}>
          {form.image_url ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 36 }}>📷</span>}
          {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: B.mustard, fontSize: 12, fontWeight: 700 }}>Subiendo...</div>}
        </div>
        <input id="img-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        <div style={{ textAlign: 'center', fontSize: 12, color: B.muted, marginBottom: 20, cursor: 'pointer' }} onClick={() => document.getElementById('img-upload').click()}>Toca para subir foto</div>

        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Nombre</label>
          <input style={inp} value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Nombre del producto" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={lbl}>Precio (€)</label>
            <input style={inp} type="number" step="0.01" inputMode="decimal" value={form.price || ''} onChange={e => set('price', parseFloat(e.target.value) || '')} placeholder="0,00" />
          </div>
          <div>
            <label style={lbl}>Categoría</label>
            <select style={inp} value={form.category || ''} onChange={e => set('category', e.target.value)}>
              <option value="">Sin categoría</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {isEdit && <button onClick={() => { if (window.confirm('¿Eliminar producto?')) onDelete(form.id); }} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 10, padding: '12px 14px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Eliminar</button>}
          <button onClick={onClose} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '13px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={() => onSave(form)} style={{ flex: 2, background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 15 }}>{isEdit ? 'Guardar' : 'Añadir'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── ManageView ───────────────────────────────────────────────────────────────
function ManageView({ products, categories, setCategories, setProducts, isMobile }) {
  const [modal, setModal] = useState(null);
  const [notif, setNotif] = useState(null);
  const notify = (msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2000); };

  const saveProduct = async (d) => {
    if (!d.name || !d.price) return;
    const payload = { name: d.name, price: d.price, category: d.category || null, image_url: d.image_url || null };
    if (d.id) {
      const { error } = await supabase.from('tpv_products').update(payload).eq('id', d.id);
      if (!error) { setProducts(prev => prev.map(p => p.id === d.id ? { ...p, ...payload } : p)); notify('Actualizado ✓'); }
      else notify('Error al actualizar', 'err');
    } else {
      const newId = Date.now();
      const { error } = await supabase.from('tpv_products').insert([{ id: newId, ...payload, active: true }]);
      if (!error) { setProducts(prev => [...prev, { id: newId, ...payload, active: true }]); notify('Añadido ✓'); }
      else notify('Error al añadir', 'err');
    }
    setModal(null);
  };

  const delProduct = async (id) => {
    await supabase.from('tpv_products').update({ active: false }).eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    notify('Eliminado', 'warn'); setModal(null);
  };

  return (
    <div style={{ flex: 1, padding: isMobile ? '16px 16px 100px' : 24, overflowY: 'auto', height: 0 }}>
      {notif && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? B.mustardDark : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>{notif.msg}</div>}

      {/* Categorías */}
      <div style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 14, padding: 20, marginBottom: 24 }}>
        <Categorias onCategoriesChange={setCategories} />
      </div>

      {/* Productos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Productos</h2>
        <button onClick={() => setModal({ name: '', price: '', category: categories[0]?.name || '', image_url: null })}
          style={{ background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
          + Nuevo
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {products.map(p => (
          <div key={p.id} onClick={() => setModal({ ...p })}
            style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}>
            <div style={{ width: 50, height: 50, borderRadius: 10, background: B.dark, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24 }}>🥪</span>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ color: B.muted, fontSize: 12 }}>{p.category || 'Sin categoría'}</div>
            </div>
            <div style={{ color: B.mustard, fontWeight: 900, fontSize: 16 }}>{fmt(p.price)}</div>
          </div>
        ))}
      </div>

      {modal && (
        <ProductModal
          data={modal}
          onSave={saveProduct}
          onDelete={delProduct}
          onClose={() => setModal(null)}
          categories={categories}
        />
      )}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sales, setSales] = useState([]);
  const [ticket, setTicket] = useState([]);
  const [cat, setCat] = useState('Todos');
  const [view, setView] = useState('catalog');
  const [desktopView, setDesktopView] = useState('pos');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [cash, setCash] = useState('');
  const [notif, setNotif] = useState(null);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(nowStr());
  const [printSale, setPrintSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState(0); // porcentaje 0-100

  useEffect(() => { const saved = sessionStorage.getItem('kono_user'); if (saved) setUser(JSON.parse(saved)); }, []);
  useEffect(() => { const t = setInterval(() => setTime(nowStr()), 30000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (!user) return;
    loadProducts(); loadSales(); loadCategories();
  }, [user]);

  const loadProducts = async () => {
    const { data } = await supabase.from('tpv_products').select('*').eq('active', true).order('id');
    if (data) setProducts(data);
    setLoading(false);
  };
  const loadCategories = async () => {
    const { data } = await supabase.from('tpv_categories').select('*').order('id');
    if (data) setCategories(data);
  };
  const loadSales = async () => {
    const { data } = await supabase.from('tpv_sales').select('*').eq('date', dateStr()).order('created_at', { ascending: false });
    if (data) setSales(data);
  };

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel('sales-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tpv_sales' }, (p) => {
        setSales(prev => [p.new, ...prev.filter(s => s.id !== p.new.id)]);
      }).subscribe();
    return () => supabase.removeChannel(ch);
  }, [user]);

  const notify = useCallback((msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2200); }, []);
  const handleLogin = (u) => { setUser(u); sessionStorage.setItem('kono_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); sessionStorage.removeItem('kono_user'); setTicket([]); };

  const addItem = (p) => {
    setTicket(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]; });
    if (isMobile) notify(`+ ${p.name}`);
  };
  const chgQty = (id, d) => setTicket(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + d } : i).filter(i => i.qty > 0));
  const clear = () => { setTicket([]); setDiscount(0); if (isMobile) setView('catalog'); };

  const subtotal = ticket.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const discountAmt = Math.round(subtotal * discount) / 100;
  const total = Math.round((subtotal - discountAmt) * 100) / 100;
  const cashNum = parseFloat(cash.replace(',', '.')) || 0;
  const change = cashNum - total;
  const count = ticket.reduce((s, i) => s + i.qty, 0);

  const pay = async () => {
    if (!ticket.length) return;
    if (payMethod === 'Efectivo' && cashNum < total) { notify('Importe insuficiente', 'err'); return; }
    const sale = {
      id: Date.now(), time: nowStr(), date: dateStr(),
      items: ticket.map(i => ({ name: i.name, qty: i.qty, price: Number(i.price) })),
      total: Math.round(total * 100) / 100, discount_pct: discount, method: payMethod,
      change_amount: payMethod === 'Efectivo' ? Math.max(0, Math.round(change * 100) / 100) : 0,
      seller: user?.username || 'employee',
    };
    const { error } = await supabase.from('tpv_sales').insert([sale]);
    if (error) { notify('Error al guardar venta', 'err'); return; }
    setSales(prev => [sale, ...prev]);
    clear(); setCash(''); setPayMethod('Efectivo'); setDiscount(0);
    if (isMobile) setView('catalog'); else setDesktopView('pos');
    notify(`✓ Cobrado ${fmt(total)}`);
    setPrintSale(sale);
  };

  const allCats = ['Todos', ...categories.map(c => c.name)];
  const filtered = products.filter(p => (cat === 'Todos' || p.category === cat) && (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  const todaySales = sales.filter(s => s.date === dateStr());
  const todayTotal = todaySales.reduce((s, x) => s + Number(x.total), 0);

  if (!user) return <Login onLogin={handleLogin} />;
  if (loading) return (
    <div style={{ background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
        <span style={{ fontSize: 40, fontWeight: 900, color: '#FFB800', letterSpacing: '-0.03em', lineHeight: 1 }}>kono</span>
        <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: '50%', background: '#E83030', marginLeft: 3, marginBottom: 5 }} />
      </div>
      <div style={{ color: '#FFB800', fontSize: 14 }}>Cargando...</div>
    </div>
  );

  // ── Checkout ─────────────────────────────────────────────────────────────────
  const goBack = () => isMobile ? setView('ticket') : setDesktopView('pos');

  // ── Renders parciales ─────────────────────────────────────────────────────────
  const Notif = () => notif ? (
    <div style={{ position: 'fixed', top: isMobile ? 16 : 20, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? B.mustardDark : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>{notif.msg}</div>
  ) : null;

  const logoBar = (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 0 }}>
      <span style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: '#FFB800', letterSpacing: '-0.03em', lineHeight: 1 }}>kono</span>
      <span style={{ display: 'inline-block', width: isMobile ? 7 : 8, height: isMobile ? 7 : 8, borderRadius: '50%', background: '#E83030', marginLeft: 2, marginBottom: isMobile ? 3 : 4, flexShrink: 0 }} />
    </div>
  );

  const navBtnStyle = (active) => ({ background: active ? B.mustard : 'none', border: `1px solid ${active ? B.mustard : B.mid}`, color: active ? B.black : B.muted, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 800 : 600, fontFamily: 'inherit' });

  // ── Catalog ───────────────────────────────────────────────────────────────────
  const CatalogContent = ({ fullWidth }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: fullWidth ? '12px 12px 0' : '16px 16px 0' }}>
      <input style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '11px 16px', color: B.white, fontSize: 15, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', marginBottom: 10 }} placeholder="🔍 Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 10, scrollbarWidth: 'none' }}>
        {allCats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ background: cat === c ? B.mustard : B.dark, border: `1px solid ${cat === c ? B.mustard : B.mid}`, borderRadius: 20, padding: '7px 16px', color: cat === c ? B.black : B.muted, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0, touchAction: 'manipulation' }}>{c}</button>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, overflowY: 'auto', flex: 1, paddingBottom: fullWidth ? 90 : 12, alignContent: 'flex-start' }}>
        {filtered.map(p => (
          <button key={p.id} onClick={() => addItem(p)}
            style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', color: B.white, fontFamily: 'inherit', touchAction: 'manipulation', width: fullWidth ? 140 : 130, height: fullWidth ? 160 : 150, flexShrink: 0, overflow: 'hidden', padding: 0 }}>
            <div style={{ width: '100%', height: 85, background: B.mid, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: '14px 14px 0 0' }}>
              {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 32 }}>🥪</span>}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', width: '100%', boxSizing: 'border-box' }}>
              <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 2, width: '100%' }}>{p.name}</span>
              <span style={{ fontSize: 13, color: B.mustard, fontWeight: 900 }}>{fmt(p.price)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Ticket ────────────────────────────────────────────────────────────────────
  const TicketContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${B.mid}`, flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 17 }}>🧾 Ticket</span>
        {ticket.length > 0 && <button onClick={clear} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Limpiar</button>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0', paddingBottom: isMobile ? 160 : 8, WebkitOverflowScrolling: 'touch' }}>
        {ticket.length === 0 ? (
          <div style={{ color: B.muted, textAlign: 'center', marginTop: 50, fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 36 }}>🥪</span>Selecciona productos del catálogo
          </div>
        ) : ticket.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: `1px solid ${B.dark}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: B.dark, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.image_url ? <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🥪</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                <div style={{ fontSize: 11, color: B.muted }}>{fmt(item.price)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              <button onClick={() => chgQty(item.id, -1)} style={{ width: 30, height: 30, borderRadius: 8, background: B.mid, border: 'none', color: B.white, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', touchAction: 'manipulation' }}>−</button>
              <span style={{ fontSize: 14, fontWeight: 800, minWidth: 22, textAlign: 'center' }}>{item.qty}</span>
              <button onClick={() => chgQty(item.id, 1)} style={{ width: 30, height: 30, borderRadius: 8, background: B.mustard, border: 'none', color: B.black, cursor: 'pointer', fontSize: 16, fontWeight: 900, fontFamily: 'inherit', touchAction: 'manipulation' }}>+</button>
              <span style={{ fontSize: 12, fontWeight: 800, color: B.mustard, minWidth: 54, textAlign: 'right' }}>{fmt(Number(item.price) * item.qty)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={isMobile ? 'cobrar-bar' : ''} style={isMobile ? {} : { padding: '12px 16px', borderTop: `2px solid ${B.mustard}`, flexShrink: 0 }}>
        {/* Descuento rápido */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase' }}>Descuento</span>
            {discount > 0 && <span style={{ fontSize: 11, color: '#8BC34A', fontWeight: 700 }}>−{fmt(discountAmt)}</span>}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[0, 5, 10, 15, 20, 25, 50].map(pct => (
              <button key={pct} onClick={() => setDiscount(pct)}
                style={{ flex: 1, background: discount === pct ? (pct === 0 ? B.mid : '#1a2e00'), border: `1px solid ${discount === pct ? (pct === 0 ? B.light : '#8BC34A') : B.mid}`, borderRadius: 7, color: discount === pct ? (pct === 0 ? B.white : '#8BC34A') : B.muted, fontSize: 11, fontWeight: 800, padding: '6px 0', cursor: 'pointer', fontFamily: 'inherit', touchAction: 'manipulation' }}>
                {pct === 0 ? '✕' : `${pct}%`}
              </button>
            ))}
          </div>
        </div>
        {/* Total */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ color: B.muted, fontSize: 13 }}>{count} art{count !== 1 ? 's' : ''}
            {discount > 0 && <span style={{ color: '#8BC34A', marginLeft: 6 }}>−{discount}%</span>}
          </span>
          <div style={{ textAlign: 'right' }}>
            {discount > 0 && <div style={{ fontSize: 11, color: B.muted, textDecoration: 'line-through' }}>{fmt(subtotal)}</div>}
            <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1 }}>{fmt(total)}</span>
          </div>
        </div>
        <button onClick={() => isMobile ? setView('checkout') : setDesktopView('checkout')} disabled={!ticket.length}
          style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 900, cursor: ticket.length ? 'pointer' : 'default', opacity: ticket.length ? 1 : 0.35, fontFamily: 'inherit', touchAction: 'manipulation' }}>
          Cobrar {fmt(total)}
        </button>
      </div>
    </div>
  );

  // ── Checkout content ──────────────────────────────────────────────────────────
  const CheckoutContent = () => (
    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px 16px 100px' : 24, display: 'flex', flexDirection: 'column', gap: 16, maxWidth: isMobile ? '100%' : 500, margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10, color: B.mustard, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase' }}>Total a cobrar</div>
          <div style={{ fontSize: 38, fontWeight: 900, color: B.white, letterSpacing: -1 }}>{fmt(total)}</div>
        </div>
        <button onClick={goBack} style={{ background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '10px 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>← Volver</button>
      </div>
      <div style={{ background: B.black, borderRadius: 14, padding: '12px 16px' }}>
        {ticket.map(i => (
          <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.dark}`, fontSize: 14 }}>
            <span>{i.name} <span style={{ color: B.muted }}>×{i.qty}</span></span>
            <span style={{ color: B.mustard, fontWeight: 700 }}>{fmt(Number(i.price) * i.qty)}</span>
          </div>
        ))}
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.dark}`, fontSize: 13 }}>
            <span style={{ color: '#8BC34A' }}>Descuento {discount}%</span>
            <span style={{ color: '#8BC34A', fontWeight: 700 }}>−{fmt(discountAmt)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTop: `2px solid ${B.mustard}` }}>
          <span style={{ fontWeight: 900, fontSize: 16 }}>TOTAL</span>
          <span style={{ fontWeight: 900, fontSize: 20, color: B.mustard }}>{fmt(total)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {PAYMENT_METHODS.map(m => (
          <button key={m.id} onClick={() => { setPayMethod(m.id); setCash(''); }}
            style={{ flex: 1, background: payMethod === m.id ? '#2A2200' : B.dark, border: `2px solid ${payMethod === m.id ? B.mustard : B.mid}`, borderRadius: 12, padding: '13px 0', color: payMethod === m.id ? B.mustard : B.muted, cursor: 'pointer', fontWeight: 700, fontSize: isMobile ? 12 : 13, fontFamily: 'inherit' }}>
            {m.icon}<br /><span style={{ fontSize: 11 }}>{m.label}</span>
          </button>
        ))}
      </div>
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
      <button onClick={pay}
        style={{ width: '100%', background: payMethod === 'Efectivo' && cashNum < total ? B.mid : B.mustard, border: 'none', borderRadius: 14, color: payMethod === 'Efectivo' && cashNum < total ? B.muted : B.black, padding: '17px 0', cursor: 'pointer', fontWeight: 900, fontSize: 18, fontFamily: 'inherit' }}>
        ✓ Confirmar cobro
      </button>
    </div>
  );

  // ── History content ───────────────────────────────────────────────────────────
  const HistoryContent = () => (
    <div style={{ flex: 1, padding: isMobile ? '16px 16px 100px' : 24, overflowY: 'auto', height: 0 }}>
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
                {Number(sale.discount_pct) > 0 && <span style={{ background: '#0F2200', border: '1px solid #4A8A00', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#8BC34A', fontWeight: 700 }}>−{sale.discount_pct}%</span>}
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

  // ── Header ────────────────────────────────────────────────────────────────────
  const adminNavDesktop = user.role === 'admin' ? [
    { id: 'cuentas', label: '💰 Cuentas' },
    { id: 'manage', label: '⚙️ Productos' },
    { id: 'usuarios', label: '👥 Usuarios' },
  ] : [];

  const desktopNavItems = [
    { id: 'pos', label: '🏠 Venta' },
    { id: 'history', label: `📋 Historial${todaySales.length > 0 ? ` (${todaySales.length})` : ''}` },
    ...adminNavDesktop,
  ];

  const mobileTabItems = [
    { id: 'catalog', icon: '🏠', label: 'Venta' },
    { id: 'ticket', icon: '🧾', label: count > 0 ? `(${count})` : 'Ticket' },
    { id: 'history', icon: '📋', label: 'Historial' },
    ...(user.role === 'admin' ? [
      { id: 'cuentas', icon: '💰', label: 'Cuentas' },
      { id: 'manage', icon: '⚙️', label: 'Config' },
      { id: 'usuarios', icon: '👥', label: 'Usuarios' },
    ] : []),
  ];

  // ── RENDER ────────────────────────────────────────────────────────────────────
  const rootStyle = { height: '100dvh', background: B.offBlack, color: B.white, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 };
  const headerStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 14px' : '0 20px', height: isMobile ? 54 : 62, background: B.black, borderBottom: '3px solid #FFB800', flexShrink: 0 };

  if (isMobile) {
    return (
      <div style={rootStyle}>
        <Notif />
        {printSale && <Ticket sale={printSale} onClose={() => setPrintSale(null)} />}
        <header className="app-header" style={{ ...headerStyle, height: 'auto', minHeight: 54, paddingTop: 0, paddingBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 54, paddingLeft: 14 }}>
            {logoBar}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 54, paddingRight: 14 }}>
            <span style={{ fontSize: 13, color: B.mustard, fontWeight: 900, background: B.dark, padding: '4px 10px', borderRadius: 20 }}>{time}</span>
            <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Salir</button>
          </div>
        </header>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {view === 'catalog' && <CatalogContent fullWidth />}
          {view === 'ticket' && <TicketContent />}
          {view === 'checkout' && <CheckoutContent />}
          {view === 'history' && <HistoryContent />}
          {view === 'cuentas' && user.role === 'admin' && <Gastos sales={sales} />}
          {view === 'manage' && user.role === 'admin' && <ManageView products={products} categories={categories} setCategories={setCategories} setProducts={setProducts} isMobile={isMobile} />}
          {view === 'usuarios' && user.role === 'admin' && <Usuarios currentUser={user} />}
        </div>
        {view !== 'checkout' && (
          <div className="bottom-nav">
            {mobileTabItems.map(tab => (
              <button key={tab.id} onClick={() => { setView(tab.id); if (tab.id === 'history') loadSales(); }}
                className={`bottom-nav-btn${view === tab.id ? ' active' : ''}`}>
                <span className="icon">{tab.icon}</span>
                <span className="label">{tab.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={rootStyle}>
      <Notif />
      {printSale && <Ticket sale={printSale} onClose={() => setPrintSale(null)} />}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {logoBar}
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `1px solid ${B.mid}`, paddingLeft: 16 }}>
            <span style={{ fontSize: 7, letterSpacing: 2.5, color: B.mustard, fontWeight: 700 }}>JAPANESE GOURMET FRIED SANDWICHES</span>
            <span style={{ fontSize: 11, color: B.muted, textTransform: 'capitalize' }}>{todayStr()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, color: B.mustard, fontWeight: 900, background: B.dark, padding: '5px 12px', borderRadius: 20 }}>{time}</span>
          <span style={{ fontSize: 12, color: B.muted, background: B.dark, padding: '5px 10px', borderRadius: 20 }}>👤 {user.display_name || user.username}</span>
          {desktopNavItems.map(nav => (
            <button key={nav.id} onClick={() => { setDesktopView(nav.id); if (nav.id === 'history') loadSales(); }} style={navBtnStyle(desktopView === nav.id)}>
              {nav.label}
            </button>
          ))}
          <button onClick={handleLogout} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>Salir</button>
        </div>
      </header>
      {desktopView === 'pos' && (
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          <CatalogContent />
          <div style={{ width: 320, background: B.black, borderLeft: `3px solid ${B.mustard}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <TicketContent />
          </div>
        </div>
      )}
      {desktopView === 'checkout' && <div style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', height: 0 }}><CheckoutContent /></div>}
      {desktopView === 'history' && <HistoryContent />}
      {desktopView === 'cuentas' && user.role === 'admin' && <Gastos sales={sales} />}
      {desktopView === 'manage' && user.role === 'admin' && <ManageView products={products} categories={categories} setCategories={setCategories} setProducts={setProducts} isMobile={false} />}
      {desktopView === 'usuarios' && user.role === 'admin' && <Usuarios currentUser={user} />}
    </div>
  );
}
