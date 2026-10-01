/**
 * components/accessibility/ColorBlindFilters.jsx
 * -----------------------------------------------------------------------------
 * Inyecta las matrices de color SVG definidas en `index.css` para el mapa.
 *
 * Aplicar `filter: url(#...)` a `<html>` romperia el posicionamiento fijo de
 * modales y notificaciones, por eso el filtro se limita a la capa de tiles de
 * Leaflet. El resto de la interfaz se adapta mediante variables de color.
 * -----------------------------------------------------------------------------
 */

/** Matrices de color (formato feColorMatrix) para cada tipo de daltonismo. */
const FILTERS = {
  deuteranopia: {
    values: '0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0',
  },
  protanopia: {
    values: '0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0',
  },
  tritanopia: {
    values: '0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0',
  },
}

export default function ColorBlindFilters() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: 'absolute' }}>
      <defs>
        {Object.entries(FILTERS).map(([id, { values }]) => (
          <filter key={id} id={`leyendas-${id}`} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={values} />
          </filter>
        ))}
      </defs>
    </svg>
  )
}
