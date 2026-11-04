# GoldenBead

Montessori school platform, starting at Mori Mori Montessori. The full plan is in [PLAN.md](PLAN.md).

**Phase 0 (now):** Scope & Sequence 6-12 for teachers at `https://app.morimorimontessori.com`, behind one shared password. Runs on Cloudflare Workers. There is no student data in Phase 0.

## How it works

- Every request, including each image, goes through the login check in `src/index.js` first.
- The password and the cookie-signing key are Cloudflare secrets. They are never written in this repo.
- If either secret is missing, the site shows "Not configured yet." and serves nothing.
- After signing in, a teacher stays signed in for 30 days. Changing the password signs everyone out.
- More than 10 login tries a minute from one place is slowed down.
- The Scope & Sequence files (`public/ss-6-12/`) are AMI album material. They are not in git; they are copied in from Knight's computer before each deploy.

## Test

```
npm install
npm test
```

## Deploy (Knight, on the Mac, in Terminal)

You need Node.js (LTS) installed once, from nodejs.org.

1. Get the code:
   ```
   git clone https://github.com/Nithi-33/morimori-platform
   cd morimori-platform
   npm install
   ```
2. Copy the Scope & Sequence files in. The five zips unzip to a folder called `ss-6-12`:
   ```
   cd public
   for f in ~/path/to/website-uploads/ss-6-12-part*.zip; do unzip -o "$f"; done
   cd ..
   ls public/ss-6-12/index.html
   ```
   The last line must print the file name. If it says "No such file", stop and tell Claude.
3. Sign in to Cloudflare (a browser window opens):
   ```
   npx wrangler login
   ```
4. Put the site online. Until step 5 it only shows "Not configured yet.":
   ```
   npx wrangler deploy
   ```
5. Set the two secrets:
   ```
   npx wrangler secret put SITE_PASSWORD
   ```
   Type the teacher password when asked. Then:
   ```
   openssl rand -hex 32 | npx wrangler secret put SESSION_SECRET
   ```
6. Open `https://app.morimorimontessori.com` on your phone, sign in, and check that a few work cards and images open.
7. Sign out of Cloudflare on the Mac so no login stays stored there:
   ```
   npx wrangler logout
   ```

To change the password later: repeat steps 3, 5 (only `SITE_PASSWORD`) and 7.

## Limits to watch

- Cloudflare's free plan allows 100,000 requests a day, and every image counts. 15 teachers should stay well under this. If the site ever stops working late in the day, move to the $5 a month Workers plan.
- Free plan file limit: 20,000 files per site. Scope & Sequence uses about 6,900.
