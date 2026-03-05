# myhouz mobile

React Native (Expo) mobile app for the myhouz household management platform.

## Styling

- **NativeWind v4** (Tailwind for React Native) — always use `className` over inline `style={{}}`
- **Always prefer `cn()` from `@/utils/cn`** for conditional class merging (clsx + tailwind-merge) — never mix `style={{}}` with `className`
- Only use inline `style` when Tailwind literally can't express it (e.g., SVG props, Ionicons color, dynamic computed values)
- `colors.ts` constants are for Ionicons/SVG props that don't accept className
- Dark mode: use `dark:` variant classes, never hardcode colors for dark mode in inline styles
- Design tokens defined in `tailwind.config.js` and mirrored in `src/styles/colors.ts`
- Custom values in `tailwind.config.js` are preferred over arbitrary value syntax (`[360px]`) — especially with breakpoint prefixes

## Responsive Breakpoints

- Use NativeWind responsive breakpoints for tablet layouts
- **Primary test device:** iPad mini (A17 Pro) — portrait width is **744pt** (below Tailwind's `md:` 768px!)
- Use `sm:` (640px) for tablet portrait layouts — fires on iPad mini (744pt) but NOT on any iPhone (~430pt max)
- Use `lg:` (1024px) for tablet landscape layouts
- `md:` (768px) does NOT fire on iPad mini portrait — avoid for tablet portrait styles
- Keep other tablets in mind (iPad Air 820pt, iPad Pro 834pt) — `sm:` covers all of them
- Define custom spacing/sizing in `tailwind.config.js` `theme.extend` instead of using arbitrary values with breakpoints

## Stack

- **Framework:** Expo (SDK 52) + Expo Router (file-based routing)
- **Language:** TypeScript
- **Styling:** NativeWind v4 (Tailwind CSS for React Native)
- **State:** Zustand (persisted to MMKV)
- **Data fetching:** React Query + Axios HTTP client
- **Auth:** Supabase Auth (direct client for auth ops, API for data)
- **i18n:** react-i18next (pt-BR default, en-US)
- **Animations:** Reanimated v4
- **Package Manager:** yarn

## Environment Variables

Uses `EXPO_PUBLIC_` prefix (baked at build time):
- `EXPO_PUBLIC_API_URL` — Next.js backend URL
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable key

For EAS builds, set these in the Expo dashboard (local `.env` is not read by cloud builds).

## Key Directories

- `src/app/` — Expo Router pages
- `src/components/ui/` — Reusable UI components
- `src/hooks/` — Custom hooks (useAuth, useItems, useRoutines, etc.)
- `src/stores/` — Zustand stores (auth, household, app, toast)
- `src/core/config/` — App bootstrap, env, HTTP client
- `src/data/` — API endpoints, Supabase client, storage
- `src/i18n/` — Translations (en-US.ts, pt-BR.ts)
- `src/styles/` — colors.ts, global.css
