# Coverage checklist — don't call it done until every line is handled

## Pages
- [ ] Every top-level route (tabs/nav) — desktop 1920 and phone 390 compared side by side
- [ ] Detail routes (`#/items/:id` style) and their sub-tabs
- [ ] Empty states, "no results" for search/filters
- [ ] Sign-in / signed-out screen, 404

## Shell
- [ ] Top bar (brand, tabs with moving indicator, tools), dock/sidebar, mobile bottom bar + "More" sheet
- [ ] Tab bar scroll/mask on phones; breakpoints where elements wrap or hide
- [ ] Background artwork (original), glass layers, pointer glint

## Overlays
- [ ] Command palette (groups, icons, keyboard nav, default results when empty)
- [ ] Menus anchored to buttons (create, account, card "⋯", chart options …)
- [ ] Modals (forms: same fields/options as the reference), drawers (details panels), bottom sheets on phones
- [ ] Notifications/activity popovers or drawers
- [ ] Toasts with Undo; card expand/focus mode
- [ ] Keyboard shortcuts (search, create, go-to letters, help list, Esc) — and ignored while typing

## Interactions
- [ ] Every button does something sensible (navigate, open, toggle, toast) — no dead buttons
- [ ] Filters/sorts/segmented controls, drag-and-drop, checkboxes/progress, forms with validation
- [ ] Deep links used by menus (`?new=1`, `?app=`, `?next=`) work, including repeated on the same page
- [ ] Theme (light/dark/system) and reduce-transparency if the reference has them

## Motion (measured, see motion-capture.md)
- [ ] Palette, page entrance, tab indicator, menus, modals, drawers, toast, press, hover, card expand

## Quality
- [ ] tsc, eslint, production build clean; no console errors or hydration warnings on any route
- [ ] Scroll ~60 fps on every page (production build, real Chrome)
- [ ] README with Authorization section; PLAN.md
