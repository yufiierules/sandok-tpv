import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabase';

const B = {
  mustard: '#D4A017', red: '#CC0000',
  black: '#111111', offBlack: '#1A1A1A', dark: '#222222',
  mid: '#333333', light: '#444444', muted: '#777777', white: '#FFFFFF',
};

const fmt = (n) => Number(n).toFixed(2).replace('.', ',') + ' €';

// ─── Carga jsQR (QR) + quagga2 (barcodes) desde CDN ──────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Escáner con getUserMedia + canvas ───────────────────────────────────────
function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const [status, setStatus] = useState('Iniciando...');
  const [error, setError] = useState('');
  const [libsLoaded, setLibsLoaded] = useState(false);
  const detectedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        // 1. Cargar librerías
        setStatus('Cargando librerías...');
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js'),
          loadScript('https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js'),
        ]);
        if (!active) return;
        setLibsLoaded(true);

        // 2. Pedir permiso de cámara
        setStatus('Solicitando cámara...');
        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        };

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
          // Fallback sin preferencia de cámara
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;

        const video = videoRef.current;
        video.srcObject = stream;
        video.setAttribute('playsinline', true);
        await video.play();

        setStatus('Apunta al código de barras...');

        // 3. Bucle de detección
        const scan = () => {
          if (!active || detectedRef.current) return;
          const canvas = canvasRef.current;
          if (!canvas || !video || video.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan);
            return;
          }
          const { videoWidth: w, videoHeight: h } = video;
          if (!w || !h) { rafRef.current = requestAnimationFrame(scan); return; }

          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, w, h);
          const imageData = ctx.getImageData(0, 0, w, h);

          // Intentar QR con jsQR
          if (window.jsQR) {
            const qr = window.jsQR(imageData.data, w, h, { inversionAttempts: 'dontInvert' });
            if (qr && qr.data) {
              detectedRef.current = true;
              stop();
              onDetected(qr.data);
              return;
            }
          }

          // Intentar código de barras con Quagga
          if (window.Quagga) {
            window.Quagga.decodeSingle({
              decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader', 'code_39_reader', 'upc_reader', 'upc_e_reader'] },
              locate: true,
              src: canvas.toDataURL('image/jpeg', 0.8),
            }, (result) => {
              if (!active || detectedRef.current) return;
              if (result && result.codeResult && result.codeResult.code) {
                detectedRef.current = true;
                stop();
                onDetected(result.codeResult.code);
              }
            });
          }

          rafRef.current = requestAnimationFrame(scan);
        };

        rafRef.current = requestAnimationFrame(scan);

      } catch (e) {
        if (!active) return;
        console.error('Camera error:', e);
        if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
          setError('Permiso denegado.\n\niOS: Ajustes → Safari/Chrome → Cámara → Permitir\nAndroid: toca el 🔒 en la URL → Permisos → Cámara');
        } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
          setError('No se encontró ninguna cámara en este dispositivo.');
        } else if (e.name === 'NotReadableError') {
          setError('La cámara está en uso por otra app. Ciérrala e inténtalo de nuevo.');
        } else {
          setError(`Error: ${e.message || e.name || 'desconocido'}`);
        }
      }
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };

    init();

    return () => {
      active = false;
      stop();
    };
  }, [onDetected]);

  const handleClose = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 5000, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: B.black, borderBottom: `2px solid ${B.mustard}`, flexShrink: 0 }}>
        <span style={{ fontWeight: 900, fontSize: 16, color: B.white }}>📷 Escanear código</span>
        <button onClick={handleClose} style={{ background: 'none', border: `1px solid ${B.mid}`, color: B.muted, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕ Cerrar</button>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#000' }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Marco */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ position: 'relative', width: 260, height: 160 }}>
            {[
              { top: 0, left: 0, borderTop: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '10px 0 0 0' },
              { top: 0, right: 0, borderTop: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 10px 0 0' },
              { bottom: 0, left: 0, borderBottom: `4px solid ${B.mustard}`, borderLeft: `4px solid ${B.mustard}`, borderRadius: '0 0 0 10px' },
              { bottom: 0, right: 0, borderBottom: `4px solid ${B.mustard}`, borderRight: `4px solid ${B.mustard}`, borderRadius: '0 0 10px 0' },
            ].map((s, i) => <div key={i} style={{ position: 'absolute', width: 32, height: 32, ...s }} />)}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', padding: '0 20px' }}>
          {error ? (
            <div style={{ background: 'rgba(180,0,0,0.9)', borderRadius: 12, padding: '14px 16px', color: B.white, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', textAlign: 'left' }}>{error}</div>
          ) : (
            <div style={{ color: B.mustard, fontWeight: 700, fontSize: 14, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>{status}</div>
          )}
        </div>
      </div>

      {/* Entrada manual siempre visible */}
      <div style={{ background: B.offBlack, borderTop: `1px solid ${B.mid}`, padding: '14px 16px', flexShrink: 0 }}>
        <ManualInput onDetected={(code) => { handleClose(); onDetected(code); }} />
      </div>
    </div>
  );
}

function ManualInput({ onDetected }) {
  const [code, setCode] = useState('');
  const submit = () => { if (code.trim()) { onDetected(code.trim()); setCode(''); } };
  return (
    <div>
      <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>
        Introducir código manualmente
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          style={{ flex: 1, background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '11px 14px', color: B.white, fontSize: 15, outline: 'none', fontFamily: 'monospace' }}
          placeholder="Código de barras..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          inputMode="numeric"
        />
        <button onClick={submit}
          style={{ background: B.mustard, border: 'none', borderRadius: 10, color: B.black, padding: '0 18px', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
          OK
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Scanner({ onAddToTicket }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('venta');
  const [showCamera, setShowCamera] = useState(false);
  const [stockForm, setStockForm] = useState({ barcode: '', name: '', price: '', category: '' });
  const [result, setResult] = useState(null);
  const [notif, setNotif] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('tpv_products').select('*').eq('active', true),
      supabase.from('tpv_categories').select('*').order('id'),
    ]);
    if (prods) setProducts(prods);
    if (cats) { setCategories(cats); setStockForm(f => ({ ...f, category: cats[0]?.name || '' })); }
  };

  const notify = (msg, type = 'ok') => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 2500); };

  const handleVentaScan = useCallback((code) => {
    setShowCamera(false);
    const product = products.find(p => p.barcode === code);
    setResult(product ? { type: 'found', product } : { type: 'notfound', code });
  }, [products]);

  const handleStockScan = useCallback((code) => {
    setShowCamera(false);
    const existing = products.find(p => p.barcode === code);
    if (existing) {
      setStockForm({ barcode: code, name: existing.name, price: existing.price, category: existing.category });
      notify('Producto ya existe — puedes actualizarlo', 'warn');
    } else {
      setStockForm(f => ({ ...f, barcode: code }));
    }
  }, [products]);

  const saveStockProduct = async () => {
    if (!stockForm.barcode || !stockForm.name || !stockForm.price) { notify('Rellena todos los campos', 'err'); return; }
    const payload = { name: stockForm.name, price: parseFloat(stockForm.price), category: stockForm.category, barcode: stockForm.barcode };
    const existing = products.find(p => p.barcode === stockForm.barcode);
    if (existing) {
      await supabase.from('tpv_products').update(payload).eq('id', existing.id);
      setProducts(prev => prev.map(p => p.id === existing.id ? { ...p, ...payload } : p));
    } else {
      const newId = Date.now();
      await supabase.from('tpv_products').insert([{ id: newId, ...payload, active: true }]);
      setProducts(prev => [...prev, { id: newId, ...payload, active: true }]);
    }
    notify('Guardado ✓');
    setStockForm({ barcode: '', name: '', price: '', category: categories[0]?.name || '' });
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

      <div style={{ display: 'flex', borderBottom: `1px solid ${B.mid}`, marginBottom: 20 }}>
        {[{ id: 'venta', label: '🏪 Venta' }, { id: 'stock', label: '📦 Stock' }].map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setResult(null); }}
            style={{ flex: 1, background: 'none', border: 'none', borderBottom: tab === t.id ? `2px solid ${B.mustard}` : '2px solid transparent', color: tab === t.id ? B.mustard : B.muted, padding: '10px 0', cursor: 'pointer', fontWeight: 700, fontSize: 14, fontFamily: 'inherit', marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'venta' && (
        <div>
          <button onClick={() => { setResult(null); setShowCamera(true); }}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
            📷 Abrir cámara
          </button>

          {result?.type === 'found' && (
            <div style={{ background: '#0F2200', border: `1px solid ${B.mustard}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: 10, background: B.dark, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {result.product.image_url ? <img src={result.product.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 28 }}>🥪</span>}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{result.product.name}</div>
                  <div style={{ color: B.mustard, fontWeight: 800, fontSize: 16 }}>{fmt(result.product.price)}</div>
                </div>
              </div>
              <button onClick={() => { onAddToTicket(result.product); notify(`✓ ${result.product.name} añadido`); setResult(null); }}
                style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 12, padding: '14px 0', fontSize: 16, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}>
                ✓ Añadir al ticket
              </button>
            </div>
          )}

          {result?.type === 'notfound' && (
            <div style={{ background: '#2A0000', border: `1px solid ${B.red}`, borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>❌</div>
              <div style={{ fontWeight: 700 }}>Producto no encontrado</div>
              <div style={{ color: B.muted, fontSize: 12, margin: '6px 0 14px', fontFamily: 'monospace' }}>{result.code}</div>
              <button onClick={() => { setTab('stock'); setStockForm(f => ({ ...f, barcode: result.code })); setResult(null); }}
                style={{ background: B.dark, border: `1px solid ${B.mid}`, color: B.white, borderRadius: 10, padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
                + Dar de alta
              </button>
            </div>
          )}

          <div style={{ fontSize: 11, color: B.muted, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Con código ({products.filter(p => p.barcode).length})
          </div>
          {products.filter(p => p.barcode).map(p => (
            <div key={p.id} style={{ background: B.black, border: `1px solid ${B.mid}`, borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: B.dark, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {p.image_url ? <img src={p.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 18 }}>🥪</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                <div style={{ color: B.muted, fontSize: 11, fontFamily: 'monospace' }}>{p.barcode}</div>
              </div>
              <span style={{ color: B.mustard, fontWeight: 800 }}>{fmt(p.price)}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'stock' && (
        <div>
          <button onClick={() => setShowCamera(true)}
            style={{ width: '100%', background: B.mustard, border: 'none', color: B.black, borderRadius: 14, padding: '18px 0', fontSize: 17, fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
            📷 Escanear código
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
              <input style={inp} type="number" step="0.01" inputMode="decimal" value={stockForm.price}
                onChange={e => setStockForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" />
            </div>
            <div>
              <label style={lbl}>Categoría</label>
              <select style={inp} value={stockForm.category} onChange={e => setStockForm(f => ({ ...f, category: e.target.value }))}>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
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
