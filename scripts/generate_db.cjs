/**
 * scripts/generate_db.cjs
 * -----------------------------------------------------------------------------
 * Genera `src/data/db.json`, la base de datos local (mock) de LEYENDAS CR.
 *
 * - Toma el catálogo de leyendas desde `src/data/legends.json` (fuente de verdad
 *   única para no duplicar información).
 * - Enriquece cada leyenda con metadatos faltantes (resumen, etiquetas, vistas,
 *   fecha de reporte, perfil de riesgo).
 * - Agrega usuarios con roles, categorías del foro, publicaciones, comentarios,
 *   expediciones, tips de onboarding, métricas agregadas y configuración de IA.
 *
 * Uso:  node scripts/generate_db.cjs
 * -----------------------------------------------------------------------------
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const LEGENDS_PATH = path.join(ROOT, 'src', 'data', 'legends.json')
const DB_PATH = path.join(ROOT, 'src', 'data', 'db.json')

const legends = JSON.parse(fs.readFileSync(LEGENDS_PATH, 'utf8'))

/* ── Metadatos complementarios por leyenda ──────────────────────────────────── */
const LEGEND_EXTRA = {
  'leyenda-01': {
    summary: 'Una carreta sin animales cruza el centro de San José en plena madrugada.',
    tags: ['carreta', 'San José', 'mala suerte', 'ruido nocturno'],
    sightings: 34,
    source: 'Testimonio de barrio',
  },
  'leyenda-02': {
    summary: 'La linterna del faro destruido se enciende sola y atrae barcos.',
    tags: ['faro', 'Puntarenas', 'mar', 'farero'],
    sightings: 21,
    source: 'Archivo maritime',
  },
  'leyenda-03': {
    summary: 'El antiguo sanatorio guarda pasillos, puertas y voces de quienes no se fueron.',
    tags: ['sanatorio', 'Cartago', 'salud', 'monjas'],
    sightings: 57,
    source: 'Expedicion oficial',
  },
  'leyenda-04': {
    summary: 'En la vieja mina aparecen las luces de los mineros desaparecidos.',
    tags: ['mina', 'Guanacaste', 'auri', 'duendes'],
    sightings: 12,
    source: 'Archivo departamental',
  },
  'leyenda-05': {
    summary: 'Una tropa fantasma desciende el cafetal en ruta por el sector del Cut.',
    tags: ['Cut', 'Guanacaste', 'ejercito', 'cafe'],
    sightings: 9,
    source: 'Testimonio de productor',
  },
  'leyenda-06': {
    summary: 'Danza de los cadaveres en el centro de Limon.',
    tags: ['Limón', 'cadaveres', 'baile', 'noche'],
    sightings: 40,
    source: 'Archivo de tradicion',
  },
  'leyenda-07': {
    summary: 'El faro de la Cruz alumbra a los naufragos de la ensenada.',
    tags: ['monasterio', 'Guanacaste', 'reliquia', 'balneario'],
    sightings: 18,
    source: 'Archivo colonial',
  },
  'leyenda-08': {
    summary: 'Una caceria de perros negros ronda los potreros de Alajuela.',
    tags: ['Alajuela', 'perros', 'caballo', 'noche'],
    sightings: 63,
    source: 'Testimonio de campo',
  },
  'leyenda-09': {
    summary: 'Lluvia de peces sobre la ensenada de Puntarenas.',
    tags: ['Puntarenas', 'lluvia', 'peces', 'mar'],
    sightings: 27,
    source: 'Evidencia audiovisual',
  },
  'leyenda-10': {
    summary: 'La sirena del Golfo Dulce llama a los pescadores hacia las rocas.',
    tags: ['Golfo Dulce', 'sirena', 'mar', 'Osa'],
    sightings: 15,
    source: 'Bitacora de buceo',
  },
  'leyenda-11': {
    summary: 'Un bus nocturno recorre la ciudad vacia a las 11:11 de la noche.',
    tags: ['San José', 'bus', 'conductora', 'urbano'],
    sightings: 72,
    source: 'Testimonio multiple',
  },
  'leyenda-12': {
    summary: 'Los pasillos del hospital de Heredia repiten pasos que nadie recorre.',
    tags: ['Heredia', 'hospital', 'monjas', 'urbano'],
    sightings: 45,
    source: 'Archivo clinico',
  },
  'leyenda-13': {
    summary: 'El nino fantasma de una escuela que nunca cierra sus puertas.',
    tags: ['escuela', 'Limón', 'nino', 'urbano'],
    sightings: 8,
    source: 'Testimonio escolar',
  },
  'leyenda-14': {
    summary: 'La Llorona de la peninsula llora cuando el sol se pone.',
    tags: ['Guanacaste', 'Chiquito', 'llorona', 'noche'],
    sightings: 31,
    source: 'Archivo de tradicion',
  },
  'leyenda-15': {
    summary: 'La Segua acecha en los caminos solitarios de Cartago.',
    tags: ['Segua', 'Cartago', 'criatura', 'camino'],
    sightings: 88,
    source: 'Expedicion oficial',
  },
}

