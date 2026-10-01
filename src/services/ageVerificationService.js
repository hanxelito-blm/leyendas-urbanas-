/**
 * services/ageVerificationService.js
 * -----------------------------------------------------------------------------
 * Servicio de verificación de edad usando la API de Hacienda de Costa Rica.
 * 
 * API: https://api.hacienda.go.cr/fe/ae?identificacion=2100042005
 * 
 * NOTA: Esta API es para facturación electrónica. Para verificación de edad real
 * se necesitaría acceso a la cédula de identidad y la API correspondiente del TSE.
 * Aquí implementamos un mock que simula el comportamiento.
 * -----------------------------------------------------------------------------
 */

const HACIENDA_API_BASE = 'https://api.hacienda.go.cr/fe/ae'

/**
 * Verifica la edad de un usuario usando su número de identificación.
 * En producción, esto llamaría a la API real de Hacienda/TSE.
 * 
 * @param {string} identificacion - Número de cédula o identificación
 * @returns {Promise<{isAdult: boolean, age: number, birthDate: string|null, error?: string}>}
 */
export async function verifyAge(identificacion) {
  try {
    // En desarrollo, simulamos la respuesta
    // En producción: const response = await fetch(`${HACIENDA_API_BASE}?identificacion=${identificacion}`)
    
    // Simulación: extraer fecha de nacimiento de la cédula costarricense
    // Formato cédula: 1-XXXX-XXXX (provincia-año-número)
    const cleanId = identificacion.replace(/[-\s]/g, '')
    
    if (cleanId.length >= 9) {
      // Los primeros dígitos después de la provincia pueden indicar año
      // Esto es una aproximación - en realidad se necesita la API del TSE
      const yearPart = parseInt(cleanId.substring(1, 3), 10)
      const currentYear = new Date().getFullYear() % 100
      let birthYear = 1900 + yearPart
      if (yearPart > currentYear + 5) birthYear = 2000 + yearPart
      
      const age = new Date().getFullYear() - birthYear
      
      return {
        isAdult: age >= 18,
        age,
        birthDate: `${birthYear}-01-01`, // aproximado
      }
    }
    
    // Fallback: edad aleatoria para testing
    const randomAge = 15 + Math.floor(Math.random() * 50)
    return {
      isAdult: randomAge >= 18,
      age: randomAge,
      birthDate: null,
    }
  } catch (error) {
    console.warn('Error verificando edad:', error)
    // En caso de error, permitir acceso pero registrar
    return {
      isAdult: true,
      age: 18,
      birthDate: null,
      error: 'No se pudo verificar la edad',
    }
  }
}

/**
 * Verifica si un usuario puede acceder a contenido de riesgo según su edad.
 * 
 * @param {number} userAge - Edad del usuario
 * @param {number} dangerLevel - Nivel de peligro (1-4)
 * @returns {boolean}
 */
export function canAccessDangerLevel(userAge, dangerLevel) {
  // Menores de 18 no pueden acceder a nivel 3 y 4
  if (userAge < 18 && dangerLevel >= 3) return false
  // Menores de 15 no pueden acceder a nivel 2+
  if (userAge < 15 && dangerLevel >= 2) return false
  return true
}

/**
 * Obtiene recomendaciones de leyendas basadas en la edad.
 * 
 * @param {Array} legends - Lista de leyendas
 * @param {number} userAge - Edad del usuario
 * @returns {Object} { recommended: [], restricted: [], warning: [] }
 */
export function getAgeBasedRecommendations(legends, userAge) {
  const recommended = []
  const restricted = []
  const warning = []
  
  legends.forEach(legend => {
    const level = legend.danger?.level || 2
    const canAccess = canAccessDangerLevel(userAge, level)
    
    if (canAccess) {
      // Priorizar leyendas seguras para menores
      if (userAge < 18) {
        if (level <= 2) recommended.push(legend)
        else warning.push(legend)
      } else {
        recommended.push(legend)
      }
    } else {
      restricted.push(legend)
    }
  })
  
  return { recommended, restricted, warning }
}

/**
 * Genera nombres aleatorios para usuarios anónimos.
 * 
 * @returns {string}
 */
export function generateRandomName() {
  const firstNames = [
    'Sombra', 'Eco', 'Susurro', 'Fantasma', 'Espectro', 'Neblina',
    'Ceniza', 'Brasa', 'Llama', 'Chispa', 'Noche', 'Alba',
    'Viento', 'Lluvia', 'Trueno', 'Relámpago', 'Estrella', 'Luna',
    'Solitario', 'Errante', 'Vigía', 'Guardián', 'Testigo', 'Cronista'
  ]
  
  const lastNames = [
    'Del Abismo', 'De La Noche', 'Del Olvido', 'De Las Sombras',
    'Sin Nombre', 'Del Viento', 'De La Bruma', 'Del Eco',
    'Inmortal', 'Eterno', 'Olvidado', 'Perdido', 'Encontrado'
  ]
  
  const first = firstNames[Math.floor(Math.random() * firstNames.length)]
  const last = lastNames[Math.floor(Math.random() * lastNames.length)]
  const num = Math.floor(Math.random() * 999).toString().padStart(3, '0')
  
  return `${first} ${last} #${num}`
}