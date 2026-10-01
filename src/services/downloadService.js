/**
 * services/downloadService.js
 * -----------------------------------------------------------------------------
 * Servicio para descargar leyendas en múltiples formatos.
 * -----------------------------------------------------------------------------
 */

import { getLegends, getLegendById } from './dbService'

/**
 * Descarga una leyenda en el formato especificado.
 * 
 * @param {string} legendId - ID de la leyenda
 * @param {string} format - 'json' | 'txt' | 'md' | 'pdf'
 */
export async function downloadLegend(legendId, format = 'json') {
  const legend = await getLegendById(legendId)
  if (!legend) throw new Error('Leyenda no encontrada')
  
  let content, mimeType, filename
  
  switch (format) {
    case 'json':
      content = JSON.stringify(legend, null, 2)
      mimeType = 'application/json'
      filename = `${legend.id}.json`
      break
      
    case 'txt':
      content = formatAsText(legend)
      mimeType = 'text/plain'
      filename = `${legend.id}.txt`
      break
      
    case 'md':
      content = formatAsMarkdown(legend)
      mimeType = 'text/markdown'
      filename = `${legend.id}.md`
      break
      
    case 'pdf':
      // Para PDF usamos la API del navegador (print)
      await printLegendAsPDF(legend)
      return
      
    default:
      throw new Error(`Formato no soportado: ${format}`)
  }
  
  downloadBlob(content, mimeType, filename)
}

/**
 * Descarga todas las leyendas en un archivo.
 */
export async function downloadAllLegends(format = 'json') {
  const legends = await getLegends()
  
  let content, mimeType, filename
  
  switch (format) {
    case 'json':
      content = JSON.stringify(legends, null, 2)
      mimeType = 'application/json'
      filename = 'leyendas-cr-completo.json'
      break
    case 'txt':
      content = legends.map(formatAsText).join('\n\n' + '='.repeat(80) + '\n\n')
      mimeType = 'text/plain'
      filename = 'leyendas-cr-completo.txt'
      break
    case 'md':
      content = legends.map(formatAsMarkdown).join('\n\n---\n\n')
      mimeType = 'text/markdown'
      filename = 'leyendas-cr-completo.md'
      break
    default:
      throw new Error(`Formato no soportado: ${format}`)
  }
  
  downloadBlob(content, mimeType, filename)
}

/**
 * Formatea una leyenda como texto plano.
 */
function formatAsText(legend) {
  return `
LEYENDAS CR - ${legend.title}
${'='.repeat(50)}

Categoría: ${legend.category}
Provincia: ${legend.province}
Ubicación: ${legend.locationName}
Coordenadas: ${legend.coordinates.join(', ')}
Año/Época: ${legend.yearOrEra}
Nivel de Peligro: ${legend.danger?.level || 'N/A'}/4 (${legend.danger?.label || 'Desconocido'})

Descripción:
${legend.shortDescription}

Historia Completa:
${legend.fullStory}

Advertencia de Peligro:
${legend.danger?.description || 'Sin información'}

Consejo de Seguridad:
${legend.danger?.advice || 'No disponible'}

Tags: ${legend.tags?.join(', ') || 'Ninguno'}
Estadísticas: ${legend.stats?.views || 0} vistas, ${legend.stats?.sightings || 0} avistamientos

Fuente: ${legend.meta?.source || 'Archivo LEYENDAS CR'}
Reportado: ${legend.meta?.reportedAt || 'Fecha desconocida'}
Verificada: ${legend.meta?.verified ? 'Sí' : 'No'}

---
Descargado desde LEYENDAS CR - Portal de Leyendas de Costa Rica
${new Date().toLocaleDateString('es-CR')}
  `.trim()
}

/**
 * Formatea una leyenda como Markdown.
 */
