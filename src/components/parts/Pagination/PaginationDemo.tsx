import { useMemo, useState } from "react";
import { CustomPagination } from "./Pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type PaginationQuery = {
  page?: string;
  per_page?: string;
};

const TOTAL_ITEMS = 57;

export const PaginationDemo = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const pagination = useMemo(() => {
    const lastPage = Math.max(1, Math.ceil(TOTAL_ITEMS / perPage));
    const safePage = Math.min(Math.max(1, page), lastPage);
    const from = TOTAL_ITEMS === 0 ? 0 : (safePage - 1) * perPage + 1;
    const to = Math.min(TOTAL_ITEMS, safePage * perPage);
    const makeUrl = (p: number | null) =>
      p ? `/api/jobs?page=${p}&per_page=${perPage}` : null;

    return {
      current_page: safePage,
      last_page: lastPage,
      per_page: perPage,
      from,
      to,
      total: TOTAL_ITEMS,
      first_page_url: makeUrl(1)!,
      prev_page_url: makeUrl(safePage > 1 ? safePage - 1 : null),
      next_page_url: makeUrl(safePage < lastPage ? safePage + 1 : null),
      last_page_url: makeUrl(lastPage)!,
    };
  }, [page, perPage]);

  const visibleItems = useMemo(() => {
    const start = (pagination.current_page - 1) * perPage + 1;
    const count = Math.min(perPage, TOTAL_ITEMS - start + 1);
    return Array.from({ length: count }, (_, i) => start + i);
  }, [pagination.current_page, perPage]);

  const handlePage = (params: PaginationQuery) => {
    const nextPage = Number(params.page ?? params["page"]) || 1;
    const nextPer = Number(params.per_page ?? perPage) || perPage;
    setPerPage(nextPer);
    setPage(nextPage);
  };

  const dummyResponse = {
    data: visibleItems.map((id) => ({
      id,
      name: `ジョブ ${id.toString().padStart(3, "0")}`,
    })),
    pagination,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CustomPagination デモ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CustomPagination<PaginationQuery>
          pagination={pagination}
          onHandle={handlePage}
        />

        <div className="flex flex-wrap gap-2">
          {dummyResponse.data.map((row) => (
            <Badge key={row.id} variant="secondary">
              {row.name}
            </Badge>
          ))}
        </div>

        <pre className="overflow-x-auto rounded-md bg-muted/60 p-3 text-xs">
          {JSON.stringify(dummyResponse.pagination, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};
