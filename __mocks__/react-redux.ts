// Re-export everything from real react-redux
// This file exists only to satisfy Jest's __mocks__ resolution —
// react-redux itself works correctly with --experimental-vm-modules
export {
  useDispatch,
  useSelector,
  Provider,
  connect,
  combineReducers,
  batch,
  shallowEqual,
  createSelectorHook,
  createDispatchHook,
} from "react-redux";
