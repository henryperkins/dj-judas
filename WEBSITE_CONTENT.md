# DJ Lee & Voices of Judah — Public Website Content

This document captures every piece of publicly readable copy from the website
(the marketing site and unauthenticated SPA routes). Admin-only pages
(`/admin/*`) are intentionally excluded because they sit behind authentication.

Sources extracted: `index.html`, `src/react-app/**`, `public/content/**`.

---

## 1. Site Metadata (HTML head)

- **Page title:** DJ Lee & Voices of Judah - Gospel Music Ministry | Book Live Performances
- **Meta description:** DJ Lee & Voices of Judah — A gospel music ministry bringing uplifting worship through powerful vocals and live performances. Book us for services, concerts, and special events.
- **Keywords:** gospel music, DJ Lee, Voices of Judah, worship music, Christian music, live performances, gospel concerts, church events, wedding music, funeral music
- **Author:** DJ Lee & Voices of Judah
- **Robots:** index, follow
- **Canonical:** https://djlee-voj.com
- **Theme color:** `#9d174d` (light) / `#d7427d` (dark)
- **RSS / Calendar feed:** `/events.ics` ("DJ Lee & Voices of Judah Events")

### Open Graph

- **og:title:** DJ Lee & Voices of Judah - Gospel Music Ministry
- **og:description:** Experience powerful gospel music and worship. Book DJ Lee & Voices of Judah for your church service, wedding, or special event. Listen to our latest releases on all platforms.
- **og:image:** `/images/og-image.jpg` (alt: "DJ Lee & Voices of Judah performing live")
- **og:site_name:** DJ Lee & Voices of Judah
- **og:locale:** en_US

### Twitter Card

- **Title:** DJ Lee & Voices of Judah - Gospel Music Ministry
- **Description:** Experience powerful gospel music and worship. Book us for your church service, wedding, or special event.
- **Image alt:** DJ Lee & Voices of Judah performing live

---

## 2. Initial Hero (server-rendered before React mounts)

> **DJ Lee & Voices of Judah**
>
> High-energy gospel DJ and vocal ensemble for weddings, reunions, and ministry events.
>
> [Book Us] [Listen]

Skip-to-content link: **"Skip to content"**

---

## 3. Hero Section (React, primary landing hero)

- **Logo alt text:** DJ Lee & Voices of Judah
- **H1:** DJ Lee & Voices of Judah
- **Subtitle:** High-energy gospel DJ and vocal ensemble for weddings, reunions, and ministry events.
- **CTAs:** "Book Us" (navigates to `/book`), "Listen" (anchor to `#media`)
- **Scroll indicator:** down-chevron icon

---

## 4. Stats Section

Four key statistics displayed under the hero/events:

| Icon | Value | Label |
|------|-------|-------|
| Calendar | **16+** | Years performing |
| Music | **3** (count of tracks) | Singles released |
| Users | **1.6K+** | Facebook followers |
| Award | Latest release month/year (e.g. *Jan 2025*) | Latest release |

---

## 5. About Us Section

**Heading:** About Us

> DJ Lee & The Voices of Judah was established in 2012 in Gary, Indiana, when
> D.J. Lee was given the opportunity to form a gospel choir within his high
> school. What started as a school choir has grown into a powerful gospel music
> ministry that has been touching lives for over 16 years.
>
> Based in Gary, Indiana, our mission is to inspire, encourage, and bring hope
> through gospel music that speaks to the heart and soul. From traditional hymns
> to contemporary gospel, we deliver a worship experience that brings people
> closer to God. Our music, including hits like "I Love to Praise Him" and
> "King's Motorcade," continues to reach audiences across the nation.

**Image alt:** DJ Lee at the piano

---

## 6. Services Section

**Heading:** Our Services

| Title | Description |
|-------|-------------|
| **Church Services** | Anointed worship ministry for Sunday services, revivals, and special church events throughout Northwest Indiana |
| **Gospel Concerts & Festivals** | Dynamic performances for gospel concerts, community festivals, and Christian conferences |
| **Youth Choir Training** | Mentoring and developing young voices in gospel music through workshops and masterclasses |
| **Special Occasions** | Ministry through music for weddings, funerals, anniversaries, and milestone celebrations |

---

## 7. Creator Media Panel (Listen / Watch / Social / Share)

