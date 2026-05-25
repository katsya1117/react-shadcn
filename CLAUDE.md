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
- **Main layout** (default): `<Layout><Outlet /></Layout>` wraps all routes under `/job/`, `/OA/`, `/manage/`, `/user/`
- **SS layout**: `<SS />` renders its own `<Layout fluid subtitle={...}>` directly, used for `/job/ShareArea/:rootFolderId`

All URL paths are centralized in `src/constants/UrlPath.ts`.

TabsBar is only shown under `/OA/` and `/manage/` path prefixes (controlled inside `TabsBar.tsx` via `useLocation`).

When `VITE_USE_SIMPLE_SSO=true`, the root `/` renders `SimpleSingleSignOn` instead of `MyPage`.

### State Management

Redux store (`src/redux/store.ts`) has 7 slices:

| Slice | Purpose |
|-------|---------|
| `user` | Login user info, user list, AD user search, Box token |
| `jobs` | Job list and search state |
| `autoComplete` | Autocomplete dropdown data (users/groups) |
| `center` | Center/organization data |
| `ui` | SideMenu collapse state, last-visited sections/tabs |
| `permission` | User permissions |
| `ss` | ShareArea folder navigation history per root folder |

Async thunks live inside each slice file under `src/redux/slices/`. They instantiate API classes from `src/api/index.ts` using config from `src/config/apiConfig.ts`.

Always use the typed wrappers from `src/redux/hooks.ts` instead of raw `useDispatch`/`useSelector`:
```ts
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
```

Error handling for slice rejected states follows the `SliceError` pattern from `src/redux/common/error.ts`: `initialSliceError`, `setSliceError`, and `parseApiError` (parses axios validation/title errors).

### API Layer

`src/api/index.ts` is a **full mock implementation** — there are no real HTTP calls. All API classes (`UsersApi`, `BoxApi`, `CenterApi`, `ADUserApi`, `AutoCompleteApi`, `SearchSetApi`) return in-memory data from `src/api/mock/`. This is intentional for local development.

### Component Organization

```
src/
  pages/          # Route-level page components (directly under src/, not under components/)
  components/
    layout/       # Layout, Header, SideMenu, TabsBar — app shell
    common/       # Shared feature components (AutoComplete, Pagination, Confirm, BoxManager, etc.)
    ss/           # ShareArea-specific components (CollaborationPanel, PathBar)
    icons/        # Icon components
    ui/           # shadcn/ui generated components (do not edit manually)
```

### Layout Component

`src/components/layout/Layout.tsx` accepts these optional props:

| Prop | Effect |
|------|--------|
| `hideSideMenu` | Hides the side navigation |
| `hideHeader` | Hides the top header |
| `hideTabs` | Hides the tabs bar |
| `fluid` | Full-width content area (no max-width) |
| `subtitle` | Subtitle text shown in header |
| `className` | Extra class on the root container |

Styling uses Vanilla Extract CSS modules (`.css.ts` files alongside components). shadcn utility `cn()` is in `src/lib/utils.ts`.

### SS (ShareArea) Feature

The SS page (`src/pages/SS.tsx`) manages Box folder collaboration. Key points:
- Only folder IDs listed in `src/config/shareAreaConfig.ts` (`SHARE_AREAS`) are valid roots — others redirect away
- `useBoxExplorer` hook (`src/hooks/useBoxExplorer.ts`) manages folder navigation history (back/forward) coordinating between Box SDK `navigateTo`, local state, and the `ss` Redux slice
- The hook uses a dual ref+state pattern: refs for immediate reads inside event handlers, state for rendering

### Path Alias

`@/*` maps to `src/*` in both Vite and TypeScript configs.

### Testing

Jest uses `ts-jest` with ESM. Key mocks in `test/jest.setup.ts`:
- `react-router` — all hooks (useLocation, useNavigate, useParams, etc.)
- `@/components/ui/tabs`
- `@/components/layout/Layout`
- `@/components/common/AutoComplete/AutoCompleteMulti`
- `@/components/common/Pagination/Pagination`

Component-level `__mocks__/` directories sit alongside the real components for Jest's automatic mock resolution.

## Key Patterns

- **Forms**: React Hook Form + zod for validation
- **Notifications**: Sonner `toast` (imported from `@/components/ui/sonner`)
- **Icons**: Lucide React
- **Autocomplete**: `AutoCompleteMulti` / `AutoCompleteSingle` wrapping React Select
- **File explorer**: Box UI Elements (`box-ui-elements`, excluded from Vite optimization)
- **Animations**: Framer Motion
