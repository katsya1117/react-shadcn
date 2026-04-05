import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AppRootState } from "../store";

const sliceName = "ui";

interface UIState {
  isSideMenuCollapsed: boolean;
  lastVisitedSections: Record<string, string | undefined>;
  lastVisitedTabs: Record<string, string | undefined>;
}

const initialState: UIState = {
  isSideMenuCollapsed: false,
  lastVisitedSections: {},
  lastVisitedTabs: {},
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
    setLastVisitedSection: (
      state,
      action: PayloadAction<{ key: string; path: string }>,
    ) => {
      const { key, path } = action.payload;
      state.lastVisitedSections[key] = path;
    },
    setLastVisitedTab: (
      state,
      action: PayloadAction<{ key: string; path: string }>,
    ) => {
      const { key, path } = action.payload;
      state.lastVisitedTabs[key] = path;
    },
  },
});

export const uiActions = uiSlice.actions;
const uiRootSelector = (state: AppRootState) => state.ui;

const selectLastVisitedSections = createSelector(
  uiRootSelector,
  (state) => state.lastVisitedSections,
);
const selectLastVisitedTabs = createSelector(
  uiRootSelector,
  (state) => state.lastVisitedTabs,
);
export const uiSelector = {
  isSideMenuCollapsed: (state: AppRootState) => state.ui.isSideMenuCollapsed,
  lastVisitedSections: selectLastVisitedSections,
  lastVisitedTabs: selectLastVisitedTabs,
};

export const uiSliceReducer = uiSlice.reducer;
