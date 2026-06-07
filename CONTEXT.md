# Summer Reading 2026 — Project Context

## About This Project

Adelaide (age 11, Clarksburg, MD) is hosting a Summer Reading Club for her friends.
Her mom Jojo manages the app and coordinates the group.

The premise: each girl picks her own books, logs her progress, earns individual prizes at three levels, and works toward group celebrations together.

---

## Adelaide & Jojo

- **Adelaide** — age 11, Clarksburg, MD, shoe size 4 (Madmia Kids & Adults)
- **Jojo** — Adelaide's mom, manages the app, coordinates prizes and events with parents via WhatsApp group, organizes FCPL destination visits (other parents welcome to organize too)

---

## Club Dates

**June 1 – September 4, 2026**

Girls may add books to their reading list at any time, but only books with a finish date between June 1 and September 4 count toward prizes and group goals.

Full overlap with all three official programs: **June 13 – August 16** (MCPL opens Jun 13, FCPL closes Aug 16).

---

## The Group Challenge

### Individual Goals
Each girl earns prizes at her own pace. Each girl picks her own prize wishes in the app (editable anytime) and confirms them with her parent.

| Level | Books | Prize |
|---|---|---|
| Level 1 | 5 | Girl's choice — set in app |
| Level 2 | 10 | Girl's choice — set in app |
| Level 3 | 15 | Girl's choice — set in app |

### Group Goals (unlocked when EVERY girl reaches the threshold)

| Books (each) | Event |
|---|---|
| 12 | Pool Party |
| 20 | Arcade Day at Round 1 |

Jojo coordinates details and costs with parents via WhatsApp when each milestone is reached. For Arcade Day, each parent decides how much to give their daughter to spend. Parent contributions are only collected if the whole group makes it.

---

## Parent Agreement

When parents join the group, they agree to:
1. Purchase their daughter's chosen prizes when she hits Level 1 (5 books), Level 2 (10 books), and Level 3 (15 books). Girls pick prize wishes in the app and can update them anytime — confirm choices with your daughter directly.
2. Coordinate with Jojo for the Pool Party when every girl reads 12 books.
3. Coordinate with Jojo for Arcade Day at Round 1 when every girl reads 20 books — each parent decides their daughter's spending amount.
4. Join the parent WhatsApp group for updates and coordination.

---

## WhatsApp Group

Parent coordination happens in a WhatsApp group. Join link: https://chat.whatsapp.com/GduClXIfuiGJlUzXUmcQD2?mode=gi_t

---

## Optional: Official Summer Reading Programs

These run alongside the group challenge. The same books count toward all of them.
Parents manage sign-ups and logging independently.

### MCPL — Montgomery County Public Libraries
- **Sign up:** https://www.montgomerycountymd.gov/montgomery-county-public-libraries/events-programs-library/participate-program-library/summer-reading-challenge
- **Dates:** June 13 – August 21, 2026
- **Prizes:**
  - 3 weeks of reading → Washington Nationals game voucher for two + ice cream coupon
  - 6 weeks of reading → Free book from Friends of the Library + raffle entry
  - Free book just for signing up (ages 0–18)

### White House Summer Reading Challenge (Usha Vance)
- **Sign up:** https://whitehouse.gov/read
- **Dates:** June 1 – September 4, 2026
- **Goal:** Read 12 books of any choice
- **Submission deadline:** September 5, 2026
- **Prizes:** Personalized certificate, small prize, raffle entry for White House visit
- **Eligibility:** K–8, must have USPS-verified US address
- **Note:** Log start AND finish date for each book (required for submission)

### FCPL — Frederick County Public Libraries
- **Sign up:** https://www.fcpl.org/participate/summer-challenge
- **Dates:** June 1 – August 16, 2026
- **Goal:** Read at least 20 days AND visit community destinations around Frederick County
- **Raffle tickets:** One per reading day + one per destination visited
- **Prize drawings:**
  - July 16: Monthly drawing (tickets due July 15)
  - August 16: Grand prize drawing (tickets due August 15)
- **Grand prizes:** American Girl Doll of the Year 2026 (Raquel Reyes), LEGO Toy Story Train Set, Chromebook, Yourigami Kids Play Fort
- **Destinations:** https://fcpl.org/participate/summer-challenge/summer-challenge-destinations
- **Jojo organizes group destination visits** — other parents are welcome to organize too

---

## Key Dates

