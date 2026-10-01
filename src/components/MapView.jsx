import { useState, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CR_CENTER = [9.9333, -84.0833]
const CR_ZOOM = 8

function MapViewController({ selectedLegend, recenterTrigger }) {
  const map = useMap()

  useEffect(() => {
    if (selectedLegend?.coordinates) {
      map.flyTo(selectedLegend.coordinates, 12, { duration: 1.2 })
    }
  }, [selectedLegend, map])

  useEffect(() => {
    if (recenterTrigger) {
      map.flyTo(CR_CENTER, CR_ZOOM, { duration: 1.0 })
    }
  }, [recenterTrigger, map])

  return null
}

const SatelliteUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SatelliteAttrib = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl })

function CustomMarker({ legend, isSelected, onClick }) {
  const dangerLevel = legend.danger?.level ?? legend.dangerLevel ?? 2
  const dangerColor = ['#3BCE7A', '#E0A93B', '#E0632B', '#D02B3C'][dangerLevel - 1] || '#E0A93B'

  const markerHtml = `
    <div class="legend-marker legend-marker-hover" style="cursor:pointer;transform:${isSelected ? 'scale(1.3)' : 'scale(1)'}">
      <div style="position:relative;display:grid;place-items:center">
        <span style="position:absolute;inset:-4px;border-radius:50%;border:2px solid ${dangerColor};opacity:0.55"></span>
        <svg width="18" height="18" fill="${dangerColor}" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        <span style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);background:${dangerColor};color:#020504;font-size:9px;font-weight:700;line-height:1;padding:2px 4px;border-radius:3px">${dangerLevel}</span>
      </div>
    </div>
  `

  const customIcon = new L.DivIcon({
    html: markerHtml,
    className: 'custom-legend-marker',
    iconSize: [42, 42],
    iconAnchor: [21, 42],
    popupAnchor: [0, -44],
  })

  return (
    <Marker
      position={legend.coordinates}
      icon={customIcon}
      eventHandlers={{ click: () => onClick(legend) }}
    >
      <Popup closeButton={false} offset={[0, -20]}>
        <div style={{
          width: 270,
          background: 'rgba(4,10,7,0.98)',
          border: '1px solid rgba(0,245,212,0.3)',
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 8px 30px rgba(0,0,0,0.9)',
        }}>
          <div style={{ position: 'relative', height: 135 }}>
            {legend.imageUrl && (
              <img src={legend.imageUrl} alt={legend.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
                onError={e => { e.target.style.display = 'none' }}
              />
            )}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(4,10,7,0.98) 0%, transparent 60%)',
            }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 12px' }}>
              <p style={{ fontSize: 10, color: '#00CCB0', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, fontWeight: 600 }}>
                {legend.category}
              </p>
              <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 700, margin: '2px 0 0', fontFamily: "'Cinzel',serif" }}>
                {legend.title}
              </h3>
            </div>
          </div>
          <div style={{ padding: '10px 12px' }}>
            <p style={{ color: '#9ca3af', fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>
              {legend.shortDescription}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, fontSize: 11 }}>
              <span style={{ color: '#6b7280' }}>
                📍 {legend.locationName}, {legend.province}
              </span>
              <span style={{
                color: dangerColor,
                fontWeight: 700,
                fontSize: 10,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(0,0,0,0.5)',
                border: `1px solid ${dangerColor}40`
              }}>
                Riesgo {dangerLevel}/4
              </span>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onClick(legend) }}
              style={{
                width: '100%', padding: '8px', cursor: 'pointer',
                background: 'linear-gradient(135deg, #023328, #011f18)',
                border: '1px solid rgba(0,245,212,0.4)',
                borderRadius: 4, color: '#00F5D4',
                fontSize: 12, fontWeight: 600,
                fontFamily: "'Cinzel',serif",
                letterSpacing: '0.08em', textTransform: 'uppercase',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00F5D4'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.boxShadow = '0 0 12px rgba(0,245,212,0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,245,212,0.4)'; e.currentTarget.style.color = '#00F5D4'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <span>Explorar Historia</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  )
}

function MapView({ legends, onLegendClick, selectedLegendId, selectedLegend, recenterTrigger }) {
  const mapRef = useRef(null)

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} id="map-container">
      {/* Atmosphere overlay for medieval horror tone */}
      <div className="map-horror-bg" aria-hidden="true" />
      
      <MapContainer
        ref={mapRef}
        center={CR_CENTER}
        zoom={CR_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        whenCreated={map => { mapRef.current = map }}
      >
        <MapViewController selectedLegend={selectedLegend} recenterTrigger={recenterTrigger} />
        <TileLayer url={SatelliteUrl} attribution={SatelliteAttrib} maxZoom={19} />
        {legends.map(legend => (
          <CustomMarker
            key={legend.id}
            legend={legend}
            isSelected={legend.id === selectedLegendId}
            onClick={onLegendClick}
          />
        ))}
      </MapContainer>
    </div>
  )
}

export default MapView