import { createSlice, type PayloadAction, createSelector } from "@reduxjs/toolkit";
import type { AppRootState } from "../store";

type ExplorerHistoryState = {
  currentId: string | null;
  back: string[];
  forward: string[];
};

const initialState: ExplorerHistoryState = {
  currentId: null,
  back: [],
  forward: [],
};

export const explorerHistorySlice = createSlice({
  name: "explorerHistory",
  initialState,
  reducers: {
    init: (state, action: PayloadAction<string>) => {
      state.currentId = action.payload;
      state.back = [];
      state.forward = [];
    },
    navigate: (state, action: PayloadAction<string>) => {
      const nextId = action.payload;
      if (state.currentId && state.currentId !== nextId) {
        state.back.push(state.currentId);
      }
      state.currentId = nextId;
      state.forward = [];
    },
    stepBack: (state) => {
      if (state.back.length === 0 || !state.currentId) return;
      const prev = state.back.pop() as string;
      state.forward.push(state.currentId);
      state.currentId = prev;
    },
    stepForward: (state) => {
      if (state.forward.length === 0 || !state.currentId) return;
      const next = state.forward.pop() as string;
      state.back.push(state.currentId);
      state.currentId = next;
    },
    setCurrent: (state, action: PayloadAction<string>) => {
      state.currentId = action.payload;
    },
    reset: () => initialState,
  },
});

export const explorerHistoryActions = explorerHistorySlice.actions;

const rootSelector = (state: AppRootState) => state.explorerHistory;

const selectCurrentId = createSelector(rootSelector, (s) => s.currentId);
const selectBack = createSelector(rootSelector, (s) => s.back);
const selectForward = createSelector(rootSelector, (s) => s.forward);

export const explorerHistorySelector = {
  currentId: selectCurrentId,
  back: selectBack,
  forward: selectForward,
  canBack: createSelector(selectBack, (back) => back.length > 0),
  canForward: createSelector(selectForward, (forward) => forward.length > 0),
};

export const explorerHistoryReducer = explorerHistorySlice.reducer;
