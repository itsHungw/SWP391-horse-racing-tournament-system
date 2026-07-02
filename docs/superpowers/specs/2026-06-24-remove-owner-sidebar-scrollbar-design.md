# Owner Sidebar Scrollbar Removal Design

## Overview
The Owner layout's navigation sidebar currently displays an unsightly horizontal scrollbar. On desktop screens, a 10px scrollbar appears beneath the sidebar due to `overflow-x-auto` not being overridden for larger screens. On mobile screens, the horizontal navigation row also shows the default scrollbar, which degrades the visual quality of the interface. This design outlines how to remove the scrollbar while maintaining navigation functionality.

## Architecture & Components
This is a styling and layout adjustment targeting the Owner workspace.

### 1. Global Styles (`frontend/src/styles.css`)
We will introduce a `.no-scrollbar` utility class that hides the scrollbar across all major browsers while retaining scroll functionality.
- For Webkit browsers (Chrome, Safari, newer Edge): `::-webkit-scrollbar { display: none; }`
- For Firefox: `scrollbar-width: none;`
- For older IE/Edge: `-ms-overflow-style: none;`

### 2. Owner Layout (`frontend/src/layouts/OwnerLayout.tsx`)
The `nav` element currently uses `flex overflow-x-auto p-3 lg:block lg:space-y-1.5`.
We will:
- Add the `no-scrollbar` class so mobile users don't see the scrollbar but can still swipe horizontally.
- Add the `lg:overflow-x-hidden` class to explicitly hide overflow on desktop screens, ensuring the vertical layout is perfectly contained without triggering the global custom scrollbars.

## Data Flow
No changes to data flow. This is a purely visual change.

## Error Handling & Edge Cases
- **Mobile Swipe Support:** Adding `no-scrollbar` only visually hides the track/thumb; the native touch scrolling behavior provided by `overflow-x-auto` is preserved.
- **Desktop Focus Outlines:** Setting `overflow-x-hidden` on the desktop container will not cut off focus rings because Tailwind `block` handles them naturally, and items are contained within the `268px` column width.