/* ── Perfil de riesgo: 1 bajo · 2 inquietante · 3 peligroso · 4 extremo ────── */
const RISK_PROFILE = {
  1: {
    label: 'Bajo',
    color: '#3BCE7A',
    advice: 'Visita de dia y en grupo. No requiere medidas especiales.',
  },
  2: {
    label: 'Inquietante',
    color: '#E0A93B',
    advice: 'Lleva linterna, evita reflejos y no te quedes a solas.',
  },
  3: {
    label: 'Peligroso',
    color: '#E0632B',
    advice: 'No ingreses en horario nocturno y registra tu hora de entrada y salida.',
  },
  4: {
    label: 'Extremo',
    color: '#D02B3C',
    advice: 'Zona de riesgo alto. Recomendamos no visitar sin guia autorizado.',
  },
}

/**
 * Enriquece el catálogo heredado con los campos que consume la nueva interfaz.
 */
const enrichedLegends = legends.map((legend, index) => {
  const extra = LEGEND_EXTRA[legend.id] || {}
  const level = Math.min(Math.max(legend.dangerLevel || 2, 1), 4)
  const profile = RISK_PROFILE[level]
  const sightings = extra.sightings || 10

  return {
    id: legend.id,
    title: legend.title,
    category: legend.category,
    province: legend.province,
    locationName: legend.locationName,
    coordinates: legend.coordinates,
    yearOrEra: legend.yearOrEra,
    shortDescription: legend.shortDescription,
    summary: extra.summary || legend.shortDescription,
    fullStory: legend.fullStory,
    imageUrl: legend.imageUrl,
    creatureImageUrl: legend.creatureImageUrl || legend.imageUrl,
    audioUrl: legend.audioUrl,
    danger: {
      level,
      label: profile.label,
      color: profile.color,
      description: legend.dangerDescription || 'Sin descripcion de peligro registrada.',
      advice: profile.advice,
    },
    tags: extra.tags || [legend.province, legend.category],
    stats: {
      views: 420 + sightings * 37,
      sightings,
      comments: 3 + (sightings % 17),
      favorites: 20 + sightings * 2,
    },
    meta: {
      verified: index % 3 === 0,
      featured: legend.id === 'leyenda-15' || legend.id === 'leyenda-03',
      source: extra.source || 'Archivo departamental',
      reportedAt: `20${18 + (index % 6)}-0${(index % 8) + 1}-1${index % 9}`,
    },
  }
})

