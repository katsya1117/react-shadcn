import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppRootState } from "../store";

type NavState = {
  lastVisited: Record<string, string | undefined>;
};

const sliceName = "nav";

const initialState: NavState = {
  lastVisited: {},
};

const navSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    setLastVisited: (
      state,
      action: PayloadAction<{ key: string; path: string }>,
    ) => {
      const { key, path } = action.payload;
      state.lastVisited[key] = path;
    },
  },
});

export const navActions = navSlice.actions;
export const navSliceReducer = navSlice.reducer;

const navRootSelector = (state: AppRootState) => state.nav;

export const navSelector = {
  lastVisitedSelector: () =>
    createSelector(navRootSelector, (state) => state.lastVisited),
};
