import { useMemo, useState } from "react";

export type UsePaginationResult<T> = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  items: T[];
  setPage: (page: number) => void;
  setPerPage: (per: number) => void;
};

/**
 * シンプルな配列向けページネーションフック。
 * 任意の配列に適用でき、配列が変わるとページをリセットする。
 */
export const usePagination = <T,>(source: T[], initialPerPage = 10): UsePaginationResult<T> => {
  const [page, setPageState] = useState(1);
  const [perPage, setPerPageState] = useState(initialPerPage);

  const total = source.length;
  const totalPages = Math.max(1, Math.ceil(total / (perPage || 1)));

  const safePage = Math.min(Math.max(1, page), totalPages);
  const items = useMemo(() => {
    const start = (safePage - 1) * perPage;
    return source.slice(start, start + perPage);
  }, [source, safePage, perPage]);

  const setPage = (next: number) => {
    const safe = Math.min(Math.max(1, next), totalPages);
    setPageState(safe);
  };

  const setPerPage = (next: number) => {
    const safe = next > 0 ? next : initialPerPage;
    setPerPageState(safe);
    setPageState(1);
  };

  return { page: safePage, perPage, total, totalPages, items, setPage, setPerPage };
};
