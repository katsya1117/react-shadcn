import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './jobSlice'
import { userSliceReducer } from '@/redux/slices/userSlice'
import { autoCompleteReducer } from '@/redux/slices/autoCompleteSlice'
import { centerSliceReducer } from '@/redux/slices/centerSlice'
import { navSliceReducer } from '@/redux/slices/navSlice'
import { permissionReducer } from '@/redux/slices/permissionSlice'
import { uiSliceReducer } from '@/redux/slices/uiSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    user: userSliceReducer,
    autoComplete: autoCompleteReducer,
    center: centerSliceReducer,
    nav: navSliceReducer,
    ui: uiSliceReducer,
    permission: permissionReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
