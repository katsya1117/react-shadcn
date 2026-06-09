// @vanilla-extract/css の API スタブ。
// .css.ts はビルド時 CSS なので、テストでは生成されるクラス名を空文字などに潰すだけでよい。
module.exports = {
  style: () => "",
  styleVariants: () => ({}),
  globalStyle: () => {},
  createVar: () => "",
  fallbackVar: (...args) => args[args.length - 1],
  assignVars: () => ({}),
};
