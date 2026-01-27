import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './jobSlice'
import { userSliceReducer } from '@/redux/slices/userSlice'
import { autoCompleteReducer } from '@/redux/slices/autoCompleteSlice'
import { centerSliceReducer } from '@/redux/slices/centerSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    user: userSliceReducer,
    autoComplete: autoCompleteReducer,
    center: centerSliceReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
