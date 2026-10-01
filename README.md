# leyendas-urbanas-
protecto

## API local y DeepSeek

El servidor Vite expone el API local que guarda las cuentas nuevas y los cambios de roles en `src/data/db.json`. Para habilitar las proyecciones con DeepSeek:

1. Copia `.env.example` como `.env`.
2. Configura `DEEPSEEK_API_KEY` con una clave nueva y `AUTH_SECRET` con un secreto aleatorio largo.
3. Reinicia `npm run dev`.

La clave de DeepSeek se usa solo desde el middleware del servidor y nunca se incluye en el bundle del navegador. La voz tenebrosa usa la síntesis de voz del navegador y se activa desde el panel de visualización.