/* ── Roles del sistema ─────────────────────────────────────────────────────── */
const roles = [
  {
    id: 'usuario',
    label: 'Usuario',
    description: 'Acceso de lectura al mapa, al archivo personal y al foro de la comunidad.',
    permissions: ['read:legends', 'use:map', 'forum:read', 'forum:write', 'profile:read'],
    color: '#00F5D4',
  },
  {
    id: 'moderador',
    label: 'Moderador',
    description: 'Puede revisar, ocultar y responder publicaciones y comentarios del foro.',
    permissions: ['read:legends', 'use:map', 'forum:read', 'forum:write', 'profile:read', 'forum:moderate'],
    color: '#E0A93B',
  },
  {
    id: 'admin',
    label: 'Administrador',
    description: 'Acceso total: panel administrativo, metricas, proyecciones IA y moderacion.',
    permissions: [
      'read:legends',
      'use:map',
      'forum:read',
      'forum:write',
      'profile:read',
      'forum:moderate',
      'admin:panel',
      'admin:ai',
      'admin:users',
    ],
    color: '#D02B3C',
  },
]

/* ── Usuarios semilla (contrasena simulada: "leyendas123") ─────────────────── */
const users = [
  {
    id: 'u-001',
    username: 'admin',
    email: 'admin@leyendascr.cr',
    password: 'leyendas123',
    displayName: 'Guardian del Archivo',
    role: 'admin',
    avatar: '/images/la-segua.jpg',
    bio: 'Administrador del portal LEYENDAS CR y custodio de los archivos.',
    province: 'San José',
    joinedAt: '2023-02-14',
    reputation: 4820,
    badges: ['Fundador', 'Archivista', 'Inspector'],
    stats: { posts: 34, comments: 211, legendsVisited: 15 },
  },
  {
    id: 'u-002',
    username: 'mod_isabel',
    email: 'isabel@leyendascr.cr',
    password: 'leyendas123',
    displayName: 'Isabel Mora',
    role: 'moderador',
    avatar: '/images/sanatorio-duran.jpg',
    bio: 'Moderadora del foro. Investigadora de folklore sanatorio.',
    province: 'Cartago',
    joinedAt: '2023-08-03',
    reputation: 2310,
    badges: ['Moderadora', 'Vigilante'],
    stats: { posts: 28, comments: 640, legendsVisited: 12 },
  },
  {
    id: 'u-003',
    username: 'explorador',
    email: 'explorador@leyendascr.cr',
    password: 'leyendas123',
    displayName: 'Carlos Urena',
    role: 'usuario',
    avatar: '/images/ciudad-condor.jpg',
    bio: 'Salgo los fines de semana a documentar avistamientos.',
    province: 'Heredia',
    joinedAt: '2024-01-20',
    reputation: 860,
    badges: ['Explorador', 'Fotografo'],
    stats: { posts: 12, comments: 97, legendsVisited: 9 },
  },
  {
    id: 'u-004',
    username: 'maria_cr',
    email: 'maria@leyendascr.cr',
    password: 'leyendas123',
    displayName: 'Maria Jimenez',
    role: 'usuario',
    avatar: '/images/monasterio-nostra.jpg',
    bio: 'Coleccionista de relatos de Guanacaste.',
    province: 'Guanacaste',
    joinedAt: '2024-05-09',
    reputation: 540,
    badges: ['Cronista'],
    stats: { posts: 7, comments: 61, legendsVisited: 6 },
  },
  {
    id: 'u-005',
    username: 'tomas_p',
    email: 'tomas@leyendascr.cr',
    password: 'leyendas123',
    displayName: 'Tomas Portugues',
    role: 'usuario',
    avatar: '/images/rio-paquira.jpg',
    bio: 'Buzo amateur y testigo del Golfo Dulce.',
    province: 'Puntarenas',
    joinedAt: '2025-03-17',
    reputation: 320,
    badges: ['Buzo'],
    stats: { posts: 3, comments: 28, legendsVisited: 4 },
  },
]

