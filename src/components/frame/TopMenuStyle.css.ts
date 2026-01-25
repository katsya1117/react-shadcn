import { style } from '@vanilla-extract/css'

// export const TopMenuStyle = {
//   container: style({
//     width: 'auto',
//     fontSize: '0.9em',
//     borderBottom: 'solid 1px #b5b5b5',
//     backgroundColor: '#f1f1f1',
//     padding: '0',
//   }),
//   tabs: style({
//     height: '25px',
//     padding: '0px'
//   })
// }

export const topbar =
  'sticky top-0 z-40 w-full border-b bg-background'

export const topbarInner =
  'mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4'

export const brand = 'flex items-center gap-2 font-semibold text-lg'

export const navMenuList =
  'flex items-center space-x-1 text-sm'

export const navMenuLink =
  'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
  'hover:bg-muted hover:text-foreground data-[active]:bg-accent data-[active]:text-accent-foreground'

export const quickActions = 'flex items-center gap-2 shrink-0'

export const navDropdownTrigger =
  'px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition ' +
  'aria-[expanded=true]:bg-accent aria-[expanded=true]:text-accent-foreground'
