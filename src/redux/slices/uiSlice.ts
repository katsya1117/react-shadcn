import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AppRootState } from "../store";

const sliceName = "ui";

interface UIState {
  isSideMenuCollapsed: boolean;
  lastVisited: Record<string, string | undefined>;
}

const initialState: UIState = {
  isSideMenuCollapsed: false,
  lastVisited: {},
};

export const uiSlice = createSlice({
  name: sliceName,
  initialState,
  reducers: {
    toggleSideMenu: (state) => {
      state.isSideMenuCollapsed = !state.isSideMenuCollapsed;
    },
    setSideMenuCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSideMenuCollapsed = action.payload;
    },
    setLastVisited: (
      state,
      action: PayloadAction<{ key: string; path: string }>,
    ) => {
      const { key, path } = action.payload;
      state.lastVisited[key] = path;
    },
  },
});

export const uiActions = uiSlice.actions;
const uiRootSelector = (state: AppRootState) => state.ui;

const selectLastVisited = createSelector(
  uiRootSelector,
  (state) => state.lastVisited,
);
export const uiSelector = {
  isSideMenuCollapsed: (state: AppRootState) => state.ui.isSideMenuCollapsed,
  lastVisited: selectLastVisited,
};

export const uiSliceReducer = uiSlice.reducer;