/* ── Categorias del foro ───────────────────────────────────────────────────── */
const forumCategories = [
  {
    id: 'c-1',
    slug: 'testimonios',
    name: 'Testimonios',
    description: 'Relatos y avistamientos de la comunidad.',
    icon: 'eye',
    color: '#00F5D4',
    order: 1,
  },
  {
    id: 'c-2',
    slug: 'debates',
    name: 'Debates',
    description: 'Conversaciones sobre veracidad, historia y folklore.',
    icon: 'message',
    color: '#E0A93B',
    order: 2,
  },
  {
    id: 'c-3',
    slug: 'investigacion',
    name: 'Investigacion',
    description: 'Documentos, bitacoras y archivos del mito.',
    icon: 'book',
    color: '#7C5CFF',
    order: 3,
  },
  {
    id: 'c-4',
    slug: 'seguridad',
    name: 'Seguridad y riesgo',
    description: 'Protocolos de visita y advertencias de peligro.',
    icon: 'shield',
    color: '#D02B3C',
    order: 4,
  },
]

/* ── Publicaciones del foro ────────────────────────────────────────────────── */
const forumPosts = [
  {
    id: 'p-1',
    categoryId: 'c-1',
    title: 'Avistamiento en el corredor del Rio Torres: el bus de las 11:11 PM',
    excerpt:
      'El colectivo fantasma sigue pasando exactamente a las 11:11 de la noche por la ruta 27. Adjunto la evidencia de tres lectores esta semana.',
    body:
      'Desde que era nino vi ese bus: rutas 27 y 34, siempre a las 11:11 PM, sin luces traseras. Los choferes dicen que se cruza con la niebla. Este fin de semana tres lectores distintos me escribieron confirmando el mismo avistamiento, por lo que subo el reporte con consenso del fenomeno.',
    authorId: 'u-003',
    createdAt: '2025-09-12T20:15:00Z',
    updatedAt: '2025-09-12T20:15:00Z',
    tags: ['autobus', 'Río Torres', 'San José'],
    status: 'publicado',
    pinned: true,
    likes: 128,
    views: 1540,
    relatedLegendId: 'leyenda-11',
  },
  {
    id: 'p-2',
    categoryId: 'c-2',
    title: 'La Segua es una advertencia social o un cuento de excusas',
    excerpt:
      'La Segua aparece en caminos solitarios frente a mujeres que caminan solas de noche. Es una moraleja sobre el riesgo o un avatar del folklore?',
    body:
      'La Segua es, para mi, la version tica de una advertencia universal: la historia que advierte sobre el camino. Discuto tres hipotesis y por que ninguna explica los avistamientos modernos del sector Quepos.',
    authorId: 'u-004',
    createdAt: '2025-09-08T14:00:00Z',
    updatedAt: '2025-09-10T09:30:00Z',
    tags: ['La Segua', 'Cartago', 'debate'],
    status: 'publicado',
    pinned: false,
    likes: 96,
    views: 812,
    relatedLegendId: 'leyenda-15',
  },
  {
    id: 'p-3',
    categoryId: 'c-4',
    title: 'Protocolo de seguridad para visitar el Sanatorio Duran',
    excerpt:
      'Documento consolidado con horarios seguros, equipo recomendado y senales de alerta temprana.',
    body:
      'Este es el protocolo que usamos en el archivo para visitas nocturnas al Sanatorio: entrada antes de las 7:00 PM, salida antes de las 5:00 AM, siempre en compania, camara sin flash y bitacora de entrada y salida compartida.',
    authorId: 'u-001',
    createdAt: '2025-09-15T08:00:00Z',
    updatedAt: '2025-09-15T08:00:00Z',
    tags: ['seguridad', 'Sanatorio', 'protocolo'],
    status: 'publicado',
    pinned: true,
    likes: 211,
    views: 2431,
    relatedLegendId: 'leyenda-03',
  },
  {
    id: 'p-4',
    categoryId: 'c-3',
    title: 'Expedicion al Faro de la Cruz: bitacora de 6 horas de archivo',
    excerpt:
      'Transcripcion completa de la bitacora: 14 eventos registrados, 2 clasificados como no explicables.',
    body:
      'Adjunto la transcripcion de la bitacora con marcas de tiempo, lecturas de temperatura ambiente y el audio capturado a las 02:14, donde se escucha un Canton sin presencia humana registrada.',
    authorId: 'u-002',
    createdAt: '2025-09-18T16:45:00Z',
    updatedAt: '2025-09-18T16:45:00Z',
    tags: ['Faro de la Cruz', 'bitacora', 'Guanacaste'],
    status: 'publicado',
    pinned: false,
    likes: 74,
    views: 640,
    relatedLegendId: 'leyenda-07',
  },
  {
    id: 'p-5',
    categoryId: 'c-1',
    title: 'Lluvia de peces sobre el sector Drake: video original 4K',
    excerpt: 'Grabacion sin cortes del fenomeno, con audio de canal separado.',
    body:
      'Subi el video completo sin edicion junto con el archivo de audio aislado del canal de mi camara. Cualquiera puede descargarlo.',
    authorId: 'u-005',
    createdAt: '2025-09-20T05:10:00Z',
    updatedAt: '2025-09-20T05:10:00Z',
    tags: ['lluvia de peces', 'Puntarenas', 'video'],
    status: 'publicado',
    pinned: false,
    likes: 58,
    views: 402,
    relatedLegendId: 'leyenda-09',
  },
  {
    id: 'p-6',
    categoryId: 'c-2',
    title: 'Publicacion suspendida por el moderador',
    excerpt:
      'Contenido reportado por varios usuarios por discurso de odio. Se conserva unicamente para auditoria.',
    body:
      'Este contenido se conserva solo con fines de auditoria y permanece oculto en el listado publico.',
    authorId: 'u-003',
    createdAt: '2025-09-19T11:00:00Z',
    updatedAt: '2025-09-19T12:10:00Z',
    tags: ['auditoria', 'moderacion'],
    status: 'oculto',
    pinned: false,
    likes: 0,
    views: 21,
    relatedLegendId: null,
  },
]

