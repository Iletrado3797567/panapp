import { useState, useEffect } from 'react'
import { list, create, update, remove } from '../../api/sheetsClient'
import { Breadcrumb, SearchBar, ActionBar, ModalConfirmDelete } from '../shared'

const SHEET_V = 'VARIANTES'
const SHEET_F = 'FORMULAS'

const BASES = [
  'HARINA TOTAL',
  'HARINA SECA',
  'HARINA MASA MADRE',
  'HARINA ESCALDADO',
  'SEMILLAS SECAS',
]

// ============================================================
// ProductoSearchBox — listbox desplegable con búsqueda
// ============================================================
function ProductoSearchBox({ productos, value, onChange }) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const selected = productos.find(p => String(p.Id) === String(value))
  const filtered = productos
    .filter(p => p.Nombre.toUpperCase().includes(search.toUpperCase()))
    .sort((a, b) => a.Nombre.localeCompare(b.Nombre))

  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <div
        className="w-full border rounded px-3 py-2 text-sm cursor-pointer flex items-center justify-between bg-white hover:border-primary transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span className={selected ? 'font-medium' : 'text-gray-400'}>
          {selected ? selected.Nombre : '— Selecciona producto —'}
        </span>
        <span className="text-gray-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="absolute z-20 w-full border rounded bg-white shadow-lg mt-1">
          <input
            className="w-full px-3 py-2 text-sm border-b outline-none focus:bg-orange-50"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value.toUpperCase())}
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-400">Sin resultados</div>
            ) : (
              filtered.map(p => (
                <div
                  key={p.Id}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 ${
                    String(p.Id) === String(value) ? 'bg-orange-100 font-medium' : ''
                  }`}
                  onClick={() => { onChange(p); setOpen(false); setSearch('') }}
                >
                  {p.Nombre}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// InsumoRow — fila reutilizable: insumo + % [+ base]
// ============================================================
function InsumoRow({ insumos, row, onChange, onRemove, showBase = false, label = '' }) {
  return (
    <div className="flex gap-2 items-center mb-2">
      <select
        className="flex-1 border rounded px-2 py-1.5 text-sm min-w-0"
        value={row.insumoId}
        onChange={e => onChange({ ...row, insumoId: e.target.value })}
      >
        <option value="">— {label || 'Insumo'} —</option>
        {insumos.map(ins => (
          <option key={ins.Id} value={ins.Id}>{ins.Nombre}</option>
        ))}
      </select>
      <div className="flex items-center gap-1 flex-shrink-0">
        <input
          type="number"
          className="w-20 border rounded px-2 py-1.5 text-sm text-right"
          placeholder="%"
          min="0"
          max="999"
          step="0.1"
          value={row.pct}
          onChange={e => onChange({ ...row, pct: e.target.value })}
        />
        <span className="text-xs text-gray-400">%</span>
      </div>
      {showBase && (
        <select
          className="w-32 border rounded px-2 py-1.5 text-sm flex-shrink-0"
          value={row.base}
          onChange={e => onChange({ ...row, base: e.target.value })}
        >
          {BASES.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      )}
      <button
        onClick={onRemove}
        className="text-red-400 hover:text-red-600 text-xl leading-none w-6 flex-shrink-0"
        title="Eliminar fila"
      >
        ×
      </button>
    </div>
  )
}

// ============================================================
// WizardFormula — 7 pasos
// ============================================================
function WizardFormula({ variante, insumos, onFinish, onSalir }) {
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Paso 1 — Harinas secas
  const [harinasSec, setHarinasSec] = useState([{ insumoId: '', pct: '' }])

  // Paso 2 — Escaldado
  const [escPct, setEscPct] = useState('')
  const [harinasEsc, setHarinasEsc] = useState([{ insumoId: '', pct: '' }])
  const [hidratEsc, setHidratEsc] = useState('')

  // Paso 3 — Masa Madre
  const [mmPct, setMmPct] = useState('')
  const [harinasMM, setHarinasMM] = useState([{ insumoId: '', pct: '' }])
  const [hidratMM, setHidratMM] = useState('')

  // Paso 4 — Semillas
  const [srPct, setSrPct] = useState('')
  const [hidratSem, setHidratSem] = useState('')

  // Paso 5 — Sal
  const [salInsumoId, setSalInsumoId] = useState('')
  const [salPct, setSalPct] = useState('')

  // Paso 6 — Hidratación total
  const [hidratTotal, setHidratTotal] = useState('')

  // Paso 7 — Otros insumos
  const [otros, setOtros] = useState([])

  // Filtros por clase
  const harinas = insumos.filter(i => i.Clase === 'HARINA')
  const aguaInsumos = insumos.filter(i => i.Clase === 'AGUA')
  const otrosClase = insumos.filter(i => i.Clase === 'OTROS')
  const todosInsumos = [...insumos].sort((a, b) => a.Nombre.localeCompare(b.Nombre))

  // Helpers de filas
  function addRow(list, setList, base = 'HARINA TOTAL') {
    setList([...list, { insumoId: '', pct: '', base }])
  }
  function updateRow(list, setList, idx, val) {
    const n = [...list]; n[idx] = val; setList(n)
  }
  function removeRow(list, setList, idx) {
    setList(list.filter((_, i) => i !== idx))
  }

  // Guardar todo al finalizar el wizard
  async function handleFinish() {
    setSaving(true)
    setError(null)
    try {
      const vid = String(variante.Id)
      const formulaRows = []

      // Paso 1: harinas secas
      for (const h of harinasSec) {
        if (h.insumoId && h.pct) {
          formulaRows.push({
            Variante: vid, Insumo: h.insumoId,
            Base_Calculo: 'HARINA SECA', Porc1: h.pct,
            Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
            Tipo: 'HARINA SECA',
          })
        }
      }

      // Paso 2: escaldado
      const escNum = parseFloat(escPct) || 0
      const hidratEscNum = parseFloat(hidratEsc) || 0
      let heVal = '', aeVal = ''
      if (escNum > 0) {
        for (const h of harinasEsc) {
          if (h.insumoId && h.pct) {
            formulaRows.push({
              Variante: vid, Insumo: h.insumoId,
              Base_Calculo: 'HARINA ESCALDADO', Porc1: h.pct,
              Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
              Tipo: 'HARINA ESCALDADO',
            })
          }
        }
        if (hidratEscNum > 0 && aguaInsumos.length > 0) {
          formulaRows.push({
            Variante: vid, Insumo: aguaInsumos[0].Id,
            Base_Calculo: 'HARINA ESCALDADO', Porc1: String(hidratEscNum),
            Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
            Tipo: 'HIDRATACIÓN ESCALDADO',
          })
          // HE = harina / (harina + agua) = 100 / (1 + hidrat/100)
          heVal = (100 / (1 + hidratEscNum / 100)).toFixed(2)
          aeVal = (100 - parseFloat(heVal)).toFixed(2)
        }
      }

      // Paso 3: masa madre
      const mmNum = parseFloat(mmPct) || 0
      const hidratMMNum = parseFloat(hidratMM) || 0
      let hmVal = '', amVal = ''
      if (mmNum > 0) {
        for (const h of harinasMM) {
          if (h.insumoId && h.pct) {
            formulaRows.push({
              Variante: vid, Insumo: h.insumoId,
              Base_Calculo: 'HARINA MASA MADRE', Porc1: h.pct,
              Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
              Tipo: 'HARINA MASA MADRE',
            })
          }
        }
        if (hidratMMNum > 0 && aguaInsumos.length > 0) {
          formulaRows.push({
            Variante: vid, Insumo: aguaInsumos[0].Id,
            Base_Calculo: 'HARINA MASA MADRE', Porc1: String(hidratMMNum),
            Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
            Tipo: 'HIDRATACIÓN MASA MADRE',
          })
          hmVal = (100 / (1 + hidratMMNum / 100)).toFixed(2)
          amVal = (100 - parseFloat(hmVal)).toFixed(2)
        }
      }

      // Paso 4: semillas
      const srNum = parseFloat(srPct) || 0
      const hidratSemNum = parseFloat(hidratSem) || 0
      let ssVal = '', asVal = ''
      if (srNum > 0 && hidratSemNum > 0 && aguaInsumos.length > 0) {
        formulaRows.push({
          Variante: vid, Insumo: aguaInsumos[0].Id,
          Base_Calculo: 'SEMILLAS SECAS', Porc1: String(hidratSemNum),
          Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
          Tipo: 'HIDRATACIÓN SEMILLAS',
        })
        // SS = secas/remojadas = 1 / (1 + hidrat/100)
        ssVal = (1 / (1 + hidratSemNum / 100)).toFixed(4)
        asVal = (1 - parseFloat(ssVal)).toFixed(4)
      }

      // Paso 5: sal
      if (salInsumoId && salPct) {
        formulaRows.push({
          Variante: vid, Insumo: salInsumoId,
          Base_Calculo: 'HARINA TOTAL', Porc1: salPct,
          Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
          Tipo: 'HIDRATACIÓN ADICIONAL',
        })
      }

      // Paso 7: otros insumos
      for (const o of otros) {
        if (o.insumoId && o.pct) {
          formulaRows.push({
            Variante: vid, Insumo: o.insumoId,
            Base_Calculo: o.base || 'HARINA TOTAL', Porc1: o.pct,
            Gramos1: '', Porc2: '', Gramos2: '', Porc3: '', Gramos3: '',
            Tipo: 'HIDRATACIÓN ADICIONAL',
          })
        }
      }

      // Crear filas en FORMULAS (secuencial para respetar IDs)
      for (const row of formulaRows) {
        await create(SHEET_F, row)
      }

      // Actualizar campos calculados en VARIANTES
      await update(SHEET_V, variante.Id, {
        ESC: escNum > 0 ? String(escNum) : '',
        MM: mmNum > 0 ? String(mmNum) : '',
        SR: srNum > 0 ? String(srNum) : '',
        HE: heVal,
        HM: hmVal,
        AE: aeVal,
        AM: amVal,
        AT: hidratTotal || '',
        SS: ssVal,
        AS: asVal,
      })

      onFinish()
    } catch (e) {
      setError('Error al guardar fórmula: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const STEP_TITLES = [
    'Harinas secas',
    'Escaldado',
    'Masa madre',
    'Semillas',
    'Sal',
    'Hidratación total',
    'Otros insumos',
  ]

  function StepIndicator() {
    return (
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {STEP_TITLES.map((title, i) => (
          <div key={i} className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => i + 1 < step && setStep(i + 1)}
              className={[
                'w-7 h-7 rounded-full text-xs flex items-center justify-center font-semibold transition-colors',
                step === i + 1
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-1'
                  : step > i + 1
                  ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                  : 'bg-gray-200 text-gray-400 cursor-default',
              ].join(' ')}
              title={title}
            >
              {step > i + 1 ? '✓' : i + 1}
            </button>
            {i < STEP_TITLES.length - 1 && (
              <div className={`w-3 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  function NavButtons({ canNext = true, isLast = false }) {
    return (
      <div className="flex flex-wrap gap-2 mt-5">
        {step > 1 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
          >
            ← Atrás
          </button>
        )}
        {!isLast ? (
          <button
            disabled={!canNext}
            onClick={() => { setError(null); setStep(s => s + 1) }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-40"
          >
            Siguiente →
          </button>
        ) : (
          <button
            disabled={saving}
            onClick={handleFinish}
            className="bg-green-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-40"
          >
            {saving ? 'Guardando...' : '✓ Guardar fórmula'}
          </button>
        )}
        <button
          onClick={onSalir}
          className="ml-auto border px-4 py-2 rounded text-sm text-gray-500 hover:bg-gray-50"
        >
          Salir
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <div className="mb-4">
        <h3 className="font-semibold text-base">Fórmula original</h3>
        <p className="text-sm text-muted-foreground">{variante.Nombre} · {variante.Masa}g</p>
      </div>

      <StepIndicator />

      <div className="text-sm font-semibold text-primary mb-3">
        Paso {step} — {STEP_TITLES[step - 1]}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {error}
        </div>
      )}

      {/* ---- Paso 1: Harinas secas ---- */}
      {step === 1 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Harinas directas (excluye las que van en escaldado o masa madre). Porcentaje sobre harina seca.
          </p>
          {harinasSec.map((row, i) => (
            <InsumoRow
              key={i}
              insumos={harinas}
              row={row}
              onChange={val => updateRow(harinasSec, setHarinasSec, i, val)}
              onRemove={() => removeRow(harinasSec, setHarinasSec, i)}
              label="Harina"
            />
          ))}
          <button
            onClick={() => addRow(harinasSec, setHarinasSec)}
            className="text-sm text-primary hover:underline mt-1"
          >
            + Añadir harina
          </button>
          <NavButtons canNext={harinasSec.some(h => h.insumoId && h.pct)} />
        </div>
      )}

      {/* ---- Paso 2: Escaldado ---- */}
      {step === 2 && (
        <div>
          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-1">
              % Escaldado sobre harina seca <span className="text-gray-400">(0 = sin escaldado)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="200" step="0.5"
                className="w-32 border rounded px-3 py-2 text-sm text-right"
                value={escPct}
                onChange={e => setEscPct(e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
          {parseFloat(escPct) > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Harinas en el escaldado. Porcentaje sobre la harina total del escaldado.
              </p>
              {harinasEsc.map((row, i) => (
                <InsumoRow
                  key={i}
                  insumos={harinas}
                  row={row}
                  onChange={val => updateRow(harinasEsc, setHarinasEsc, i, val)}
                  onRemove={() => removeRow(harinasEsc, setHarinasEsc, i)}
                  label="Harina"
                />
              ))}
              <button
                onClick={() => addRow(harinasEsc, setHarinasEsc)}
                className="text-sm text-primary hover:underline mb-4 block"
              >
                + Añadir harina
              </button>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  % Hidratación del escaldado <span className="text-xs text-gray-400">(agua / harina)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="600" step="1"
                    className="w-32 border rounded px-3 py-2 text-sm text-right"
                    value={hidratEsc}
                    onChange={e => setHidratEsc(e.target.value)}
                    placeholder="200"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            </>
          )}
          <NavButtons />
        </div>
      )}

      {/* ---- Paso 3: Masa madre ---- */}
      {step === 3 && (
        <div>
          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-1">
              % Masa madre sobre harina seca <span className="text-gray-400">(0 = sin masa madre)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="200" step="0.5"
                className="w-32 border rounded px-3 py-2 text-sm text-right"
                value={mmPct}
                onChange={e => setMmPct(e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
          {parseFloat(mmPct) > 0 && (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                Harinas en la masa madre. Porcentaje sobre la harina total de la MM.
              </p>
              {harinasMM.map((row, i) => (
                <InsumoRow
                  key={i}
                  insumos={harinas}
                  row={row}
                  onChange={val => updateRow(harinasMM, setHarinasMM, i, val)}
                  onRemove={() => removeRow(harinasMM, setHarinasMM, i)}
                  label="Harina"
                />
              ))}
              <button
                onClick={() => addRow(harinasMM, setHarinasMM)}
                className="text-sm text-primary hover:underline mb-4 block"
              >
                + Añadir harina
              </button>
              <div>
                <label className="text-sm text-muted-foreground block mb-1">
                  % Hidratación de la masa madre <span className="text-xs text-gray-400">(agua / harina)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="0" max="300" step="1"
                    className="w-32 border rounded px-3 py-2 text-sm text-right"
                    value={hidratMM}
                    onChange={e => setHidratMM(e.target.value)}
                    placeholder="100"
                  />
                  <span className="text-sm text-gray-400">%</span>
                </div>
              </div>
            </>
          )}
          <NavButtons />
        </div>
      )}

      {/* ---- Paso 4: Semillas ---- */}
      {step === 4 && (
        <div>
          <div className="mb-4">
            <label className="text-sm text-muted-foreground block mb-1">
              % Semillas remojadas sobre harina total <span className="text-gray-400">(0 = sin semillas)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number" min="0" max="100" step="0.5"
                className="w-32 border rounded px-3 py-2 text-sm text-right"
                value={srPct}
                onChange={e => setSrPct(e.target.value)}
                placeholder="0"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
          </div>
          {parseFloat(srPct) > 0 && (
            <div>
              <label className="text-sm text-muted-foreground block mb-1">
                % Hidratación de las semillas <span className="text-xs text-gray-400">(agua / semillas secas)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="300" step="1"
                  className="w-32 border rounded px-3 py-2 text-sm text-right"
                  value={hidratSem}
                  onChange={e => setHidratSem(e.target.value)}
                  placeholder="100"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>
              {hidratSem && (
                <p className="text-xs text-muted-foreground mt-1">
                  SS = {(1 / (1 + parseFloat(hidratSem) / 100)).toFixed(3)} ·
                  AS = {(1 - 1 / (1 + parseFloat(hidratSem) / 100)).toFixed(3)}
                </p>
              )}
            </div>
          )}
          <NavButtons />
        </div>
      )}

      {/* ---- Paso 5: Sal ---- */}
      {step === 5 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Porcentaje sobre harina total. Deja en blanco si no aplica.
          </p>
          <div className="flex gap-2 items-center">
            <select
              className="flex-1 border rounded px-2 py-2 text-sm"
              value={salInsumoId}
              onChange={e => setSalInsumoId(e.target.value)}
            >
              <option value="">— Insumo sal —</option>
              {otrosClase.map(ins => (
                <option key={ins.Id} value={ins.Id}>{ins.Nombre}</option>
              ))}
            </select>
            <div className="flex items-center gap-1 flex-shrink-0">
              <input
                type="number" min="0" max="10" step="0.01"
                className="w-20 border rounded px-2 py-2 text-sm text-right"
                placeholder="2"
                value={salPct}
                onChange={e => setSalPct(e.target.value)}
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <NavButtons />
        </div>
      )}

      {/* ---- Paso 6: Hidratación total ---- */}
      {step === 6 && (
        <div>
          <label className="text-sm text-muted-foreground block mb-1">
            % Hidratación total deseada
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number" min="0" max="200" step="0.5"
              className="w-32 border rounded px-3 py-2 text-sm text-right"
              value={hidratTotal}
              onChange={e => setHidratTotal(e.target.value)}
              placeholder="75"
              autoFocus
            />
            <span className="text-sm text-gray-400">%</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Hidratación total sobre harina total. El agua directa se calculará restando
            la del escaldado, masa madre y semillas.
          </p>
          <NavButtons canNext={!!hidratTotal} />
        </div>
      )}

      {/* ---- Paso 7: Otros insumos ---- */}
      {step === 7 && (
        <div>
          <p className="text-xs text-muted-foreground mb-3">
            Levadura, aceite, miel u otros. Opcional. Indica base de cálculo para cada uno.
          </p>
          {otros.length === 0 && (
            <p className="text-sm text-gray-400 mb-3">Sin ingredientes adicionales.</p>
          )}
          {otros.map((row, i) => (
            <InsumoRow
              key={i}
              insumos={todosInsumos}
              row={row}
              onChange={val => updateRow(otros, setOtros, i, val)}
              onRemove={() => removeRow(otros, setOtros, i)}
              showBase
            />
          ))}
          <button
            onClick={() => addRow(otros, setOtros, 'HARINA TOTAL')}
            className="text-sm text-primary hover:underline mt-1 block"
          >
            + Añadir insumo
          </button>
          <NavButtons canNext isLast />
        </div>
      )}
    </div>
  )
}

// ============================================================
// VarianteForm — nuevo / editar
// ============================================================
function VarianteForm({ initial, productos, productoFijo, onSave, onCancel, onVerFormula }) {

  const [prodId, setProdId] = useState(
    productoFijo ? String(productoFijo.Id) : (initial?.Productos || '')
  )
  const [distintivo, setDistintivo] = useState(initial?.Distintivo || '')
  const [masa, setMasa] = useState(initial?.Masa || '')

  const prodSeleccionado = productoFijo || productos.find(p => String(p.Id) === String(prodId))
  const nombreVariante = prodSeleccionado && distintivo.trim()
    ? `${prodSeleccionado.Nombre} ${distintivo.trim().toUpperCase()}`
    : (prodSeleccionado?.Nombre || '')

  function handleProdChange(prod) {
    setProdId(String(prod.Id))
    // Autocargar masa del producto si el campo está vacío
    if (!masa && prod.Masa) setMasa(prod.Masa)
  }

  function handleSubmit() {
    if (!prodId || !distintivo.trim()) return
    onSave({
      Productos: String(prodId),
      Distintivo: distintivo.trim().toUpperCase(),
      Nombre: nombreVariante,
      Masa: masa,
      ESC: '', MM: '', SR: '', HS: '', HT: '',
      HE: '', HM: '', AE: '', AM: '', AT: '', SS: '', AS: '',
    })
  }

  const canSubmit = !!prodId && !!distintivo.trim()

  return (
    <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="font-semibold mb-3">{initial ? 'Editar variante' : 'Nueva variante'}</h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2" onClick={e => e.stopPropagation()}>
          <label className="text-sm text-muted-foreground block mb-1">Producto *</label>
          {productoFijo ? (
            <div className="w-full border rounded px-3 py-2 text-sm bg-gray-50 text-gray-600">
              {productoFijo.Nombre}
            </div>
          ) : (
            <ProductoSearchBox
              productos={productos}
              value={prodId}
              onChange={handleProdChange}
            />
          )}
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Distintivo *</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm uppercase"
            value={distintivo}
            onChange={e => setDistintivo(e.target.value.toUpperCase())}
            placeholder="EJ: INVIERNO"
            autoFocus
          />
          {nombreVariante && (
            <p className="text-xs text-muted-foreground mt-1">
              Nombre: <strong>{nombreVariante}</strong>
            </p>
          )}
        </div>

        <div>
          <label className="text-sm text-muted-foreground block mb-1">Masa (g)</label>
          <input
            className="w-full border rounded px-3 py-2 text-sm"
            type="number"
            step="1"
            value={masa}
            onChange={e => setMasa(e.target.value)}
            placeholder="Se autocarga del producto"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90 disabled:opacity-40"
        >
          Guardar variante
        </button>
        <button
          onClick={onCancel}
          className="border px-4 py-2 rounded text-sm hover:bg-gray-50"
        >
          Cancelar
        </button>
	{initial && onVerFormula && (
          <button
            onClick={onVerFormula}
            className="ml-auto flex items-center gap-2 border border-primary text-primary px-4 py-2 rounded text-sm hover:bg-orange-50"
          >
            🧪 Fórmula original →
          </button>
        )}


        
      </div>
    </div>
  )
}

// ============================================================
// Panel post-guardado
// ============================================================
function PostSavePanel({ variante, onFormula, onSalir }) {
  return (
    <div className="bg-white border rounded-lg p-6 text-center shadow-sm">
      <div className="text-3xl mb-3">✅</div>
      <h3 className="font-semibold text-lg mb-1">{variante.Nombre}</h3>
      <p className="text-sm text-muted-foreground mb-6">Variante guardada correctamente</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={onFormula}
          className="bg-primary text-primary-foreground px-6 py-3 rounded text-sm font-medium hover:opacity-90"
        >
          🧪 Fórmula original
        </button>
        <button
          onClick={onSalir}
          className="border px-6 py-3 rounded text-sm hover:bg-gray-50"
        >
          Salir
        </button>
      </div>
    </div>
  )
}

// ============================================================
// VariantesPage — componente principal
// ============================================================
export default function VariantesPage({ productoFijo, onVolver, breadcrumbExtra = [] }) {
  const [variantes, setVariantes] = useState([])
  const [productos, setProductos] = useState([])
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [savedVariante, setSavedVariante] = useState(null)
  const [showWizard, setShowWizard] = useState(false)

  async function load() {
    try {
      setLoading(true)
      const [vars, prods, ins] = await Promise.all([
        list(SHEET_V),
        list('PRODUCTOS'),
        list('INSUMOS'),
      ])
      setVariantes(vars)
      setProductos(prods)
      setInsumos(ins)
    } catch (e) {
      setError('Error al cargar: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    try {
      let saved
      if (editing) {
        saved = await update(SHEET_V, editing.Id, data)
      } else {
        saved = await create(SHEET_V, data)
      }
      setShowForm(false)
      setEditing(null)
      setSelected(null)
      setSavedVariante(saved)   // → panel post-guardado
      load()
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return
    try {
      await remove(SHEET_V, confirmDelete.Id)
      setConfirmDelete(null)
      setSelected(null)
      load()
    } catch (e) {
      setError('Error al eliminar: ' + e.message)
    }
  }

  function handleRowClick(v) {
    setSelected(prev => prev?.Id === v.Id ? null : v)
    setShowForm(false)
    setEditing(null)
  }

  // ---- Panel post-guardado ----
  if (savedVariante && !showWizard) {
    return (
      <div>
        <Breadcrumb crumbs={[...breadcrumbExtra]} />
        <PostSavePanel
          variante={savedVariante}
          onFormula={() => setShowWizard(true)}
          onSalir={() => setSavedVariante(null)}
        />
      </div>
    )
  }

  // ---- Wizard ----
  if (showWizard && savedVariante) {
    const crumbs = [
      ...breadcrumbExtra,
      { label: savedVariante.Nombre, onClick: () => setShowWizard(false) },
      { label: 'Fórmula original' },
    ]
    return (
      <div>
        <Breadcrumb crumbs={crumbs} />
        <WizardFormula
          variante={savedVariante}
          insumos={insumos}
          onFinish={() => { setShowWizard(false); setSavedVariante(null) }}
          onSalir={() => setShowWizard(false)}
        />
      </div>
    )
  }

  // ---- Lista principal ----
  const variantesFiltradas = [...variantes]
    .filter(v => {
      const coincideProd = !productoFijo || String(v.Productos) === String(productoFijo.Id)
      const coincideBusq = (v.Nombre || '').toUpperCase().includes(busqueda.toUpperCase())
      return coincideProd && coincideBusq
    })
    .sort((a, b) => parseInt(b.Id) - parseInt(a.Id))

  const crumbs = [...breadcrumbExtra]

  return (
    <div onClick={() => setSelected(null)}>
      <Breadcrumb crumbs={crumbs} />

      <div className="flex items-center justify-between mb-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">
          {productoFijo ? `Variantes — ${productoFijo.Nombre}` : 'Variantes'}
        </h2>
        <div className="flex items-center gap-2">
          {onVolver && (
            <button
              onClick={onVolver}
              className="border px-3 py-2 rounded text-sm hover:bg-gray-50"
            >
              ← Volver
            </button>
          )}
          <button
            onClick={() => { setShowForm(true); setEditing(null); setSelected(null) }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:opacity-90"
          >
            + Nueva variante
          </button>
        </div>
      </div>

      <div onClick={e => e.stopPropagation()}>
        <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar variante..." />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm"
          onClick={e => e.stopPropagation()}>
          {error}
        </div>
      )}

      {(showForm || editing) && (
        <div onClick={e => e.stopPropagation()}>
          <VarianteForm
            initial={editing}
            productos={productos}
            productoFijo={productoFijo}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditing(null) }}
            onVerFormula={() => { setSavedVariante(editing); setEditing(null); setShowForm(false); setShowWizard(true) }}
          />
        </div>
      )}

      {!(showForm || editing) && (
        loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : variantesFiltradas.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {variantes.filter(v => !productoFijo || String(v.Productos) === String(productoFijo.Id)).length === 0
              ? 'No hay variantes. Crea la primera.'
              : 'No hay resultados.'}
          </p>
        ) : (
          <div
            className={`bg-white rounded-lg border overflow-hidden ${selected ? 'pb-24' : ''}`}
            onClick={e => e.stopPropagation()}
          >
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Masa (g)</th>
                </tr>
              </thead>
              <tbody>
                {variantesFiltradas.map((v, i) => {
                  const isSelected = selected?.Id === v.Id
                  return (
                    <tr
                      key={v.Id}
                      onClick={() => handleRowClick(v)}
                      className={[
                        'cursor-pointer transition-colors',
                        isSelected
                          ? 'bg-orange-100 border-l-4 border-l-primary'
                          : i % 2 === 0 ? 'bg-white hover:bg-orange-50' : 'bg-gray-50 hover:bg-orange-50',
                      ].join(' ')}
                    >
                      <td className="px-4 py-3 font-medium">{v.Nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{v.Masa}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {selected && !showForm && !editing && (
        <ActionBar
          label={selected.Nombre}
          onEdit={() => { setEditing(selected); setSelected(null) }}
          onDelete={() => setConfirmDelete(selected)}
        />
      )}

      {confirmDelete && (
        <ModalConfirmDelete
          nombre={confirmDelete.Nombre}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}