| Date | Action | Program |
|------|--------|---------|
| June 1 | Reading Club begins — books finished from this date count | Club |
| June 13 | MCPL begins · Kickoff at Damascus Rec Center, 11am–2pm | MCPL |
| July 15 | FCPL ticket submission deadline (drawing July 16) | FCPL |
| August 15 | FCPL final ticket deadline (grand prize drawing Aug 16) | FCPL |
| August 21 | MCPL challenge ends | MCPL |
| September 4 | Reading Club ends · White House challenge ends | Club / White House |
| September 5 | Submit reading log at whitehouse.gov/read | White House |

---

## The App

**Live URL:** https://summerproject-teal.vercel.app
**GitHub:** https://github.com/zdongmc/summer2026
**Stack:** Next.js 15 + Neon (Postgres) + Vercel
**Auth:** PIN-based login per reader; admin PIN for Jojo via env var `ADMIN_PIN`

### Pages
- `/` — Parent guide / landing page (public); includes Gantt-style program timeline SVG showing overlap of all four programs
- `/login` — PIN login for girls
- `/join` — Self-registration via invite code (girls pick name, PIN, color, prize wishes; avatar set later in Profile)
- `/dashboard` — Group progress: individual cards, group milestone cards, reviews feed, destination wish list, places visited (authenticated)
- `/my-books` — My Activity: **Progress · Bookshelf · Reading List · Places** tabs (authenticated)
- `/profile` — Edit color, avatar, prize wishes (authenticated)
- `/tracker` — Standalone printable tracker (SVG bookshelf + reading day circles + places visited); accessed via "Open printable tracker →" link on the Progress tab
- `/recommendations` — All reviews from the group (authenticated)
- `/setup` — Jojo's admin panel (authenticated by admin PIN)

### My Activity Tabs (in order)
1. **Progress** (default) — hero stats (books / reading days / places), prize progress bars (turns amber when reached), 20 reading day circles, recent reads, places visited chips, link to printable tracker
2. **Bookshelf** — all finished books; ✎ edit and × delete per book; `@name` mentions highlighted in reviews
3. **Reading List** — TBR / currently reading items
4. **Places** — FCPL destination visits; log new visits, star wish-list destinations

### App Features
- Log finished books with title, author, cover (barcode scan or manual), start/finish date, rating, review
- Edit or delete logged books (✎ pencil button opens edit form; × removes the book)
- `@name` mentions in reviews: autocomplete dropdown appears when typing `@`; highlighted on dashboard and recommendations
- Emoji reactions (❤️ 😂 😮 👏 🔥) on reviews
- Reading list / TBR with "currently reading" status
- Log reading days (today or past days); delete logged days with × chips on the reading day strip
- FCPL destination visits: log visits, star wish-list destinations
- Printable color-in tracker SVG at `/tracker` (bookshelf + reading day circles + places visited)
- Avatar picker (24 emoji options) — set in Profile after joining
- Color scheme picker (9 options: forest, violet, sunshine, rose, sky, navy, lime, orange, pink)

### Setup Panel (Jojo only)
- Initialize / migrate database
- Generate invite codes for self-registration
- Add readers manually
- View current readers with prize wishes, book counts, and PIN reset
- Milestone alerts: fires when girls hit 5, 10, or 15 books; group alerts at 12 and 20
- Destination wish lists: all starred destinations sorted by most-wanted
- Log group destination visits (select destination + date + which girls were present)

### Environment Variables
- `DATABASE_URL` — Neon Postgres connection string
- `JWT_SECRET` — Secret for session tokens
- `ADMIN_PIN` — Jojo's admin PIN

### Database Tables
- `readers` — name, pin_hash, color, avatar, prize_5/10/15 + statuses
- `books` — title, author, cover_url, started_date, finished_date, rating, review
- `reading_days` — one row per reader per day
- `reading_list` — TBR / currently reading entries
- `destinations` — logged visits (reader, place, date)
- `destination_wishes` — starred destinations per reader
- `reactions` — emoji reactions on books
- `invite_codes` — single-use registration codes

---

## Files in This Project

| File | Description |
|------|-------------|
| `CONTEXT.md` | This file — full project context |
| `app/` | Next.js app source |
| `lib/milestones.ts` | Individual (Level 1/2/3) and group milestone definitions |
| `lib/colors.ts` | Reader color schemes |
| `lib/avatars.ts` | Avatar emoji list |
| `lib/destinations.ts` | FCPL destination list grouped by region |
| `lib/db.ts` | Neon database connection |
| `lib/auth.ts` | JWT session management |
