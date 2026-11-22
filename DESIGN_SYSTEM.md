# Raouia Makeup Academy design system

The academy uses an iOS 17/18 semantic palette and navigation model with a web adaptation of Apple's newer Liquid Glass material. On a phone, the content occupies the full width above a labeled tab bar. On desktop, administration moves into a leading sidebar. The pink interaction tint, the academy wordmark and the makeup still life on the sign-in screen carry the brand across both layouts.

The design authority is the repository's pinned [Apple Design Skill](https://github.com/NutshellEngineering/apple-design-skill/tree/119b6acc231e87ed56a64f0a8a73ce0a8606be55/skills/apple-design-skill), an unofficial mirror of Apple's Human Interface Guidelines. The material placement follows Apple's [materials](https://developer.apple.com/design/human-interface-guidelines/materials), [color](https://developer.apple.com/design/human-interface-guidelines/color), [motion](https://developer.apple.com/design/human-interface-guidelines/motion) and [accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) guidance. The CSS recipes and spring constants below are web implementation choices.

## Adaptive color

Edit the two theme blocks in `src/index.css`. Tailwind exposes those values through semantic utilities in `tailwind.config.ts`. The default assignment `--accent: var(--system-pink)` controls the interaction tint in both appearances. Success, danger, warning and info use green, red, orange and blue respectively. Keep the signature gradient for the academy mark and brand moments.

| System swatch | Light | Dark |
| --- | --- | --- |
| Blue | #007AFF | #0A84FF |
| Green | #34C759 | #30D158 |
| Indigo | #5856D6 | #5E5CE6 |
| Orange | #FF9500 | #FF9F0A |
| Pink | #FF2D55 | #FF375F |
| Purple | #AF52DE | #BF5AF2 |
| Red | #FF3B30 | #FF453A |
| Teal | #30B0C7 | #40C8E0 |
| Yellow | #FFCC00 | #FFD60A |
| Mint | #00C7BE | #63E6E2 |
| Cyan | #32ADE6 | #64D2FF |
| Brown | #A2845E | #AC8E68 |
| Gray | #8E8E93 | #8E8E93 |
| Gray 2 | #AEAEB2 | #636366 |
| Gray 3 | #C7C7CC | #48484A |
| Gray 4 | #D1D1D6 | #3A3A3C |
| Gray 5 | #E5E5EA | #2C2C2E |
| Gray 6 | #F2F2F7 | #1C1C1E |

| Semantic role | Light | Dark |
| --- | --- | --- |
| Background / secondary / tertiary | #FFFFFF / #F2F2F7 / #FFFFFF | #000000 / #1C1C1E / #2C2C2E |
| Grouped background / inset card | #F2F2F7 / #FFFFFF | #000000 / #1C1C1E |
| Primary label | #000000 | #FFFFFF |
| Secondary / tertiary / quaternary label | #3C3C43 at 60% / 30% / 18% | #EBEBF5 at 60% / 30% / 18% |
| Separator / opaque separator | #3C3C43 at 29% / #C6C6C8 | #545458 at 65% / #38383A |
| Primary fill | #787880 at 20% | #787880 at 36% |
| Secondary fill | #787880 at 16% | #787880 at 32% |
| Tertiary fill | #767680 at 12% | #767680 at 24% |
| Quaternary fill | #747480 at 8% | #747480 at 18% |

Use `bg-grouped` behind inset sections and `bg-card` for opaque reading surfaces. Exact palette swatches are available through utilities such as `bg-system-blue`. Apple's lower-emphasis label alphas and white on plain system pink can fall below 4.5:1. Use `text-label-secondary`, `text-accent` and semantic status text for readable foregrounds. These utilities use solid label inks or tint mixtures suited to the appearance. Check the resulting foreground/background pairs when changing the tint.

## Glass and controls

Use `.glass` for secondary buttons and segmented controls. Use `.glass-accent` for the primary action. The accent recipe mixes system pink with black under a white label. A static diagonal sheen, inset highlight, hairline and soft shadow define the edge. Pressing an enabled control scales it to 96%, and the primary action also brightens briefly.

| Material | Use | Backdrop blur |
| --- | --- | --- |
| Compact glass | Buttons, pickers and language controls | 8px |
| Ultra-thin | Mobile tab bar | 12px |
| Thin | Sticky navigation bar | 14px |
| Regular | Sidebar, menus and sheet chrome | 16px |

One material provides the backdrop for a group of controls. Nested buttons take their depth from the parent. Keep long lists, form content and sheet scroll areas opaque. Reduce Transparency and Increase Contrast use solid material backgrounds and remove the sheen and blur. Browsers without backdrop filtering use the solid base.

## Type and layout

Use the system sans stack for controls and content. The type scale runs from a 34px large title, through 28/22/20px section titles and 17px body, to 13px footnotes and 12px captions. Values are expressed in rem. Cairo handles Arabic with natural tracking and logical start/end alignment. Playfair Display is reserved for brand typography. The font subsets live in `src/assets/fonts`. Their licenses ship with the site in `public/licenses`.

Compose screens on an 8px rhythm with 4px adjustments inside controls. Use a 44px minimum touch area and a visible keyboard focus ring. Content and sheet corners use the existing 12–28px radius scale. Mobile bars and sheet footers account for safe-area insets. The sticky navigation bar shows a compact section title after the large page heading scrolls away.

## Motion

`src/lib/motion.ts` defines the shared transitions. Stiffness, damping and mass are 620/40/0.72 for controls, 420/38/0.86 for sheets and 540/42/0.84 for route transitions. Forward navigation brings the new screen in from the trailing edge while the old screen moves 20% toward the leading edge. Back reverses the effect, and Arabic mirrors its direction. The outgoing frame is inert during the overlap. Changes within a page's query string preserve its component state.

Selection pills share a layout ID. Course cards and detail views share visual elements when both are mounted. List entrances stagger by 24ms with a capped delay, and loading placeholders crossfade over 140ms. A mobile sheet can be dismissed by its close control, Escape, the scrim or a downward pull on its grabber. Its body scrolls independently.

Reduce Motion suppresses decorative transforms, staggers and fades. The player watermark retains its existing movement for playback protection.

## Appearance

System is the default. The sun, moon and automatic controls are available at sign-in, in the client profile menu and in the admin sidebar or drawer. The radio group exposes the selected mode and localized names in French, Arabic and English.

The head script in `index.html` reads `raouia.theme` before styles or React render. Keep its resolution rule in sync with `src/lib/theme.ts`. Both update the HTML dark class, the native control color scheme and the browser chrome color. System follows live OS changes. Explicit choices survive reloads and synchronize across tabs. With storage disabled, a choice lasts for the current page session.
