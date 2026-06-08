import React from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const PathBar = ({
  onCopyPath,
  onGoBack,
  onGoForward,
  onOpenBox,
  onOpenExplorer,
}: any) => (
  <div data-testid="path-bar">
    <button onClick={onCopyPath}>copy-path</button>
    <button onClick={onGoBack}>go-back</button>
    <button onClick={onGoForward}>go-forward</button>
    <button onClick={onOpenBox}>open-box</button>
    <button onClick={onOpenExplorer}>open-explorer</button>
  </div>
);

export default PathBar;
