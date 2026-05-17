import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
};

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

// ─── Carga ZXing desde CDN ────────────────────────────────────────────────────
function loadZXing() {
  return new Promise((resolve, reject) => {
    if (window.ZXing) { resolve(window.ZXing); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.19.1/umd/index.min.js';
    script.onload = () => resolve(window.ZXing);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// ─── Componente escáner con ZXing ─────────────────────────────────────────────
function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [status, setStatus] = useState('Iniciando cámara...');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const start = async () => {
      try {
        setStatus('Solicitando permiso de cámara...');

        // Primero pedir permiso explícitamente al navegador
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } }
          });
          // Detener el stream — ZXing abrirá el suyo propio
          stream.getTracks().forEach(t => t.stop());
        } catch (permErr) {
          setError('No se pudo acceder a la cámara. Ve a Ajustes del navegador y permite el acceso a la cámara para esta web.');
          return;
        }

        setStatus('Cargando escáner...');
        const ZXing = await loadZXing();

        if (!active) return;

        const hints = new Map();
        const formats = [
          ZXing.BarcodeFormat.EAN_13,
          ZXing.BarcodeFormat.EAN_8,
          ZXing.BarcodeFormat.CODE_128,
          ZXing.BarcodeFormat.CODE_39,
          ZXing.BarcodeFormat.UPC_A,
          ZXing.BarcodeFormat.UPC_E,
          ZXing.BarcodeFormat.QR_CODE,
          ZXing.BarcodeFormat.DATA_MATRIX,
        ];
        hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
        hints.set(ZXing.DecodeHintType.TRY_HARDER, true);

        const reader = new ZXing.BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 200,
        });
        readerRef.current = reader;

        setStatus('Apunta al código de barras...');

        // Obtener cámaras disponibles
        const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();
        // Preferir cámara trasera
        const backCamera = devices.find(d =>
          d.label.toLowerCase().includes('back') ||
          d.label.toLowerCase().includes('trasera') ||
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        ) || devices[devices.length - 1] || devices[0];

        if (!backCamera) {
          setError('No se encontró ninguna cámara en este dispositivo.');
          return;
        }

        await reader.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, err) => {
            if (!active) return;
            if (result) {
              const code = result.getText();
              if (code) {
                reader.reset();
                onDetected(code);
              }
            }
          }
        );
      } catch (e) {
        if (!active) return;
        console.error('Scanner error:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Permiso de cámara denegado. En iOS: Ajustes → Safari → Cámara → Permitir. En Android: toca el candado en la barra de direcciones → Cámara → Permitir.');
        } else if (e.name === 'NotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.');
        } else {
          setError('Error al iniciar la cámara. Inténtalo de nuevo.');
        }
      }
    };

    start();

    return () => {
      active = false;
      if (readerRef.current) {
        try { readerRef.current.reset(); } catch {}
      }
    };
  }, [onDetected]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: B.black, borderBottom: `2px solid ${B.mustard}`, flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: B.white }}>📷 Escanear código</span>
        <button onClick={onClose} style={{ background: 'none', border: `1px solid ${B.mid}`, color: B.muted, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕ Cerrar</button>
      </div>

      {/* Vídeo */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted autoPlay />

        {/* Marco guía */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: 280, height: 180 }}>
            {/* Sombra exterior */}
            <div style={{ position: 'absolute', inset: -9999, background: 'rgba(0,0,0,0.55)', boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.55)', clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 140px 0, 140px 90px, -140px 90px)' }} />
            {/* Bordes del marco */}
            {[
              { top: 0, left: 0, borderTop: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '10px 0 0 0', width: 36, height: 36 },
              { top: 0, right: 0, borderTop: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 10px 0 0', width: 36, height: 36 },
              { bottom: 0, left: 0, borderBottom: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '0 0 0 10px', width: 36, height: 36 },
              { bottom: 0, right: 0, borderBottom: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 0 10px 0', width: 36, height: 36 },
            ].map((s, i) => <div key={i} style={{ position: 'absolute', ...s }} />)}
            {/* Línea de escaneo animada */}
            <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${B.mustard}, transparent)`, animation: 'scan 2s ease-in-out infinite' }} />
          </div>
        </div>

        {/* Estado */}
        <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
          {error ? (
            <div style={{ background: 'rgba(200,0,0,0.85)', margin: '0 20px', borderRadius: 12, padding: '12px 16px', color: B.white, fontSize: 13 }}>{error}</div>
          ) : (
            <div style={{ color: B.mustard, fontWeight: 700, fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>{status}</div>
          )}
        </div>
      </div>

      {/* Entrada manual */}
      <div style={{ background: B.offBlack, borderTop: `1px solid ${B.mid}`, padding: '14px 16px', flexShrink: 0 }}>
        <ManualInput onDetected={onDetected} />
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  );
}

// ─── Entrada manual de código ─────────────────────────────────────────────────
function ManualInput({ onDetected }) {
  const [code, setCode] = useState('');
  return (
    <div>
      <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        ¿No funciona el escáner? Introduce el código manualmente
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '11px 14px', color: B.white, fontSize: 15, outline: 'none', fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}
          placeholder="Código de barras..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && code.trim()) { onDetected(code.trim()); setCode(''); } }}
          inputMode="numeric"
        />
        <button
          onClick={() => { if (code.trim()) { onDetected(code.trim()); setCode(''); } }}
          style={{ background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '0 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
          Buscar
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal Scanner ─────────────────────────────────────────────
export default function Scanner({ onAddToTicket }) {
  const [products, setProducts] = useState([]);
  const [tab, setTab] = useState('venta');
  const [showCamera, setShowCamera] = useState(false);
  const [stockForm, setStockForm] = useState({ barcode: '', name: '', price: '', category: 'Sandos' });
  const [result, setResult] = useState(null);
  const [notif, setNotif] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('tpv_products').select('*').eq('active', true);
    if (data) setProducts(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('tpv_categories').select('*').order('id');
    if (data) setCategories(data);
  };

  const notify = (msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2500); };

  const handleVentaScan = useCallback((code) => {
    setShowCamera(false);
    const product = products.find(p => p.barcode === code);
    if (product) {
      setResult({ type: 'found', product });
    } else {
      setResult({ type: 'notfound', code });
    }
  }, [products]);

  const handleStockScan = useCallback((code) => {
    setShowCamera(false);
    const existing = products.find(p => p.barcode === code);
    if (existing) {
      setStockForm({ barcode: code, name: existing.name, price: existing.price, category: existing.category });
      notify('Producto ya existe — puedes actualizarlo', 'warn');
    } else {
      setStockForm(f => ({ ...f, barcode: code }));
      notify('Código escaneado — rellena los datos');
    }
  }, [products]);

  const addToTicket = (product) => {
    onAddToTicket(product);
    notify(`✓ ${product.name} añadido al ticket`);
    setResult(null);
  };

  const saveStockProduct = async () => {
    if (!stockForm.barcode || !stockForm.name || !stockForm.price) { notify('Rellena todos los campos', 'err'); return; }
    const existing = products.find(p => p.barcode === stockForm.barcode);
    const payload = { name: stockForm.name, price: parseFloat(stockForm.price), category: stockForm.category, barcode: stockForm.barcode };
    if (existing) {
      await supabase.from('tpv_products').update(payload).eq('id', existing.id);
      setProducts(prev => prev.map(p => p.id === existing.id ? { ...p, ...payload } : p));
      notify('Producto actualizado ✓');
    } else {
      const newId = Date.now();
      await supabase.from('tpv_products').insert([{ id: newId, ...payload, active: true }]);
      setProducts(prev => [...prev, { id: newId, ...payload, active: true }]);
      notify('Producto añadido ✓');
    }
    setStockForm({ barcode: '', name: '', price: '', category: categories[0]?.name || 'Sandos' });
  };

  const inp = { width: '100%', background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', color: B.white, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const lbl = { display: 'block', fontSize: 10, color: B.mustard, fontWeight: 800, marginBottom: 6, letterSpacing: 1.5, textTransform: 'uppercase' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px', fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      {notif && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', padding: '10px 24px', borderRadius: 50, fontWeight: 800, fontSize: 13, zIndex: 9999, background: notif.type === 'err' ? B.red : notif.type === 'warn' ? '#B8880F' : B.mustard, color: B.black, whiteSpace: 'nowrap' }}>{notif.msg}</div>}

      {showCamera && (
        <BarcodeScanner
          onDetected={tab === 'venta' ? handleVentaScan : handleStockScan}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${B.mid}`, marginBottom: 20 }}>
        {[{ id: 'venta', label: '🏪 Modo venta' }, { id: 'stock', label: '📦 Gestión stock' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
            style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${B.mustard}` : '2px solid transparent', color: tab === t.id ? B.mustard : B.muted, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── MODO VENTA ── */}
      {tab === 'venta' && (
        <div>
          <p style={{ color: B.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Escanea el código de barras para añadir el producto al ticket.
          </p>
          <button onClick={() => { setResult(null); setShowCamera(true); }}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
            📷 Abrir cámara
          </button>

          {result?.type === 'found' && (
            <div style={{ background: '#0F2200', border: `1px solid ${B.mustard}`, borderRadius: 14, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: B.dark, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {result.product.image_url ? <img src={result.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>🥪</span>}
                </div>
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
              <div style={{ color: B.muted, fontSize: 12, marginBottom: 14, fontFamily: 'monospace' }}>{result.code}</div>
              <button onClick={() => { setTab('stock'); setStockForm(f => ({ ...f, barcode: result.code })); setResult(null); }}
                style={{ background: B.dark, border: `1px solid ${B.mid}`, color: B.white, borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                + Dar de alta este producto
              </button>
            </div>
          )}

          {/* Lista productos con código */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
              Productos con código ({products.filter(p => p.barcode).length})
            </div>
            {products.filter(p => p.barcode).length === 0 ? (
              <div style={{ color: B.muted, fontSize: 13, textAlign: 'center', padding: 20 }}>Ningún producto tiene código asignado aún</div>
            ) : products.filter(p => p.barcode).map(p => (
              <div key={p.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: B.dark, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🥪</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                  <div style={{ color: B.muted, fontSize: 11, fontFamily: 'monospace' }}>{p.barcode}</div>
                </div>
                <span style={{ color: B.mustard, fontWeight: 800 }}>{fmt(p.price)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MODO STOCK ── */}
      {tab === 'stock' && (
        <div>
          <p style={{ color: B.muted, fontSize: 13, marginBottom: 16, lineHeight: 1.5 }}>
            Escanea el código de barras de un producto para darlo de alta o actualizar sus datos.
          </p>
          <button onClick={() => setShowCamera(true)}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
            📷 Escanear código de barras
          </button>

          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Código de barras</label>
            <input style={{ ...inp, fontFamily: 'monospace' }} placeholder="Escanea o escribe el código"
              value={stockForm.barcode} onChange={e => setStockForm(f => ({ ...f, barcode: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Nombre del producto</label>
            <input style={inp} placeholder="Ej: Refresco Cola 33cl" value={stockForm.name}
              onChange={e => setStockForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div>
              <label style={lbl}>Precio (€)</label>
              <input style={inp} type="number" step="0.01" inputMode="decimal" placeholder="0,00" value={stockForm.price}
                onChange={e => setStockForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Categoría</label>
              <select style={inp} value={stockForm.category} onChange={e => setStockForm(f => ({ ...f, category: e.target.value }))}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                <option value="Otros">Otros</option>
              </select>
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
