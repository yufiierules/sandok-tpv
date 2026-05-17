import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
};

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

// ─── Lector de código de barras via cámara ────────────────────────────────────
function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setScanning(true);
        startDetection();
      }
    } catch (e) {
      setError('No se pudo acceder a la cámara. Asegúrate de dar permiso.');
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const startDetection = () => {
    if (!('BarcodeDetector' in window)) {
      // Fallback: usar input manual
      setError('Tu navegador no soporta detección automática. Usa el campo manual.');
      return;
    }
    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code', 'upc_a', 'upc_e'] });
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          stopCamera();
          onDetected(barcodes[0].rawValue);
        }
      } catch {}
    }, 300);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: B.black, borderBottom: `2px solid ${B.mustard}` }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: B.white }}>📷 Escanear código</span>
        <button onClick={() => { stopCamera(); onClose(); }} style={{ background: 'none', border: `1px solid ${B.mid}`, color: B.muted, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕ Cerrar</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
        {/* Guía visual */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 260, height: 160, border: `3px solid ${B.mustard}`, borderRadius: 12, boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'absolute', top: -2, left: -2, width: 30, height: 30, borderTop: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '10px 0 0 0' }} />
            <div style={{ position: 'absolute', top: -2, right: -2, width: 30, height: 30, borderTop: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 10px 0 0' }} />
            <div style={{ position: 'absolute', bottom: -2, left: -2, width: 30, height: 30, borderBottom: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '0 0 0 10px' }} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderBottom: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 0 10px 0' }} />
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, background: B.mustard, opacity: 0.7, animation: 'scan 2s ease-in-out infinite' }} />
          </div>
        </div>
        {scanning && !error && (
          <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', color: B.mustard, fontWeight: 700, fontSize: 14 }}>
            Apunta al código de barras
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', bottom: 30, left: 20, right: 20, background: B.offBlack, border: `1px solid ${B.red}`, borderRadius: 12, padding: 16, textAlign: 'center', color: '#ff6b6b', fontSize: 13 }}>
            {error}
          </div>
        )}
      </div>
      <style>{`@keyframes scan { 0%,100% { top: 10%; } 50% { top: 85%; } }`}</style>
    </div>
  );
}

