// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/Forward/OneDrive/Desktop/proyecto%20leyendas/leyendas-urbanas-mapa/leyendas-urbanas-/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Forward/OneDrive/Desktop/proyecto%20leyendas/leyendas-urbanas-mapa/leyendas-urbanas-/node_modules/@vitejs/plugin-react/dist/index.js";
import path2 from "path";

// server/api.js
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
var __vite_injected_original_import_meta_url = "file:///C:/Users/Forward/OneDrive/Desktop/proyecto%20leyendas/leyendas-urbanas-mapa/leyendas-urbanas-/server/api.js";
var ROOT = path.dirname(path.dirname(fileURLToPath(__vite_injected_original_import_meta_url)));
var DATABASE_PATH = path.join(ROOT, "src", "data", "db.json");
var MAX_BODY_SIZE = 1024 * 1024;
function readDatabase() {
  return JSON.parse(fs.readFileSync(DATABASE_PATH, "utf8"));
}
function writeDatabase(database) {
  const temporaryPath = `${DATABASE_PATH}.${crypto.randomUUID()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(database, null, 2)}
`, "utf8");
  fs.renameSync(temporaryPath, DATABASE_PATH);
}
function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}
function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error("El cuerpo de la solicitud es demasiado grande."));
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("El cuerpo de la solicitud no es JSON v\xE1lido."));
      }
    });
    request.on("error", reject);
  });
}
function sanitizeUser(user) {
  const { password, passwordHash, identificacion, ...safeUser } = user;
  return safeUser;
}
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}
function verifyPassword(user, password) {
  if (!user.passwordHash) return user.password === password;
  const [, salt, expectedHex] = user.passwordHash.split(":");
  const expected = Buffer.from(expectedHex || "", "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
function createToken(user, secret) {
  const payload = Buffer.from(JSON.stringify({ id: user.id, expiresAt: Date.now() + 7 * 864e5 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}
function getAuthenticatedUser(request, database, secret) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest();
  let supplied;
  try {
    supplied = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (claims.expiresAt < Date.now()) return null;
    return database.users.find((user) => user.id === claims.id) || null;
  } catch {
    return null;
  }
}
function parseModelJson(content) {
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}
function normalizeProjection(result, factors, model) {
  const series = Array.isArray(result.series) ? result.series.slice(0, 6) : [];
  if (series.length === 0) throw new Error("DeepSeek no devolvi\xF3 una serie de proyecci\xF3n v\xE1lida.");
  const recommendations = Array.isArray(result.recommendations) ? result.recommendations.slice(0, 8) : [];
  return {
    model,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    horizonDays: Number(result.horizonDays) || 60,
    growthRate: Number(result.growthRate) || 0,
    projectedReach: Math.max(0, Math.round(Number(result.projectedReach) || 0)),
    confidence: Math.min(Math.max(Number(result.confidence) || 0.5, 0), 1),
    riskLevel: ["alto", "medio", "bajo"].includes(result.riskLevel) ? result.riskLevel : "medio",
    factors,
    series: series.map((item, index) => ({
      month: String(item.month || `Mes ${index + 1}`).slice(0, 40),
      activeUsers: Math.max(0, Math.round(Number(item.activeUsers) || 0)),
      posts: Math.max(0, Math.round(Number(item.posts) || 0)),
      engagement: Math.min(Math.max(Number(item.engagement) || 0, 0), 1)
    })),
    recommendations: recommendations.map((item, index) => ({
      id: `deepseek-${index + 1}`,
      title: String(item.title || "Recomendaci\xF3n").slice(0, 120),
      detail: String(item.detail || "").slice(0, 600),
      impact: ["alto", "medio", "bajo"].includes(item.impact) ? item.impact : "medio"
    })),
    disclaimer: "Estimaci\xF3n generada por IA a partir de datos de actividad; no constituye una predicci\xF3n garantizada."
  };
}
function clamp01(value) {
  return Math.min(Math.max(Number(value) || 0, 0), 1);
}
function buildLocalProjection(user, factors, database) {
  const stats = user?.stats || { posts: 0, comments: 0, legendsVisited: 0 };
  const engagement = clamp01(factors?.engagement ?? (stats.comments * 0.4 + stats.posts * 2.5 + stats.legendsVisited * 1.2) / 160);
  const reputation = clamp01((user?.reputation || 0) / 3e3);
  const daysActive = Math.max(0, Math.floor((Date.now() - new Date(user?.joinedAt || Date.now()).getTime()) / 864e5));
  const retention = clamp01(0.35 + reputation * 0.4 + Math.min(daysActive / 730, 0.25));
  const contentSupply = clamp01(factors?.contentSupply ?? (stats.posts * 3 + (user?.reputation || 0) * 0.3) / 80);
  const normalized = { engagement, retention, contentSupply };
  const weights = database.aiConfig.weights || { engagement: 0.45, retention: 0.3, contentSupply: 0.25 };
  const baseScore = normalized.engagement * weights.engagement + normalized.retention * weights.retention + normalized.contentSupply * weights.contentSupply;
  const growthRate = 0.08 + baseScore * 0.35;
  const months = [1, 2, 3];
  const series = months.map((month) => {
    const value = 1 * (1 + growthRate) ** month;
    return {
      month: `Mes +${month}`,
      activeUsers: Math.round(120 * value),
      posts: Math.round(18 * value),
      engagement: Number((0.35 + baseScore * 0.5).toFixed(3))
    };
  });
  const riskLevel = baseScore > 0.66 ? "alto" : baseScore > 0.38 ? "medio" : "bajo";
  return {
    model: "local-estimator-fallback",
    generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
    horizonDays: Number(database.aiConfig.horizons?.[1]) || 60,
    growthRate: Number((growthRate * 100).toFixed(1)),
    projectedReach: series[2].activeUsers,
    confidence: Number(Math.min(Math.max(0.68 + baseScore * 0.2, 0.4), 0.96).toFixed(2)),
    riskLevel,
    factors: normalized,
    series,
    recommendations: [
      {
        id: "fallback-1",
        title: "Publica de manera constante",
        detail: "Mant\xE9n una frecuencia semanal para mejorar el crecimiento proyectado de tu perfil.",
        impact: "alto"
      },
      {
        id: "fallback-2",
        title: "Participa en debates activos",
        detail: "Responder testimonios y debates aumenta la participaci\xF3n y la visibilidad del perfil.",
        impact: "medio"
      },
      {
        id: "fallback-3",
        title: "Explora leyendas de riesgo medio y alto",
        detail: "Aumentar la interacci\xF3n con ubicaciones relevantes y contenido de riesgo puede reforzar la retenci\xF3n.",
        impact: "bajo"
      }
    ],
    disclaimer: "La API de DeepSeek no est\xE1 disponible o no tiene saldo suficiente; esta estimaci\xF3n es una proyecci\xF3n local para mantener la funcionalidad del panel."
  };
}
async function generateDeepSeekProjection(request, user, database, apiKey) {
  if (!apiKey) {
    const error = new Error("Configura DEEPSEEK_API_KEY en el archivo .env del proyecto y reinicia el servidor.");
    error.status = 503;
    throw error;
  }
  const body = await readBody(request);
  const factors = body.factors || {};
  const userContent = {
    horizonDays: database.aiConfig.horizons?.[1] || 60,
    activity: {
      posts: Number(user.stats?.posts) || 0,
      comments: Number(user.stats?.comments) || 0,
      legendsVisited: Number(user.stats?.legendsVisited) || 0,
      reputation: Number(user.reputation) || 0
    },
    factors,
    weights: database.aiConfig.weights
  };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3e4);
  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "Eres un analista de actividad comunitaria. Devuelve solo JSON v\xE1lido en espa\xF1ol con: horizonDays (n\xFAmero), growthRate (porcentaje), projectedReach (entero), confidence (0 a 1), riskLevel (alto|medio|bajo), series (3 elementos con month, activeUsers, posts, engagement), recommendations (2 a 4 objetos con title, detail, impact alto|medio|bajo). Basa las cifras en las entradas, evita afirmar certezas y no inventes datos actuales."
          },
          { role: "user", content: JSON.stringify(userContent) }
        ]
      }),
      signal: controller.signal
    });
    const payload = await response.json();
    if (!response.ok) {
      const message = payload.error?.message || `DeepSeek respondi\xF3 con estado ${response.status}.`;
      const isBalanceIssue = /insufficient balance|balance|credit|quota|billing|subscription/i.test(message);
      if (isBalanceIssue) {
        return buildLocalProjection(user, factors, database);
      }
      const error = new Error(message);
      error.status = response.status === 429 ? 429 : 502;
      throw error;
    }
    const content = payload.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("DeepSeek devolvi\xF3 una respuesta vac\xEDa.");
    try {
      return normalizeProjection(parseModelJson(content), factors, payload.model || "deepseek-chat");
    } catch {
      return buildLocalProjection(user, factors, database);
    }
  } catch (error) {
    const isDeepSeekFailure = /insufficient balance|quota|billing|credit|fetch failed|deepseek|network|timeout/i.test(String(error?.message || ""));
    if (isDeepSeekFailure) {
      return buildLocalProjection(user, factors, database);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
function validateNewUser(body, existingUsers) {
  const username = String(body.username || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const displayName = String(body.displayName || "").trim();
  const password = String(body.password || "");
  if (username.length < 3 || !/^[a-zA-Z0-9_.-]+$/.test(username)) {
    return { error: "El usuario debe tener al menos 3 caracteres y usar letras, n\xFAmeros, punto, guion o guion bajo." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "El correo electr\xF3nico no es v\xE1lido." };
  if (password.length < 6) return { error: "La contrase\xF1a debe tener al menos 6 caracteres." };
  if (!displayName) return { error: "Escribe el nombre visible de la cuenta." };
  if (existingUsers.some((user) => user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email)) {
    return { error: "Ese usuario o correo ya est\xE1n registrados." };
  }
  return { username, email, displayName, password };
}
function createApiPlugin(env) {
  const secret = env.AUTH_SECRET || crypto.randomBytes(32).toString("hex");
  const apiKey = env.DEEPSEEK_API_KEY || "";
  async function handle(request, response, next) {
    const url = new URL(request.url || "/", "http://localhost");
    if (!url.pathname.startsWith("/api/")) return next();
    try {
      if (request.method === "GET" && url.pathname === "/api/health") {
        return sendJson(response, 200, { ready: true, deepseekConfigured: Boolean(apiKey) });
      }
      let database = readDatabase();
      if (request.method === "POST" && url.pathname === "/api/auth/login") {
        const body = await readBody(request);
        const identifier = String(body.identifier || "").trim().toLowerCase();
        const user = database.users.find((item) => item.username.toLowerCase() === identifier || item.email.toLowerCase() === identifier);
        if (!user || !verifyPassword(user, String(body.password || ""))) {
          return sendJson(response, 401, { success: false, message: "Usuario o contrase\xF1a incorrectos." });
        }
        if (user.passwordHash && user.password) {
          delete user.password;
          writeDatabase(database);
        }
        return sendJson(response, 200, { success: true, user: sanitizeUser(user), token: createToken(user, secret) });
      }
      if (request.method === "POST" && url.pathname === "/api/auth/register") {
        const body = await readBody(request);
        const validated = validateNewUser(body, database.users);
        if (validated.error) return sendJson(response, 400, { success: false, message: validated.error });
        const user = {
          id: `u-${crypto.randomUUID()}`,
          username: validated.username,
          email: validated.email,
          passwordHash: hashPassword(validated.password),
          displayName: validated.displayName,
          role: "usuario",
          avatar: "/images/la-segua.jpg",
          bio: "Nuevo miembro de la comunidad de LEYENDAS CR.",
          province: String(body.province || "San Jos\xE9"),
          joinedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          reputation: 0,
          badges: ["Nuevo miembro"],
          stats: { posts: 0, comments: 0, legendsVisited: 0 },
          age: Number(body.age) || 18,
          isAdult: body.isAdult !== false,
          birthDate: body.birthDate || null
        };
        database.users.push(user);
        writeDatabase(database);
        return sendJson(response, 201, {
          success: true,
          user: sanitizeUser(user),
          token: createToken(user, secret),
          ageWarning: user.isAdult ? null : `Eres menor de edad (${user.age} a\xF1os). Algunas zonas peligrosas estar\xE1n restringidas.`
        });
      }
      const authenticatedUser = getAuthenticatedUser(request, database, secret);
      if (!authenticatedUser || authenticatedUser.role !== "admin") {
        return sendJson(response, 403, { message: "Se requiere una sesi\xF3n de administrador." });
      }
      if (request.method === "GET" && url.pathname === "/api/users") {
        return sendJson(response, 200, database.users.map(sanitizeUser));
      }
      if (request.method === "POST" && url.pathname === "/api/users") {
        const body = await readBody(request);
        const validated = validateNewUser(body, database.users);
        if (validated.error) return sendJson(response, 400, { message: validated.error });
        const validRoles = database.roles.map((role) => role.id);
        if (!validRoles.includes(body.role)) return sendJson(response, 400, { message: "El rol seleccionado no existe." });
        const user = {
          id: `u-${crypto.randomUUID()}`,
          username: validated.username,
          email: validated.email,
          passwordHash: hashPassword(validated.password),
          displayName: validated.displayName,
          role: body.role,
          avatar: "/images/la-segua.jpg",
          bio: "Cuenta creada desde el panel de administraci\xF3n.",
          province: String(body.province || "San Jos\xE9"),
          joinedAt: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
          reputation: 0,
          badges: ["Nuevo miembro"],
          stats: { posts: 0, comments: 0, legendsVisited: 0 },
          age: 18,
          isAdult: true,
          birthDate: null
        };
        database.users.push(user);
        writeDatabase(database);
        return sendJson(response, 201, sanitizeUser(user));
      }
      const roleMatch = url.pathname.match(/^\/api\/users\/([^/]+)\/role$/);
      if (request.method === "PATCH" && roleMatch) {
        const body = await readBody(request);
        const validRoles = database.roles.map((role) => role.id);
        const target = database.users.find((user) => user.id === decodeURIComponent(roleMatch[1]));
        if (!target) return sendJson(response, 404, { message: "No se encontr\xF3 esa cuenta." });
        if (!validRoles.includes(body.role)) return sendJson(response, 400, { message: "El rol seleccionado no existe." });
        if (target.id === authenticatedUser.id && body.role !== "admin") {
          return sendJson(response, 400, { message: "No puedes quitarte tu propio rol de administrador." });
        }
        target.role = body.role;
        writeDatabase(database);
        return sendJson(response, 200, sanitizeUser(target));
      }
      if (request.method === "POST" && url.pathname === "/api/ai/projection") {
        const result = await generateDeepSeekProjection(request, authenticatedUser, database, apiKey);
        return sendJson(response, 200, result);
      }
      return sendJson(response, 404, { message: "Ruta API no encontrada." });
    } catch (error) {
      const status = error.status || (error.message.includes("JSON") ? 400 : 500);
      if (!response.headersSent) sendJson(response, status, { message: error.message || "Error interno del servidor." });
    }
  }
  const middleware = (request, response, next) => {
    handle(request, response, next).catch((error) => {
      if (!response.headersSent) sendJson(response, 500, { message: error.message || "Error interno del servidor." });
    });
  };
  return {
    name: "leyendas-api",
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    }
  };
}

// vite.config.js
var __vite_injected_original_dirname = "C:\\Users\\Forward\\OneDrive\\Desktop\\proyecto leyendas\\leyendas-urbanas-mapa\\leyendas-urbanas-";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, __vite_injected_original_dirname, "");
  return {
    plugins: [react(), createApiPlugin(env)],
    root: __vite_injected_original_dirname,
    publicDir: path2.resolve(__vite_injected_original_dirname, "public"),
    server: {
      port: 3e3,
      open: true
    },
    build: {
      outDir: path2.resolve(__vite_injected_original_dirname, "dist"),
      emptyOutDir: true
    },
    resolve: {
      alias: {
        "@": path2.resolve(__vite_injected_original_dirname, "src")
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAic2VydmVyL2FwaS5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEZvcndhcmRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxwcm95ZWN0byBsZXllbmRhc1xcXFxsZXllbmRhcy11cmJhbmFzLW1hcGFcXFxcbGV5ZW5kYXMtdXJiYW5hcy1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEZvcndhcmRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxwcm95ZWN0byBsZXllbmRhc1xcXFxsZXllbmRhcy11cmJhbmFzLW1hcGFcXFxcbGV5ZW5kYXMtdXJiYW5hcy1cXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0ZvcndhcmQvT25lRHJpdmUvRGVza3RvcC9wcm95ZWN0byUyMGxleWVuZGFzL2xleWVuZGFzLXVyYmFuYXMtbWFwYS9sZXllbmRhcy11cmJhbmFzLS92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgY3JlYXRlQXBpUGx1Z2luIH0gZnJvbSAnLi9zZXJ2ZXIvYXBpLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgX19kaXJuYW1lLCAnJylcblxuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCBjcmVhdGVBcGlQbHVnaW4oZW52KV0sXG4gICAgcm9vdDogX19kaXJuYW1lLFxuICAgIHB1YmxpY0RpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ3B1YmxpYycpLFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIG9wZW46IHRydWUsXG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgb3V0RGlyOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZGlzdCcpLFxuICAgICAgZW1wdHlPdXREaXI6IHRydWUsXG4gICAgfSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKSxcbiAgICAgIH0sXG4gICAgfVxuICB9XG59KSIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcRm9yd2FyZFxcXFxPbmVEcml2ZVxcXFxEZXNrdG9wXFxcXHByb3llY3RvIGxleWVuZGFzXFxcXGxleWVuZGFzLXVyYmFuYXMtbWFwYVxcXFxsZXllbmRhcy11cmJhbmFzLVxcXFxzZXJ2ZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXEZvcndhcmRcXFxcT25lRHJpdmVcXFxcRGVza3RvcFxcXFxwcm95ZWN0byBsZXllbmRhc1xcXFxsZXllbmRhcy11cmJhbmFzLW1hcGFcXFxcbGV5ZW5kYXMtdXJiYW5hcy1cXFxcc2VydmVyXFxcXGFwaS5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvRm9yd2FyZC9PbmVEcml2ZS9EZXNrdG9wL3Byb3llY3RvJTIwbGV5ZW5kYXMvbGV5ZW5kYXMtdXJiYW5hcy1tYXBhL2xleWVuZGFzLXVyYmFuYXMtL3NlcnZlci9hcGkuanNcIjtpbXBvcnQgY3J5cHRvIGZyb20gJ25vZGU6Y3J5cHRvJ1xyXG5pbXBvcnQgZnMgZnJvbSAnbm9kZTpmcydcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoIH0gZnJvbSAnbm9kZTp1cmwnXHJcblxyXG5jb25zdCBST09UID0gcGF0aC5kaXJuYW1lKHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpKVxyXG5jb25zdCBEQVRBQkFTRV9QQVRIID0gcGF0aC5qb2luKFJPT1QsICdzcmMnLCAnZGF0YScsICdkYi5qc29uJylcclxuY29uc3QgTUFYX0JPRFlfU0laRSA9IDEwMjQgKiAxMDI0XHJcblxyXG5mdW5jdGlvbiByZWFkRGF0YWJhc2UoKSB7XHJcbiAgcmV0dXJuIEpTT04ucGFyc2UoZnMucmVhZEZpbGVTeW5jKERBVEFCQVNFX1BBVEgsICd1dGY4JykpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHdyaXRlRGF0YWJhc2UoZGF0YWJhc2UpIHtcclxuICBjb25zdCB0ZW1wb3JhcnlQYXRoID0gYCR7REFUQUJBU0VfUEFUSH0uJHtjcnlwdG8ucmFuZG9tVVVJRCgpfS50bXBgXHJcbiAgZnMud3JpdGVGaWxlU3luYyh0ZW1wb3JhcnlQYXRoLCBgJHtKU09OLnN0cmluZ2lmeShkYXRhYmFzZSwgbnVsbCwgMil9XFxuYCwgJ3V0ZjgnKVxyXG4gIGZzLnJlbmFtZVN5bmModGVtcG9yYXJ5UGF0aCwgREFUQUJBU0VfUEFUSClcclxufVxyXG5cclxuZnVuY3Rpb24gc2VuZEpzb24ocmVzcG9uc2UsIHN0YXR1cywgcGF5bG9hZCkge1xyXG4gIHJlc3BvbnNlLnN0YXR1c0NvZGUgPSBzdGF0dXNcclxuICByZXNwb25zZS5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04JylcclxuICByZXNwb25zZS5lbmQoSlNPTi5zdHJpbmdpZnkocGF5bG9hZCkpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlYWRCb2R5KHJlcXVlc3QpIHtcclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IGJvZHkgPSAnJ1xyXG4gICAgcmVxdWVzdC5zZXRFbmNvZGluZygndXRmOCcpXHJcbiAgICByZXF1ZXN0Lm9uKCdkYXRhJywgKGNodW5rKSA9PiB7XHJcbiAgICAgIGJvZHkgKz0gY2h1bmtcclxuICAgICAgaWYgKGJvZHkubGVuZ3RoID4gTUFYX0JPRFlfU0laRSkge1xyXG4gICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0VsIGN1ZXJwbyBkZSBsYSBzb2xpY2l0dWQgZXMgZGVtYXNpYWRvIGdyYW5kZS4nKSlcclxuICAgICAgICByZXF1ZXN0LmRlc3Ryb3koKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmVxdWVzdC5vbignZW5kJywgKCkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSlcclxuICAgICAgfSBjYXRjaCB7XHJcbiAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignRWwgY3VlcnBvIGRlIGxhIHNvbGljaXR1ZCBubyBlcyBKU09OIHZcdTAwRTFsaWRvLicpKVxyXG4gICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmVxdWVzdC5vbignZXJyb3InLCByZWplY3QpXHJcbiAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gc2FuaXRpemVVc2VyKHVzZXIpIHtcclxuICBjb25zdCB7IHBhc3N3b3JkLCBwYXNzd29yZEhhc2gsIGlkZW50aWZpY2FjaW9uLCAuLi5zYWZlVXNlciB9ID0gdXNlclxyXG4gIHJldHVybiBzYWZlVXNlclxyXG59XHJcblxyXG5mdW5jdGlvbiBoYXNoUGFzc3dvcmQocGFzc3dvcmQpIHtcclxuICBjb25zdCBzYWx0ID0gY3J5cHRvLnJhbmRvbUJ5dGVzKDE2KS50b1N0cmluZygnaGV4JylcclxuICBjb25zdCBoYXNoID0gY3J5cHRvLnNjcnlwdFN5bmMocGFzc3dvcmQsIHNhbHQsIDY0KS50b1N0cmluZygnaGV4JylcclxuICByZXR1cm4gYHNjcnlwdDoke3NhbHR9OiR7aGFzaH1gXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZlcmlmeVBhc3N3b3JkKHVzZXIsIHBhc3N3b3JkKSB7XHJcbiAgaWYgKCF1c2VyLnBhc3N3b3JkSGFzaCkgcmV0dXJuIHVzZXIucGFzc3dvcmQgPT09IHBhc3N3b3JkXHJcbiAgY29uc3QgWywgc2FsdCwgZXhwZWN0ZWRIZXhdID0gdXNlci5wYXNzd29yZEhhc2guc3BsaXQoJzonKVxyXG4gIGNvbnN0IGV4cGVjdGVkID0gQnVmZmVyLmZyb20oZXhwZWN0ZWRIZXggfHwgJycsICdoZXgnKVxyXG4gIGNvbnN0IGFjdHVhbCA9IGNyeXB0by5zY3J5cHRTeW5jKHBhc3N3b3JkLCBzYWx0LCA2NClcclxuICByZXR1cm4gZXhwZWN0ZWQubGVuZ3RoID09PSBhY3R1YWwubGVuZ3RoICYmIGNyeXB0by50aW1pbmdTYWZlRXF1YWwoZXhwZWN0ZWQsIGFjdHVhbClcclxufVxyXG5cclxuZnVuY3Rpb24gY3JlYXRlVG9rZW4odXNlciwgc2VjcmV0KSB7XHJcbiAgY29uc3QgcGF5bG9hZCA9IEJ1ZmZlci5mcm9tKEpTT04uc3RyaW5naWZ5KHsgaWQ6IHVzZXIuaWQsIGV4cGlyZXNBdDogRGF0ZS5ub3coKSArIDcgKiA4NjQwMDAwMCB9KSkudG9TdHJpbmcoJ2Jhc2U2NHVybCcpXHJcbiAgY29uc3Qgc2lnbmF0dXJlID0gY3J5cHRvLmNyZWF0ZUhtYWMoJ3NoYTI1NicsIHNlY3JldCkudXBkYXRlKHBheWxvYWQpLmRpZ2VzdCgnYmFzZTY0dXJsJylcclxuICByZXR1cm4gYCR7cGF5bG9hZH0uJHtzaWduYXR1cmV9YFxyXG59XHJcblxyXG5mdW5jdGlvbiBnZXRBdXRoZW50aWNhdGVkVXNlcihyZXF1ZXN0LCBkYXRhYmFzZSwgc2VjcmV0KSB7XHJcbiAgY29uc3QgdG9rZW4gPSByZXF1ZXN0LmhlYWRlcnMuYXV0aG9yaXphdGlvbj8ucmVwbGFjZSgvXkJlYXJlclxccysvaSwgJycpXHJcbiAgaWYgKCF0b2tlbikgcmV0dXJuIG51bGxcclxuXHJcbiAgY29uc3QgW3BheWxvYWQsIHNpZ25hdHVyZV0gPSB0b2tlbi5zcGxpdCgnLicpXHJcbiAgaWYgKCFwYXlsb2FkIHx8ICFzaWduYXR1cmUpIHJldHVybiBudWxsXHJcbiAgY29uc3QgZXhwZWN0ZWQgPSBjcnlwdG8uY3JlYXRlSG1hYygnc2hhMjU2Jywgc2VjcmV0KS51cGRhdGUocGF5bG9hZCkuZGlnZXN0KClcclxuICBsZXQgc3VwcGxpZWRcclxuICB0cnkge1xyXG4gICAgc3VwcGxpZWQgPSBCdWZmZXIuZnJvbShzaWduYXR1cmUsICdiYXNlNjR1cmwnKVxyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIG51bGxcclxuICB9XHJcbiAgaWYgKHN1cHBsaWVkLmxlbmd0aCAhPT0gZXhwZWN0ZWQubGVuZ3RoIHx8ICFjcnlwdG8udGltaW5nU2FmZUVxdWFsKHN1cHBsaWVkLCBleHBlY3RlZCkpIHJldHVybiBudWxsXHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBjbGFpbXMgPSBKU09OLnBhcnNlKEJ1ZmZlci5mcm9tKHBheWxvYWQsICdiYXNlNjR1cmwnKS50b1N0cmluZygndXRmOCcpKVxyXG4gICAgaWYgKGNsYWltcy5leHBpcmVzQXQgPCBEYXRlLm5vdygpKSByZXR1cm4gbnVsbFxyXG4gICAgcmV0dXJuIGRhdGFiYXNlLnVzZXJzLmZpbmQoKHVzZXIpID0+IHVzZXIuaWQgPT09IGNsYWltcy5pZCkgfHwgbnVsbFxyXG4gIH0gY2F0Y2gge1xyXG4gICAgcmV0dXJuIG51bGxcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcnNlTW9kZWxKc29uKGNvbnRlbnQpIHtcclxuICBjb25zdCBjbGVhbmVkID0gY29udGVudC50cmltKCkucmVwbGFjZSgvXmBgYCg/Ompzb24pP1xccyovaSwgJycpLnJlcGxhY2UoL1xccypgYGAkLywgJycpXHJcbiAgcmV0dXJuIEpTT04ucGFyc2UoY2xlYW5lZClcclxufVxyXG5cclxuZnVuY3Rpb24gbm9ybWFsaXplUHJvamVjdGlvbihyZXN1bHQsIGZhY3RvcnMsIG1vZGVsKSB7XHJcbiAgY29uc3Qgc2VyaWVzID0gQXJyYXkuaXNBcnJheShyZXN1bHQuc2VyaWVzKSA/IHJlc3VsdC5zZXJpZXMuc2xpY2UoMCwgNikgOiBbXVxyXG4gIGlmIChzZXJpZXMubGVuZ3RoID09PSAwKSB0aHJvdyBuZXcgRXJyb3IoJ0RlZXBTZWVrIG5vIGRldm9sdmlcdTAwRjMgdW5hIHNlcmllIGRlIHByb3llY2NpXHUwMEYzbiB2XHUwMEUxbGlkYS4nKVxyXG5cclxuICBjb25zdCByZWNvbW1lbmRhdGlvbnMgPSBBcnJheS5pc0FycmF5KHJlc3VsdC5yZWNvbW1lbmRhdGlvbnMpID8gcmVzdWx0LnJlY29tbWVuZGF0aW9ucy5zbGljZSgwLCA4KSA6IFtdXHJcbiAgcmV0dXJuIHtcclxuICAgIG1vZGVsLFxyXG4gICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGhvcml6b25EYXlzOiBOdW1iZXIocmVzdWx0Lmhvcml6b25EYXlzKSB8fCA2MCxcclxuICAgIGdyb3d0aFJhdGU6IE51bWJlcihyZXN1bHQuZ3Jvd3RoUmF0ZSkgfHwgMCxcclxuICAgIHByb2plY3RlZFJlYWNoOiBNYXRoLm1heCgwLCBNYXRoLnJvdW5kKE51bWJlcihyZXN1bHQucHJvamVjdGVkUmVhY2gpIHx8IDApKSxcclxuICAgIGNvbmZpZGVuY2U6IE1hdGgubWluKE1hdGgubWF4KE51bWJlcihyZXN1bHQuY29uZmlkZW5jZSkgfHwgMC41LCAwKSwgMSksXHJcbiAgICByaXNrTGV2ZWw6IFsnYWx0bycsICdtZWRpbycsICdiYWpvJ10uaW5jbHVkZXMocmVzdWx0LnJpc2tMZXZlbCkgPyByZXN1bHQucmlza0xldmVsIDogJ21lZGlvJyxcclxuICAgIGZhY3RvcnMsXHJcbiAgICBzZXJpZXM6IHNlcmllcy5tYXAoKGl0ZW0sIGluZGV4KSA9PiAoe1xyXG4gICAgICBtb250aDogU3RyaW5nKGl0ZW0ubW9udGggfHwgYE1lcyAke2luZGV4ICsgMX1gKS5zbGljZSgwLCA0MCksXHJcbiAgICAgIGFjdGl2ZVVzZXJzOiBNYXRoLm1heCgwLCBNYXRoLnJvdW5kKE51bWJlcihpdGVtLmFjdGl2ZVVzZXJzKSB8fCAwKSksXHJcbiAgICAgIHBvc3RzOiBNYXRoLm1heCgwLCBNYXRoLnJvdW5kKE51bWJlcihpdGVtLnBvc3RzKSB8fCAwKSksXHJcbiAgICAgIGVuZ2FnZW1lbnQ6IE1hdGgubWluKE1hdGgubWF4KE51bWJlcihpdGVtLmVuZ2FnZW1lbnQpIHx8IDAsIDApLCAxKSxcclxuICAgIH0pKSxcclxuICAgIHJlY29tbWVuZGF0aW9uczogcmVjb21tZW5kYXRpb25zLm1hcCgoaXRlbSwgaW5kZXgpID0+ICh7XHJcbiAgICAgIGlkOiBgZGVlcHNlZWstJHtpbmRleCArIDF9YCxcclxuICAgICAgdGl0bGU6IFN0cmluZyhpdGVtLnRpdGxlIHx8ICdSZWNvbWVuZGFjaVx1MDBGM24nKS5zbGljZSgwLCAxMjApLFxyXG4gICAgICBkZXRhaWw6IFN0cmluZyhpdGVtLmRldGFpbCB8fCAnJykuc2xpY2UoMCwgNjAwKSxcclxuICAgICAgaW1wYWN0OiBbJ2FsdG8nLCAnbWVkaW8nLCAnYmFqbyddLmluY2x1ZGVzKGl0ZW0uaW1wYWN0KSA/IGl0ZW0uaW1wYWN0IDogJ21lZGlvJyxcclxuICAgIH0pKSxcclxuICAgIGRpc2NsYWltZXI6ICdFc3RpbWFjaVx1MDBGM24gZ2VuZXJhZGEgcG9yIElBIGEgcGFydGlyIGRlIGRhdG9zIGRlIGFjdGl2aWRhZDsgbm8gY29uc3RpdHV5ZSB1bmEgcHJlZGljY2lcdTAwRjNuIGdhcmFudGl6YWRhLicsXHJcbiAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBjbGFtcDAxKHZhbHVlKSB7XHJcbiAgcmV0dXJuIE1hdGgubWluKE1hdGgubWF4KE51bWJlcih2YWx1ZSkgfHwgMCwgMCksIDEpXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGJ1aWxkTG9jYWxQcm9qZWN0aW9uKHVzZXIsIGZhY3RvcnMsIGRhdGFiYXNlKSB7XHJcbiAgY29uc3Qgc3RhdHMgPSB1c2VyPy5zdGF0cyB8fCB7IHBvc3RzOiAwLCBjb21tZW50czogMCwgbGVnZW5kc1Zpc2l0ZWQ6IDAgfVxyXG4gIGNvbnN0IGVuZ2FnZW1lbnQgPSBjbGFtcDAxKGZhY3RvcnM/LmVuZ2FnZW1lbnQgPz8gKChzdGF0cy5jb21tZW50cyAqIDAuNCArIHN0YXRzLnBvc3RzICogMi41ICsgc3RhdHMubGVnZW5kc1Zpc2l0ZWQgKiAxLjIpIC8gMTYwKSlcclxuICBjb25zdCByZXB1dGF0aW9uID0gY2xhbXAwMSgodXNlcj8ucmVwdXRhdGlvbiB8fCAwKSAvIDMwMDApXHJcbiAgY29uc3QgZGF5c0FjdGl2ZSA9IE1hdGgubWF4KDAsIE1hdGguZmxvb3IoKERhdGUubm93KCkgLSBuZXcgRGF0ZSh1c2VyPy5qb2luZWRBdCB8fCBEYXRlLm5vdygpKS5nZXRUaW1lKCkpIC8gODY0MDAwMDApKVxyXG4gIGNvbnN0IHJldGVudGlvbiA9IGNsYW1wMDEoMC4zNSArIHJlcHV0YXRpb24gKiAwLjQgKyBNYXRoLm1pbihkYXlzQWN0aXZlIC8gNzMwLCAwLjI1KSlcclxuICBjb25zdCBjb250ZW50U3VwcGx5ID0gY2xhbXAwMShmYWN0b3JzPy5jb250ZW50U3VwcGx5ID8/ICgoc3RhdHMucG9zdHMgKiAzICsgKHVzZXI/LnJlcHV0YXRpb24gfHwgMCkgKiAwLjMpIC8gODApKVxyXG4gIGNvbnN0IG5vcm1hbGl6ZWQgPSB7IGVuZ2FnZW1lbnQsIHJldGVudGlvbiwgY29udGVudFN1cHBseSB9XHJcbiAgY29uc3Qgd2VpZ2h0cyA9IGRhdGFiYXNlLmFpQ29uZmlnLndlaWdodHMgfHwgeyBlbmdhZ2VtZW50OiAwLjQ1LCByZXRlbnRpb246IDAuMywgY29udGVudFN1cHBseTogMC4yNSB9XHJcbiAgY29uc3QgYmFzZVNjb3JlID1cclxuICAgIG5vcm1hbGl6ZWQuZW5nYWdlbWVudCAqIHdlaWdodHMuZW5nYWdlbWVudCArXHJcbiAgICBub3JtYWxpemVkLnJldGVudGlvbiAqIHdlaWdodHMucmV0ZW50aW9uICtcclxuICAgIG5vcm1hbGl6ZWQuY29udGVudFN1cHBseSAqIHdlaWdodHMuY29udGVudFN1cHBseVxyXG5cclxuICBjb25zdCBncm93dGhSYXRlID0gMC4wOCArIGJhc2VTY29yZSAqIDAuMzVcclxuICBjb25zdCBtb250aHMgPSBbMSwgMiwgM11cclxuICBjb25zdCBzZXJpZXMgPSBtb250aHMubWFwKChtb250aCkgPT4ge1xyXG4gICAgY29uc3QgdmFsdWUgPSAxICogKDEgKyBncm93dGhSYXRlKSAqKiBtb250aFxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgbW9udGg6IGBNZXMgKyR7bW9udGh9YCxcclxuICAgICAgYWN0aXZlVXNlcnM6IE1hdGgucm91bmQoMTIwICogdmFsdWUpLFxyXG4gICAgICBwb3N0czogTWF0aC5yb3VuZCgxOCAqIHZhbHVlKSxcclxuICAgICAgZW5nYWdlbWVudDogTnVtYmVyKCgwLjM1ICsgYmFzZVNjb3JlICogMC41KS50b0ZpeGVkKDMpKSxcclxuICAgIH1cclxuICB9KVxyXG5cclxuICBjb25zdCByaXNrTGV2ZWwgPSBiYXNlU2NvcmUgPiAwLjY2ID8gJ2FsdG8nIDogYmFzZVNjb3JlID4gMC4zOCA/ICdtZWRpbycgOiAnYmFqbydcclxuICByZXR1cm4ge1xyXG4gICAgbW9kZWw6ICdsb2NhbC1lc3RpbWF0b3ItZmFsbGJhY2snLFxyXG4gICAgZ2VuZXJhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcclxuICAgIGhvcml6b25EYXlzOiBOdW1iZXIoZGF0YWJhc2UuYWlDb25maWcuaG9yaXpvbnM/LlsxXSkgfHwgNjAsXHJcbiAgICBncm93dGhSYXRlOiBOdW1iZXIoKGdyb3d0aFJhdGUgKiAxMDApLnRvRml4ZWQoMSkpLFxyXG4gICAgcHJvamVjdGVkUmVhY2g6IHNlcmllc1syXS5hY3RpdmVVc2VycyxcclxuICAgIGNvbmZpZGVuY2U6IE51bWJlcihNYXRoLm1pbihNYXRoLm1heCgwLjY4ICsgYmFzZVNjb3JlICogMC4yLCAwLjQpLCAwLjk2KS50b0ZpeGVkKDIpKSxcclxuICAgIHJpc2tMZXZlbCxcclxuICAgIGZhY3RvcnM6IG5vcm1hbGl6ZWQsXHJcbiAgICBzZXJpZXMsXHJcbiAgICByZWNvbW1lbmRhdGlvbnM6IFtcclxuICAgICAge1xyXG4gICAgICAgIGlkOiAnZmFsbGJhY2stMScsXHJcbiAgICAgICAgdGl0bGU6ICdQdWJsaWNhIGRlIG1hbmVyYSBjb25zdGFudGUnLFxyXG4gICAgICAgIGRldGFpbDogJ01hbnRcdTAwRTluIHVuYSBmcmVjdWVuY2lhIHNlbWFuYWwgcGFyYSBtZWpvcmFyIGVsIGNyZWNpbWllbnRvIHByb3llY3RhZG8gZGUgdHUgcGVyZmlsLicsXHJcbiAgICAgICAgaW1wYWN0OiAnYWx0bycsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ2ZhbGxiYWNrLTInLFxyXG4gICAgICAgIHRpdGxlOiAnUGFydGljaXBhIGVuIGRlYmF0ZXMgYWN0aXZvcycsXHJcbiAgICAgICAgZGV0YWlsOiAnUmVzcG9uZGVyIHRlc3RpbW9uaW9zIHkgZGViYXRlcyBhdW1lbnRhIGxhIHBhcnRpY2lwYWNpXHUwMEYzbiB5IGxhIHZpc2liaWxpZGFkIGRlbCBwZXJmaWwuJyxcclxuICAgICAgICBpbXBhY3Q6ICdtZWRpbycsXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBpZDogJ2ZhbGxiYWNrLTMnLFxyXG4gICAgICAgIHRpdGxlOiAnRXhwbG9yYSBsZXllbmRhcyBkZSByaWVzZ28gbWVkaW8geSBhbHRvJyxcclxuICAgICAgICBkZXRhaWw6ICdBdW1lbnRhciBsYSBpbnRlcmFjY2lcdTAwRjNuIGNvbiB1YmljYWNpb25lcyByZWxldmFudGVzIHkgY29udGVuaWRvIGRlIHJpZXNnbyBwdWVkZSByZWZvcnphciBsYSByZXRlbmNpXHUwMEYzbi4nLFxyXG4gICAgICAgIGltcGFjdDogJ2Jham8nLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICAgIGRpc2NsYWltZXI6ICdMYSBBUEkgZGUgRGVlcFNlZWsgbm8gZXN0XHUwMEUxIGRpc3BvbmlibGUgbyBubyB0aWVuZSBzYWxkbyBzdWZpY2llbnRlOyBlc3RhIGVzdGltYWNpXHUwMEYzbiBlcyB1bmEgcHJveWVjY2lcdTAwRjNuIGxvY2FsIHBhcmEgbWFudGVuZXIgbGEgZnVuY2lvbmFsaWRhZCBkZWwgcGFuZWwuJyxcclxuICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGdlbmVyYXRlRGVlcFNlZWtQcm9qZWN0aW9uKHJlcXVlc3QsIHVzZXIsIGRhdGFiYXNlLCBhcGlLZXkpIHtcclxuICBpZiAoIWFwaUtleSkge1xyXG4gICAgY29uc3QgZXJyb3IgPSBuZXcgRXJyb3IoJ0NvbmZpZ3VyYSBERUVQU0VFS19BUElfS0VZIGVuIGVsIGFyY2hpdm8gLmVudiBkZWwgcHJveWVjdG8geSByZWluaWNpYSBlbCBzZXJ2aWRvci4nKVxyXG4gICAgZXJyb3Iuc3RhdHVzID0gNTAzXHJcbiAgICB0aHJvdyBlcnJvclxyXG4gIH1cclxuXHJcbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcXVlc3QpXHJcbiAgY29uc3QgZmFjdG9ycyA9IGJvZHkuZmFjdG9ycyB8fCB7fVxyXG4gIGNvbnN0IHVzZXJDb250ZW50ID0ge1xyXG4gICAgaG9yaXpvbkRheXM6IGRhdGFiYXNlLmFpQ29uZmlnLmhvcml6b25zPy5bMV0gfHwgNjAsXHJcbiAgICBhY3Rpdml0eToge1xyXG4gICAgICBwb3N0czogTnVtYmVyKHVzZXIuc3RhdHM/LnBvc3RzKSB8fCAwLFxyXG4gICAgICBjb21tZW50czogTnVtYmVyKHVzZXIuc3RhdHM/LmNvbW1lbnRzKSB8fCAwLFxyXG4gICAgICBsZWdlbmRzVmlzaXRlZDogTnVtYmVyKHVzZXIuc3RhdHM/LmxlZ2VuZHNWaXNpdGVkKSB8fCAwLFxyXG4gICAgICByZXB1dGF0aW9uOiBOdW1iZXIodXNlci5yZXB1dGF0aW9uKSB8fCAwLFxyXG4gICAgfSxcclxuICAgIGZhY3RvcnMsXHJcbiAgICB3ZWlnaHRzOiBkYXRhYmFzZS5haUNvbmZpZy53ZWlnaHRzLFxyXG4gIH1cclxuICBjb25zdCBjb250cm9sbGVyID0gbmV3IEFib3J0Q29udHJvbGxlcigpXHJcbiAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gY29udHJvbGxlci5hYm9ydCgpLCAzMDAwMClcclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpLmRlZXBzZWVrLmNvbS9jaGF0L2NvbXBsZXRpb25zJywge1xyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIEF1dGhvcml6YXRpb246IGBCZWFyZXIgJHthcGlLZXl9YCxcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XHJcbiAgICAgICAgbW9kZWw6ICdkZWVwc2Vlay1jaGF0JyxcclxuICAgICAgICB0ZW1wZXJhdHVyZTogMC4zLFxyXG4gICAgICAgIHJlc3BvbnNlX2Zvcm1hdDogeyB0eXBlOiAnanNvbl9vYmplY3QnIH0sXHJcbiAgICAgICAgbWVzc2FnZXM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgcm9sZTogJ3N5c3RlbScsXHJcbiAgICAgICAgICAgIGNvbnRlbnQ6ICdFcmVzIHVuIGFuYWxpc3RhIGRlIGFjdGl2aWRhZCBjb211bml0YXJpYS4gRGV2dWVsdmUgc29sbyBKU09OIHZcdTAwRTFsaWRvIGVuIGVzcGFcdTAwRjFvbCBjb246IGhvcml6b25EYXlzIChuXHUwMEZBbWVybyksIGdyb3d0aFJhdGUgKHBvcmNlbnRhamUpLCBwcm9qZWN0ZWRSZWFjaCAoZW50ZXJvKSwgY29uZmlkZW5jZSAoMCBhIDEpLCByaXNrTGV2ZWwgKGFsdG98bWVkaW98YmFqbyksIHNlcmllcyAoMyBlbGVtZW50b3MgY29uIG1vbnRoLCBhY3RpdmVVc2VycywgcG9zdHMsIGVuZ2FnZW1lbnQpLCByZWNvbW1lbmRhdGlvbnMgKDIgYSA0IG9iamV0b3MgY29uIHRpdGxlLCBkZXRhaWwsIGltcGFjdCBhbHRvfG1lZGlvfGJham8pLiBCYXNhIGxhcyBjaWZyYXMgZW4gbGFzIGVudHJhZGFzLCBldml0YSBhZmlybWFyIGNlcnRlemFzIHkgbm8gaW52ZW50ZXMgZGF0b3MgYWN0dWFsZXMuJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7IHJvbGU6ICd1c2VyJywgY29udGVudDogSlNPTi5zdHJpbmdpZnkodXNlckNvbnRlbnQpIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgfSksXHJcbiAgICAgIHNpZ25hbDogY29udHJvbGxlci5zaWduYWwsXHJcbiAgICB9KVxyXG4gICAgY29uc3QgcGF5bG9hZCA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKVxyXG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xyXG4gICAgICBjb25zdCBtZXNzYWdlID0gcGF5bG9hZC5lcnJvcj8ubWVzc2FnZSB8fCBgRGVlcFNlZWsgcmVzcG9uZGlcdTAwRjMgY29uIGVzdGFkbyAke3Jlc3BvbnNlLnN0YXR1c30uYFxyXG4gICAgICBjb25zdCBpc0JhbGFuY2VJc3N1ZSA9IC9pbnN1ZmZpY2llbnQgYmFsYW5jZXxiYWxhbmNlfGNyZWRpdHxxdW90YXxiaWxsaW5nfHN1YnNjcmlwdGlvbi9pLnRlc3QobWVzc2FnZSlcclxuICAgICAgaWYgKGlzQmFsYW5jZUlzc3VlKSB7XHJcbiAgICAgICAgcmV0dXJuIGJ1aWxkTG9jYWxQcm9qZWN0aW9uKHVzZXIsIGZhY3RvcnMsIGRhdGFiYXNlKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBlcnJvciA9IG5ldyBFcnJvcihtZXNzYWdlKVxyXG4gICAgICBlcnJvci5zdGF0dXMgPSByZXNwb25zZS5zdGF0dXMgPT09IDQyOSA/IDQyOSA6IDUwMlxyXG4gICAgICB0aHJvdyBlcnJvclxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNvbnRlbnQgPSBwYXlsb2FkLmNob2ljZXM/LlswXT8ubWVzc2FnZT8uY29udGVudFxyXG4gICAgaWYgKHR5cGVvZiBjb250ZW50ICE9PSAnc3RyaW5nJykgdGhyb3cgbmV3IEVycm9yKCdEZWVwU2VlayBkZXZvbHZpXHUwMEYzIHVuYSByZXNwdWVzdGEgdmFjXHUwMEVEYS4nKVxyXG4gICAgdHJ5IHtcclxuICAgICAgcmV0dXJuIG5vcm1hbGl6ZVByb2plY3Rpb24ocGFyc2VNb2RlbEpzb24oY29udGVudCksIGZhY3RvcnMsIHBheWxvYWQubW9kZWwgfHwgJ2RlZXBzZWVrLWNoYXQnKVxyXG4gICAgfSBjYXRjaCB7XHJcbiAgICAgIHJldHVybiBidWlsZExvY2FsUHJvamVjdGlvbih1c2VyLCBmYWN0b3JzLCBkYXRhYmFzZSlcclxuICAgIH1cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc3QgaXNEZWVwU2Vla0ZhaWx1cmUgPSAvaW5zdWZmaWNpZW50IGJhbGFuY2V8cXVvdGF8YmlsbGluZ3xjcmVkaXR8ZmV0Y2ggZmFpbGVkfGRlZXBzZWVrfG5ldHdvcmt8dGltZW91dC9pLnRlc3QoU3RyaW5nKGVycm9yPy5tZXNzYWdlIHx8ICcnKSlcclxuICAgIGlmIChpc0RlZXBTZWVrRmFpbHVyZSkge1xyXG4gICAgICByZXR1cm4gYnVpbGRMb2NhbFByb2plY3Rpb24odXNlciwgZmFjdG9ycywgZGF0YWJhc2UpXHJcbiAgICB9XHJcbiAgICB0aHJvdyBlcnJvclxyXG4gIH0gZmluYWxseSB7XHJcbiAgICBjbGVhclRpbWVvdXQodGltZW91dClcclxuICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZhbGlkYXRlTmV3VXNlcihib2R5LCBleGlzdGluZ1VzZXJzKSB7XHJcbiAgY29uc3QgdXNlcm5hbWUgPSBTdHJpbmcoYm9keS51c2VybmFtZSB8fCAnJykudHJpbSgpXHJcbiAgY29uc3QgZW1haWwgPSBTdHJpbmcoYm9keS5lbWFpbCB8fCAnJykudHJpbSgpLnRvTG93ZXJDYXNlKClcclxuICBjb25zdCBkaXNwbGF5TmFtZSA9IFN0cmluZyhib2R5LmRpc3BsYXlOYW1lIHx8ICcnKS50cmltKClcclxuICBjb25zdCBwYXNzd29yZCA9IFN0cmluZyhib2R5LnBhc3N3b3JkIHx8ICcnKVxyXG5cclxuICBpZiAodXNlcm5hbWUubGVuZ3RoIDwgMyB8fCAhL15bYS16QS1aMC05Xy4tXSskLy50ZXN0KHVzZXJuYW1lKSkge1xyXG4gICAgcmV0dXJuIHsgZXJyb3I6ICdFbCB1c3VhcmlvIGRlYmUgdGVuZXIgYWwgbWVub3MgMyBjYXJhY3RlcmVzIHkgdXNhciBsZXRyYXMsIG5cdTAwRkFtZXJvcywgcHVudG8sIGd1aW9uIG8gZ3Vpb24gYmFqby4nIH1cclxuICB9XHJcbiAgaWYgKCEvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLy50ZXN0KGVtYWlsKSkgcmV0dXJuIHsgZXJyb3I6ICdFbCBjb3JyZW8gZWxlY3RyXHUwMEYzbmljbyBubyBlcyB2XHUwMEUxbGlkby4nIH1cclxuICBpZiAocGFzc3dvcmQubGVuZ3RoIDwgNikgcmV0dXJuIHsgZXJyb3I6ICdMYSBjb250cmFzZVx1MDBGMWEgZGViZSB0ZW5lciBhbCBtZW5vcyA2IGNhcmFjdGVyZXMuJyB9XHJcbiAgaWYgKCFkaXNwbGF5TmFtZSkgcmV0dXJuIHsgZXJyb3I6ICdFc2NyaWJlIGVsIG5vbWJyZSB2aXNpYmxlIGRlIGxhIGN1ZW50YS4nIH1cclxuICBpZiAoZXhpc3RpbmdVc2Vycy5zb21lKCh1c2VyKSA9PiB1c2VyLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IHVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgfHwgdXNlci5lbWFpbC50b0xvd2VyQ2FzZSgpID09PSBlbWFpbCkpIHtcclxuICAgIHJldHVybiB7IGVycm9yOiAnRXNlIHVzdWFyaW8gbyBjb3JyZW8geWEgZXN0XHUwMEUxbiByZWdpc3RyYWRvcy4nIH1cclxuICB9XHJcbiAgcmV0dXJuIHsgdXNlcm5hbWUsIGVtYWlsLCBkaXNwbGF5TmFtZSwgcGFzc3dvcmQgfVxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXBpUGx1Z2luKGVudikge1xyXG4gIGNvbnN0IHNlY3JldCA9IGVudi5BVVRIX1NFQ1JFVCB8fCBjcnlwdG8ucmFuZG9tQnl0ZXMoMzIpLnRvU3RyaW5nKCdoZXgnKVxyXG4gIGNvbnN0IGFwaUtleSA9IGVudi5ERUVQU0VFS19BUElfS0VZIHx8ICcnXHJcblxyXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZShyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkge1xyXG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChyZXF1ZXN0LnVybCB8fCAnLycsICdodHRwOi8vbG9jYWxob3N0JylcclxuICAgIGlmICghdXJsLnBhdGhuYW1lLnN0YXJ0c1dpdGgoJy9hcGkvJykpIHJldHVybiBuZXh0KClcclxuXHJcbiAgICB0cnkge1xyXG4gICAgICBpZiAocmVxdWVzdC5tZXRob2QgPT09ICdHRVQnICYmIHVybC5wYXRobmFtZSA9PT0gJy9hcGkvaGVhbHRoJykge1xyXG4gICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCB7IHJlYWR5OiB0cnVlLCBkZWVwc2Vla0NvbmZpZ3VyZWQ6IEJvb2xlYW4oYXBpS2V5KSB9KVxyXG4gICAgICB9XHJcblxyXG4gICAgICBsZXQgZGF0YWJhc2UgPSByZWFkRGF0YWJhc2UoKVxyXG5cclxuICAgICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSAnUE9TVCcgJiYgdXJsLnBhdGhuYW1lID09PSAnL2FwaS9hdXRoL2xvZ2luJykge1xyXG4gICAgICAgIGNvbnN0IGJvZHkgPSBhd2FpdCByZWFkQm9keShyZXF1ZXN0KVxyXG4gICAgICAgIGNvbnN0IGlkZW50aWZpZXIgPSBTdHJpbmcoYm9keS5pZGVudGlmaWVyIHx8ICcnKS50cmltKCkudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIGNvbnN0IHVzZXIgPSBkYXRhYmFzZS51c2Vycy5maW5kKChpdGVtKSA9PiBpdGVtLnVzZXJuYW1lLnRvTG93ZXJDYXNlKCkgPT09IGlkZW50aWZpZXIgfHwgaXRlbS5lbWFpbC50b0xvd2VyQ2FzZSgpID09PSBpZGVudGlmaWVyKVxyXG4gICAgICAgIGlmICghdXNlciB8fCAhdmVyaWZ5UGFzc3dvcmQodXNlciwgU3RyaW5nKGJvZHkucGFzc3dvcmQgfHwgJycpKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHNlbmRKc29uKHJlc3BvbnNlLCA0MDEsIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6ICdVc3VhcmlvIG8gY29udHJhc2VcdTAwRjFhIGluY29ycmVjdG9zLicgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHVzZXIucGFzc3dvcmRIYXNoICYmIHVzZXIucGFzc3dvcmQpIHtcclxuICAgICAgICAgIGRlbGV0ZSB1c2VyLnBhc3N3b3JkXHJcbiAgICAgICAgICB3cml0ZURhdGFiYXNlKGRhdGFiYXNlKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgeyBzdWNjZXNzOiB0cnVlLCB1c2VyOiBzYW5pdGl6ZVVzZXIodXNlciksIHRva2VuOiBjcmVhdGVUb2tlbih1c2VyLCBzZWNyZXQpIH0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnICYmIHVybC5wYXRobmFtZSA9PT0gJy9hcGkvYXV0aC9yZWdpc3RlcicpIHtcclxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxdWVzdClcclxuICAgICAgICBjb25zdCB2YWxpZGF0ZWQgPSB2YWxpZGF0ZU5ld1VzZXIoYm9keSwgZGF0YWJhc2UudXNlcnMpXHJcbiAgICAgICAgaWYgKHZhbGlkYXRlZC5lcnJvcikgcmV0dXJuIHNlbmRKc29uKHJlc3BvbnNlLCA0MDAsIHsgc3VjY2VzczogZmFsc2UsIG1lc3NhZ2U6IHZhbGlkYXRlZC5lcnJvciB9KVxyXG4gICAgICAgIGNvbnN0IHVzZXIgPSB7XHJcbiAgICAgICAgICBpZDogYHUtJHtjcnlwdG8ucmFuZG9tVVVJRCgpfWAsXHJcbiAgICAgICAgICB1c2VybmFtZTogdmFsaWRhdGVkLnVzZXJuYW1lLFxyXG4gICAgICAgICAgZW1haWw6IHZhbGlkYXRlZC5lbWFpbCxcclxuICAgICAgICAgIHBhc3N3b3JkSGFzaDogaGFzaFBhc3N3b3JkKHZhbGlkYXRlZC5wYXNzd29yZCksXHJcbiAgICAgICAgICBkaXNwbGF5TmFtZTogdmFsaWRhdGVkLmRpc3BsYXlOYW1lLFxyXG4gICAgICAgICAgcm9sZTogJ3VzdWFyaW8nLFxyXG4gICAgICAgICAgYXZhdGFyOiAnL2ltYWdlcy9sYS1zZWd1YS5qcGcnLFxyXG4gICAgICAgICAgYmlvOiAnTnVldm8gbWllbWJybyBkZSBsYSBjb211bmlkYWQgZGUgTEVZRU5EQVMgQ1IuJyxcclxuICAgICAgICAgIHByb3ZpbmNlOiBTdHJpbmcoYm9keS5wcm92aW5jZSB8fCAnU2FuIEpvc1x1MDBFOScpLFxyXG4gICAgICAgICAgam9pbmVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCksXHJcbiAgICAgICAgICByZXB1dGF0aW9uOiAwLFxyXG4gICAgICAgICAgYmFkZ2VzOiBbJ051ZXZvIG1pZW1icm8nXSxcclxuICAgICAgICAgIHN0YXRzOiB7IHBvc3RzOiAwLCBjb21tZW50czogMCwgbGVnZW5kc1Zpc2l0ZWQ6IDAgfSxcclxuICAgICAgICAgIGFnZTogTnVtYmVyKGJvZHkuYWdlKSB8fCAxOCxcclxuICAgICAgICAgIGlzQWR1bHQ6IGJvZHkuaXNBZHVsdCAhPT0gZmFsc2UsXHJcbiAgICAgICAgICBiaXJ0aERhdGU6IGJvZHkuYmlydGhEYXRlIHx8IG51bGwsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGRhdGFiYXNlLnVzZXJzLnB1c2godXNlcilcclxuICAgICAgICB3cml0ZURhdGFiYXNlKGRhdGFiYXNlKVxyXG4gICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgMjAxLCB7XHJcbiAgICAgICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICAgICAgdXNlcjogc2FuaXRpemVVc2VyKHVzZXIpLFxyXG4gICAgICAgICAgdG9rZW46IGNyZWF0ZVRva2VuKHVzZXIsIHNlY3JldCksXHJcbiAgICAgICAgICBhZ2VXYXJuaW5nOiB1c2VyLmlzQWR1bHQgPyBudWxsIDogYEVyZXMgbWVub3IgZGUgZWRhZCAoJHt1c2VyLmFnZX0gYVx1MDBGMW9zKS4gQWxndW5hcyB6b25hcyBwZWxpZ3Jvc2FzIGVzdGFyXHUwMEUxbiByZXN0cmluZ2lkYXMuYCxcclxuICAgICAgICB9KVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCBhdXRoZW50aWNhdGVkVXNlciA9IGdldEF1dGhlbnRpY2F0ZWRVc2VyKHJlcXVlc3QsIGRhdGFiYXNlLCBzZWNyZXQpXHJcbiAgICAgIGlmICghYXV0aGVudGljYXRlZFVzZXIgfHwgYXV0aGVudGljYXRlZFVzZXIucm9sZSAhPT0gJ2FkbWluJykge1xyXG4gICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgNDAzLCB7IG1lc3NhZ2U6ICdTZSByZXF1aWVyZSB1bmEgc2VzaVx1MDBGM24gZGUgYWRtaW5pc3RyYWRvci4nIH0pXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ0dFVCcgJiYgdXJsLnBhdGhuYW1lID09PSAnL2FwaS91c2VycycpIHtcclxuICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzcG9uc2UsIDIwMCwgZGF0YWJhc2UudXNlcnMubWFwKHNhbml0aXplVXNlcikpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BPU1QnICYmIHVybC5wYXRobmFtZSA9PT0gJy9hcGkvdXNlcnMnKSB7XHJcbiAgICAgICAgY29uc3QgYm9keSA9IGF3YWl0IHJlYWRCb2R5KHJlcXVlc3QpXHJcbiAgICAgICAgY29uc3QgdmFsaWRhdGVkID0gdmFsaWRhdGVOZXdVc2VyKGJvZHksIGRhdGFiYXNlLnVzZXJzKVxyXG4gICAgICAgIGlmICh2YWxpZGF0ZWQuZXJyb3IpIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgNDAwLCB7IG1lc3NhZ2U6IHZhbGlkYXRlZC5lcnJvciB9KVxyXG4gICAgICAgIGNvbnN0IHZhbGlkUm9sZXMgPSBkYXRhYmFzZS5yb2xlcy5tYXAoKHJvbGUpID0+IHJvbGUuaWQpXHJcbiAgICAgICAgaWYgKCF2YWxpZFJvbGVzLmluY2x1ZGVzKGJvZHkucm9sZSkpIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgNDAwLCB7IG1lc3NhZ2U6ICdFbCByb2wgc2VsZWNjaW9uYWRvIG5vIGV4aXN0ZS4nIH0pXHJcbiAgICAgICAgY29uc3QgdXNlciA9IHtcclxuICAgICAgICAgIGlkOiBgdS0ke2NyeXB0by5yYW5kb21VVUlEKCl9YCxcclxuICAgICAgICAgIHVzZXJuYW1lOiB2YWxpZGF0ZWQudXNlcm5hbWUsXHJcbiAgICAgICAgICBlbWFpbDogdmFsaWRhdGVkLmVtYWlsLFxyXG4gICAgICAgICAgcGFzc3dvcmRIYXNoOiBoYXNoUGFzc3dvcmQodmFsaWRhdGVkLnBhc3N3b3JkKSxcclxuICAgICAgICAgIGRpc3BsYXlOYW1lOiB2YWxpZGF0ZWQuZGlzcGxheU5hbWUsXHJcbiAgICAgICAgICByb2xlOiBib2R5LnJvbGUsXHJcbiAgICAgICAgICBhdmF0YXI6ICcvaW1hZ2VzL2xhLXNlZ3VhLmpwZycsXHJcbiAgICAgICAgICBiaW86ICdDdWVudGEgY3JlYWRhIGRlc2RlIGVsIHBhbmVsIGRlIGFkbWluaXN0cmFjaVx1MDBGM24uJyxcclxuICAgICAgICAgIHByb3ZpbmNlOiBTdHJpbmcoYm9keS5wcm92aW5jZSB8fCAnU2FuIEpvc1x1MDBFOScpLFxyXG4gICAgICAgICAgam9pbmVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCksXHJcbiAgICAgICAgICByZXB1dGF0aW9uOiAwLFxyXG4gICAgICAgICAgYmFkZ2VzOiBbJ051ZXZvIG1pZW1icm8nXSxcclxuICAgICAgICAgIHN0YXRzOiB7IHBvc3RzOiAwLCBjb21tZW50czogMCwgbGVnZW5kc1Zpc2l0ZWQ6IDAgfSxcclxuICAgICAgICAgIGFnZTogMTgsXHJcbiAgICAgICAgICBpc0FkdWx0OiB0cnVlLFxyXG4gICAgICAgICAgYmlydGhEYXRlOiBudWxsLFxyXG4gICAgICAgIH1cclxuICAgICAgICBkYXRhYmFzZS51c2Vycy5wdXNoKHVzZXIpXHJcbiAgICAgICAgd3JpdGVEYXRhYmFzZShkYXRhYmFzZSlcclxuICAgICAgICByZXR1cm4gc2VuZEpzb24ocmVzcG9uc2UsIDIwMSwgc2FuaXRpemVVc2VyKHVzZXIpKVxyXG4gICAgICB9XHJcblxyXG4gICAgICBjb25zdCByb2xlTWF0Y2ggPSB1cmwucGF0aG5hbWUubWF0Y2goL15cXC9hcGlcXC91c2Vyc1xcLyhbXi9dKylcXC9yb2xlJC8pXHJcbiAgICAgIGlmIChyZXF1ZXN0Lm1ldGhvZCA9PT0gJ1BBVENIJyAmJiByb2xlTWF0Y2gpIHtcclxuICAgICAgICBjb25zdCBib2R5ID0gYXdhaXQgcmVhZEJvZHkocmVxdWVzdClcclxuICAgICAgICBjb25zdCB2YWxpZFJvbGVzID0gZGF0YWJhc2Uucm9sZXMubWFwKChyb2xlKSA9PiByb2xlLmlkKVxyXG4gICAgICAgIGNvbnN0IHRhcmdldCA9IGRhdGFiYXNlLnVzZXJzLmZpbmQoKHVzZXIpID0+IHVzZXIuaWQgPT09IGRlY29kZVVSSUNvbXBvbmVudChyb2xlTWF0Y2hbMV0pKVxyXG4gICAgICAgIGlmICghdGFyZ2V0KSByZXR1cm4gc2VuZEpzb24ocmVzcG9uc2UsIDQwNCwgeyBtZXNzYWdlOiAnTm8gc2UgZW5jb250clx1MDBGMyBlc2EgY3VlbnRhLicgfSlcclxuICAgICAgICBpZiAoIXZhbGlkUm9sZXMuaW5jbHVkZXMoYm9keS5yb2xlKSkgcmV0dXJuIHNlbmRKc29uKHJlc3BvbnNlLCA0MDAsIHsgbWVzc2FnZTogJ0VsIHJvbCBzZWxlY2Npb25hZG8gbm8gZXhpc3RlLicgfSlcclxuICAgICAgICBpZiAodGFyZ2V0LmlkID09PSBhdXRoZW50aWNhdGVkVXNlci5pZCAmJiBib2R5LnJvbGUgIT09ICdhZG1pbicpIHtcclxuICAgICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgNDAwLCB7IG1lc3NhZ2U6ICdObyBwdWVkZXMgcXVpdGFydGUgdHUgcHJvcGlvIHJvbCBkZSBhZG1pbmlzdHJhZG9yLicgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGFyZ2V0LnJvbGUgPSBib2R5LnJvbGVcclxuICAgICAgICB3cml0ZURhdGFiYXNlKGRhdGFiYXNlKVxyXG4gICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCBzYW5pdGl6ZVVzZXIodGFyZ2V0KSlcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYgKHJlcXVlc3QubWV0aG9kID09PSAnUE9TVCcgJiYgdXJsLnBhdGhuYW1lID09PSAnL2FwaS9haS9wcm9qZWN0aW9uJykge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGdlbmVyYXRlRGVlcFNlZWtQcm9qZWN0aW9uKHJlcXVlc3QsIGF1dGhlbnRpY2F0ZWRVc2VyLCBkYXRhYmFzZSwgYXBpS2V5KVxyXG4gICAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgMjAwLCByZXN1bHQpXHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJldHVybiBzZW5kSnNvbihyZXNwb25zZSwgNDA0LCB7IG1lc3NhZ2U6ICdSdXRhIEFQSSBubyBlbmNvbnRyYWRhLicgfSlcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgIGNvbnN0IHN0YXR1cyA9IGVycm9yLnN0YXR1cyB8fCAoZXJyb3IubWVzc2FnZS5pbmNsdWRlcygnSlNPTicpID8gNDAwIDogNTAwKVxyXG4gICAgICBpZiAoIXJlc3BvbnNlLmhlYWRlcnNTZW50KSBzZW5kSnNvbihyZXNwb25zZSwgc3RhdHVzLCB7IG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UgfHwgJ0Vycm9yIGludGVybm8gZGVsIHNlcnZpZG9yLicgfSlcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGNvbnN0IG1pZGRsZXdhcmUgPSAocmVxdWVzdCwgcmVzcG9uc2UsIG5leHQpID0+IHtcclxuICAgIGhhbmRsZShyZXF1ZXN0LCByZXNwb25zZSwgbmV4dCkuY2F0Y2goKGVycm9yKSA9PiB7XHJcbiAgICAgIGlmICghcmVzcG9uc2UuaGVhZGVyc1NlbnQpIHNlbmRKc29uKHJlc3BvbnNlLCA1MDAsIHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSB8fCAnRXJyb3IgaW50ZXJubyBkZWwgc2Vydmlkb3IuJyB9KVxyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBuYW1lOiAnbGV5ZW5kYXMtYXBpJyxcclxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcclxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZShtaWRkbGV3YXJlKVxyXG4gICAgfSxcclxuICAgIGNvbmZpZ3VyZVByZXZpZXdTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UobWlkZGxld2FyZSlcclxuICAgIH0sXHJcbiAgfVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcWQsU0FBUyxjQUFjLGVBQWU7QUFDM2YsT0FBTyxXQUFXO0FBQ2xCLE9BQU9BLFdBQVU7OztBQ0YyYyxPQUFPLFlBQVk7QUFDL2UsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBQ2pCLFNBQVMscUJBQXFCO0FBSHVSLElBQU0sMkNBQTJDO0FBS3RXLElBQU0sT0FBTyxLQUFLLFFBQVEsS0FBSyxRQUFRLGNBQWMsd0NBQWUsQ0FBQyxDQUFDO0FBQ3RFLElBQU0sZ0JBQWdCLEtBQUssS0FBSyxNQUFNLE9BQU8sUUFBUSxTQUFTO0FBQzlELElBQU0sZ0JBQWdCLE9BQU87QUFFN0IsU0FBUyxlQUFlO0FBQ3RCLFNBQU8sS0FBSyxNQUFNLEdBQUcsYUFBYSxlQUFlLE1BQU0sQ0FBQztBQUMxRDtBQUVBLFNBQVMsY0FBYyxVQUFVO0FBQy9CLFFBQU0sZ0JBQWdCLEdBQUcsYUFBYSxJQUFJLE9BQU8s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VUFBVSxLQUFLLGFBQWEsTUFBTSxDQUFDO0FBQUEsTUFDckQ7QUFFQSxVQUFJLFFBQVEsV0FBVyxVQUFVLElBQUksYUFBYSxzQkFBc0I7QUFDdEUsY0FBTSxTQUFTLE1BQU0sMkJBQTJCLFNBQVMsbUJBQW1CLFVBQVUsTUFBTTtBQUM1RixlQUFPLFNBQVMsVUFBVSxLQUFLLE1BQU07QUFBQSxNQUN2QztBQUVBLGFBQU8sU0FBUyxVQUFVLEtBQUssRUFBRSxTQUFTLDBCQUEwQixDQUFDO0FBQUEsSUFDdkUsU0FBUyxPQUFPO0FBQ2QsWUFBTSxTQUFTLE1BQU0sV0FBVyxNQUFNLFFBQVEsU0FBUyxNQUFNLElBQUksTUFBTTtBQUN2RSxVQUFJLENBQUMsU0FBUyxZQUFhLFVBQVMsVUFBVSxRQUFRLEVBQUUsU0FBUyxNQUFNLFdBQVcsOEJBQThCLENBQUM7QUFBQSxJQUNuSDtBQUFBLEVBQ0Y7QUFFQSxRQUFNLGFBQWEsQ0FBQyxTQUFTLFVBQVUsU0FBUztBQUM5QyxXQUFPLFNBQVMsVUFBVSxJQUFJLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDL0MsVUFBSSxDQUFDLFNBQVMsWUFBYSxVQUFTLFVBQVUsS0FBSyxFQUFFLFNBQVMsTUFBTSxXQUFXLDhCQUE4QixDQUFDO0FBQUEsSUFDaEgsQ0FBQztBQUFBLEVBQ0g7QUFFQSxTQUFPO0FBQUEsSUFDTCxNQUFNO0FBQUEsSUFDTixnQkFBZ0IsUUFBUTtBQUN0QixhQUFPLFlBQVksSUFBSSxVQUFVO0FBQUEsSUFDbkM7QUFBQSxJQUNBLHVCQUF1QixRQUFRO0FBQzdCLGFBQU8sWUFBWSxJQUFJLFVBQVU7QUFBQSxJQUNuQztBQUFBLEVBQ0Y7QUFDRjs7O0FEOWFBLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sa0NBQVcsRUFBRTtBQUV2QyxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsTUFBTSxHQUFHLGdCQUFnQixHQUFHLENBQUM7QUFBQSxJQUN2QyxNQUFNO0FBQUEsSUFDTixXQUFXQyxNQUFLLFFBQVEsa0NBQVcsUUFBUTtBQUFBLElBQzNDLFFBQVE7QUFBQSxNQUNOLE1BQU07QUFBQSxNQUNOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxRQUFRQSxNQUFLLFFBQVEsa0NBQVcsTUFBTTtBQUFBLE1BQ3RDLGFBQWE7QUFBQSxJQUNmO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUEsUUFDTCxLQUFLQSxNQUFLLFFBQVEsa0NBQVcsS0FBSztBQUFBLE1BQ3BDO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogWyJwYXRoIiwgInBhdGgiXQp9Cg==
