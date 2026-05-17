import { useState, useEffect } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
};

export default function Usuarios({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ username: '', password_hash: '', role: 'employee', display_name: '' });
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    const { data } = await supabase.from('tpv_users').select('id, username, role, display_name, created_at').order('created_at');
    if (data) setUsers(data);
    setLoading(false);
  };

  const notify = (msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2500); };

  const openNew = () => { setForm({ username: '', password_hash: '', role: 'employee', display_name: '' }); setEditUser(null); setShowForm(true); };
  const openEdit = (u) => { setForm({ username: u.username, password_hash: '', role: u.role, display_name: u.display_name || u.username }); setEditUser(u); setShowForm(true); };

  const saveUser = async () => {
    if (!form.username) { notify('El usuario es obligatorio', 'err'); return; }
    if (!editUser && !form.password_hash) { notify('La contraseña es obligatoria', 'err'); return; }

    if (editUser) {
      const update = { role: form.role, display_name: form.display_name || form.username };
      if (form.password_hash) update.password_hash = form.password_hash;
      const { error } = await supabase.from('tpv_users').update(update).eq('id', editUser.id);
      if (error) { notify('Error al actualizar', 'err'); return; }
      notify('Usuario actualizado ✓');
    } else {
      const { error } = await supabase.from('tpv_users').insert([{
        id: crypto.randomUUID(), username: form.username.toLowerCase().trim(),
        password_hash: form.password_hash, role: form.role,
        display_name: form.display_name || form.username,
      }]);
      if (error) { notify(error.message.includes('unique') ? 'Ese usuario ya existe' : 'Error al crear usuario', 'err'); return; }
      notify('Usuario creado ✓');
    }
    setShowForm(false);
    loadUsers();
  };

  const deleteUser = async (u) => {
    if (u.username === currentUser.username) { notify('No puedes eliminar tu propia cuenta', 'err'); return; }
    if (!window.confirm(`¿Eliminar usuario "${u.username}"?`)) return;
    await supabase.from('tpv_users').delete().eq('id', u.id);
    notify('Usuario eliminado', 'warn');
    loadUsers();
  };

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' };
  const ROLES = [{ id: 'admin', label: '👑 Admin — Acceso completo' }, { id: 'employee', label: '👤 Empleado — Solo venta y cobro' }];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      {notif && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? '#B8880F' : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>{notif.msg}</div>}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 900, margin: 0 }}>Gestión de usuarios</h2>
        <button onClick={openNew} style={{ background: B.mustard, border: 'none', color: B.black, borderRadius: 10, padding: '10px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>+ Nuevo usuario</button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowForm(false)}>
          <div style={{ background: B.offBlack, border: `2px solid ${B.mustard}`, borderRadius: '20px 20px 0 0', padding: 28, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 40, height: 4, background: B.mid, borderRadius: 2, margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 900, marginBottom: 20 }}>{editUser ? 'Editar usuario' : 'Nuevo usuario'}</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Usuario (login)</label>
              <input style={{ ...inp, opacity: editUser ? 0.5 : 1 }} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="ej: maria" disabled={!!editUser} autoCapitalize="none" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Nombre para mostrar</label>
              <input style={inp} value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="ej: María García" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>{editUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}</label>
              <input style={inp} type="password" value={form.password_hash} onChange={e => setForm(f => ({ ...f, password_hash: e.target.value }))} placeholder="••••••••" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Rol y permisos</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ROLES.map(r => (
                  <div key={r.id} onClick={() => setForm(f => ({ ...f, role: r.id }))}
                    style={{ background: form.role === r.id ? '#2A2200' : B.dark, border: `2px solid ${form.role === r.id ? B.mustard : B.mid}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${form.role === r.id ? B.mustard : B.muted}`, background: form.role === r.id ? B.mustard : 'transparent', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: form.role === r.id ? B.mustard : B.white }}>{r.label}</div>
                      {r.id === 'employee' && <div style={{ fontSize: 11, color: B.muted, marginTop: 2 }}>Venta, ticket, cobro e historial del día</div>}
                      {r.id === 'admin' && <div style={{ fontSize: 11, color: B.muted, marginTop: 2 }}>Productos, categorías, cuentas, gastos y usuarios</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, background: 'none', border: `1px solid ${B.mid}`, borderRadius: 10, color: B.muted, padding: '13px 0', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={saveUser} style={{ flex: 2, background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '13px 0', cursor: 'pointer', fontWeight: 900, fontFamily: 'inherit', fontSize: 15 }}>{editUser ? 'Guardar cambios' : 'Crear usuario'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lista usuarios */}
      {loading ? <div style={{ color: B.muted, textAlign: 'center', padding: 40 }}>Cargando...</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} style={{ background: B.black, border: `1px solid ${u.username === currentUser.username ? B.mustard : B.mid}`, borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.role === 'admin' ? '#2A2200' : B.dark, border: `2px solid ${u.role === 'admin' ? B.mustard : B.mid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {u.role === 'admin' ? '👑' : '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{u.display_name || u.username}</div>
                <div style={{ fontSize: 12, color: B.muted }}>@{u.username}</div>
                <div style={{ display: 'inline-block', background: u.role === 'admin' ? '#2A2200' : B.dark, border: `1px solid ${u.role === 'admin' ? B.mustard : B.mid}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, color: u.role === 'admin' ? B.mustard : B.muted, marginTop: 4, fontWeight: 700 }}>
                  {u.role === 'admin' ? 'Admin' : 'Empleado'}
                </div>
                {u.username === currentUser.username && <span style={{ fontSize: 11, color: B.mustard, marginLeft: 8 }}>← tú</span>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openEdit(u)} style={{ background: B.dark, border: `1px solid ${B.mid}`, color: B.white, borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'inherit' }}>✏️ Editar</button>
                {u.username !== currentUser.username && (
                  <button onClick={() => deleteUser(u)} style={{ background: 'none', border: `1px solid ${B.red}`, color: B.red, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
