import { configureStore } from "@reduxjs/toolkit";
import jobsReducer from "./slices/jobSlice";
import { userSliceReducer } from "./slices/userSlice";
import { autoCompleteReducer } from "./slices/autoCompleteSlice";
import { centerSliceReducer } from "./slices/centerSlice";
import { uiSliceReducer } from "./slices/uiSlice";
import { permissionReducer } from "./slices/permissionSlice";
import { ssSliceReducer } from "./slices/ssSlice";

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
export type AppRootState = RootState;