/* ── Comentarios ───────────────────────────────────────────────────────────── */
const forumComments = [
  {
    id: 'c-01',
    postId: 'p-1',
    authorId: 'u-004',
    body: 'Mi abuela lo vio en los 90. Confirmo que siempre eran las 11:11.',
    createdAt: '2025-09-12T21:02:00Z',
    likes: 12,
    status: 'visible',
  },
  {
    id: 'c-02',
    postId: 'p-1',
    authorId: 'u-001',
    body: 'Reporte recibido. Aumento la clasificacion de evidencia a B. Buen aporte.',
    createdAt: '2025-09-13T08:20:00Z',
    likes: 30,
    status: 'visible',
  },
  {
    id: 'c-03',
    postId: 'p-1',
    authorId: 'u-002',
    body: 'Alguien tiene la placa del bus? Seria clave para identificar el vehiculo original.',
    createdAt: '2025-09-13T13:44:00Z',
    likes: 4,
    status: 'visible',
  },
  {
    id: 'c-04',
    postId: 'p-2',
    authorId: 'u-003',
    body: 'Para mi es una version local del aviso contra el riesgo nocturno. Dificil ignorarlo.',
    createdAt: '2025-09-08T18:30:00Z',
    likes: 22,
    status: 'visible',
  },
  {
    id: 'c-05',
    postId: 'p-2',
    authorId: 'u-001',
    body: 'Excelente analisis. Anotado para el dossier de Cartago.',
    createdAt: '2025-09-09T10:05:00Z',
    likes: 15,
    status: 'visible',
  },
  {
    id: 'c-06',
    postId: 'p-3',
    authorId: 'u-005',
    body: 'Aplique el protocolo en Quepos y funciono. Se lo pase a dos expediciones mas.',
    createdAt: '2025-09-15T12:00:00Z',
    likes: 9,
    status: 'visible',
  },
  {
    id: 'c-07',
    postId: 'p-3',
    authorId: 'u-002',
    body: 'Sugiero agregar: kit de primeros auxilios y contacto de emergencia.',
    createdAt: '2025-09-15T15:12:00Z',
    likes: 18,
    status: 'visible',
  },
  {
    id: 'c-08',
    postId: 'p-4',
    authorId: 'u-003',
    body: 'La marca de tiempo 02:14 coincide con mi registro. Caso documentado.',
    createdAt: '2025-09-18T19:00:00Z',
    likes: 11,
    status: 'visible',
  },
  {
    id: 'c-09',
    postId: 'p-5',
    authorId: 'u-004',
    body: 'Fantastico. La lluvia empezo justo al atardecer?',
    createdAt: '2025-09-20T07:30:00Z',
    likes: 6,
    status: 'visible',
  },
  {
    id: 'c-10',
    postId: 'p-5',
    authorId: 'u-001',
    body: 'Video verificado. Categorizado como evidencia audiovisual clase A.',
    createdAt: '2025-09-20T09:15:00Z',
    likes: 20,
    status: 'visible',
  },
]

