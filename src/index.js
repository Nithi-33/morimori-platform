// GoldenBead Worker. Phase 0: serves Scope & Sequence 6-12 to teachers who know the shared password.

import {
  COOKIE_NAME,
  checkPassword,
  clearedCookie,
  createSessionValue,
  isConfigured,
  isValidSession,
  readCookie,
  safeNext,
  sessionCookie,
} from "./auth.js";
import { loginPage } from "./login-page.js";

const HOME = "/ss-6-12/";

const LOGIN_PAGE_CSP = [
  "default-src 'none'",
  "style-src 'unsafe-inline'",
  "script-src 'unsafe-inline'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
].join("; ");

function withSecurityHeaders(response, { cache = "no-store" } = {}) {
  const res = new Response(response.body, response);
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("X-Content-Type-Options", "nosniff");
  // "same-origin": with "no-referrer" browsers send "Origin: null" on the login form, which was refused.
  res.headers.set("Referrer-Policy", "same-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("Strict-Transport-Security", "max-age=31536000");
  res.headers.set("Cache-Control", cache);
  return res;
}

function redirect(location, extraHeaders = {}) {
  return withSecurityHeaders(
    new Response(null, { status: 303, headers: { Location: location, ...extraHeaders } }),
  );
}

function html(body, status = 200) {
  return withSecurityHeaders(
    new Response(body, {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": LOGIN_PAGE_CSP,
      },
    }),
  );
}

async function tooManyAttempts(request, env) {
  if (!env.LOGIN_LIMITER) return false;
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const { success } = await env.LOGIN_LIMITER.limit({ key: `login:${ip}` });
  return !success;
}

async function handleLogin(request, env, url) {
  if (request.method === "GET") {
    return html(loginPage({ next: safeNext(url.searchParams.get("next")) }));
  }
  if (request.method !== "POST") {
    return withSecurityHeaders(new Response("Method not allowed", { status: 405, headers: { Allow: "GET, POST" } }));
  }

  // Reject logins posted from another site.
  const origin = request.headers.get("Origin");
  const crossSite = origin ? origin !== url.origin : request.headers.get("Sec-Fetch-Site") === "cross-site";
  if (crossSite) {
    return withSecurityHeaders(new Response("Forbidden", { status: 403 }));
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return withSecurityHeaders(new Response("Bad request", { status: 400 }));
  }
  const next = safeNext(form.get("next"));

  if (await tooManyAttempts(request, env)) {
    return html(loginPage({ next, error: "slow" }), 429);
  }
  if (!(await checkPassword(env, form.get("password")))) {
    return html(loginPage({ next, error: "wrong" }), 401);
  }
  return redirect(next, { "Set-Cookie": sessionCookie(await createSessionValue(env)) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // The login cookie only works over HTTPS, so send plain-HTTP visits (e.g. links from chat apps) there first.
    if (url.protocol === "http:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }

    if (path === "/robots.txt") {
      return withSecurityHeaders(await env.ASSETS.fetch(request), { cache: "public, max-age=86400" });
    }

    // Fail closed: with no password or secret set, nothing is served.
    if (!isConfigured(env)) {
      return withSecurityHeaders(new Response("Not configured yet.", { status: 503 }));
    }

    if (path === "/login") return handleLogin(request, env, url);

    if (path === "/logout") {
      return redirect("/login", { "Set-Cookie": clearedCookie() });
    }

    const signedIn = await isValidSession(env, readCookie(request, COOKIE_NAME));
    if (!signedIn) {
      const next = path === "/" ? HOME : path + url.search;
      return redirect(`/login?next=${encodeURIComponent(next)}`);
    }

    if (path === "/") return redirect(HOME);

    if (request.method !== "GET" && request.method !== "HEAD") {
      return withSecurityHeaders(new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } }));
    }

    // "private" keeps shared caches from storing teacher-only files. Pages are checked every
    // time so updates show at once; images may stay in the browser for a day. Errors and
    // redirects are not kept, so a fixed file shows up after the next deploy.
    const asset = await env.ASSETS.fetch(request);
    const isPage = (asset.headers.get("Content-Type") || "").startsWith("text/html");
    let cache = "no-store";
    if (asset.status === 200) cache = isPage ? "private, no-cache" : "private, max-age=86400";
    return withSecurityHeaders(asset, { cache });
  },
};