function formatAsMarkdown(legend) {
  return `
# ${legend.title}

**Categoría:** ${legend.category}  
**Provincia:** ${legend.province}  
**Ubicación:** ${legend.locationName}  
**Coordenadas:** \`${legend.coordinates.join(', ')}\`  
**Año/Época:** ${legend.yearOrEra}  
**Nivel de Peligro:** ${legend.danger?.level || 'N/A'}/4 (${legend.danger?.label || 'Desconocido'})

## Descripción
${legend.shortDescription}

## Historia Completa
${legend.fullStory}

## ⚠️ Advertencia de Peligro
${legend.danger?.description || 'Sin información'}

## 🛡️ Consejo de Seguridad
${legend.danger?.advice || 'No disponible'}

---
**Tags:** ${legend.tags?.join(', ') || 'Ninguno'}  
**Estadísticas:** ${legend.stats?.views || 0} vistas, ${legend.stats?.sightings || 0} avistamientos  
**Fuente:** ${legend.meta?.source || 'Archivo LEYENDAS CR'}  
**Reportado:** ${legend.meta?.reportedAt || 'Fecha desconocida'}  
**Verificada:** ${legend.meta?.verified ? 'Sí' : 'No'}

---
*Descargado desde [LEYENDAS CR](https://leyendas-cr.com) - Portal de Leyendas de Costa Rica*  
*${new Date().toLocaleDateString('es-CR')}*`
}

/**
 * Imprime una leyenda como PDF usando la API del navegador.
 */
async function printLegendAsPDF(legend) {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${legend.title} - LEYENDAS CR</title>
      <style>
        body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; line-height: 1.6; color: #1a1a1a; }
        h1 { color: #0d2e26; border-bottom: 2px solid #00f5d4; padding-bottom: 10px; }
        h2 { color: #0d2e26; margin-top: 30px; }
        .meta { background: #f0fdfa; padding: 15px; border-radius: 8px; border-left: 4px solid #00f5d4; margin: 20px 0; }
        .danger { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .story { white-space: pre-wrap; font-size: 1.1em; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.9em; }
        @media print { body { padding: 0; } .no-print { display: none; } }
      </style>
    </head>
    <body>
      <h1>${legend.title}</h1>
      
      <div class="meta">
        <strong>Categoría:</strong> ${legend.category}<br>
        <strong>Provincia:</strong> ${legend.province}<br>
        <strong>Ubicación:</strong> ${legend.locationName}<br>
        <strong>Coordenadas:</strong> ${legend.coordinates.join(', ')}<br>
        <strong>Año/Época:</strong> ${legend.yearOrEra}<br>
        <strong>Nivel de Peligro:</strong> ${legend.danger?.level || 'N/A'}/4 (${legend.danger?.label || 'Desconocido'})
      </div>
      
      <h2>Descripción</h2>
      <p>${legend.shortDescription}</p>
      
      <h2>Historia Completa</h2>
      <div class="story">${legend.fullStory}</div>
      
      <div class="danger">
        <h2>⚠️ Advertencia de Peligro</h2>
        <p>${legend.danger?.description || 'Sin información'}</p>
        <h3>🛡️ Consejo de Seguridad</h3>
        <p>${legend.danger?.advice || 'No disponible'}</p>
      </div>
      
      <div class="footer">
        <p><strong>Fuente:</strong> ${legend.meta?.source || 'Archivo LEYENDAS CR'}</p>
        <p><strong>Reportado:</strong> ${legend.meta?.reportedAt || 'Fecha desconocida'}</p>
        <p><strong>Verificada:</strong> ${legend.meta?.verified ? 'Sí' : 'No'}</p>
        <hr>
        <p>Descargado desde <strong>LEYENDAS CR</strong> - Portal de Leyendas de Costa Rica</p>
        <p>${new Date().toLocaleDateString('es-CR')}</p>
      </div>
      
      <script>
        window.onload = () => { window.print(); setTimeout(() => window.close(), 1000); }
      </script>
    </body>
    </html>
  `)
  printWindow.document.close()
}

/**
 * Descarga un blob como archivo.
 */
function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Crea botones de descarga para una leyenda (para usar en componentes).
 */
export function createDownloadButtons(legendId, legendTitle) {
  const formats = [
    { format: 'json', label: 'JSON', icon: '📄' },
    { format: 'txt', label: 'TXT', icon: '📝' },
    { format: 'md', label: 'MD', icon: '📋' },
    { format: 'pdf', label: 'PDF', icon: '📕' },
  ]
  
  return formats.map(f => ({
    ...f,
    onClick: () => downloadLegend(legendId, f.format)
  }))
}