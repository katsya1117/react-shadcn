import type { Pagination } from "@/api";

export const createMockPagination = (
  override: Partial<Pagination> = {},
): Pagination => ({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  from: 1,
  to: 1,
  total: 1,
  first_page_url: "",
  prev_page_url: null,
  next_page_url: null,
  last_page_url: "",
  ...override,
});
