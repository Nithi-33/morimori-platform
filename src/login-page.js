// Bilingual (Thai + English) login page. No images, no outside fonts or scripts.

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

const MESSAGES = {
  wrong: "รหัสผ่านไม่ถูกต้อง ลองอีกครั้ง · Wrong password, please try again.",
  slow: "ลองหลายครั้งเกินไป รอ 1 นาทีแล้วลองใหม่ · Too many tries. Wait 1 minute and try again.",
};

export function loginPage({ next = "/", error = "" } = {}) {
  const message = MESSAGES[error] || "";
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>GoldenBead · เข้าสู่ระบบ</title>
<style>
  :root {
    --bg: #fbf8f1;
    --card: #ffffff;
    --text: #2b2418;
    --muted: #5f5545;
    --border: #e6dcc6;
    --primary: #8a5a00;
    --on-primary: #ffffff;
    --error: #b42318;
    --ring: #c58b12;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1c1810;
      --card: #262017;
      --text: #f5eedf;
      --muted: #cbbfa6;
      --border: #4a3f2c;
      --primary: #e0a93a;
      --on-primary: #1c1810;
      --error: #ff8a80;
      --ring: #e0a93a;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    background: var(--bg);
    color: var(--text);
    font-family: "Sarabun", "Noto Sans Thai", "Leelawadee UI", "Thonburi", system-ui, -apple-system, "Segoe UI", sans-serif;
    font-size: 17px;
    line-height: 1.6;
  }
  main {
    width: 100%;
    max-width: 400px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px 24px;
  }
  .brand {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--primary);
  }
  h1 { margin: 0 0 4px; font-size: 24px; line-height: 1.3; }
  .sub { margin: 0 0 24px; color: var(--muted); font-size: 15px; }
  label { display: block; font-weight: 600; margin-bottom: 8px; }
  .field { display: flex; gap: 8px; }
  input[type="password"], input[type="text"] {
    flex: 1;
    min-width: 0;
    min-height: 48px;
    padding: 10px 14px;
    font: inherit;
    color: var(--text);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
  }
  button {
    min-height: 48px;
    font: inherit;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: opacity 200ms ease;
  }
  button:hover { opacity: 0.9; }
  .toggle {
    padding: 0 14px;
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border);
    font-size: 15px;
  }
  .submit {
    width: 100%;
    margin-top: 20px;
    background: var(--primary);
    color: var(--on-primary);
    border: none;
  }
  input:focus-visible, button:focus-visible { outline: 3px solid var(--ring); outline-offset: 2px; }
  .error { margin: 12px 0 0; color: var(--error); font-size: 15px; }
  .note { margin: 24px 0 0; color: var(--muted); font-size: 14px; }
  @media (prefers-reduced-motion: reduce) { button { transition: none; } }
</style>
</head>
<body>
<main>
  <p class="brand">GoldenBead</p>
  <h1>Scope &amp; Sequence 6–12</h1>
  <p class="sub">สำหรับครูเท่านั้น · Teachers only</p>
  <form method="post" action="/login">
    <input type="hidden" name="next" value="${escapeHtml(next)}">
    <label for="password">รหัสผ่าน · Password</label>
    <div class="field">
      <input id="password" name="password" type="password" autocomplete="current-password" required autofocus${message ? ' aria-invalid="true" aria-describedby="error"' : ""}>
      <button type="button" class="toggle" id="toggle" aria-controls="password" aria-pressed="false">แสดง · Show</button>
    </div>
    ${message ? `<p class="error" id="error" role="alert">${message}</p>` : ""}
    <button type="submit" class="submit">เข้าสู่ระบบ · Sign in</button>
  </form>
  <p class="note">ลืมรหัสผ่าน ถามคุณ Knight · Forgot the password? Ask Knight.</p>
</main>
<script>
  (function () {
    var input = document.getElementById("password");
    var toggle = document.getElementById("toggle");
    toggle.addEventListener("click", function () {
      var show = input.type === "password";
      input.type = show ? "text" : "password";
      toggle.setAttribute("aria-pressed", String(show));
      toggle.textContent = show ? "ซ่อน · Hide" : "แสดง · Show";
    });
  })();
</script>
</body>
</html>`;
}
