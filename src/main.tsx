// import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store } from './redux/store'
import { Toaster } from './components/ui/sonner'
// [PROTO-CACHE-REFRESH] main.tsx: 試作（フォルダ取得キャッシュ・更新ボタン）。未使用。手順は src/prototypes/box-cache-refresh/README.md
// import { configureBoxFolderCache } from './prototypes/box-cache-refresh/boxFolderCache'
import { configureCollaborationsCache } from './redux/slices/ssSlice'
import { configureBoxDevToken } from './lib/boxDevToken'
import { configureRenderLog } from './hooks/useRenderLog'

// ローカル開発用の Box トークン（開発時のみ有効）。詳細は src/lib/boxDevToken.ts を参照。
configureBoxDevToken({
  enabled: import.meta.env.DEV,
  envToken: import.meta.env.VITE_BOX_DEV_TOKEN,
})

// Box API の呼び出し回数を減らすためのキャッシュ（SS 画面）。
// コラボレーター一覧のキャッシュ（5 分）は、既定は無効。復活させるには、環境変数を true にする（コードの変更は不要）。
//   VITE_BOX_COLLABORATIONS_CACHE=true
// フォルダ取得のキャッシュは、試作（src/prototypes/box-cache-refresh/）。使うときは、次のコメントアウトを外す。
// 開発時は、命中・未命中をコンソールに出す（有効のときだけ）。
// configureBoxFolderCache({
//   enabled: import.meta.env.VITE_BOX_FOLDER_CACHE === 'true',
//   debug: import.meta.env.DEV,
// })
configureCollaborationsCache({
  enabled: import.meta.env.VITE_BOX_COLLABORATIONS_CACHE === 'true',
})

// 無駄な再レンダリングの調査用ログ（useRenderLog。開発時のみ）。.env.local に VITE_RENDER_LOG=true で有効。
// 詳細は docs/spec-use-render-log.md を参照。
configureRenderLog({
  enabled: import.meta.env.DEV && import.meta.env.VITE_RENDER_LOG === 'true',
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