/* ── Expediciones (reemplazan el antiguo apartado de encuentros) ──────────── */
const expeditions = [
  {
    id: 'e-1',
    name: 'Sanatorio Duran',
    province: 'Cartago',
    date: '2025-10-31T21:00:00Z',
    difficulty: 'Alta',
    capacity: 12,
    joined: 9,
    dangerLevel: 3,
    description: 'Antiguo sanatorio con avistamientos de monjas y pasillos con voces.',
    contact: 'https://wa.me/50600000000',
  },
  {
    id: 'e-2',
    name: 'Ruinas de Ujarras',
    province: 'Cartago',
    date: '2025-11-15T22:00:00Z',
    difficulty: 'Media',
    capacity: 20,
    joined: 14,
    dangerLevel: 2,
    description: 'Ruinas coloniales con apariciones del Padre sin Cabeza.',
    contact: 'https://wa.me/50600000000',
  },
  {
    id: 'e-3',
    name: 'Cerro de la Muerte',
    province: 'San José',
    date: '2025-12-21T23:59:00Z',
    difficulty: 'Media',
    capacity: 16,
    joined: 11,
    dangerLevel: 2,
    description: 'Vigilia nocturna en el km 84 donde aparece el nino fantasma.',
    contact: 'https://wa.me/50600000000',
  },
  {
    id: 'e-4',
    name: 'Bahia Ballena Nocturna',
    province: 'Puntarenas',
    date: '2026-01-31T20:00:00Z',
    difficulty: 'Baja',
    capacity: 24,
    joined: 19,
    dangerLevel: 1,
    description: 'Ruta en lancha para avistar el barco fantasma de 1587.',
    contact: 'https://wa.me/50600000000',
  },
]

/* ── Onboarding: avisos mostrados al entrar al sistema ─────────────────────── */
const onboardingTips = [
  {
    id: 't-1',
    icon: 'map',
    title: 'Tu primera expedicion: el mapa',
    message:
      'Desde el mapa puedes ver las leyendas de Costa Rica en su ubicacion real. Toca un marcador para leer la historia completa, escuchar el audio y ver su nivel de peligro.',
    route: '/mapa',
  },
  {
    id: 't-2',
    icon: 'shield',
    title: 'Cuidado con el nivel de riesgo',
    message:
      'Cada leyenda tiene un nivel de peligro de 1 a 4. Antes de organizar una visita, revisa la advertencia y el consejo de seguridad registrados en el archivo.',
    route: '/mapa',
  },
  {
    id: 't-3',
    icon: 'users',
    title: 'La comunidad te espera',
    message:
      'Con tu cuenta activa puedes entrar al foro: publicar testimonios, comentar hallazgos y responder a otros exploradores. Es un espacio privado, solo para miembros.',
    route: '/comunidad',
  },
  {
    id: 't-4',
    icon: 'accessibility',
    title: 'Personaliza tu experiencia visual',
    message:
      'Usa el boton de accesibilidad para cambiar entre modo claro y oscuro, ajustar el tamano del texto y activar modos para los daltonismos mas comunes.',
    route: null,
  },
  {
    id: 't-5',
    icon: 'lock',
    title: 'Acceso restringido',
    message:
      'El foro, el panel de administracion y las proyecciones de IA son rutas privadas: se validan segun tu sesion y tu rol (usuario, moderador o administrador).',
    route: '/login',
  },
]

