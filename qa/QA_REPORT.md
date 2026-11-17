# Neeo: UX/UI QA report

_2026-11-17 · branch `claude/neeo-dating-app-store-fa49mt` · web build with mock data_

## How it was tested

- **Crawler:** `scripts/qa-crawl.cjs` uses Playwright to walk every route. That covers all 77 route files, plus the error, empty, loading, offline and success states, membership states 30–45, and the safety, report, block and delete flows. It ran in 8 configurations:
  - 320×568, 390×844 and 430×932, each in light and dark
  - 200% zoom (a 195 CSS px viewport at 2×, which is how a browser renders 200% text on a 390pt phone; WCAG 1.4.4 and 1.4.10)
  - RTL, with Urdu switched on through Region & language
- **Checks on every screen:**
  - axe-core, WCAG 2.2 A and AA (390px, light and dark)
  - browser console errors and warnings
  - horizontal overflow and controls off screen
  - controls smaller than 44×44
  - clipped text
  - copy rules: "please", "successfully", "!", lorem, "Vera", hard-coded prices
  - tab bar visible in focused flows
- **Manual review:** contact sheets of every configuration, plus a keyboard focus check (Tab) in light and dark.
- **Results:** 1,033 screenshots in `qa/screens/<config>/`. `qa/index.html` is the contact sheet, and `qa/results/*.json` holds the per-screen findings.
- **Regression:** `npm run verify` (types, lint, tokens, 141 unit tests), the RLS suite (86 checks) and the web E2E (27 steps) all pass.

## Summary

| | Found | Fixed | Open |
|---|---:|---:|---:|
| Critical | 11 | 10 | 1 (repo visibility: yours to change) |
| Major | 22 | 21 | 1 (Urdu/Arabic full translation) |
| Minor | 12 | 9 | 3 |
| **Total** | **45** | **40** | **5** |

On the first crawl (390px, light, before any fix), automated checks flagged 176 instances across 22 rule types. The final crawl had **0 automated findings in all 8 configurations**, including zero browser console errors or warnings.

Before/after pairs for the critical and major fixes are in `qa/before-after/` and on the "Before / after" tab of the contact sheet.

## Issues

Severity: **critical** blocks a task or excludes a group of users. **major** makes a task harder or breaks a standard. **minor** is polish.

