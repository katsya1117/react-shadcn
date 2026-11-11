// import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store } from './redux/store'
import { Toaster } from './components/ui/sonner'
import { configureBoxFolderCache } from './lib/boxFolderCache'
import { configureCollaborationsCache } from './redux/slices/ssSlice'
import { configureBoxDevToken } from './lib/boxDevToken'

// ローカル開発用の Box トークン（開発時のみ有効）。詳細は src/lib/boxDevToken.ts を参照。
configureBoxDevToken({
  enabled: import.meta.env.DEV,
  envToken: import.meta.env.VITE_BOX_DEV_TOKEN,
})

// Box API の呼び出し回数を減らすためのキャッシュ（SS 画面）。
// 呼び出し回数が問題になるか未確認のため、暫定的に、どちらも既定は無効（性能と最新のデータを優先）。
// 復活させるには、環境変数を true にする（コードの変更は不要）。
//   VITE_BOX_FOLDER_CACHE=true          Content Explorer のフォルダ取得（docs/spec-box-folder-cache.md）
//   VITE_BOX_COLLABORATIONS_CACHE=true  コラボレーター一覧（5 分。ssSlice）
// 開発時は、フォルダ取得キャッシュの命中・未命中をコンソールに出す（有効のときだけ）。
configureBoxFolderCache({
  enabled: import.meta.env.VITE_BOX_FOLDER_CACHE === 'true',
  debug: import.meta.env.DEV,
})
configureCollaborationsCache({
  enabled: import.meta.env.VITE_BOX_COLLABORATIONS_CACHE === 'true',
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
