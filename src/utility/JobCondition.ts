import type { SearchSetConditionItem } from '@/api'

export const toConditionString = (items: SearchSetConditionItem[]) =>
  items.map((c) => `${c.field}${c.op}${c.value}`).join(';')
