import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "./jobSlice";
import { userSliceReducer } from "@/redux/slices/userSlice";
import { autoCompleteReducer } from "@/redux/slices/autoCompleteSlice";
import { centerSliceReducer } from "@/redux/slices/centerSlice";
import { uiSliceReducer } from "@/redux/slices/uiSlice";
import { permissionReducer } from "@/redux/slices/permissionSlice";
import { ssSliceReducer } from "@/redux/slices/ssSlice";

export const store = configureStore({
  reducer: {
    jobs: jobsReducer,
    user: userSliceReducer,
    autoComplete: autoCompleteReducer,
    center: centerSliceReducer,
    ui: uiSliceReducer,
    permission: permissionReducer,
    ss: ssSliceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
