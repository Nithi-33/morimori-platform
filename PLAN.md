# Mori Mori Montessori school platform: plan

> **DRAFT v2 – Knight answered the 8 questions on 28 Oct 2026. A few follow-up questions are still open (see the end).**
> No app code until Knight approves the final plan.

## Goal

One bilingual (Thai + English) app for Montessori record keeping, photos, attendance and parent messages. It replaces Transparent Classroom and Seesaw at Mori Mori. Later, other schools can use it too.

Address: `school.morimorimontessori.com` (name to be decided).

It shares **nothing except the domain** with `dashboard.morimorimontessori.com` (Dad's trading page): no shared login, keys, database, photo storage, repo or Cloudflare API token. It never goes into the binance-trader repo.

## Knight's answers (28 Oct 2026)

1. **Size:** 75 children now, about 100 in 3 years. Five classrooms: three 3-6, one toddler, one 6-12.
2. **Users in year one:** about 15 staff and 100 parents.
3. **Language:** screens and reports in both Thai and English.
4. **Transparent Classroom:** used today by Knight (admin and teacher). Main problem: uploading photos takes too many clicks. Teachers want it to work like Instagram: open, take a photo, post. They also want the app to suggest the work and the children's names.
5. **Seesaw:** today it is used only for announcements and direct messages to parents. Put both into the new platform.
6. **Fees:** no official invoices needed, but simple fee tracking (who paid, who has not) is wanted. Platform fee: at first, friends' schools use it free. Later about 10 baht per child per month, charged to the school (not to parents).
7. **Attendance:** teachers check children in, ideally by tapping each child's photo (face scan was also asked about; see below). No report to สช. needed.
8. **Budget:** the cheapest hosting. Nobody named yet for fixing problems.

## Design decisions that follow

### Fast photo posting (the main reason to switch)

- The app installs on the teacher's phone home screen (web app, no App Store needed).
- One screen: tap the camera, take one or more photos, pick the work and the children, post. Aim: 3 taps for a normal post.
- Photos are shrunk on the phone before upload, so it is fast on school Wi-Fi and storage stays cheap.
- **Work suggestions:** from that child's current lessons (presented / practising), and from what the teacher tagged recently.
- **Child suggestions without face recognition:** children checked in today, in that classroom, who had that work presented recently. The teacher taps to confirm.
- Optional later: an AI service reads the *material* in the photo (for example "Pink Tower") to suggest the work. This sends children's photos to an outside company, often abroad, so it needs a line in the consent form and Knight's OK. Not in the first version.

### No face recognition

Not for photo tagging and not for attendance. A face scan is biometric data, which is sensitive data under PDPA. For children it needs explicit parent consent, careful security and a strong reason, and a leak would be very serious. Tapping the child's photo is almost as fast and carries none of this risk.

28 Oct 2026: Knight noted that parents already consent at enrolment to their children's faces being used in online advertising. That consent covers publishing photos. It does not cover biometric face matching, which needs its own explicit consent for that purpose. Face matching also works poorly in a Montessori room: children's faces change fast, and photos are often taken from above, at an angle, or show only hands on the material. Decision for version 1: no face recognition; use the smart suggestions instead. This can be revisited later only as a separate opt-in trial.

### Face check-in at the gate (decided 28 Oct 2026, opt-in)

Knight wants face check-in: it is now common in Thai schools, and parents get a message when their child arrives. Decision:

- **Version 1:** teachers tap the child's photo to check in. Parents get a phone notification.
- **Later phase:** a face-scan terminal at the gate (for example ZKTeco, which can push check-ins to a server). The face data stays on the device in the school. The app receives only "child X arrived at 07:52" and notifies the parents.
- **Separate consent form:** explicit consent for face check-in (biometric data). Children without that consent are checked in by tap.
- Face matching is still **not** used to tag classroom photos (it works poorly with photos taken from above or at an angle).
- To test before buying a device: the device must work with our server and be set so face data is never uploaded.

### Saving photos to the parent's phone

Transparent Classroom downloads land in Files on iPhone, not in Photos. Fix: parents tick the photos they want and tap "Save to phone". This opens the phone's share sheet, then "Save Images" puts them in Photos (iPhone) or Gallery (Android). Two taps; a website can't save straight into Photos without the share sheet.

### Messages (replaces Seesaw)

- Announcements to the whole school, one classroom, or chosen families.
- Direct messages between staff and a family, with "seen" status.
- Notifications on the phone when the app is installed (free web push).

### Several schools (from the fee answer)

- Every record belongs to a school, built in from day one. This is cheap now and expensive to add later.
- Launch with Mori Mori only. Add a friend's school after the app has worked well for one term.
- When another school uses it, that school owns its data (data controller) and Knight's platform processes it for them (data processor). A short data processing agreement is needed with each school (have the PDPA lawyer check it once).
- One school must never see another school's data. This gets tested before the second school joins.

## Children's data (PDPA)

Not legal advice. A Thai PDPA lawyer should check the final consent form, privacy notice and the school agreement once.

- **Consent:** for children under 10, consent must come from a parent. Ages 10-20 (some 6-12 children may reach 10) fall under a different rule; check.
- **Running the school** (enrolment, attendance, records) is covered by the contract with the family.
- **Photos:** separate opt-in consent, which parents can withdraw, for photos on the website, Facebook or ads, and for photos shared with other families.
- **Group photos:** children are tagged; a family sees a photo only if every tagged child has consent.
- **Health data** (allergies, medical notes, disabilities) is sensitive: explicit consent; only admin and that child's guide see it. Don't collect religion or ethnicity unless needed.
- **Never face recognition.**
- **Access control:** roles admin / guide / assistant / parent. Guides see only their classroom; parents only their own children. Staff log in with Google plus 2-step verification. Every view, export and deletion is logged.
- **Data location:** Cloudflare has no Thailand region. Follow the PDPC cross-border rules (in force since 24 Mar 2024), rely on Cloudflare's data-protection agreement, state the transfer in the privacy notice.
- **Retention (proposal):** records while enrolled. When a child leaves, the family gets a download, photos are deleted after 1 year, progress reports kept as long as needed (to check), invoices 5 years.
- **Breach:** tell the PDPC within 72 hours unless there is no risk; tell families if the risk is high. One-page breach plan before launch.
- **Parents' rights:** export or correct a child's record on request.
- **Privacy notice** in Thai and English at enrolment.

## Cost (cheapest option)

| Item | Cost |
|---|---|
| Cloudflare Workers + D1 database | Free plan at the start; $5/month (about 170 baht) once usage grows |
| Photo storage (R2) | First 10 GB free, then about $0.015 per GB per month |
| Staff and parent login | Built into the app (Google sign-in or an email link): free |
| Phone notifications | Web push: free |
| Domain | Already owned |

Rough photo estimate: 15 staff × about 30 photos a day, shrunk to about 300 KB each, is roughly 2-3 GB a year. Expected total: **0-200 baht a month** for Mori Mori.

For comparison, Transparent Classroom for 75 children is about $112 a month (about 3,700 baht) at the listed $1.50 per child. (Prices to re-check.)

At 10 baht per child, a school with 100 children would pay 1,000 baht a month, which covers hosting many times over.

**Upkeep:** Claude builds and fixes it, and Knight approves changes. Real risk: if something breaks during the school day, someone must be able to switch back. Plan: keep Transparent Classroom running in parallel for the first term, plus the weekly backup to the school Synology.

## Phases

- **Phase 1 – Core + photos (staff only):** schools, classrooms, children, families, staff login; bulk import (create a classroom, upload an Excel / Google Sheet / CSV of children and parents, check a preview that flags errors, then import; a ready-made template is provided); attendance by tapping photos; fast photo posting with work and child suggestions; AMI 3-6 lesson tracking (presented / practising / mastered); consent flags; audit log. Parents see nothing yet.
- **Phase 2 – Parents (replaces Seesaw):** parent login; announcements and direct messages; parents see their own child's photos (with consent rules); bilingual progress reports (PDF or Word).
- **Phase 3 – Toddler and 6-12:** toddler and 6-12 lesson lists; move old records from Transparent Classroom (check what its export gives); stop using Transparent Classroom after a full term without problems.
- **Phase 3b – Fees and face check-in:** fee list per child per term, PromptPay QR on the bill, mark as paid, reminder to unpaid families, a list of who has not paid (simple receipts, not tax invoices); face-scan terminal at the gate with opt-in consent.
- **Phase 4 – Other schools:** schools interested so far include Bamboo School, Mami Playhouse, a Khon Kaen international school and others (names to confirm). Start with one pilot school; onboarding, school agreement, separate-data tests, then the 10-baht billing.

## Hosting choice (compared 28 Oct 2026, prices to re-check)

| Option | Monthly cost | Who keeps it secure | Notes |
|---|---|---|---|
| **Cloudflare** (Workers + D1 + R2) | 0-170 baht | Cloudflare patches the servers | No charge for photo downloads; no server to update |
| AWS (Lightsail $5 server + S3 photos) | about 170 baht + photo download fees | We patch the server | Downloads cost money after the free amount |
| Cheap VPS (Hetzner, DigitalOcean, Vultr; $4-6) | 120-200 baht | We patch the server | Cheapest raw server; all security, backups and updates are on us |

**Decision: Cloudflare for the school app.** It costs about the same as the others, but there is no server for us to patch, which matters most with children's data.

**Trading bot fixed IP:** not on this platform. The trading bot gets its own small server with a fixed IP (for example AWS Lightsail with a static IP, about $5 a month), in a separate project. The school app and the trading bot must never share a server: if one is broken into, the other must stay safe.

## Stack

- **App:** its own Cloudflare Worker on its own subdomain; installable web app for phones.
- **Database:** D1 (30-day recovery), weekly encrypted backup to the school Synology (a copy in Thailand).
- **Photos:** private R2 bucket, shown only through short-lived links.
- **Login:** built into the app (staff: Google with 2-step verification; parents: Google or email link). Cloudflare Access is no longer used, because its free plan stops at 50 users and other schools' staff would go over that.
- **Separate keys:** its own Cloudflare API token, limited to this app's resources.
- **Nothing in KV** until the iMac upload token's KV scope is checked (it may be account-wide).
- **Cookie check:** confirm the dashboard's login cookie is limited to `dashboard.` so it is never sent to the school app.

## Working rules

- Knight creates all accounts, signs in and handles credentials. Claude never does.
- Re-check prices and legal rules before this plan is marked final.

## Still open

1. Student list: is it in Excel or Google Sheets, and which columns?
2. Repo: Knight to confirm in this chat so the plan can be saved to Nithi-33/morimori-platform.
3. Knight to approve this plan as final.

## Sources (re-check before final)

- transparentclassroom.com/pricing
- onespotapps.com/pricing
- Cloudflare Workers, D1 and R2 pricing pages
- Tilleke & Gibbins: PDPA consent guidelines; PDPC breach notification articles
- LawPlus: PDPA cross-border transfer newsletter (2024)
- Cloudflare R2 data-location docs