- **Artist:** DJ Lee & The Voices of Judah
- **Tagline:** Gospel Ministry from Gary, Indiana • Established 2008

### Tabs

- **Listen** — "Choose your streaming platform"
- **Watch** — Facebook Watch, Facebook Live, Facebook Page
- **Social** — Instagram, Quick Links, Universal Embed (TikTok/YouTube/X/LinkedIn and more)
- **Share** — Share manager

### Section labels & hints

| Section | Hint |
|---------|------|
| Listen | Choose your streaming platform |
| Facebook Watch | On-demand videos |
| Facebook Live | Live broadcasts (public) |
| Facebook Page | Timeline embed |
| Instagram | Latest posts and reels |
| Quick Links | Open profiles |
| Universal Embed | TikTok, YouTube, X, LinkedIn and more |

### Empty / fallback copy

- "Add a Spotify URL to play here."
- "Add an Apple Music link to play here."
- "Provide a Facebook Watch video URL."
- "Provide a Facebook Live URL."
- "Provide a Facebook Page URL."
- "Provide a public Instagram post/reel URL."
- "Provide any supported social post URL (e.g., TikTok/YouTube/Twitter)."

### Listen tabs (Spotify / Apple Music)

- **Open in Spotify** (link to artist page)
- **Open in Apple Music** (link to artist page)
- Mini player labels: "Now Playing", "Spotify" / "Apple Music"
- Tab buttons: "Spotify", "Apple Music"

### Spotify embed extras

- "Loading Spotify player..."
- "Stream on Spotify to support the artist"

### Apple Music embed extras

- "Loading Apple Music player..."
- "Tap to listen"
- "Add to Library" (button)
- "Connect Apple Music" (authorize button)
- "Open in Apple Music"
- "Not an Apple Music subscriber?"
- "Stream or purchase to support the artist"
- Offline banner: "You're offline. Some features unavailable."

### Instagram mobile feed extras

- Header pill: "Instagram"
- "View Profile" link
- Pull-to-refresh: "Pull to refresh" / "Release to refresh" / "Refreshing..."
- Discovery sheet: "Discover the music from these posts" with buttons "Listen on Spotify" and "Listen on Apple Music"
- States: "Loading...", "Preview unavailable", "Failed to load post"
- "🎵 Discover the music from these posts" (desktop embed)

### Facebook embed footer text

- "🎵 Stream our music catalog"

### Facebook Events fallback

- "Loading events..."
- "No upcoming events"

---

## 8. Social Section ("Latest Updates")

- **Heading:** Latest Updates
- **Subtitle:** Follow our journey on social media
- **Fallback title:** Instagram updates are available off-site.
- **Fallback description:** Follow the ministry for new photos, reels, and announcements.
- **CTA button:** "Follow on Instagram" (opens `https://www.instagram.com/iam_djlee`)

### Dynamic feed UI

- Loading state: "Loading social feed..."
- Refresh overlay: "Updating…"
- Section header: "Latest from Social", "Refresh"
- Per-post badges: "instagram" / "facebook", "Shop" (shoppable badge)
- Caption preview action: "View post"
- Lightbox header: "Latest from {platform}", link "View on {platform}"
- Errors: "Unable to load social feed"

---

## 9. Photo Gallery Section

- **Heading:** Photo Gallery
- **Category filter chips:** All, plus all categories in the data
  (currently: `worship`, `youth choir`, `community`, `recording`)
- **Lightbox controls:** Close, Previous photo, Next photo, photo counter `n / total`

### Local gallery photos (default content)

| Caption | Category |
|---------|----------|
| Voices of Judah leading an outdoor worship set in Gary, Indiana. | worship |
| Smiling choir members fellowship together after Thursday rehearsal. | community |
| Sunday morning praise team ministering on the sanctuary stage. | worship |
| Northwest Indiana youth choir clinic focused on harmony work. | youth choir |
| Musicians backing Voices of Judah during a live recording session. | recording |
| Choir director guiding vocalists through a dynamic rehearsal moment. | worship |
| Unified moment of worship during the regional praise night. | worship |
| Volunteers serving meals during a Gary community outreach event. | community |
| Voices of Judah posing with supporters after a community concert. | community |
| Entire Voices of Judah ministry team gathered for a portrait. | community |

### Static fallback gallery (`public/content/gallery.json`)

