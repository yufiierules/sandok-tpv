import { useState } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', dark: '#222222', mid: '#333333',
  white: '#FFFFFF', muted: '#777777',
};

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) { setError('Introduce usuario y contraseña'); return; }
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('tpv_users')
        .select('*')
        .eq('username', username.trim())
        .eq('password_hash', password)
        .single();

      if (err || !data) {
        setError('Usuario o contraseña incorrectos');
      } else {
        onLogin(data);
      }
    } catch (e) {
      setError('Error de conexión');
    }
    setLoading(false);
  };

  const handleKey = (e) => { if (e.key === 'Enter') handleLogin(); };

  return (
    <div style={s.root}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <span style={s.logoSand}>Sand</span>
          <span style={s.logoDot}>●</span>
          <span style={s.logoK}>K</span>
        </div>
        <div style={s.tagline}>JAPANESE GOURMET FRIED SANDWICHES</div>
        <div style={s.subtitle}>Sistema TPV</div>

        <div style={s.divider} />

        <label style={s.label}>Usuario</label>
        <input
          style={s.input}
          type="text"
          placeholder="sandokadmin"
          value={username}
          onChange={e => setUsername(e.target.value)}
          onKeyDown={handleKey}
          autoCapitalize="none"
          autoComplete="username"
        />

        <label style={s.label}>Contraseña</label>
        <input
          style={s.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={handleKey}
          autoComplete="current-password"
        />

        {error && <div style={s.error}>{error}</div>}

        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={handleLogin} disabled={loading}>
          {loading ? 'Accediendo...' : 'Entrar'}
        </button>

        <div style={s.footer}>🥪 SandoK TPV v2.0</div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: '#1A1A1A', border: `2px solid ${B.mustard}`, borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  logoWrap: { display: 'flex', alignItems: 'baseline', justifyContent: 'center', marginBottom: 6 },
  logoSand: { fontSize: 42, fontWeight: 300, color: B.white, letterSpacing: -1 },
  logoDot: { fontSize: 28, color: B.red, margin: '0 3px' },
  logoK: { fontSize: 42, fontWeight: 900, color: B.white, letterSpacing: -2 },
  tagline: { textAlign: 'center', fontSize: 8, letterSpacing: 2.5, color: B.mustard, fontWeight: 700, marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: B.muted, marginBottom: 28 },
  divider: { height: 1, background: B.mid, marginBottom: 28 },
  label: { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: { width: '100%', background: '#111', border: `1px solid ${B.mid}`, borderRadius: 10, padding: '13px 16px', color: B.white, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 18, fontFamily: 'inherit' },
  error: { background: '#2A0000', border: `1px solid ${B.red}`, borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btn: { width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 },
  footer: { textAlign: 'center', fontSize: 11, color: B.muted },
};
