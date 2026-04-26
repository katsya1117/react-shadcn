# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 5174
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run test       # Jest (single-threaded, jsdom environment)
npm run test:watch # Jest watch mode
npm run test:coverage  # Jest with LCOV coverage report
```

To run a single test file:
```bash
npx jest src/redux/slices/userSlice.test.ts
```

## Architecture Overview

This is a React 19 + Vite business application using Redux Toolkit for state and shadcn/ui components.

### Routing

`src/App.tsx` defines all routes using React Router 7. Routes fall into two layouts:
- **Main layout** (default): Header + SideMenu + optional TabsBar
- **SS layout**: ShareArea with `fluid` and `subtitle` props, used for `/job/ShareArea/:rootFolderId`

All URL paths are centralized in `src/constant/UrlPath.ts`.

TabsBar is only shown under `/OA/` and `/manage/` path prefixes.

### State Management

Redux store (`src/store/index.ts`) has 7 slices:

| Slice | Purpose |
|-------|---------|
| `user` | Login user info, user list, search conditions |
| `jobs` | Job list state |
| `autoComplete` | Autocomplete dropdown data |
| `center` | Center/organization data |
| `ui` | SideMenu collapse state, last-visited sections/tabs |
| `permission` | User permissions |
| `ss` | ShareArea (SS) navigation state |

Async thunks live inside each slice file under `src/redux/slices/`. They instantiate API classes from `src/api/index.ts` using config from `src/config/apiConfig.ts` (base path: `/api`, mock header `x-jcl-user: mock-user`).

### Component Organization

```
src/components/
  frame/    # Layout, Header, SideMenu, TabsBar — app shell
  pages/    # Route-level page components
  parts/    # Feature-specific reusable components
  icons/    # Icon components
  ss/       # ShareArea-specific components
  ui/       # shadcn/ui generated components (do not edit manually)
```

### Layout Component

`src/components/frame/Layout.tsx` accepts these optional props:

| Prop | Effect |
|------|--------|
| `hideSideMenu` | Hides the side navigation |
| `hideHeader` | Hides the top header |
| `hideTabs` | Hides the tabs bar |
| `fluid` | Full-width content area (no max-width) |
| `subtitle` | Subtitle text shown in header |

Styling uses Vanilla Extract CSS modules (`.css.ts` files alongside components).

### Path Alias

`@/*` maps to `src/*` in both Vite and TypeScript configs.

### Testing

Jest targets specific files listed in `jest.config.ts` coverage configuration. Key mocks are set up in `test/jest.setup.ts`:
- `react-router` (useLocation, useNavigate, etc.)
- Layout, Tabs, AutoComplete, Pagination components

## Key Patterns

- **Forms**: React Hook Form + zod for validation
- **Notifications**: Sonner `toast` (with position offsets for layout)
- **Icons**: Lucide React
- **Autocomplete**: Custom `AutoCompleteMulti` wrapping React Select
- **File explorer**: Box UI Elements (`box-ui-elements`, excluded from Vite optimization)
- **Animations**: Framer Motion