/* ── Metricas agregadas para el panel administrativo ───────────────────────── */
const metrics = {
  generatedAt: '2025-09-22T08:00:00Z',
  kpis: {
    totalUsers: 18432,
    activeUsers7d: 3267,
    mapVisits: 58210,
    forumPosts: 3146,
    forumComments: 22890,
    legendViews: 142780,
    avgSessionMinutes: 11.4,
    newUsersThisMonth: 428,
  },
  // Serie temporal de los ultimos 12 meses (grafica de lineas)
  monthly: [
    { month: 'Oct', users: 980, visits: 3200, posts: 180 },
    { month: 'Nov', users: 1120, visits: 3580, posts: 205 },
    { month: 'Dic', users: 1310, visits: 4020, posts: 260 },
    { month: 'Ene', users: 1490, visits: 4380, posts: 241 },
    { month: 'Feb', users: 1620, visits: 4520, posts: 258 },
    { month: 'Mar', users: 1780, visits: 4890, posts: 276 },
    { month: 'Abr', users: 1910, visits: 5010, posts: 288 },
    { month: 'May', users: 2040, visits: 5320, posts: 301 },
    { month: 'Jun', users: 2210, visits: 5640, posts: 318 },
    { month: 'Jul', users: 2480, visits: 6210, posts: 342 },
    { month: 'Ago', users: 2760, visits: 6890, posts: 371 },
    { month: 'Sep', users: 3110, visits: 7470, posts: 415 },
  ],
  // Distribucion por provincia (grafica de barras)
  byProvince: [
    { province: 'San José', visits: 18400, legends: 3 },
    { province: 'Cartago', visits: 12100, legends: 3 },
    { province: 'Puntarenas', visits: 8900, legends: 2 },
    { province: 'Guanacaste', visits: 7600, legends: 3 },
    { province: 'Heredia', visits: 5400, legends: 1 },
    { province: 'Alajuela', visits: 4100, legends: 1 },
    { province: 'Limón', visits: 1700, legends: 2 },
  ],
  // Reparto de roles (grafica de anillo)
  byRole: [
    { role: 'usuario', value: 16380 },
    { role: 'moderador', value: 142 },
    { role: 'admin', value: 9 },
  ],
  // Uso de la IA simulada por usuario (grafica de barras horizontales)
  aiUsage: [
    { label: 'admin', used: 6, limit: 10 },
    { label: 'mod_isabel', used: 4, limit: 10 },
    { label: 'explorador', used: 10, limit: 10 },
    { label: 'maria_cr', used: 2, limit: 10 },
    { label: 'tomas_p', used: 1, limit: 10 },
  ],
}

/* ── Configuracion de la IA simulada ───────────────────────────────────────── */
const aiConfig = {
  model: 'leyendas-oracle-v1',
  dailyLimitPerUser: 10,
  weights: {
    engagement: 0.45,
    retention: 0.3,
    contentSupply: 0.25,
  },
  horizons: [30, 60, 90],
}

const db = {
  meta: {
    name: 'LEYENDAS CR',
    description: 'Portal interactivo de leyendas e historias urbanas de Costa Rica.',
    version: '2.0.0',
    country: 'Costa Rica',
    center: { lat: 9.9333, lng: -84.0833 },
    tileLayer:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles de Esri',
    lastUpdated: '2025-09-22',
  },
  roles,
  users,
  legends: enrichedLegends,
  forum: {
    categories: forumCategories,
    posts: forumPosts,
    comments: forumComments,
  },
  expeditions,
  onboardingTips,
  metrics,
  aiConfig,
}

fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8')
console.log(
  `db.json generado: ${enrichedLegends.length} leyendas, ${users.length} usuarios, ${forumPosts.length} publicaciones.`
)
