import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#FFB800', mustardDark: '#E6A500', red: '#E83030',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
  green: '#22c55e', greenDark: '#0F2200', greenBorder: '#4A8A00',
};

const fmt = (n) => Number(n || 0).toFixed(2).replace('.', ',') + ' €';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

const CATEGORIAS_GASTO = ['Proveedor','Alquiler','Suministros','Nóminas','Marketing','Mantenimiento','Otros'];

function dateToStr(date) {
  const d = String(date.getDate()).padStart(2,'0');
  const m = String(date.getMonth()+1).padStart(2,'0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseDate(str) {
  const [d,m,y] = str.split('/');
  return new Date(+y, +m-1, +d);
}

function inMonth(dateStr, year, month) {
  try {
    const d = parseDate(dateStr);
    return d.getFullYear() === year && d.getMonth() === month;
  } catch { return false; }
}

export default function Gastos() {
  const now = new Date();
  const [selYear, setSelYear] = useState(now.getFullYear());
  const [selMonth, setSelMonth] = useState(now.getMonth());
  const [sales, setSales] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [tab, setTab] = useState('resumen');
  const [form, setForm] = useState({ descripcion: '', importe: '', categoria: 'Otros', fecha: dateToStr(now) });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Ventas del mes seleccionado
    const start = new Date(selYear, selMonth, 1);
    const end = new Date(selYear, selMonth + 1, 0);
    const startStr = dateToStr(start);
    const endStr = dateToStr(end);

    const [salesRes, gastosRes] = await Promise.all([
      supabase.from('tpv_sales').select('*').order('created_at', { ascending: false }),
      supabase.from('tpv_gastos').select('*').order('fecha', { ascending: false }),
    ]);

    if (salesRes.data) {
      setSales(salesRes.data.filter(s => inMonth(s.date, selYear, selMonth)));
    }
    if (gastosRes.data) {
      setGastos(gastosRes.data);
    }
    setLoading(false);
  }, [selYear, selMonth]);

  useEffect(() => { loadData(); }, [loadData]);

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
      setForm({ descripcion: '', importe: '', categoria: 'Otros', fecha: dateToStr(now) });
      setShowForm(false);
    }
  };

  const deleteGasto = async (id) => {
    if (!window.confirm('¿Eliminar este gasto?')) return;
    await supabase.from('tpv_gastos').delete().eq('id', id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  const gastosDelMes = gastos.filter(g => inMonth(g.fecha, selYear, selMonth));
  const ventasPeriodo = sales.reduce((s, x) => s + Number(x.total), 0);
  const gastosPeriodo = gastosDelMes.reduce((s, x) => s + Number(x.importe), 0);
  const beneficio = ventasPeriodo - gastosPeriodo;

  const navMonth = (dir) => {
    let m = selMonth + dir;
    let y = selYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelMonth(m);
    setSelYear(y);
  };

  const isCurrentMonth = selYear === now.getFullYear() && selMonth === now.getMonth();

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' };

  // Años disponibles (desde 2024 hasta año actual)
  const years = [];
  for (let y = 2024; y <= now.getFullYear(); y++) years.push(y);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* ── Navegador de mes ── */}
      <div style={{ background: B.dark, borderRadius: 16, padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showPicker ? 14 : 0 }}>
          <button onClick={() => navMonth(-1)}
            style={{ background: B.mid, border: 'none', color: B.white, borderRadius: 8, width: 36, height: 36, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>

          <button onClick={() => setShowPicker(!showPicker)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: B.white }}>
              {MESES[selMonth]} {selYear}
            </div>
            <div style={{ fontSize: 11, color: B.mustard, fontWeight: 700 }}>
              {isCurrentMonth ? '● mes actual' : 'toca para cambiar'}
            </div>
          </button>

          <button onClick={() => navMonth(+1)} disabled={isCurrentMonth}
            style={{ background: isCurrentMonth ? B.black : B.mid, border: 'none', color: isCurrentMonth ? B.mid : B.white, borderRadius: 8, width: 36, height: 36, cursor: isCurrentMonth ? 'default' : 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        {/* Selector rápido mes/año */}
        {showPicker && (
          <div>
            {/* Selector de año */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, justifyContent: 'center' }}>
              {years.map(y => (
                <button key={y} onClick={() => setSelYear(y)}
                  style={{ background: selYear === y ? B.mustard : B.mid, border: 'none', borderRadius: 8, padding: '6px 14px', color: selYear === y ? B.black : B.muted, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
                  {y}
                </button>
              ))}
            </div>
            {/* Grid de meses */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {MESES.map((m, i) => {
                const isFuture = selYear === now.getFullYear() && i > now.getMonth();
                const isSelected = i === selMonth;
                return (
                  <button key={m} onClick={() => { if (!isFuture) { setSelMonth(i); setShowPicker(false); } }}
                    disabled={isFuture}
                    style={{ background: isSelected ? B.mustard : B.black, border: `1px solid ${isSelected ? B.mustard : B.mid}`, borderRadius: 8, padding: '8px 4px', color: isFuture ? B.mid : isSelected ? B.black : B.white, fontWeight: 700, cursor: isFuture ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12 }}>
                    {m.slice(0,3)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Tarjetas resumen ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <TarjetaMetrica label="Ventas" valor={ventasPeriodo} color={B.mustard} icon="📈" />
        <TarjetaMetrica label="Gastos" valor={gastosPeriodo} color={B.red} icon="📉" />
        <TarjetaMetrica label="Beneficio" valor={beneficio} color={beneficio >= 0 ? B.green : B.red} icon={beneficio >= 0 ? '✅' : '⚠️'} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${B.mid}`, marginBottom: 16 }}>
        {[{ id: 'resumen', label: '📊 Ventas' }, { id: 'gastos', label: '💸 Gastos' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${B.mustard}` : '2px solid transparent', color: tab === t.id ? B.mustard : B.muted, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>Cargando {MESES[selMonth]}...</div>
      ) : (
        <>
          {/* ── Tab ventas ── */}
          {tab === 'resumen' && (
            <div>
              {sales.length === 0 ? (
                <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>No hay ventas en {MESES[selMonth]} {selYear}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ background: B.dark, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Por método de pago</div>
                    {['Efectivo','Tarjeta','Bizum'].map(m => {
                      const total = sales.filter(s => s.method === m).reduce((s, x) => s + Number(x.total), 0);
                      if (!total) return null;
                      return (
                        <div key={m} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.mid}`, fontSize: 14 }}>
                          <span>{m === 'Efectivo' ? '💴' : m === 'Tarjeta' ? '💳' : '📱'} {m}</span>
                          <span style={{ fontWeight: 700, color: B.mustard }}>{fmt(total)}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 14 }}>
                      <span style={{ fontWeight: 800 }}>Total</span>
                      <span style={{ fontWeight: 900, color: B.mustard, fontSize: 16 }}>{fmt(ventasPeriodo)}</span>
                    </div>
                  </div>
                  {sales.map(sale => (
                    <div key={sale.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ color: B.muted, fontSize: 12 }}>{sale.date} {sale.time}</span>
                          <span style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11 }}>{sale.method}</span>
                          {Number(sale.discount_pct) > 0 && (
                            <span style={{ background: '#0F2200', border: '1px solid #4A8A00', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#8BC34A', fontWeight: 700 }}>−{sale.discount_pct}%</span>
                          )}
                        </div>
                        <span style={{ fontWeight: 900, color: B.mustard, fontSize: 16 }}>{fmt(sale.total)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(sale.items || []).map((it, i) => (
                          <span key={i} style={{ background: B.dark, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: B.muted }}>{it.name} ×{it.qty}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Tab gastos ── */}
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
                  <button onClick={addGasto}
                    style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontSize: 15, fontFamily: 'inherit' }}>
                    Guardar gasto
                  </button>
                </div>
              )}

              {gastosDelMes.length === 0 ? (
                <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>No hay gastos en {MESES[selMonth]} {selYear}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Desglose por categoría */}
                  <div style={{ background: B.dark, borderRadius: 12, padding: 16, marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, marginBottom: 10, textTransform: 'uppercase' }}>Por categoría</div>
                    {CATEGORIAS_GASTO.map(cat => {
                      const total = gastosDelMes.filter(g => g.categoria === cat).reduce((s, x) => s + Number(x.importe), 0);
                      if (!total) return null;
                      return (
                        <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${B.mid}`, fontSize: 13 }}>
                          <span style={{ color: B.muted }}>{cat}</span>
                          <span style={{ fontWeight: 700, color: B.red }}>−{fmt(total)}</span>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0' }}>
                      <span style={{ fontWeight: 800 }}>Total</span>
                      <span style={{ fontWeight: 900, color: B.red, fontSize: 16 }}>−{fmt(gastosPeriodo)}</span>
                    </div>
                  </div>
                  {/* Lista */}
                  {gastosDelMes.map(g => (
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
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function TarjetaMetrica({ label, valor, color, icon }) {
  return (
    <div style={{ background: '#1A1A1A', border: '1px solid #333', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, color: '#777', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color, letterSpacing: -0.5 }}>{Number(valor).toFixed(2).replace('.', ',') + '€'}</div>
    </div>
  );
}
