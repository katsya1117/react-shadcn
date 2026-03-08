declare const Box: any;

declare global {
  interface Window {
    Box?: typeof Box;
  }
}

export {};
