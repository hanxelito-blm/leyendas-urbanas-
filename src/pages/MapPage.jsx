/**
 * pages/MapPage.jsx
 * -----------------------------------------------------------------------------
 * Página del mapa interactivo optimizada para máxima visibilidad en laptops.
 *
 * Características:
 *   - El mapa ocupa el 100% del campo visual sin scrolls molestos.
 *   - HUD flotante con búsqueda rápida, filtros desplegables y recentrado.
 *   - Tira flotante inferior para explorar las leyendas visualmente sin tapar el mapa.
 *   - Vuelo suave de cámara al seleccionar cualquier leyenda.
 * -----------------------------------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import MapView from '../components/MapView'
import StoryModal from '../components/StoryModal'
import ReportForm from '../components/ReportForm'
import { getFilteredLegends, getProvinces, getCategories } from '../services/dbService'
import { readValue, writeValue } from '../services/storage'
import { useToast } from '../context/ToastContext'

const DISCOVERED_KEY = 'leyendas-cr-discovered'

const PROVINCE_COORDS = {
  'San José': [9.9333, -84.0833],
  Alajuela: [10.0167, -84.2167],
  Cartago: [9.8667, -83.9167],
  Heredia: [9.9981, -84.1167],
  Guanacaste: [10.6267, -85.4433],
  Puntarenas: [9.9763, -84.8384],
  Limón: [9.9933, -83.0333],
}

function loadDiscovered() {
  const migrated = readValue(DISCOVERED_KEY, null)
  if (migrated) return migrated
  try {
    const legacy = JSON.parse(window.localStorage.getItem('leyendas-cr-discovered') || '[]')
    return Array.isArray(legacy) ? legacy : []
  } catch {
    return []
  }
}

export default function MapPage() {
  const toast = useToast()
  const [legends, setLegends] = useState([])
  const [provinces, setProvinces] = useState([])
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ province: '', category: '', search: '', maxDanger: 5 })
  const [selected, setSelected] = useState(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [discovered, setDiscovered] = useState(loadDiscovered)
  
  // UI Controls
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [recenterCount, setRecenterCount] = useState(0)

  useEffect(() => {
    Promise.all([getProvinces(), getCategories()]).then(([provinceList, categoryList]) => {
      setProvinces(provinceList)
      setCategories(categoryList)
    })
  }, [])

  useEffect(() => {
    let active = true
    getFilteredLegends(filters).then((result) => {
      if (active) setLegends(result)
    })
    return () => {
      active = false
    }
  }, [filters])

  useEffect(() => {
    writeValue(DISCOVERED_KEY, discovered)
  }, [discovered])

  const handleLegendClick = (legend) => {
    setSelected(legend)
    setDiscovered((prev) => (prev.includes(legend.id) ? prev : [...prev, legend.id]))
  }

  const handleReportSubmit = (formData) => {
    const base = PROVINCE_COORDS[formData.province] || PROVINCE_COORDS['San José']
    const offset = (Math.random() - 0.5) * 0.1
    const level = Math.min(Math.max(Number(formData.dangerLevel) || 2, 1), 4)
    const newLegend = {
      id: `leyenda-local-${Date.now().toString(36)}`,
      title: formData.title,
      category: formData.category,
      province: formData.province,
      coordinates: [base[0] + offset, base[1] + offset],
      locationName: formData.locationName,
      shortDescription: `${formData.description.slice(0, 120)}...`,
      summary: formData.description.slice(0, 160),
      fullStory: formData.description,
      imageUrl: '/images/la-segua.jpg',
      creatureImageUrl: '/images/la-segua.jpg',
      audioUrl: null,
      yearOrEra: String(new Date().getFullYear()),
      danger: {
        level,
        label: ['Bajo', 'Inquietante', 'Peligroso', 'Extremo'][level - 1],
        color: ['#3BCE7A', '#E0A93B', '#E0632B', '#D02B3C'][level - 1],
        description: 'Nivel de riesgo asignado por quien reporta el avistamiento.',
        advice: 'Registra tu visita y sigue las indicaciones de seguridad del archivo.',
      },
      tags: [formData.province, formData.category],
      stats: { views: 1, sightings: 1, comments: 0, favorites: 0 },
      meta: { verified: false, featured: false, source: 'Reporte de la comunidad', reportedAt: new Date().toISOString().slice(0, 10) },
    }

    setSelected(newLegend)
    setDiscovered((prev) => [...prev, newLegend.id])
    toast.success('Reporte registrado', 'Tu leyenda aparece en el mapa y en tu archivo personal.')
  }

  const activeFilterCount = (filters.province ? 1 : 0) + (filters.category ? 1 : 0) + (filters.maxDanger < 5 ? 1 : 0)
  const hasFilters = activeFilterCount > 0 || Boolean(filters.search)

  const legendList = useMemo(() => legends, [legends])

  return (
    <div className="relative w-full h-full flex-1 overflow-hidden select-none" style={{ minHeight: 'calc(100vh - 64px)' }}>
      {/* 1. MAPA INTERACTIVO - Ocupa el 100% de la pantalla para máxima visibilidad */}
      <div className="absolute inset-0 z-0">
        <MapView
          legends={legendList}
          onLegendClick={handleLegendClick}
          selectedLegendId={selected?.id}
          selectedLegend={selected}
          recenterTrigger={recenterCount}
        />
      </div>

      {/* 2. HUD FLOTANTE SUPERIOR - Barra de control compacta */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Lado izquierdo: Búsqueda y Filtros */}
        <div className="pointer-events-auto flex items-center gap-2 bg-[rgba(5,13,9,0.92)] border border-[rgba(0,245,212,0.3)] backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.8)]">
          {/* Campo de búsqueda */}
          <div className="flex items-center gap-2">
            <svg width="15" height="15" fill="none" stroke="#00F5D4" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Buscar leyenda o lugar..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="bg-transparent text-xs text-white placeholder-gray-400 focus:outline-none w-32 sm:w-48"
            />
            {filters.search && (
              <button
                onClick={() => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="text-gray-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            )}
          </div>

          <div className="w-[1px] h-4 bg-gray-700" />

          {/* Botón desplegable de filtros */}
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-[rgba(0,245,212,0.2)] text-[#00F5D4] border border-[rgba(0,245,212,0.5)] font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#00F5D4] text-black font-bold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            <span className="text-[10px]">{filtersOpen ? '▲' : '▼'}</span>
          </button>

          {/* Botón recentrar mapa */}
          <button
            onClick={() => setRecenterCount((c) => c + 1)}
            title="Centrar en Costa Rica"
            className="p-1 rounded-full text-gray-400 hover:text-[#00F5D4] transition-colors"
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
            </svg>
          </button>
        </div>

        {/* Lado derecho: Leyendas descubiertas, explorador y reporte */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Tira / Carrusel de leyendas toggle */}
          <button
            onClick={() => setDrawerOpen((v) => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md transition-all shadow-[0_4px_20px_rgba(0,0,0,0.7)] ${
              drawerOpen
                ? 'bg-[#00F5D4] text-black font-bold shadow-[0_0_15px_rgba(0,245,212,0.4)]'
                : 'bg-[rgba(5,13,9,0.92)] text-gray-200 border border-[rgba(0,245,212,0.3)] hover:border-[#00F5D4]'
            }`}
          >
            <span>📜</span>
            <span className="hidden sm:inline">Ver Leyendas</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/30 font-bold">
              {legends.length}
            </span>
          </button>

          {/* Botón reportar */}
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-[#0d3b31] to-[#044d3d] border border-[rgba(0,245,212,0.5)] text-[#00F5D4] hover:text-white hover:border-[#00F5D4] shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all"
          >
            <span>+</span>
            <span className="hidden sm:inline">Reportar</span>
          </button>
        </div>
      </div>

      {/* 3. POPOVER FLOTANTE DE FILTROS - No empuja ni achica el mapa */}
      {filtersOpen && (
        <div className="absolute top-16 left-3 z-30 pointer-events-auto w-72 sm:w-80 bg-[rgba(5,13,9,0.96)] border border-[rgba(0,245,212,0.35)] rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-800">
            <h4 className="text-xs font-bold text-[#00F5D4] uppercase tracking-wider font-cinzel">
              Filtrar el Archivo
            </h4>
            {hasFilters && (
              <button
                onClick={() => setFilters({ province: '', category: '', search: '', maxDanger: 5 })}
                className="text-[11px] text-gray-400 hover:text-red-400 underline"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-[11px] text-gray-300 font-medium mb-1">Provincia</label>
              <select
                value={filters.province}
                onChange={(e) => setFilters((prev) => ({ ...prev, province: e.target.value }))}
                className="w-full bg-[rgba(0,0,0,0.6)] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00F5D4] focus:outline-none"
              >
                <option value="">Todas las provincias</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-gray-300 font-medium mb-1">Categoría</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full bg-[rgba(0,0,0,0.6)] border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-[#00F5D4] focus:outline-none"
              >
                <option value="">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] text-gray-300 font-medium">Nivel de Riesgo Máximo</label>
                <span className="text-xs font-bold text-[#00F5D4]">
                  {filters.maxDanger >= 5 ? 'Todos' : `≤ ${filters.maxDanger}/4`}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={filters.maxDanger}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxDanger: Number(e.target.value) }))}
                className="w-full accent-[#00F5D4]"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TIRA FLOTANTE INFERIOR DE LEYENDAS (CARRUSEL MINIMIZABLE) */}
      {drawerOpen && (
        <div className="absolute bottom-4 left-3 right-3 z-20 pointer-events-auto bg-[rgba(4,10,7,0.94)] border border-[rgba(0,245,212,0.3)] backdrop-blur-xl rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.95)]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <span className="text-xs font-bold text-[#00F5D4] uppercase tracking-wider font-cinzel">
              Explorador de Leyendas ({legends.length})
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-white text-xs px-2 py-0.5 rounded"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
            {legends.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLegendClick(item)}
                className="shrink-0 w-52 bg-[rgba(10,22,17,0.85)] border border-[rgba(0,245,212,0.2)] hover:border-[#00F5D4] rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_0_15px_rgba(0,245,212,0.2)] group"
              >
                <div className="relative h-24 overflow-hidden">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(4,10,7,0.9)] via-transparent to-transparent" />
                  <span
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-black"
                    style={{
                      backgroundColor:
                        item.danger?.level >= 4
                          ? '#ef4444'
                          : item.danger?.level === 3
                          ? '#f97316'
                          : '#00F5D4',
                    }}
                  >
                    Riesgo {item.danger?.level || 2}
                  </span>
                </div>
                <div className="p-2">
                  <p className="text-[10px] text-[#00F5D4] uppercase tracking-wider font-semibold truncate">
                    {item.province}
                  </p>
                  <h4 className="text-xs font-bold text-white truncate font-cinzel">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                    {item.shortDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de historia */}
      {selected && (
        <StoryModal legend={selected} onClose={() => setSelected(null)} isDiscovered />
      )}

      {/* Modal de reporte */}
      <ReportForm isOpen={reportOpen} onClose={() => setReportOpen(false)} onSubmit={handleReportSubmit} />
    </div>
  )
}