| # | Issue | Screen | Severity | Principle | Fix | Status |
|---|---|---|---|---|---|---|
| 1 | Web layout stretched to full desktop width; CTA ran edge to edge | all (web) | critical | Material: responsive layout / canonical layouts; Nielsen 8 | App renders in a centred 480px column, with tint around it; sheets are constrained to the column | fixed |
| 2 | Welcome hero cropped faces at the eyes on wide and short screens | Welcome | critical | Nielsen 8 (aesthetic) | Hero height clamped (220px to 0.85 × column) and crop anchored on the faces (`contentPosition`) at 320/390/430/480 | fixed |
| 3 | Repo is public | GitHub | critical | Security | Not changed, per your instruction | **open: make it private** |
| 4 | Welcome didn't scroll: at 320×568 "I already have an account" and the Terms/Privacy links were unreachable | Welcome | critical | WCAG 1.4.10 Reflow, 2.1.1 | Content is in a ScrollView | fixed |
| 5 | Keyboard focus ring was the browser default (1px near-black), invisible on the dark theme | all (web) | critical | WCAG 2.4.7 Focus Visible | 3px `focus` token outline with 2px offset, themed per mode | fixed |
| 6 | Discover photo: keyboard and mouse users couldn't reach the next photo (an adjustable role meant for screen readers only, and the second tap zone hidden); controls nested inside an `img` role | Discover, profiles | critical | WCAG 2.1.1, 4.1.2 | Web: real Previous/Next photo buttons. Native: adjustable kept. Alt text moved onto the image itself | fixed |
| 7 | Radios, checkboxes and chips had no `aria-checked` (gender, intention, agreement, report-message selection, action chips announced as checkboxes) | onboarding, report, chat | critical | WCAG 4.1.2 (axe: aria-required-attr) | Explicit checked state everywhere; action chips are buttons | fixed |
| 8 | Profile photos and avatars rendered `<img>` without alt | Discover, Likes, profile, chat | critical | WCAG 1.1.1 (axe: image-alt) | Label set on the image itself | fixed |
| 9 | Switch rows: an input nested inside a pressable row, a 40×20 target, a missing checked state | all settings | critical | WCAG 4.1.2, 2.5.8 | The whole row is the switch (one tab stop, full-width target); the visual switch is decorative | fixed |
| 10 | At 200% zoom, text inputs pushed the page sideways (OTP, DOB, name, city, check-in) | sign-in, onboarding, check-in | critical | WCAG 1.4.10, 1.4.4 | Inputs can shrink (`minWidth: 0`) | fixed |
| 11 | Discover load-error screen had no background, so it was white with light text in dark mode | Discover (offline) | critical | WCAG 1.4.3 | Wrapped in a `bg` view with safe-area padding | fixed |
| 12 | Switch off-track (`border` on surface ≈1.3:1) and resting input border below 3:1 | settings, forms | major | WCAG 1.4.11 Non-text Contrast | Off track and input border use `textMuted` (≥3:1 in both modes) | fixed |
| 13 | Touch targets below 44: icon buttons (36/40px; hitSlop doesn't exist on web), stepper ±, segmented tabs (40px), photo move/remove, undo/save | many | major | WCAG 2.5.8; Apple HIG 44pt | The pressable is always ≥44×44 and the visual circle can be smaller; segments are 44px | fixed |
| 14 | 200% zoom: photo manager squeezed its title to one letter per line | Your photos | major | WCAG 1.4.10 | Card wraps; controls move under the text | fixed |
| 15 | After validation on blur, the focus border stayed on (the caller's `onBlur` replaced the field's own) | every form | major | Nielsen 1 (system status) | Field handlers wrap the caller's handlers | fixed |
| 16 | Invalid autocomplete tokens on web (`sms-otp`, `birthdate`, `postal-address-locality`) | OTP, DOB, city, reauth | major | WCAG 1.3.5 | Mapped to `one-time-code`, `bday`, `address-level2` on web | fixed |
| 17 | Accessible names didn't contain the visible text (tab badges, You tiles, Likes cards, list rows) | tabs, You, Likes, settings | major | WCAG 2.5.3 Label in Name | Name comes from visible text on web; extra detail spoken via screen-reader-only text; native keeps full labels | fixed |
| 18 | Stepper was a slider wrapping two buttons | Preferences | major | WCAG 4.1.2 (nested-interactive) | Web: group + labelled buttons, value announced politely; native: adjustable | fixed |
| 19 | No loading state: Discover, Chats, Likes and profiles were blank while loading | tabs, profile | major | Nielsen 1; WCAG 4.1.3 | Skeletons (pulse respects Reduce Motion), announced as "Loading" | fixed |
| 20 | Chats and Likes had no error state: a failed load showed "No chats yet" / "No likes yet" | Chats, Likes | major | Nielsen 9 (recover from errors) | "Can't load this right now" with Try again | fixed |
| 21 | Load errors reused chat-draft copy ("Your draft is kept on this device…") on lists, sign-in and review | Discover, Likes, sign-in, onboarding review, Plus compare | major | Nielsen 2 (match the real world) | New neutral `states.loadFailed` copy | fixed |
| 22 | Notification permission denied: onboarding moved on silently; settings showed text only, and "Open settings" did nothing on web | onboarding, settings | major | Nielsen 9; HIG (permission requests) | Stays on the step with icon + text and the exact steps to turn it on (web: explains the preview can't send) | fixed |
| 23 | Missing flows: check-in prompt ("I'm okay" / alert sent), chaperone invite → accepted, Friend's Take invite → received → shown, voice listen-back/re-record, Help/What's new entry from You | see GAP_REPORT | major | Nielsen 3 (user control), 7 (efficiency) | Built with existing components (see "Flows" below) | fixed |
| 24 | Security: a profile owner could insert their own "Friend's Take" as approved, or edit a friend's words | database (RLS) | major | OWASP A01 Broken Access Control | Owner can only approve/hide/delete; takes are written via the `invite-respond` function; 4 RLS tests added | fixed |
| 25 | Saved language not restored on launch; RTL not applied on web; directional icons mirrored only on native | Region & language | major | Material: bidirectionality; WCAG 3.1.1 | Locale applied on launch; web sets `dir`/`lang` on the app column; icons mirror from the language | fixed |
| 26 | Your photos: "move earlier" was a rotated back-chevron, so in RTL it pointed down | Your photos | major | Material: bidirectionality | Dedicated up/down icons | fixed |
| 27 | Onboarding review rendered ", NaN" and could submit an incomplete draft | Onboarding review | major | Nielsen 5 (error prevention) | Incomplete draft → "A few steps to finish first" → next missing step | fixed |
| 28 | Profile scroll area unreachable by keyboard when it had no focusable content | profile | major | WCAG 2.1.1 (axe: scrollable-region-focusable) | Scroll region focusable and labelled on web | fixed |
| 29 | Chat header "View profile" link was distinguished by colour only | Chat | major | WCAG 1.4.1 Use of Color | Underlined | fixed |
| 30 | Console warnings on web: expo-notifications (2 per screen) and useNativeDriver | onboarding/settings notifications, match, Discover | major | Quality bar: zero console errors/warnings | Web stub for notifications; native driver only on native | fixed |
| 31 | Hard-coded English in components: "Photo verified" / "Verified", sheet "Close", tab "N new", check-in "(hours from now)" / "N hours" / "Checked", "Main", "Policies", "photo N", safety hint | many | major | WCAG 3.1.2; i18n | All moved to `en.ts` | fixed |
| 32 | Check-in checklist items were buttons with a hint, not checkboxes | Date check-in | major | WCAG 4.1.2 | New checkbox `ListRow` | fixed |
| 33 | Urdu/Arabic: only a few strings translated, so most screens fall back to English | all (ur/ar) | major | WCAG 3.1.2; localisation | Core navigation, Welcome, Discover and Region translated [TRANSLATION REVIEW] | **open: needs native translators** |
| 34 | Copy says "please" (5 strings) | errors, purchase pending, support | minor | Package tone (calm, no pressure) | Reworded | fixed |
| 35 | Empty Discover still showed "1 of 8" | Discover (empty) | minor | Nielsen 1 | Counter hidden when there are no introductions | fixed |
| 36 | Urdu/Arabic language names displayed in the wrong order (bidi) | Region & language | minor | Unicode bidi; Material bidirectionality | Names isolated (U+2068/U+2069) | fixed |
| 37 | Tab and segment selection carried by colour/background only | tab bar, Segmented | minor | WCAG 1.4.1 | Selected segment is semibold; `aria-selected` on tabs and segments | fixed |
| 38 | Bottom sheets rendered full desktop width on web | all sheets (web) | minor | Material responsive layout | Max width = app column | fixed |
| 39 | Large headers had no header role (Likes, Chats, Discover, profile name) | tabs, profile | minor | WCAG 1.3.1 | `accessibilityRole="header"` | fixed |
| 40 | Error copy said "Retry connection" / "Your draft…" outside chat | see #21 | minor | Nielsen 2 | Covered by #21 | fixed |
| 41 | Mock: invite and take lists returned mutated objects, so the screen didn't update on accept (mock only) | Chaperone, Friend's Take | minor | — | Mock returns copies | fixed |
| 42 | Store screenshot script relied on the old You-tile label | tooling | minor | — | Selector updated | fixed |
| 43 | Closing a quiet chat is long-press (and a screen-reader action) only; no visible affordance on web | Chats | minor | WCAG 2.1.1 | Ending a connection works from the chat's safety menu. A visible "Close chat" control needs a design decision (it's tied to the 10-chat cap) | **open** |
| 44 | Toasts (e.g. "Draft restored") stay up for ~4 s after you navigate away | Chat → other screens | minor | Nielsen 1 | Left as is: toasts are polite live regions and don't block input | **open** |
| 45 | Not testable here: keyboard overlap, safe areas, VoiceOver/TalkBack, native Dynamic Type | native | minor | HIG, WCAG | Covered by the Maestro flows and the device QA list in PROGRESS.md | **open: needs devices** |

## Flows confirmed or added

| Flow | Status |
|---|---|
| Match celebration → first message | existed, verified |
| Photo request → approve / decline / revoke | existed, verified |
| Date check-in start → check-in prompt → "I'm okay" / alert sent | **added** (`/check-in-prompt/[id]`, Chats card, inbox item, `help_requested` status, immediate SMS from `checkin-escalation`) |
| Chaperone invite → accepted | **added** (`/settings/chaperone`, `invites` table, `invite-respond` function, `web/invite.html`) |
| Friend's Take invite → received → shown on profile | **added** (`/settings/friends-take`; owner approves before it shows) |
| Voice prompt record → re-record → delete | **added** listen-back and re-record |
| Filters sheet (Free vs Plus locked) | existed, verified (E2E) |
| Pause profile → resume | existed, verified |
| Notification permission denied → how to enable | **added** |
| Urdu language switch end to end | **fixed** (E2E step: switch → RTL + Urdu strings → back to English) |
| "What's new" / help entry from You | **added** |

All added flows are listed in `GAP_REPORT.md` → "Added in the QA pass", and are covered by unit tests (`__tests__/qaFlows.test.ts`), RLS tests and new E2E steps.

## Checked and fine

- Tab bar is hidden in chat, profile detail, match, Plus/purchase, report/block/unmatch, check-in and reauth (crawler check, 0 findings).
- Text contrast is ≥4.5:1 for every text token on every surface in both modes (unit-tested). Terracotta (`action`) and `danger` are never the only signal: every error has an icon and text.
- No hard-coded prices, no "Vera", no lorem, no "!" and no "successfully" in any screen's visible text.
- Every input has a visible label, validation on blur, error text with an icon, and the right keyboard type (phone-pad, number-pad, decimal-pad).

## Regenerating

```
npx expo export --platform web --output-dir dist-web
for c in 320-light 320-dark 390-light 390-dark 430-light 430-dark zoom200 rtl; do node scripts/qa-crawl.cjs dist-web $c; done
node scripts/qa-report.mjs     # qa/index.html
```
