import { useState } from 'react';
import { supabase } from './supabase';

const B = {
  yellow: '#FFB800', yellowDark: '#E6A500', red: '#E83030',
  black: '#111111', dark: '#1A1A1A', mid: '#2A2A2A', border: '#333333',
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
        {/* Logo kono. */}
        <div style={s.logoWrap}>
          <span style={s.logoText}>kono</span>
          <span style={s.logoDot} />
        </div>
        <div style={s.tagline}>JAPANESE GOURMET FRIED SANDWICHES</div>
        <div style={s.subtitle}>Sistema TPV</div>

        <div style={s.divider} />

        <label style={s.label}>Usuario</label>
        <input
          style={s.input}
          type="text"
          placeholder="usuario"
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

        <div style={s.footer}>kono. TPV v2.0</div>
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: '100vh', background: B.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { background: B.black, border: 'none', borderRadius: 24, padding: '44px 36px', width: '100%', maxWidth: 380, fontFamily: "'DM Sans','Helvetica Neue',sans-serif", boxShadow: '0 12px 48px rgba(0,0,0,0.25)' },
  logoWrap: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 0, marginBottom: 6 },
  logoText: { fontSize: 56, fontWeight: 900, color: B.yellow, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: "'DM Sans','Helvetica Neue',sans-serif" },
  logoDot: { display: 'inline-block', width: 16, height: 16, borderRadius: '50%', background: B.red, marginLeft: 4, marginBottom: 8, flexShrink: 0 },
  tagline: { textAlign: 'center', fontSize: 8, letterSpacing: 2.5, color: B.yellow, opacity: 0.6, fontWeight: 700, marginBottom: 6 },
  subtitle: { textAlign: 'center', fontSize: 13, color: B.muted, marginBottom: 28 },
  divider: { height: 1, background: '#222', marginBottom: 28 },
  label: { display: 'block', fontSize: 10, color: B.yellow, fontWeight: 800, marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: { width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '13px 16px', color: B.white, fontSize: 16, outline: 'none', boxSizing: 'border-box', marginBottom: 18, fontFamily: 'inherit' },
  error: { background: '#2A0000', border: '1px solid #E83030', borderRadius: 8, padding: '10px 14px', color: '#ff6b6b', fontSize: 13, marginBottom: 16, textAlign: 'center' },
  btn: { width: '100%', background: B.yellow, border: 'none', color: B.black, borderRadius: 12, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 },
  footer: { textAlign: 'center', fontSize: 11, color: B.muted },
};
