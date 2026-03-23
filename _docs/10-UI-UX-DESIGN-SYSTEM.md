# BossZap — UI/UX Design System

## Philosophy
- **Luxury feel, simple operation.** Looks expensive, every action is obvious.
- **Mobile-first ALWAYS.** Design for mobile FIRST, then scale up. Most MEIs use smartphones as their primary and often only device.
- **Zero learning curve.** Understand any screen in 5 seconds.
- **Data-rich, clutter-free.** Meaningful data, never overwhelming.

## Color Palette
```css
:root {
  --primary: #00D4AA;
  --primary-dark: #00B894;
  --secondary: #6C5CE7;
  --background: #F8F9FA;
  --surface: #FFFFFF;
  --text-primary: #2D3436;
  --text-secondary: #636E72;
  --text-muted: #B2BEC3;
  --success: #00B894;
  --warning: #FDCB6E;
  --danger: #E17055;
  --info: #0984E3;
  --border: #DFE6E9;
}
```

## Typography
```css
--font-primary: 'Inter', 'SF Pro Display', system-ui;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Sizes */
--text-h1: 28px;    /* page titles */
--text-h2: 22px;    /* section titles */
--text-h3: 18px;    /* card titles */
--text-h4: 16px;    /* subsection */
--text-body: 14px;  /* body text */
--text-small: 12px; /* small text */
--text-caption: 11px; /* captions */
```

## Spacing (8px Grid)
```
xs: 4px | sm: 8px | md: 16px | lg: 24px | xl: 32px | 2xl: 48px | 3xl: 64px
```

## Components

### Cards
- bg: white, radius: 12px, shadow: `0 1px 3px rgba(0,0,0,0.08)`, padding: 24px.
- Hover shadow (interactive): `0 4px 12px rgba(0,0,0,0.1)`.
- No visible borders. Shadows define boundaries.

### Buttons
- **Primary:** bg #00D4AA, text white, radius 8px, h 44px, font-weight 600.
- **Secondary:** bg transparent, border 1px #DFE6E9, text #2D3436.
- **Danger:** bg #E17055, text white.
- **Ghost:** bg transparent, text #00D4AA, no border.
- All: min-height 44px (touch target), transition 0.2s ease.
- Loading: spinner replaces text, maintain width.

### Inputs
- Border: 1px #DFE6E9, radius 8px, padding 12px 16px.
- Focus: border #00D4AA, shadow `0 0 0 3px rgba(0,212,170,0.15)`.
- Error: border #E17055, red helper text below.
- Label: above input, font-weight 500, color #636E72, 13px.

### Tables
- Header: bg #F8F9FA, font-weight 600, text #636E72, uppercase 11px, letter-spacing 0.5px.
- Rows: bg white, hover #F8F9FA, border-bottom 1px #F1F3F5.
- Min row height: 52px. Sticky header. Mobile: transform to card layout.

### Charts
- Library: Recharts only.
- Colors: #00D4AA, #6C5CE7, #0984E3, #FDCB6E, #E17055.
- Always: title, legend, hover tooltips.
- Revenue vs Expenses: area or bar chart.
- Profit trend: line with gradient fill.
- Category breakdown: donut (not pie).
- Animate on load, 0.5s.

### Sidebar Navigation
- Width: 260px desktop, 72px collapsed (icon-only).
- Mobile: off-canvas drawer with overlay.
- bg white, right border 1px #F1F3F5.
- Active: bg rgba(0,212,170,0.08), left border 3px #00D4AA, text #00D4AA.
- Icons: Lucide, 20px, color #636E72 (active: #00D4AA).
- Subscriber logo + business name at top.

### Modals
- Overlay: rgba(0,0,0,0.4), backdrop blur 4px.
- bg white, radius 16px, padding 32px.
- Max: 480px forms, 640px content, 90vw mobile.
- Animate: scale 0.95 + fade, 0.2s.

### Toasts
- Position: top-right desktop, top-center mobile.
- Radius 8px, left border 4px status color.
- Auto-dismiss: success 4s, warning 6s, error persistent.
- Slide in from right.

## Responsive Breakpoints
```
Mobile:  0-639px    (single column)
Tablet:  640-1023px (2 columns, collapsible sidebar)
Desktop: 1024-1439px (sidebar + content)
Wide:    1440px+    (max-width 1280px centered)
```

## Mobile-First Rules (CRITICAL — ALL UIs)

EVERY screen in BossZap must work perfectly on mobile. This is non-negotiable.

