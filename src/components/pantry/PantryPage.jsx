import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePantry } from '@context/PantryContext'

/* ═══════════════════════════════════════════════════════
   KYŌRA — Mi Despensa
   Inventario de ingredientes por ubicación.
   ═══════════════════════════════════════════════════════ */

const css = `
.pnt-wrap { max-width:960px;margin:0 auto;padding:2.5rem 1.5rem 4rem;font-family:var(--font-b); }

/* ── Header ── */
.pnt-head { margin-bottom:2rem; }
@keyframes pntHeadIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
.pnt-head { animation:pntHeadIn .45s cubic-bezier(.22,1,.36,1) both .04s; }
.pnt-eyebrow { font-size:.58rem;font-weight:500;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:.6rem; }
.pnt-title { font-family:var(--font-d);font-size:2rem;font-weight:400;color:var(--charcoal);line-height:1.15;margin-bottom:.4rem; }
.pnt-title em { font-style:italic;color:var(--gold); }
.pnt-sub { font-size:.88rem;font-weight:300;color:var(--text-muted);line-height:1.6;max-width:520px; }

/* ── Summary strip ── */
.pnt-strip {
  display:flex;align-items:center;justify-content:space-between;gap:1rem;
  padding:.85rem 1.2rem;
  background:rgba(200,169,110,.07);
  border:1px solid rgba(200,169,110,.2);
  border-radius:6px;
  margin-bottom:1.8rem;
  animation:pntHeadIn .45s cubic-bezier(.22,1,.36,1) both .12s;
  flex-wrap:wrap;gap:.8rem;
}
.pnt-strip-text { font-size:.78rem;font-weight:400;color:var(--gold);letter-spacing:.02em; }
.pnt-strip-text strong { font-weight:600; }
.pnt-strip-cta {
  background:var(--charcoal);color:var(--gold-light);border:none;border-radius:3px;
  font-family:var(--font-b);font-size:.65rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;
  padding:.6rem 1.1rem;cursor:pointer;transition:all .22s;white-space:nowrap;
}
.pnt-strip-cta:hover { background:#000;letter-spacing:.18em; }

/* ── Empty state ── */
.pnt-empty {
  display:flex;flex-direction:column;align-items:center;gap:.8rem;
  padding:3.5rem 2rem;text-align:center;
  background:var(--white);border:1px solid var(--border);border-radius:8px;
  animation:pntCardIn .5s cubic-bezier(.22,1,.36,1) both .1s;
}
.pnt-empty-ico {
  width:60px;height:60px;border-radius:16px;
  background:var(--charcoal);
  display:flex;align-items:center;justify-content:center;
  margin-bottom:.5rem;
  box-shadow:0 8px 28px rgba(26,26,46,.18), 0 0 0 1px rgba(200,169,110,.1);
}
.pnt-empty-ico svg { color:var(--gold-light); }
.pnt-empty-title { font-family:var(--font-d);font-size:1.3rem;font-weight:400;color:var(--charcoal); }
.pnt-empty-body { font-size:.85rem;font-weight:300;color:var(--text-muted);line-height:1.65;max-width:400px; }

/* ── Grid ── */
@keyframes pntCardIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.pnt-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:1.2rem; }
.pnt-cat {
  background:var(--white);border:1px solid var(--border);border-radius:8px;
  overflow:hidden;
  animation:pntCardIn .5s cubic-bezier(.22,1,.36,1) both;
}
.pnt-cat:nth-child(1) { animation-delay:.08s }
.pnt-cat:nth-child(2) { animation-delay:.14s }
.pnt-cat:nth-child(3) { animation-delay:.2s }
.pnt-cat:nth-child(4) { animation-delay:.26s }

.pnt-cat-head {
  display:flex;align-items:center;gap:.8rem;
  padding:1.1rem 1.2rem;
  border-bottom:1px solid var(--border);
  background:linear-gradient(135deg,rgba(200,169,110,.04),transparent);
}
.pnt-cat-icon { font-size:1.3rem;flex-shrink:0; }
.pnt-cat-name {
  font-family:var(--font-d);font-size:1rem;font-weight:600;color:var(--charcoal);flex:1;
}
.pnt-cat-count {
  font-size:.6rem;font-weight:500;letter-spacing:.05em;
  color:var(--gold);background:rgba(200,169,110,.1);
  border:1px solid rgba(200,169,110,.2);border-radius:100px;
  padding:2px 8px;min-width:22px;text-align:center;
}

/* ── Add row ── */
.pnt-add-row { display:flex;gap:.5rem;padding:.9rem 1.1rem;border-bottom:1px solid rgba(200,169,110,.07); }
.pnt-add-input {
  flex:1;padding:.62rem .9rem;
  border:1.5px solid var(--border);border-radius:3px;
  background:var(--cream);font-family:var(--font-b);
  font-size:.85rem;font-weight:300;color:var(--text-dark);
  outline:none;transition:border-color .2s,box-shadow .2s;
}
.pnt-add-input:focus { border-color:var(--gold);box-shadow:0 0 0 3px rgba(200,169,110,.1);background:var(--white); }
.pnt-add-input::placeholder { color:var(--text-light); }
.pnt-add-btn {
  padding:.62rem 1rem;
  background:var(--charcoal);color:var(--gold-light);
  border:none;border-radius:3px;
  font-family:var(--font-b);font-size:.68rem;font-weight:500;
  letter-spacing:.1em;text-transform:uppercase;
  cursor:pointer;transition:all .2s;white-space:nowrap;
}
.pnt-add-btn:hover { background:#000; }
.pnt-add-btn:disabled { opacity:.35;cursor:not-allowed; }

/* ── Item list ── */
.pnt-items { padding:.8rem 1.1rem;min-height:60px;display:flex;flex-wrap:wrap;gap:.45rem;align-content:flex-start; }

.pnt-chip {
  display:inline-flex;align-items:center;gap:5px;
  padding:.35rem .75rem;
  background:rgba(200,169,110,.07);
  border:1px solid rgba(200,169,110,.18);
  border-radius:100px;
  font-size:.78rem;font-weight:400;color:var(--text-dark);
  animation:pntChipIn .2s cubic-bezier(.22,1,.36,1) both;
}
@keyframes pntChipIn { from{opacity:0;transform:scale(.92)} to{opacity:1;transform:scale(1)} }
.pnt-chip-x {
  width:15px;height:15px;border-radius:50%;
  border:none;background:rgba(0,0,0,.07);
  color:var(--text-light);font-size:10px;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:all .15s;padding:0;line-height:1;
}
.pnt-chip-x:hover { background:rgba(201,112,112,.15);color:#C97070; }

.pnt-empty-loc {
  width:100%;padding:1rem 0;
  text-align:center;font-size:.78rem;font-weight:300;
  color:var(--text-light);font-style:italic;
}

/* ── Responsive ── */
@media(max-width:640px) {
  .pnt-grid { grid-template-columns:1fr; }
  .pnt-title { font-size:1.7rem; }
  .pnt-strip { flex-direction:column;align-items:flex-start; }
  .pnt-add-input { font-size:16px; }
}
`

