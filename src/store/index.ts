import { configureStore } from '@reduxjs/toolkit'
import jobsReducer from './jobSlice'
import { userSliceReducer } from '@/redux/slices/userSlice'
import { autoCompleteReducer } from '@/redux/slices/autoCompleteSlice'

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    user: userSliceReducer,
    autoComplete: autoCompleteReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
