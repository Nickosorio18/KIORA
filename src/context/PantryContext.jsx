import { createContext, useContext, useState, useEffect, useMemo, createElement } from 'react'

/* ═══════════════════════════════════════════════════════
   KYŌRA — PantryContext
   Fuente única de verdad para la despensa del usuario.
   Persiste en localStorage. Soporta tanto la vista por
   item (PantryPage) como la vista agrupada (KyoraAgent).
   ═══════════════════════════════════════════════════════ */

/* ── SVG Icons for pantry locations ── */
const pIco = (children) => createElement('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.8', strokeLinecap: 'round', strokeLinejoin: 'round' }, children);

const PantryIcons = {
  alacena: pIco(createElement('path', { d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18' })),
  refrigerador: pIco([createElement('rect', { key: 'r', x: '4', y: '2', width: '16', height: '20', rx: '2' }), createElement('line', { key: 'l', x1: '4', y1: '10', x2: '20', y2: '10' }), createElement('line', { key: 'h', x1: '10', y1: '6', x2: '10', y2: '6.01' })]),
  congelador: pIco([createElement('line', { key: '1', x1: '12', y1: '2', x2: '12', y2: '22' }), createElement('line', { key: '2', x1: '2', y1: '12', x2: '22', y2: '12' }), createElement('line', { key: '3', x1: '5', y1: '5', x2: '19', y2: '19' }), createElement('line', { key: '4', x1: '19', y1: '5', x2: '5', y2: '19' })]),
  frutas_verduras: pIco([createElement('path', { key: 'l', d: 'M12 2a5 5 0 0 1 5 5c0 4-5 7-5 7s-5-3-5-7a5 5 0 0 1 5-5z' }), createElement('path', { key: 's', d: 'M12 14v8' }), createElement('path', { key: 'l1', d: 'M9 18h6' })]),
};

const PantryContext = createContext(null)

const STORAGE_KEY = 'kyora.pantry.items'

export const LOCATIONS = [
  { id: 'alacena', label: 'Alacena', icon: PantryIcons.alacena, desc: 'Granos, enlatados, especias, aceites...' },
  { id: 'refrigerador', label: 'Refrigerador', icon: PantryIcons.refrigerador, desc: 'Lácteos, carnes frescas, sobras...' },
  { id: 'congelador', label: 'Congelador', icon: PantryIcons.congelador, desc: 'Carnes congeladas, verduras, helados...' },
  { id: 'frutas_verduras', label: 'Frutas y Verduras', icon: PantryIcons.frutas_verduras, desc: 'Productos frescos del día...' },
]

export const LOCATION_IDS = LOCATIONS.map((l) => l.id)

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export const PantryProvider = ({ children }) => {
  const [items, setItems] = useState(() => loadFromStorage())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Ignore storage errors
    }
  }, [items])

  const addItem = (name, location) => {
    const clean = (name || '').trim()
    if (!clean) return
    // Support comma-separated batch add
    const names = clean.split(',').map((s) => s.trim()).filter(Boolean)
    setItems((prev) => {
      const existing = new Set(
        prev.filter((i) => i.location === location).map((i) => i.name.toLowerCase())
      )
      const toAdd = names
        .filter((n) => !existing.has(n.toLowerCase()))
        .map((n, idx) => ({ id: Date.now() + idx, name: n, location }))
      return [...prev, ...toAdd]
    })
  }

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const removeItemByName = (name, location) => {
    setItems((prev) =>
      prev.filter((item) => !(item.location === location && item.name === name))
    )
  }

  const getByLocation = (location) => items.filter((item) => item.location === location)

  const clear = () => setItems([])

  // Agrupado por ubicación como { alacena: ['Arroz','Avena',...], refrigerador: [...], ... }
  const asObject = useMemo(() => {
    const obj = {}
    LOCATION_IDS.forEach((id) => {
      obj[id] = items.filter((i) => i.location === id).map((i) => i.name)
    })
    return obj
  }, [items])

  const totalCount = items.length

  // Legacy: some old code expected an array of strings for LOCATIONS. Kept as object-array.
  return (
    <PantryContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        removeItemByName,
        getByLocation,
        clear,
        asObject,
        totalCount,
        LOCATIONS,
        LOCATION_IDS,
      }}
    >
      {children}
    </PantryContext.Provider>
  )
}

export const usePantry = () => {
  const ctx = useContext(PantryContext)
  if (!ctx) throw new Error('usePantry must be used within PantryProvider')
  return ctx
}