/* ── Category component ── */
function PantryCategory({ location, items, onRemove }) {
  const [newItem, setNewItem] = useState('')
  const { addItem } = usePantry()

  function handleAdd() {
    if (!newItem.trim()) return
    addItem(newItem.trim(), location.id)
    setNewItem('')
  }

  return (
    <div className="pnt-cat">
      <div className="pnt-cat-head">
        <span className="pnt-cat-icon">{location.icon}</span>
        <span className="pnt-cat-name">{location.label}</span>
        {items.length > 0 && <span className="pnt-cat-count">{items.length}</span>}
      </div>

      <div className="pnt-add-row">
        <input
          className="pnt-add-input"
          type="text"
          placeholder={`Agregar a ${location.label}…`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          className="pnt-add-btn"
          onClick={handleAdd}
          disabled={!newItem.trim()}
        >
          + Agregar
        </button>
      </div>

      <div className="pnt-items">
        {items.length === 0
          ? <span className="pnt-empty-loc">Sin ingredientes</span>
          : items.map((item) => (
              <span className="pnt-chip" key={item.id}>
                {item.name}
                <button
                  className="pnt-chip-x"
                  onClick={() => onRemove(item.id)}
                  aria-label={`Eliminar ${item.name}`}
                >×</button>
              </span>
            ))
        }
      </div>
    </div>
  )
}

/* ── Page ── */
export default function PantryPage() {
  const navigate = useNavigate()
  const { LOCATIONS, getByLocation, removeItem, items } = usePantry()

  return (
    <>
      <style>{css}</style>
      <div className="pnt-wrap">

        {/* Header */}
        <div className="pnt-head">
          <div className="pnt-eyebrow">Mi Despensa</div>
          <h1 className="pnt-title">Tus <em>ingredientes</em></h1>
          <p className="pnt-sub">
            Agrega lo que tienes y deja que KYŌRA cocine el plan. Sin desperdiciar lo que compraste.
          </p>
        </div>

        {/* Summary strip — solo si hay ingredientes */}
        {items.length > 0 && (
          <div className="pnt-strip">
            <span className="pnt-strip-text">
              ✦ <strong>{items.length} ingrediente{items.length !== 1 ? 's' : ''}</strong> registrado{items.length !== 1 ? 's' : ''} — tu coach los usará automáticamente al generar planes
            </span>
            <button className="pnt-strip-cta" onClick={() => navigate('/app/agent')}>
              Ir al coach IA →
            </button>
          </div>
        )}

        {/* Empty hero — si no hay nada en ninguna ubicación */}
        {items.length === 0 && (
          <div className="pnt-empty">
            <div className="pnt-empty-ico">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <div className="pnt-empty-title">Cuéntanos qué tienes en casa</div>
            <p className="pnt-empty-body">
              Agrega los ingredientes que tienes en casa y KYŌRA los usará para sugerirte recetas y planes que puedes cocinar hoy mismo.
            </p>
          </div>
        )}

        {/* Grid de ubicaciones */}
        <div className="pnt-grid">
          {LOCATIONS.map((loc) => (
            <PantryCategory
              key={loc.id}
              location={loc}
              items={getByLocation(loc.id)}
              onRemove={removeItem}
            />
          ))}
        </div>

      </div>
    </>
  )
}
