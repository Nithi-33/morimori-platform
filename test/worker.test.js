import { test } from "node:test";
import assert from "node:assert/strict";

import worker from "../src/index.js";
import { COOKIE_NAME, createSessionValue, isValidSession, safeNext } from "../src/auth.js";

const BASE = "https://app.goldenbead.org";

function makeEnv(overrides = {}) {
  return {
    SITE_PASSWORD: "test-password",
    SESSION_SECRET: "x".repeat(40),
    ASSETS: {
      async fetch(request) {
        const path = new URL(request.url).pathname;
        const type = path.endsWith(".html") || path.endsWith("/") ? "text/html" : "image/jpeg";
        return new Response(`asset:${path}`, { headers: { "Content-Type": type } });
      },
    },
    ...overrides,
  };
}

function get(path, headers = {}) {
  return new Request(BASE + path, { headers });
}

function postLogin(fields, headers = {}) {
  return new Request(BASE + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", ...headers },
    body: new URLSearchParams(fields).toString(),
  });
}

async function signedInCookie(env) {
  return `${COOKIE_NAME}=${await createSessionValue(env)}`;
}

test("fails closed when secrets are missing", async () => {
  const env = makeEnv({ SITE_PASSWORD: undefined });
  const res = await worker.fetch(get("/ss-6-12/"), env);
  assert.equal(res.status, 503);
});

test("fails closed when the session secret is too short", async () => {
  const env = makeEnv({ SESSION_SECRET: "short" });
  const res = await worker.fetch(get("/ss-6-12/"), env);
  assert.equal(res.status, 503);
});

test("robots.txt is public", async () => {
  const res = await worker.fetch(get("/robots.txt"), makeEnv({ SITE_PASSWORD: undefined }));
  assert.equal(res.status, 200);
});

test("pages and images need a login", async () => {
  const env = makeEnv();
  for (const path of ["/ss-6-12/", "/ss-6-12/ss_ver2_images/t/1.jpg", "/"]) {
    const res = await worker.fetch(get(path), env);
    assert.equal(res.status, 303, path);
    assert.match(res.headers.get("Location"), /^\/login\?next=/);
  }
});

test("login page is bilingual and marked noindex", async () => {
  const res = await worker.fetch(get("/login"), makeEnv());
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /รหัสผ่าน/);
  assert.match(body, /Password/);
  assert.equal(res.headers.get("X-Robots-Tag"), "noindex, nofollow");
  assert.ok(res.headers.get("Content-Security-Policy"));
});

test("wrong password is refused and sets no cookie", async () => {
  const res = await worker.fetch(postLogin({ password: "nope", next: "/ss-6-12/" }), makeEnv());
  assert.equal(res.status, 401);
  assert.equal(res.headers.get("Set-Cookie"), null);
});

test("right password sets a host-only secure cookie and redirects", async () => {
  const res = await worker.fetch(postLogin({ password: "test-password", next: "/ss-6-12/" }), makeEnv());
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("Location"), "/ss-6-12/");
  const cookie = res.headers.get("Set-Cookie");
  assert.match(cookie, /^__Host-gb_session=/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.doesNotMatch(cookie, /Domain=/i);
});

test("login posted from another site is refused", async () => {
  const res = await worker.fetch(
    postLogin({ password: "test-password" }, { Origin: "https://evil.example" }),
    makeEnv(),
  );
  assert.equal(res.status, 403);
});

test("redirect after login never leaves the site", async () => {
  for (const next of ["https://evil.example", "//evil.example", "/\\evil.example", "evil"]) {
    assert.equal(safeNext(next), "/", next);
  }
  assert.equal(safeNext("/ss-6-12/"), "/ss-6-12/");
  const res = await worker.fetch(postLogin({ password: "test-password", next: "//evil.example" }), makeEnv());
  assert.equal(res.headers.get("Location"), "/");
});

test("signed-in teacher gets the files, with private caching", async () => {
  const env = makeEnv();
  const cookie = await signedInCookie(env);
  const page = await worker.fetch(get("/ss-6-12/", { Cookie: cookie }), env);
  assert.equal(page.status, 200);
  assert.equal(await page.text(), "asset:/ss-6-12/");
  assert.equal(page.headers.get("Cache-Control"), "private, no-cache");
  const image = await worker.fetch(get("/ss-6-12/ss_ver2_images/t/1.jpg", { Cookie: cookie }), env);
  assert.equal(image.headers.get("Cache-Control"), "private, max-age=86400");
});

test("root goes to Scope & Sequence when signed in", async () => {
  const env = makeEnv();
  const res = await worker.fetch(get("/", { Cookie: await signedInCookie(env) }), env);
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("Location"), "/ss-6-12/");
});

test("tampered, expired or old-password cookies are refused", async () => {
  const env = makeEnv();
  const good = await createSessionValue(env);
  const [expires, sig] = good.split(".");
  assert.equal(await isValidSession(env, good), true);
  assert.equal(await isValidSession(env, `${Number(expires) + 999}.${sig}`), false);
  assert.equal(await isValidSession(env, `${expires}.${"0".repeat(64)}`), false);
  assert.equal(await isValidSession(env, "garbage"), false);

  const old = await createSessionValue(env, Date.now() - 31 * 24 * 60 * 60 * 1000);
  assert.equal(await isValidSession(env, old), false);

  const changed = makeEnv({ SITE_PASSWORD: "new-password" });
  assert.equal(await isValidSession(changed, good), false);
});

test("too many attempts are slowed down", async () => {
  const env = makeEnv({ LOGIN_LIMITER: { limit: async () => ({ success: false }) } });
  const res = await worker.fetch(postLogin({ password: "test-password" }), env);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Set-Cookie"), null);
});

test("logout clears the cookie", async () => {
  const res = await worker.fetch(get("/logout"), makeEnv());
  assert.match(res.headers.get("Set-Cookie"), /Max-Age=0/);
});

test("next=/logout or /login falls back to the home page", async () => {
  assert.equal(safeNext("/logout"), "/");
  assert.equal(safeNext("/login?next=/x"), "/");
});

test("cross-site login without an Origin header is refused", async () => {
  const res = await worker.fetch(
    postLogin({ password: "test-password" }, { "Sec-Fetch-Site": "cross-site" }),
    makeEnv(),
  );
  assert.equal(res.status, 403);
});

test("missing files are not cached", async () => {
  const env = makeEnv({
    ASSETS: { fetch: async () => new Response("Not found", { status: 404, headers: { "Content-Type": "image/jpeg" } }) },
  });
  const res = await worker.fetch(get("/ss-6-12/missing.jpg", { Cookie: await signedInCookie(env) }), env);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get("Cache-Control"), "no-store");
});

test("plain http is sent to https", async () => {
  const res = await worker.fetch(new Request("http://app.goldenbead.org/ss-6-12/"), makeEnv());
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("Location"), "https://app.goldenbead.org/ss-6-12/");
});

test("referrer policy keeps the Origin header on the login form", async () => {
  const res = await worker.fetch(get("/login"), makeEnv());
  assert.equal(res.headers.get("Referrer-Policy"), "same-origin");
});
