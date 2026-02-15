import { StrictMode } from 'react'
import { Provider } from 'react-redux'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store } from './store'
import { Toaster } from './components/ui/sonner'

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
