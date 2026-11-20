# In Orbit — Visual direction

## Intent
Atmospheric, celestial, editorial, ethereal, intimate. A quiet personal universe that makes saved content inviting to revisit. Interpret the dark celestial atmosphere discussed in the source conversation, with Elisha Jeon's portfolio as a reference: https://elishajeon.com/noto. Do not copy its layouts or assets.

Deep midnight and indigo, a sparse star field, translucent surfaces, soft white type, and restrained warm amber light. Avoid generic SaaS dashboards, cyberpunk neon, opaque blocks, childish space illustrations, and visual clutter.

## Typography
- All headings, including the `In Orbit` wordmark and card titles: DT Nightingale Light, weight 300. It is bundled locally under the SIL Open Font License.
- Body and UI: Inter, regular and medium.
- Inter uses next/font/google and DT Nightingale uses next/font/local. Both are served locally by Next.js at runtime. A build needs font-network access for Inter.
- Homepage title: responsive 44–58px, compact rather than hero-like.
- Card titles: 24px with 32px line height; descriptions 14px with 24px line height.
- UI and metadata: 12–14px minimum; segmented navigation and primary controls use 14px.

## Provisional tokens
The implemented source of truth is app/globals.css. These values are starting points for design review, not a finalized system.

- Page gradient: #040134 → #161136 → #282338 → #3A363B → #4B473D, sampled from the visual draft
- Midnight / page start: #040134
- Indigo / atmosphere: #282338
- Primary text: #F4F1E9
- Secondary text: #A9B1C5
- Amber / emphasis and focus: #E8C58F
- Starlight / save action: #FFE99A → #FFCE55; reserved for the Add save modal, cursor trail, and motion accents
- Card and control surface: rgba(255,255,255,0.15), increasing to roughly 0.19 on hover
- Resting component borders: transparent; separation comes from the translucent fill rather than white strokes
- Spacing rhythm: an 8px base using 8, 16, 24, 32, 40, 48, and 64px; allow 4px only for optical adjustments.
- Radii: inputs 9px, cards 12px, pills 30px.
- Content: maximum shell 1320px; outer padding 48px desktop, 32px tablet, 24px mobile.
- Library: three columns desktop, two at 1000px and below, one at 620px and below.

## Surfaces and content
Soft white surfaces at 15% opacity provide separation without visible resting strokes. Use ambient light sparingly, without heavy blur, lift, or glow on every control. Cards use one consistent bookmark pattern: 16px outer inset and an approximately 1.9:1 rounded preview. Real covers and social images can be explored later. Sample content is identified once at the library level and must not imply imported or persisted records.

Gallery cards hug their available content instead of sharing a forced minimum height. They use a three-column staggered masonry arrangement that closes vertical gaps while preserving the selected sort in the document and keyboard order. The optional List layout uses a single compact row per save with a smaller thumbnail and one-line title and description treatment. Fetched social thumbnails replace the abstract preview when available, while the existing artwork remains the fallback.

Dropdowns and general popovers use softly blurred white translucency rather than native browser menus or outlined containers. Menus use a restrained warm checkmark for selection. The Add save modal uses the supplied vertical gradient: `#FFF8D8` at 100% opacity at the top, `#FFF0B0` at 75% opacity at the midpoint, and `#FFE38B` at 75% opacity at the bottom. Modal overlays use `#08061A` at 50% opacity. Form fields are near-opaque warm white to preserve text and placeholder contrast against the gradient. The primary Type selector uses the same field treatment and appears before title and URL; optional secondary tags remain unboxed pills lower in the form. Text and controls use dark aubergine-brown, validation feedback is neutral grey, and the primary “Send into orbit” action is white with a custom shooting-star icon. The desktop modal is a compact centered panel; on small screens it becomes a near-full-screen bottom sheet. Form fields use persistent labels and 48px inputs.

The homepage is the library. Keep the introduction compact enough to lead naturally into browsing. Categories, search, and sort use familiar labels. The active save category uses a restrained amber underline glow; the Library/Images segmented control does not. Cards show the save type as plain amber text and use pills only for secondary topic and style tags. Source copy is omitted from card previews.

Persisted save cards expose management through a quiet three-dot control layered over the preview. Its compact translucent menu offers Edit and Delete without changing the card's primary open-link behaviour. Editing reuses the warm Add save modal; deletion requires a separate, compact confirmation and uses neutral—not alarming red—feedback.

Images shares the same header, search, background, and glass language, then opens into a borderless three-column masonry collage on desktop, two columns on smaller screens, and one on narrow phones. Images—not containers—define the composition. Tags sit quietly beneath images, and the paste/drop instruction remains compact. Library and Images empty states share one borderless, centered treatment: a small amber star, restrained serif heading, and muted guidance. The active image drop state keeps that hierarchy in a compact panel fixed to the center of the viewport, so it remains centered at every scroll position. Its fill is a plain 90% vertical gradient from `#FFF8D8` to `#FFE38B`, without backdrop blur or inset glass effects, with a 2px `#F7E5A4` outline, matching inset dashed boundary, and restrained external golden bloom. Drop-state heading and guidance use off-black and deep brown so they remain readable against the brighter yellow surface.

## Motion and accessibility
- Subtle card hover illumination and several independently staggered shooting stars; content itself does not animate into place.
- Honor prefers-reduced-motion for all animations and smooth scrolling.
- Decorative stars and static constellation lines are concentrated in the upper 30–40% of the page, hidden from assistive technology, and never intercept interaction.
- The login screen reuses the same celestial background component as the authenticated library, with its sparse star field continuing through the full viewport so the sign-in page does not feel visually separate.
- Use semantic headings, input labels, visible keyboard focus, a skip link, and an announced result count.
- Preserve contrast against translucent surfaces; validate at final background combinations.
- The yellow cursor trail is a continuous two-layer canvas stroke, not particles. It shares the modal's starlight palette, remains lightweight, sits above modal overlays, and is disabled for coarse pointers and reduced-motion preferences.
- The wordmark is plain editorial typography with no orbit animation or decorative overlap.
- Sending a temporary save triggers a short shooting-star launch from the lower center of the viewport. This is an exploratory first pass and should be revised when specific motion references are chosen.

## Voice
Quiet, personal, editorial, slightly dreamy. No startup marketing language, unnecessary exclamation points, or forced space metaphors. Themed terminology is optional; clarity wins.
