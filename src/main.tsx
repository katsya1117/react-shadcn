// import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store } from './redux/store'
import { Toaster } from './components/ui/sonner'
import { configureBoxFolderCache } from './lib/boxFolderCache'
import { configureBoxDevToken } from './lib/boxDevToken'

// ローカル開発用の Box トークン（開発時のみ有効）。詳細は src/lib/boxDevToken.ts を参照。
configureBoxDevToken({
  enabled: import.meta.env.DEV,
  envToken: import.meta.env.VITE_BOX_DEV_TOKEN,
})

// Box Content Explorer のフォルダ取得キャッシュ。VITE_BOX_FOLDER_CACHE=false で無効にできる。
// 開発時は、命中・未命中をコンソールに出す（実際の利用での再訪の割合を測るため）。
// 詳細は docs/spec-box-folder-cache.md を参照。
configureBoxFolderCache({
  enabled: import.meta.env.VITE_BOX_FOLDER_CACHE !== 'false',
  debug: import.meta.env.DEV,
})

createRoot(document.getElementById('root')!).render(
  // <StrictMode>
  //   <Provider store={store}>
  //       <Toaster />
  //       <App />
  //   </Provider>
  // </StrictMode>
    <Provider store={store}>
        <Toaster />
        <App />
    </Provider>
  
)
