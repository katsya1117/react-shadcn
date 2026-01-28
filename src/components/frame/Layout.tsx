import type { PropsWithChildren } from 'react'
import { LayoutStyle } from './LayoutStyle.css'
import TopMenu from './TopMenu'

const Layout = ({ children }: PropsWithChildren) => (
  <div className={LayoutStyle.container}>
    <TopMenu />
    <div className={LayoutStyle.contents}>{children}</div>
  </div>
)

export default Layout