### Development Approach
- **Write mobile CSS first.** Default styles = mobile layout.
- **Use `min-width` media queries to scale UP** to tablet/desktop. Never use `max-width`.
- **Test on 375px width** (iPhone SE) as the minimum supported viewport.
- **Tailwind:** write base classes for mobile, then add `sm:`, `md:`, `lg:` for larger screens.
  ```tsx
  // CORRECT: mobile first, then scale up
  <div className="flex flex-col gap-4 md:flex-row md:gap-6">

  // WRONG: desktop first, then override for mobile
  <div className="flex flex-row gap-6 max-md:flex-col max-md:gap-4">
  ```

### Mobile Layout Rules
- **Single column layout** on mobile. No side-by-side cards or columns below 640px.
- **Summary cards:** stack vertically, full width. 2-column grid on tablet, 4-column on desktop.
- **Sidebar navigation:** hidden by default on mobile. Opens as off-canvas drawer with hamburger menu.
- **Tables:** transform to card layout on mobile. Each row becomes a stacked card showing key fields.
- **Charts:** full width, horizontal scroll if needed. Simplify legends (below chart, not beside).
- **Modals:** full-screen on mobile (`max-w-full h-full` or bottom sheet). Standard centered modal on desktop.
- **Forms:** single column, full-width inputs. No multi-column form layouts on mobile.
- **Action buttons:** full width on mobile (`w-full`), auto-width on desktop.
- **Filters/search:** collapsible on mobile (tap to expand), always visible on desktop.

### Touch Targets
- **Minimum 44x44px** for all interactive elements (buttons, links, checkboxes, icons).
- **Spacing between touch targets:** minimum 8px gap so users don't tap the wrong element.
- **Swipe gestures:** support swipe-to-dismiss on toasts and swipe between calendar months.

### Mobile-Specific Components
- **Bottom navigation bar:** optional alternative to sidebar on mobile (dashboard pages).
- **Pull-to-refresh:** on main data lists (transactions, events, documents).
- **Floating action button (FAB):** bottom-right on mobile for primary action ("+" to create budget, register expense).
- **Bottom sheets:** use instead of dropdown menus on mobile for selections with many options.

### Mobile Performance
- **Images:** use `next/image` with responsive `sizes` attribute. Serve smaller images on mobile.
- **Lazy loading:** below-the-fold content loads on scroll.
- **Bundle size:** target < 200KB initial JS on mobile. Code-split per page.
- **Skeleton loading:** show placeholder shapes while data loads (never blank white screens).

### Testing Requirements
- **Every page must be tested at these widths:** 375px, 414px, 768px, 1024px, 1440px.
- **No horizontal scroll** at any viewport width (except intentional scroll containers like data tables).
- **No text overflow or truncation** that hides critical information.
- **Touch interactions must feel responsive** — no delay on tap, instant visual feedback.

### Pages — Mobile-Specific Behavior

#### Subscriber Dashboard Home (Mobile)
- Summary cards: 2x2 grid (compact version with just number + label).
- Chart: single full-width area chart, swipe to see more charts.
- Recent activity: scrollable list.
- FAB button: "+" menu (register income, register expense, create budget).

#### Financial Page (Mobile)
- Period selector: horizontal scrollable pills (this week | this month | custom).
- Charts: one chart visible, swipe carousel for others.
- Transaction list: full-width cards, pull-to-refresh, infinite scroll.
- Export button: in top-right action menu.

#### Calendar Page (Mobile)
- Week view by default (not monthly — saves space).
- Tap date to see events in bottom sheet.
- Swipe left/right to change weeks.

#### Documents Page (Mobile)
- Card list (not table). Each card: doc number, client, amount, status badge, date.
- Tap to preview, long-press for actions (download, share).

#### Admin Dashboard (Mobile)
- Simplified layout: key metrics as cards, expandable sections for details.
- Subscriber list: searchable card list, tap for detail view.
- Bottom navigation: Overview | Subscribers | Payments | Settings.

#### Landing Page (Mobile)
- Hero: stacked layout, CTA button full width.
- Features: single column, one feature per block.
- Pricing: single card, full width.
- Sticky CTA button at bottom of viewport during scroll.

## Animations
- Duration: 0.15s micro, 0.2s transitions, 0.3s pages.
- Easing: ease-out entrances, ease-in exits.
- Only animate transform + opacity. Never layout properties.
- Respect `prefers-reduced-motion`.

## Accessibility
- Keyboard navigable. Color contrast 4.5:1 minimum.
- Alt text on images. Labels on inputs. Focus indicators visible.
- Error messages announced to screen readers.

## Dark Mode Preparation
- ALL colors as CSS custom properties from day one.
- No hardcoded hex in components. Reference variables only.
- Dark mode = swap variable values. Architecture ready from Sprint 1.
