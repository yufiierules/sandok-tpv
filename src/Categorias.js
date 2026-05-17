import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', muted: '#777777', white: '#FFFFFF',
};

export default function Categorias({ onCategoriesChange }) {
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState({ name: '' });
  const [editCat, setEditCat] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [notif, setNotif] = useState(null);

  useEffect(() => { loadCats(); }, []);

  const loadCats = async () => {
    const { data } = await supabase.from('tpv_categories').select('*').order('id');
    if (data) { setCats(data); onCategoriesChange && onCategoriesChange(data); }
  };

  const notify = (msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2500); };

  const openNew = () => { setForm({ name: '' }); setEditCat(null); setShowForm(true); };
  const openEdit = (c) => { setForm({ name: c.name }); setEditCat(c); setShowForm(true); };

  const saveCat = async () => {
    if (!form.name.trim()) { notify('El nombre es obligatorio', 'err'); return; }
    if (editCat) {
      const oldName = editCat.name;
      const { error } = await supabase.from('tpv_categories').update({ name: form.name.trim() }).eq('id', editCat.id);
      if (error) { notify('Error al renombrar', 'err'); return; }
      // Actualizar todos los productos con la categoría antigua
      await supabase.from('tpv_products').update({ category: form.name.trim() }).eq('category', oldName);
      notify(`Renombrada y aplicada a todos los productos ✓`);
    } else {
      const { error } = await supabase.from('tpv_categories').insert([{ id: Date.now(), name: form.name.trim() }]);
      if (error) { notify(error.message.includes('unique') ? 'Ya existe esa categoría' : 'Error', 'err'); return; }
      notify('Categoría creada ✓');
    }
    setShowForm(false);
    loadCats();
  };

  const deleteCat = async (c) => {
    const { count } = await supabase.from('tpv_products').select('id', { count: 'exact', head: true }).eq('category', c.name).eq('active', true);
    if (count > 0) {
      if (!window.confirm(`Esta categoría tiene ${count} producto(s). ¿Eliminar igualmente? Los productos quedarán sin categoría.`)) return;
    } else {
      if (!window.confirm(`¿Eliminar la categoría "${c.name}"?`)) return;
    }
    await supabase.from('tpv_categories').delete().eq('id', c.id);
    notify('Categoría eliminada', 'warn');
    loadCats();
  };

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '14px 16px', color: B.white, fontSize: 18, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };

  return (
    <div style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      {notif && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? '#B8880F' : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>{notif.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: B.muted, letterSpacing: 1, textTransform: 'uppercase' }}>Categorías</span>
        <button onClick={openNew} style={{ background: B.mustard, border: 'none', color: B.black, borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontWeight: 800, fontSize: 13, fontFamily: 'inherit' }}>+ Añadir</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }} onClick={() => setShowForm(false)}>
          <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 16 }}>{editCat ? 'Renombrar categoría' : 'Nueva categoría'}</h3>
            <p style={{ fontSize: 12, color: B.muted, marginBottom: 16, lineHeight: 1.5 }}>
              Puedes usar emojis, acentos y caracteres especiales. Ej: <span style={{ color: B.mustard }}>☕ Cafés</span>, <span style={{ color: B.mustard }}>🍣 Japonés</span>
            </p>
            <input style={inp} value={form.name} onChange={e => setForm({ name: e.target.value })} placeholder="Nombre de la categoría..." autoFocus
              onKeyDown={e => e.key === 'Enter' && saveCat()} />
            {editCat && <p style={{ fontSize: 11, color: B.muted, marginTop: 10 }}>⚠️ Al renombrar se actualizarán todos los productos en esta categoría automáticamente.</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '12px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={saveCat} style={{ flex: 2, background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '12px 0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 15 }}>{editCat ? 'Renombrar' : 'Crear'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {cats.map(c => (
          <div key={c.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 1, fontWeight: 700, fontSize: 15 }}>{c.name}</span>
            <button onClick={() => openEdit(c)} style={{ background: B.dark, border: 'none', color: B.white, borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>✏️</button>
            <button onClick={() => deleteCat(c)} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 7, padding: '6px 10px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>🗑️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