| # | Caption | Category |
|---|---------|----------|
| 1 | Gary Gospel Fest 2024 - Main Stage Performance | worship |
| 2 | Thursday Night Rehearsal at Greater Faith Community | worship |
| 3 | Gary Community Outreach - Feeding the Homeless | community |
| 4 | Recording "I Love to Praise Him" at Chicago Studios | recording |
| 5 | Sunday Worship Service - Victory Temple Church | worship |
| 6 | Northwest Indiana Youth Choir Workshop 2024 | youth choir |

---

## 10. Featured Products (Merch & Music)

- **Heading:** Merch & Music
- Per-card actions: "View All", "Add to cart"
- (Products themselves come live from the Medusa storefront.)

---

## 11. Booking CTA Section (landing page)

- **Heading:** Book Us
- **Subtitle:** Quick form • 24hr response
- **Button:** "Start Booking" (navigates to `/book`)

---

## 12. Footer

- **Brand:** DJ Lee & Voices of Judah
- **Tagline:** Gospel Ministry • Est. 2008
- **Nav links:** About, Media, Services, Book, Admin
- **Copyright:** © {current year} DJ Lee & VOJ

---

## 13. Mobile Bottom Navigation

Items (icon + label):

| Icon | Label | Target |
|------|-------|--------|
| House | Home | `#home` |
| Music | Listen | Opens platform launcher |
| Calendar | Events | `#events` |
| Users | Social | `#social` |
| Shopping cart | Shop | `/products` |
| Ticket | Book | `/book` |

---

## 14. Platform Launcher (FAB / inline)

- **Inline heading:** Connect & Listen
- **Modal heading:** Choose Your Platform
- **Per-platform label format:** "Listen on Spotify", "Listen on Apple Music", "Follow on Facebook", "Follow on Instagram"
- **Close labels:** "Close platform menu", "Open platform menu"
- Tooltips show platform names ("Spotify", "Apple Music", "Facebook", "Instagram")

---

## 15. Theme Toggle

- Aria label cycles between: "Theme: Light. Click to switch", "Theme: Dark. Click to switch", "Theme: System. Click to switch"
- Screen-reader text: "Switch theme"

---

## 16. Events Section (landing page grid)

- **Heading:** Upcoming Events
- **Past events sub-heading:** Past Events
- **Toggle buttons:** "List", "Calendar"
- **Bulk action:** "Add All Upcoming to Calendar (ICS)"

### Loading / empty / error states

- Loading title: "Loading events..." — "Checking the latest event schedule."
- Empty title: "No upcoming events yet" — "Check back soon for the next date."
- Error title: "Events could not load" — "Please check back soon for the next date."

### Event card actions

- "Tickets"
- "Directions"
- "Add to Google Calendar" / "Add to Apple Calendar" (platform-aware)
- "Share" (Facebook share)
- "Copy Link" / "Copied!"
- "ICS" (download)

### Calendar view weekday headers

Sun, Mon, Tue, Wed, Thu, Fri, Sat

---

## 17. Next Event Banner

- **Pill heading:** Next Event
- **Location fallback:** "Location TBA"
- **Details link:** "View details"
- **Calendar actions:** "Add to Google Calendar" / "Add to Apple Calendar", "Download ICS", "Directions", "Tickets"
- **Share actions:** "Share", "Copy link"
- **Feedback strings:** "Shared", "Sharing failed", "Sharing not supported", "Link copied", "Unable to share", "Event link copied to clipboard", "Unable to copy event link"

---

## 18. Event Details Page (`/events/:slug`)

- **Back link:** ← Back to events
- **Error heading (not found / failure):** "Event unavailable" with body "Event not found." or "Unable to load this event."
- **Section headings:** "About this event", "Event information", "Preview", "Where to find us", "Moments from tour", "Frequently asked questions", "More events"
- **Definition list labels:** Date, Ends, Your time, Venue, Location, Tags
- **Buttons:** Tickets, Directions, Add to Google/Apple Calendar, Download ICS, Share, Copy link / Copied
- **Status / feedback:** "Event link copied to clipboard", "Unable to copy event link"

---

## 19. Event Data (`public/content/events.json`)

### Event 1 — Fall Worship Night

