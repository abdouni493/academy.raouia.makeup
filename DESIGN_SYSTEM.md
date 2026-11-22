# Raouia design system

The redesign applies [Apple Design Skill](https://github.com/NutshellEngineering/apple-design-skill), installed locally at `/workspace/design-skills/apple-design-skill`, revision `119b6acc231e87ed56a64f0a8a73ce0a8606be55`. Its entry point and relevant HIG references were read before implementation. This is an unofficial HIG mirror, not an Apple product or an automatic compliance certification.

## Design intent

Mobile web uses the iOS navigation model: labelled bottom tabs, safe-area spacing, inset grouped content, and bottom sheets. Desktop uses a translucent leading sidebar for administration. Solid content surfaces keep text readable; translucent material is reserved for navigation and sheets. Blush rose, champagne, nude and plum preserve the academy's beauty identity. The signature gradient is reserved for brand moments and primary emphasis.

Authority: HIG [color](https://developer.apple.com/design/human-interface-guidelines/color), [typography](https://developer.apple.com/design/human-interface-guidelines/typography), [materials](https://developer.apple.com/design/human-interface-guidelines/materials), [dark mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode), [motion](https://developer.apple.com/design/human-interface-guidelines/motion), [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), and the skill's button, sheet, tab bar, sidebar and form-control references. Exact web radius, tracking and spring values below are implementation choices guided by those principles, not Apple API constants.

## Semantic colors

`src/index.css` owns RGB channels for light and `.dark`; `tailwind.config.ts` exposes opacity-aware semantic utilities. The original blush/rosegold/champagne/nude/plum names remain adaptive aliases for compatibility. No raw component hex colors are needed.

| CSS token | Light | Dark |
| --- | --- | --- |
| `background` | `#FCF7F4` | `#1C161D` |
| `background-secondary` | `#FFFBF8` | `#29212B` |
| `background-tertiary` | `#F4E8E7` | `#382D38` |
| `label` | `#31212D` | `#F9EEF3` |
| `label-secondary` | `#6C525F` | `#D9C0CD` |
| `label-tertiary` | `#745C67` | `#CEB5C2` |
| `label-quaternary` | `#78606B` | `#C7AEBB` |
| `separator` | `#DDC7CE` | `#594351` |
| `control-border` | `#977583` | `#A38496` |
| `fill` | `#EAD6DD` | `#5B3C4E` |
| `fill-secondary` | `#F2E5E8` | `#44323E` |
| `accent` | `#A52F58` | `#F5A2BC` |
| `accent-pressed` | `#882344` | `#F8BDD0` |
| `accent-soft` | `#F7E1E9` | `#4B2D3E` |
| `accent-contrast` | `#FFFFFF` | `#321823` |
| `gradient-end` | `#8F4858` | `#E8B6A2` |
| `rosegold` | `#905246` | `#E4B19E` |
| `rosegold-light` | `#E7C9BC` | `#65463F` |
| `champagne` | `#F5E5CF` | `#3C3030` |
| `nude` | `#EAD8CE` | `#513D3B` |
| `sidebar` | `#382331` | `#241B27` |
| `sidebar-label` | `#FFF5F8` | `#FFF0F6` |
| `sidebar-secondary` | `#E1C5D1` | `#DBC0D0` |
| `sidebar-fill` | `#553B4D` | `#493548` |
| `success` | `#286344` | `#9BD5B1` |
| `success-soft` | `#E4F0E7` | `#253C30` |
| `danger` | `#B22F46` | `#FFACB9` |
| `danger-soft` | `#FBE8EB` | `#492A35` |
| `warning` | `#855617` | `#E9C38C` |
| `warning-soft` | `#F5EACF` | `#43382A` |
| `info` | `#315E90` | `#B0CFF4` |
| `info-soft` | `#E6EDF6` | `#29394C` |

Background utilities are `bg-surface`, `bg-surface-secondary`, `bg-surface-tertiary`; labels use `text-label` and `text-label-secondary/tertiary/quaternary`. Filled accent controls use `text-accent-contrast`, which changes from white to deep wine in dark mode. Rose-gold is a secondary brand highlight, not a competing action tint. Fills accept alpha modifiers for grouped-control backgrounds. Separators are decorative hairlines; `control-border` provides stronger control outlines.

The defined primary/secondary/tertiary/quaternary labels reach at least **4.76:1** across all three light surfaces and **6.37:1** across dark surfaces. Accent and rose-gold text exceed **5:1** on those surfaces. Filled-button text exceeds **6.49:1** across the gradient stops. Semantic status text/fill pairs exceed **5.25:1**. These are computed sRGB token-pair checks, not a claim that every possible image/translucent combination has been certified. Increased-contrast overrides strengthen labels and separators; reduced transparency uses opaque navigation surfaces.

## Typography

Functional UI uses `-apple-system`, `BlinkMacSystemFont`, SF Pro Display/Text, Helvetica Neue, sans-serif. Arabic retains Cairo and logical alignment; the brand may use Playfair Display only in its wordmark/hero. Text uses rem units so browser text enlargement works.

| Role | Default size | Weight |
| --- | --- | --- |
| Large Title | 34px | 700 |
| Title 1 | 28px | 700 |
| Title 2 | 22px | 600 |
| Title 3 | 20px | 600 |
| Headline | 17px | 600 |
| Body | 17px | 400 |
| Callout | 16px | 400 |
| Subhead | 15px | 400 |
| Footnote | 13px | 400 |
| Caption | 12px | 400 |

Titles use modest negative tracking (-0.012 to -0.025em); Arabic resets tracking. Body uses 1.5 line height. This is the project's HIG-inspired web scale; the mirrored HIG article explicitly supplies 17pt default iOS text and 11pt minimum, but its full iOS size tables are not populated.

## Spacing, corners and elevation

Use an 8px composition rhythm (8, 16, 24, 32, 48), with 4px adjustments within compact controls. Touch controls target at least 44px. The corner family is 12px (`lg`), 16px (`xl`), 20px (`2xl`) and 28px (`3xl`/`sheet`), with pill shapes for switches and segmented selection. CSS rounded corners approximate native continuous corners; this SPA does not render native UIKit controls.

Content cards use a layered background and rose hairline with a restrained two-layer shadow. Menus and sheets use separate elevated shadows. Dark backgrounds become brighter as elevation increases. Navigation materials use near-opaque warm/plum surfaces and backdrop blur so labels remain legible over scrolling content.

## Motion and appearance

Shared interactive spring: stiffness 500, damping 38, mass 0.8. Sheet spring: stiffness 360, damping 36, mass 1. Page changes use a small 6px displacement and 180ms entrance/100ms exit; dropdowns use 4px and a 0.98 scale. There are no decorative floating blobs or animated page blur. Selection pills use shared layout transitions; sheets enter and dismiss on the same axis.

`prefers-reduced-motion` suppresses nonessential CSS animation and explicit Framer Motion transitions. The **VideoPlayer moving watermark and its keyframes are intentionally preserved** per the anti-piracy requirement. Appearance follows `prefers-color-scheme` before paint and updates live; no additional theme preference is introduced.

## Behavior boundary

Auth, Supabase/Bunny requests, routing, access checks, upload handling, playback events and watermark behavior are outside this redesign. Changes to event handling are limited to presentation accessibility (focus, dialog dismissal and keyboard access). Existing translation keys remain intact.


## Validation

- `npm run build` passes (TypeScript project references and Vite production bundle).
- Browser fixture matrix: nine auth/client/admin routes across mobile/desktop and light/dark (36 scenarios), plus Arabic RTL, live OS appearance changes, modal title/focus containment/focus return, Escape/close dismissal and reduced-motion checks: 195 assertions passed.
- Additional checks pass at 320px Arabic layouts for auth/client/admin; long mobile sheets scroll with real touch input and dismiss by dragging the grabber; reduced-motion button presses have no transform.
- 200% root text enlargement at 390px passes viewport-overflow checks for login, client catalog and admin clients. Tables retain their own horizontal scroll area.
- Playback logic, watermark markup and watermark keyframes match the original. Auth, service, query, upload-provider and routing modules, translation files and dependency lockfiles remain unchanged.

Authenticated browser screenshots use isolated local fixtures; they do not establish live Supabase/Bunny integration readiness. No real account or database mutations were used for visual validation. Test helpers/results and screenshots are under `/workspace/.onboarding/` outside the application checkout.
