export type SliceError = {
  message: string
  detail?: string
}

export const initialSliceError: SliceError = {
  message: '',
  detail: '',
}

export const rejectedMessage = '処理に失敗しました。時間をおいて再度お試しください。'

export const setSliceError = (message: string, detail?: string): SliceError => ({
  message,
  detail,
})