- **Title:** Fall Worship Night
- **Summary:** An intimate evening of worship featuring new arrangements and testimonies from the road in Indianapolis.
- **Description:** Join DJ Lee & The Voices of Judah for an immersive night of praise as we unveil new music and testimonies from this season's ministry tour. Expect a full choir, live band, and special guest psalmists from the Indianapolis region.
- **When:** 2025-10-18, 7:00 PM – 9:30 PM (EDT)
- **Venue:** Calvary Community Church, 4400 N High School Rd, Indianapolis, IN, US
- **Tickets:** https://tickets.djleevoices.com/fall-worship-night
- **RSVP:** https://form.djleevoices.com/fall-worship-night
- **Price:** Advance $25 • At the door $35 — Group bundles available for ministries of 10 or more.
- **Tags:** worship night, choir, indianapolis
- **FAQ:**
  - *Are seats reserved?* — All tickets are general admission. Doors open at 6:00 PM and seating is first come, first served.
  - *Will childcare be provided?* — Yes. A supervised kids worship lab is available for ages 4–10; register during checkout so we can plan volunteers.

### Event 2 — 12th Anniversary Reunion Concert

- **Title:** 12th Anniversary Reunion Concert
- **Summary:** Celebrate 12 years of ministry with a full choir reunion, live band, and special alumni features in Chicago.
- **Description:** We're inviting every past and present member of DJ Lee & The Voices of Judah back to the stage for one unforgettable night of praise. Expect new arrangements of the classics, a live string section, and an extended altar ministry moment.
- **When:** 2026-01-10, 6:00 PM – 9:00 PM (CST)
- **Venue:** House of Hope Chicago, 752 E 114th St, Chicago, IL, US
- **Tickets:** https://tickets.djleevoices.com/reunion-12
- **RSVP:** https://form.djleevoices.com/reunion-12
- **Price:** Early bird $20 • At the door $30 — VIP meet & greet packages include reserved seating and signed merch.
- **Tags:** anniversary, concert, chicago
- **FAQ:**
  - *What time do doors open?* — Doors open at 5:00 PM with a pre-show fellowship lounge. VIP guests may check in starting at 4:30 PM.
  - *Is parking available on site?* — Complimentary parking is available in the main lot. Overflow parking with shuttle service is available from the 115th Street commuter lot.

### Event 3 — New Year Praise Revival

- **Title:** New Year Praise Revival
- **Summary:** Launch 2026 with a high-energy revival night featuring DJ Lee & The Voices of Judah and guest worship leaders from Atlanta.
- **Description:** We're starting the new year with a declaration of victory in Atlanta. Experience prophetic worship, mass choir collaborations, and a midnight communion moment as we dedicate 2026 to the Lord.
- **When:** 2026-01-02, 6:30 PM – 10:30 PM (EST)
- **Venue:** New Life Cathedral, 4025 Welcome All Rd, Atlanta, GA, US
- **Tickets:** https://tickets.djleevoices.com/new-year-praise
- **RSVP:** https://form.djleevoices.com/new-year-praise
- **Price:** General $30 • VIP $55 — VIP includes early entry, reserved front-row seating, and post-service photo opportunity.
- **Tags:** revival, atlanta, worship
- **FAQ:**
  - *Will there be a livestream?* — Yes. A pay-per-view livestream will be available worldwide; details will be emailed to registered guests.
  - *Can youth participate?* — Absolutely. Our youth choir will open the night, and a student discount is available with valid ID.

---

## 20. Music Catalog (`src/react-app/data/tracks.ts`)

| Title | Artist | Release | Spotify | Apple Music |
|-------|--------|---------|---------|-------------|
| **I Love to Praise Him** | DJ Lee & Voices of Judah | 2022-01-01 | `spotify:track:2VTudgmPqyqO9lJ1FMULc7` | https://music.apple.com/us/album/i-love-to-praise-him/1612314848 |
| **Starting Point** | DJ Lee | 2020-01-01 | `spotify:track:4vlipJtap5vgkfhuYXHTzA` | https://music.apple.com/us/album/starting-point-single/1540816225 |
| **Trust in God** | DJ Lee | 2025-01-01 | `spotify:track:3xQZ7uX9vNngNXBgEQWVd7` | https://music.apple.com/us/album/trust-in-god-single/1815332243 |

---

## 21. Testimonials (`src/react-app/data/testimonials.ts`)

### Featured testimonial

> "For over a decade, DJ Lee & Voices of Judah have been a cornerstone of gospel
> music in Northwest Indiana. Their dedication to ministry and excellence in
> worship is unmatched."
>
> — **Bishop William Crawford**, Presiding Bishop, *Greater Faith Community Church*

