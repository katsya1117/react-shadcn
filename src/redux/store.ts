import type { AnyAction, Dispatch } from 'redux'

// 最低限のモック Store 型
export type AppDispatch = Dispatch<AnyAction>

// 実際の Redux store は未実装なので、ダミー dispatch を提供
export const mockDispatch: AppDispatch = ((action: AnyAction) => action) as Dispatch<AnyAction>
