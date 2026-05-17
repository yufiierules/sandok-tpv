import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', mustardDark: '#B8880F', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
  green: '#22c55e', greenDark: '#0F2200', greenBorder: '#4A8A00',
};

const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';
const dateStr = () => new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

function getWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const mon = new Date(now); mon.setDate(now.getDate() - day + 1);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
}

function getMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

function parseDate(str) {
  // dd/mm/yyyy
  const [d, m, y] = str.split('/');
  return new Date(+y, +m - 1, +d);
}

function inRange(dateStr, start, end) {
  const d = parseDate(dateStr);
  return d >= start && d <= end;
}

const CATEGORIAS_GASTO = [
  'Proveedor', 'Alquiler', 'Suministros', 'Nóminas', 'Marketing', 'Mantenimiento', 'Otros'
];

export default function Gastos({ sales }) {
  const [gastos, setGastos] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [tab, setTab] = useState('resumen'); // resumen | gastos
  const [form, setForm] = useState({ descripcion: '', importe: '', categoria: 'Otros', fecha: dateStr() });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGastos();
  }, []);

  const loadGastos = async () => {
    const { data } = await supabase.from('tpv_gastos').select('*').order('fecha', { ascending: false });
    if (data) setGastos(data);
    setLoading(false);
  };

  const addGasto = async () => {
    if (!form.descripcion || !form.importe) return;
    const gasto = {
      id: Date.now(),
      descripcion: form.descripcion,
      importe: parseFloat(form.importe),
      categoria: form.categoria,
      fecha: form.fecha,
    };
    const { error } = await supabase.from('tpv_gastos').insert([gasto]);
    if (!error) {
      setGastos(prev => [gasto, ...prev]);
      setForm({ descripcion: '', importe: '', categoria: 'Otros', fecha: dateStr() });
      setShowForm(false);
    }
  };

  const deleteGasto = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    await supabase.from('tpv_gastos').delete().eq('id', id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  // Calcular rangos
  const today = dateStr();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();

  const filterSales = (p) => {
    if (p === 'dia') return sales.filter(s => s.date === today);
    if (p === 'semana') return sales.filter(s => inRange(s.date, weekRange.start, weekRange.end));
    return sales.filter(s => inRange(s.date, monthRange.start, monthRange.end));
  };

  const filterGastos = (p) => {
    if (p === 'dia') return gastos.filter(g => g.fecha === today);
    if (p === 'semana') return gastos.filter(g => inRange(g.fecha, weekRange.start, weekRange.end));
    return gastos.filter(g => inRange(g.fecha, monthRange.start, monthRange.end));
  };

  const ventasPeriodo = filterSales(periodo).reduce((s, x) => s + Number(x.total), 0);
  const gastosPeriodo = filterGastos(periodo).reduce((s, x) => s + Number(x.importe), 0);
  const beneficio = ventasPeriodo - gastosPeriodo;

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' };

  const periodos = [
    { id: 'dia', label: 'Hoy' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes', label: 'Mes' },
  ];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* Selector periodo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {periodos.map(p => (
          <button key={p.id} onClick={() => setPeriodo(p.id)}
            style={{ flex: 1, background: periodo === p.id ? B.mustard : B.dark, border: `1px solid ${periodo === p.id ? B.mustard : B.mid}`, borderRadius: 10, padding: '10px 0', color: periodo === p.id ? B.black : B.muted, cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <TarjetaMetrica label="Ventas" valor={ventasPeriodo} color={B.mustard} icon="📈" />
        <TarjetaMetrica label="Gastos" valor={gastosPeriodo} color={B.red} icon="📉" />
        <TarjetaMetrica label="Beneficio" valor={beneficio} color={beneficio >= 0 ? B.green : B.red} icon={beneficio >= 0 ? '✅' : '⚠️'} />
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${B.mid}`, marginBottom: 16 }}>
        {[{ id: 'resumen', label: '📊 Resumen ventas' }, { id: 'gastos', label: '💸 Gastos' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${B.mustard}` : '2px solid transparent', color: tab === t.id ? B.mustard : B.muted, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab resumen ventas */}
      {tab === 'resumen' && (
        <div>
          {filterSales(periodo).length === 0 ? (
            <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>No hay ventas en este periodo</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Agrupación por método de pago */}
              <div style={{ background: B.dark, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Por método de pago</div>
                {['Efectivo', 'Tarjeta', 'Bizum'].map(m => {
                  const total = filterSales(periodo).filter(s => s.method === m).reduce((s, x) => s + Number(x.total), 0);
                  if (!total) return null;
                  return (
                    <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.mid}`, fontSize: 14 }}>
                      <span>{m === 'Efectivo' ? '💴' : m === 'Tarjeta' ? '💳' : '📱'} {m}</span>
                      <span style={{ fontWeight: 700, color: B.mustard }}>{fmt(total)}</span>
                    </div>
                  );
                })}
              </div>
              {/* Lista de ventas */}
              {filterSales(periodo).map(sale => (
                <div key={sale.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ color: B.muted, fontSize: 12 }}>{sale.date} {sale.time}</span>
                      <span style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{sale.method}</span>
                    </div>
                    <span style={{ fontWeight: 900, color: B.mustard, fontSize: 16 }}>{fmt(sale.total)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                    {sale.items.map((it, i) => <span key={i} style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: B.muted }}>{it.name} ×{it.qty}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab gastos */}
      {tab === 'gastos' && (
        <div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit', marginBottom: 16 }}>
            {showForm ? '✕ Cancelar' : '+ Añadir gasto'}
          </button>

          {showForm && (
            <div style={{ background: B.dark, border: `1px solid ${B.mid}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl}>Descripción</label>
                <input style={inp} placeholder="Ej: Factura proveedor pan" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div>
                  <label style={lbl}>Importe (€)</label>
                  <input style={inp} type="number" step="0.01" inputMode="decimal" placeholder="0,00" value={form.importe} onChange={e => setForm(f => ({ ...f, importe: e.target.value }))} />
                </div>
                <div>
                  <label style={lbl}>Fecha</label>
                  <input style={inp} type="text" placeholder="dd/mm/aaaa" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>Categoría</label>
                <select style={inp} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                  {CATEGORIAS_GASTO.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={addGasto} style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit' }}>
                Guardar gasto
              </button>
            </div>
          )}

          {loading ? <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>Cargando...</div> : filterGastos(periodo).length === 0 ? (
            <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>No hay gastos en este periodo</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filterGastos(periodo).map(g => (
                <div key={g.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{g.descripcion}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: B.muted }}>{g.categoria}</span>
                      <span style={{ fontSize: 11, color: B.muted }}>{g.fecha}</span>
                    </div>
                  </div>
                  <span style={{ fontWeight: 900, color: B.red, fontSize: 16 }}>−{fmt(g.importe)}</span>
                  <button onClick={() => deleteGasto(g.id)} style={{ background: 'none', border: 'none', color: B.muted, cursor: 'pointer', fontSize: 18, padding: 4 }}>🗑️</button>
                </div>
              ))}
              <div style={{ background: B.dark, borderRadius: 12, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: B.muted }}>Total gastos</span>
                <span style={{ fontWeight: 900, color: B.red, fontSize: 18 }}>−{fmt(gastosPeriodo)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TarjetaMetrica({ label, valor, color, icon }) {
  return (
    <div style={{ background: '#1A1A1A', border: `1px solid #333`, borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, color: '#777', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 900, color, letterSpacing: -0.5 }}>{Number(valor).toFixed(2).replace('.', ',') + '€'}</div>
    </div>
  );
}