### Individual testimonials

1. **Pastor Michael Johnson** — Senior Pastor, Gary, IN (Worship Service, 5★)
   > "DJ Lee & Voices of Judah brought such an anointed atmosphere to our church service. Their ministry through music truly touched every heart in the congregation."

2. **Sarah Williams** — Event Coordinator, Chicago, IL (Gospel Concert, 5★)
   > "The choir's performance at our community gospel fest was absolutely phenomenal. They had everyone on their feet praising God!"

3. **Deacon Robert Davis** — Music Ministry Director, Hammond, IN (Church Revival, 5★)
   > "We've been blessed to have DJ Lee & Voices of Judah minister at our annual revival for three years running. They never disappoint!"

4. **Marcus & Angela Thompson** — Newlyweds, Merrillville, IN (Wedding Ceremony, 5★)
   > "Their rendition of 'I Love to Praise Him' during our wedding ceremony was absolutely beautiful. It was exactly what we envisioned for our special day."

5. **Minister Tracey Brooks** — Youth Pastor, East Chicago, IN (Youth Conference, 5★)
   > "The youth were so inspired by their performance and testimony. DJ Lee has a gift for connecting with young people through gospel music."

6. **James Mitchell** — Family Member, Gary, IN (Funeral Service, 5★)
   > "Having them minister at my mother's homegoing service brought such comfort to our family. Their voices truly carried the presence of God."

---

## 22. Social Proof Wall (component copy)

- **Hero label:** Total Reach Across All Platforms
- **Metric cards:** "Total Streams", "Avg Engagement" (24.5%), "Conversion Rate"
- **Per-platform labels:** "Listeners" (music platforms) or "Followers" (social),
  plus "Engagement" and "Growth" metrics, CTA "Connect →"
- **Live ticker:** "Live Activity", with rotating items "Currently Listening",
  "Shares Today", "New Followers"
- **Closing CTA heading:** Join Our Growing Community
  - Subtitle: "Be part of our ministry through music across all platforms"
  - Button: "Listen Now"
- **Trust indicators:** "Active since 2008", "Gary, Indiana", "Growing community"
- **Default totals shown when no live data:** Spotify ~850, Apple Music ~1,200,
  Facebook ~1.6K, Instagram ~2.3K, total streams ~15,000

---

## 23. Booking Page (`/book`)

- **Back button:** ← Back
- **Heading:** Book Us
- **Subtitle:** Share a few details and we'll get back within a day.
- Renders the booking form (see next section).

### Booking Form (`BookingForm`, casual tone on `/book`)

- **Form heading:** Let's plan your event
- **Subtitle:** Tell us a bit about the event. We'll reply within a day.

#### Fields

| Field | Label | Placeholder |
|-------|-------|-------------|
| Name | Name | Your name |
| Email | Email | you@example.com |
| Phone | Phone | Best number to reach you |
| Event type | Event Type | (chips on mobile, dropdown otherwise) |
| Event date | Event Date | — |
| Event time | Event Time | — |
| Location | Where is it? | Venue or address |
| Message | Anything else? | Anything else we should know? |

#### Event type options

Worship Service, Gospel Concert, Wedding Ceremony, Funeral Service,
Conference/Revival, Community Event, Other.

#### Validation messages

- "Name is required"
- "Email is required" / "Invalid email address"
- "Phone number is required"
- "Event date is required"
- "Event time is required" / "Please choose a future time"
- "Location is required"
- Summary header: "There are problems with your submission:"

#### Submission states

- Submit button (casual): **Send** (formal: "Send Booking Request")
- Sending state: "Sending…"
- Server errors:
  - "Email delivery is not configured. Tap below to email us directly."
  - "Too many submissions. Please try again in a minute."
  - "We could not submit your request. Please try again."
  - Network fallback opens `mailto:V.O.J@icloud.com` with: "We could not reach the server. We opened your email client with a prefilled message as a fallback."
  - Alt fallback: "We could not reach the server. Please email V.O.J@icloud.com with your booking details."

#### Success view