// ─── Componente principal Scanner ─────────────────────────────────────────────
export default function Scanner({ onAddToTicket }) {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('venta'); // venta | stock
  const [showCamera, setShowCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [stockForm, setStockForm] = useState({ barcode: '', name: '', price: '', category: 'Sandos', emoji: '🥪' });
  const [result, setResult] = useState(null); // { type: 'found'|'notfound'|'added', product }
  const [notif, setNotif] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('tpv_products').select('*').eq('active', true);
    if (data) setProducts(data);
  };

  const notify = (msg, type = 'ok') => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 2500);
  };

  // Cuando se detecta un código — modo VENTA
  const handleVentaScan = (code) => {
    setShowCamera(false);
    setManualCode(code);
    const product = products.find(p => p.barcode === code);
    if (product) {
      setResult({ type: 'found', product });
    } else {
      setResult({ type: 'notfound', code });
    }
  };

  // Cuando se detecta un código — modo STOCK
  const handleStockScan = (code) => {
    setShowCamera(false);
    const existing = products.find(p => p.barcode === code);
    if (existing) {
      setStockForm({ barcode: code, name: existing.name, price: existing.price, category: existing.category, emoji: existing.emoji });
      notify('Producto ya existe — puedes actualizarlo', 'warn');
    } else {
      setStockForm(f => ({ ...f, barcode: code }));
      notify('Código escaneado — rellena los datos del producto');
    }
  };

  const addToTicket = (product) => {
    onAddToTicket(product);
    notify(`✓ ${product.name} añadido al ticket`);
    setResult(null);
    setManualCode('');
  };

  const saveStockProduct = async () => {
    if (!stockForm.barcode || !stockForm.name || !stockForm.price) {
      notify('Rellena todos los campos', 'err'); return;
    }
    const existing = products.find(p => p.barcode === stockForm.barcode);
    const data = { name: stockForm.name, price: parseFloat(stockForm.price), category: stockForm.category, emoji: stockForm.emoji, barcode: stockForm.barcode };

    if (existing) {
      await supabase.from('tpv_products').update(data).eq('id', existing.id);
      setProducts(prev => prev.map(p => p.id === existing.id ? { ...p, ...data } : p));
      notify('Producto actualizado ✓');
    } else {
      const newId = Date.now();
      await supabase.from('tpv_products').insert([{ id: newId, ...data, active: true }]);
      setProducts(prev => [...prev, { id: newId, ...data, active: true }]);
      notify('Producto añadido ✓');
    }
    setStockForm({ barcode: '', name: '', price: '', category: 'Sandos', emoji: '🥪' });
  };

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' };
  const cats = ['Sandos', 'Extras', 'Bebidas', 'Menús', 'Otros'];
  const emojis = ['🥪','🦐','🥩','🥚','🍜','🫛','🥟','🍵','🫧','🍶','💧','🍱','🧃','🍺','🍷','🍰'];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      {notif && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? '#B8880F' : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>
          {notif.msg}
        </div>
      )}

      {showCamera && (
        <BarcodeScanner
          onDetected={tab === 'venta' ? handleVentaScan : handleStockScan}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${B.mid}`, marginBottom: 20 }}>
        {[{ id: 'venta', label: '🏪 Modo venta' }, { id: 'stock', label: '📦 Gestión stock' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(null); setManualCode(''); }}
            style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${B.mustard}` : '2px solid transparent', color: tab === t.id ? B.mustard : B.muted, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MODO VENTA ── */}
      {tab === 'venta' && (
        <div>
          <p style={{ color: B.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Escanea el código de barras de un producto para añadirlo automáticamente al ticket actual.
          </p>

          <button onClick={() => setShowCamera(true)}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
            📷 Escanear código
          </button>

          {/* Entrada manual */}
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>O introduce el código manualmente</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1 }} placeholder="Código de barras..." value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleVentaScan(manualCode)} />
              <button onClick={() => handleVentaScan(manualCode)}
                style={{ background: B.dark, border: `1px solid ${B.mid}`, color: B.white, borderRadius: 10, padding: '0 16px', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>
                Buscar
              </button>
            </div>
          </div>

          {/* Resultado escaneo */}
          {result?.type === 'found' && (
            <div style={{ background: '#0F2200', border: `1px solid ${B.mustard}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <span style={{ fontSize: 40 }}>{result.product.emoji}</span>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{result.product.name}</div>
                  <div style={{ color: B.mustard, fontWeight: 800, fontSize: 16 }}>{fmt(result.product.price)}</div>
                  <div style={{ color: B.muted, fontSize: 12 }}>{result.product.category}</div>
                </div>
              </div>
              <button onClick={() => addToTicket(result.product)}
                style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Añadir al ticket
              </button>
            </div>
          )}

          {result?.type === 'notfound' && (
            <div style={{ background: '#2A0000', border: `1px solid ${B.red}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Producto no encontrado</div>
              <div style={{ color: B.muted, fontSize: 12, marginBottom: 14 }}>Código: {result.code}</div>
              <button onClick={() => { setTab('stock'); setStockForm(f => ({ ...f, barcode: result.code })); setResult(null); }}
                style={{ background: B.dark, border: `1px solid ${B.mid}`, color: B.white, borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                + Añadir este producto al stock
              </button>
            </div>
          )}

          {/* Lista productos con código */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              Productos con código ({products.filter(p => p.barcode).length})
            </div>
            {products.filter(p => p.barcode).map(p => (
              <div key={p.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>{p.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: B.muted, fontSize: 11, fontFamily: 'monospace' }}>{p.barcode}</div>
                </div>
                <span style={{ color: B.mustard, fontWeight: 800 }}>{fmt(p.price)}</span>
              </div>
            ))}
            {products.filter(p => p.barcode).length === 0 && (
              <div style={{ color: B.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>
                Ningún producto tiene código asignado aún
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODO STOCK ── */}
      {tab === 'stock' && (
        <div>
          <p style={{ color: B.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Escanea el código de barras de un producto nuevo para añadirlo al catálogo, o actualiza uno existente.
          </p>

          <button onClick={() => setShowCamera(true)}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
            📷 Escanear código de barras
          </button>

          {/* Código */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Código de barras</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={{ ...inp, flex: 1, fontFamily: 'monospace' }} placeholder="Escanea o escribe el código"
                value={stockForm.barcode} onChange={e => setStockForm(f => ({ ...f, barcode: e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nombre del producto</label>
            <input style={inp} placeholder="Ej: Refresco Cola 33cl" value={stockForm.name} onChange={e => setStockForm(f => ({ ...f, name: e.target.value }))} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Precio (€)</label>
              <input style={inp} type="number" step="0.01" inputMode="decimal" placeholder="0,00" value={stockForm.price} onChange={e => setStockForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Categoría</label>
              <select style={inp} value={stockForm.category} onChange={e => setStockForm(f => ({ ...f, category: e.target.value }))}>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>Emoji</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {emojis.map(e => (
                <button key={e} onClick={() => setStockForm(f => ({ ...f, emoji: e }))}
                  style={{ width: 40, height: 40, borderRadius: 8, border: `2px solid ${stockForm.emoji === e ? B.mustard : 'transparent'}`, background: stockForm.emoji === e ? '#2A2200' : B.black, cursor: 'pointer', fontSize: 20 }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveStockProduct}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '15px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
            Guardar producto
          </button>
        </div>
      )}
    </div>
  );
}