- **Heading (casual):** Got it! 🎉 (formal: "Booking Request Sent!")
- **Body:** "Thanks for reaching out. We'll follow up within a day." / "Thank you for your interest in booking DJ Lee & Voices of Judah."
- **Body 2:** "If anything changes, just send us a note." / "We'll review your request and get back to you within 24 hours."
- **Note:** "A copy of your details remains on this device until you clear it."
- **Reset button (casual):** Send Another (formal: "New Booking Request")

---

## 24. Products Page (`/products`)

- **Back button:** ← Back
- **Heading:** Products
- **Loading state:** Loading products...
- **Empty state title:** "No products available"
- **Empty state description:** "Merch and music will appear here when the store is ready."
- **Per-card:** product title, truncated description, price (e.g. "$19.99"), "Add to Cart" button
- **Fallback price:** "Price unavailable"

---

## 25. Checkout Page (`/checkout`)

- **Back button:** ← Back
- **Heading:** Checkout

### Sections

- **Shipping Address** (form fields: Email, First name, Last name, Address, City, Postal code, Country)
  - Save button: "Save address"
- **Shipping Options**
  - Action: "Load options"
  - Calculated price label: "Calculated at checkout"
- **Payment**
  - Buttons: "Pay (Medusa provider)", "Pay with Stripe (Coming Soon)"
- **Order Summary**
  - Rows: Subtotal, Shipping, Discount (if any), Tax, Total
  - "Applied Promotions:" header with "Auto-applied" or promo code, "(automatic)" suffix when applicable
- **Mobile footer:** sticky "Pay Now" button (or "Cart Empty")

### Status messages

- "Set VITE_MEDUSA_URL and VITE_MEDUSA_PUBLISHABLE_KEY to enable cart & shipping."
- "Unable to start checkout. Please refresh and try again."
- "Unable to save address. Please try again."
- "Unable to load shipping options. Please try again."
- "Unable to apply that shipping option. Please try again."
- "Unable to complete order. Please check payment and address details."
- "Stripe payment provider not available. Please use Medusa payment."
- "Stripe payment requires additional setup. Please use Medusa payment for now."
- "An error occurred while setting up payment. Please try again."
- "Cart not found"

---

## 26. Success Page (`/success`)

- **Heading:** Thank you for your order!
- **Body:** "Your order was received and is being processed."
- **Order summary row:** "Order ID" (when present)
- **Buttons:** "Back to home", "Shop more"

---

## 27. Share Manager (component used on landing page)

- **Heading:** Share
- **Primary actions:** Share (native), Copy Link, Open Link, QR Code
- **Success states:** "Shared!", "Copied!"
- **Deep links heading:** "Listen & Follow"
- **Default deep link labels:** "Listen on Spotify", "Listen on Apple Music"

### Share targets (per-platform buttons)

- Facebook
- X
- WhatsApp
- Messenger

Each renders as "Share on {Platform}" button.

---

## 28. Apple Music Badge

- **Aria label / alt:** "Listen on Apple Music"

---

## 29. Public Backend Endpoints (linkable from UI)

These URLs are publicly callable / linkable from the site:

- `/events.ics` — combined ICS feed of upcoming events
- `/events/{slug}.ics` — per-event ICS download
- `/api/events` — public events JSON
- `/api/gallery` — public photo gallery JSON
- `/api/instagram/oembed` — Instagram oEmbed proxy
- `/api/booking` — booking form submission
- `/api/social/feed` — dynamic social feed
- `/api/social/metrics` — Spotify artist metrics
- `/api/apple/developer-token` — Apple MusicKit token
- `/api/facebook/data-deletion` — Facebook data deletion callback (POST)
- `/api/stripe/checkout` — optional Stripe Checkout handoff
- `/api/stripe/webhook` — Stripe webhook (server-to-server)
- `/api/r2/*` — R2 read endpoints with Range support

---

## 30. Contact

- **Booking email (fallback):** V.O.J@icloud.com
- **Primary Facebook page:** https://www.facebook.com/MidWestScreamers/
- **Primary Instagram:** https://www.instagram.com/iam_djlee/
- **Spotify artist:** https://open.spotify.com/artist/5WICYLl8MXvOY2x3mkoSqK
- **Apple Music artist:** https://music.apple.com/us/artist/dj-lee/18270857
- **SoundCloud (default):** https://soundcloud.com/dj-lee-voices-of-judah
- **Location:** Gary, Indiana (Northwest Indiana / Chicagoland)
- **Established:** 2008 (footer / brand) — 2012 (choir founding per About copy)
