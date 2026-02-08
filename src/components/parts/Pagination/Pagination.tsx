import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pagination as PaginationProps } from "../../../api";
import { useMemo } from "react";

export const CustomPagination = <T,>(props: {
  pagination: PaginationProps;
  onHandle: (params: T) => void;
}) => {
  const urlParse = (url?: string | null) => {
    if (!url) return;
    const parser = new URL("http://localhost" + url);
    props.onHandle(Object.fromEntries(parser.searchParams.entries()) as T);
  };
  const disabledClass = "pointer-events-none opacity-50";
  const currentPage = props.pagination.current_page;
  const lastPage = props.pagination.last_page;
  const per = props.pagination.per_page;
  const from = props.pagination.from;
  const to = props.pagination.to;
  const totalCount = props.pagination.total;
  const firstUrl = props.pagination.first_page_url;
  const prevUrl = props.pagination.prev_page_url ?? null;
  const nextUrl = props.pagination.next_page_url ?? null;
  const lastUrl = props.pagination.last_page_url;

  //   const pages = useMemo(() => {
  //   const nums: number[] = [];
  //   for (let i = 1; i <= lastPage; i++) {
  //     if (i === currentPage - 1 || i === currentPage || i === currentPage + 1) {
  //       nums.push(i);
  //     }
  //   }
  //   return nums;
  // }, [currentPage, lastPage]);

  // これでもいい
  const displayNums = () => {
    const nums: number[] = [];
    for (let i = 1; i <= lastPage; i++) {
      if (i === currentPage - 1 || i === currentPage || i === currentPage + 1) {
        nums.push(i);
      }
    }
    return nums;
  };
  const pages = displayNums();

  return (
    <div className="flex flex-col w-full flex-wrap items-center justify-center space-y-4 py-6">
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">{from}</span>{" "}-{" "}
        <span className="font-semibold text-foreground">{to}</span>{" "}/{" "}
        <span className="font-semibold text-foreground">{totalCount}</span>件
        {/* Items per Page: {per} {from} - {to} of {totalCount} */}
      </div>
      <Pagination className="w-auto">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault();
                urlParse(firstUrl);
              }}
              aria-disabled={currentPage === 1}
              tabIndex={currentPage === 1 ? -1 : 0}
              className={cn("size-10", currentPage === 1 && disabledClass)}
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
          {currentPage > 2 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          {pages.map((num) => (
            <PaginationItem key={num}>
              {num === currentPage - 1 ? (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    urlParse(prevUrl);
                  }}
                >
                  {num}
                </PaginationLink>
              ) : num === currentPage ? (
                <PaginationLink isActive={true}>{num}</PaginationLink>
              ) : num === currentPage + 1 ? (
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    urlParse(nextUrl);
                  }}
                >
                  {num}
                </PaginationLink>
              ) : (
                <></>
              )}
            </PaginationItem>
          ))}
          {currentPage < lastPage - 1 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink
              onClick={(e) => {
                e.preventDefault();
                urlParse(lastUrl);
              }}
              aria-disabled={currentPage === lastPage}
              tabIndex={currentPage === lastPage ? -1 : 0}
              className={cn(
                "size-10",
                currentPage === lastPage && disabledClass,
              )}
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

//   // Fallback pagination (page/per/total numbers)
//   const [internalPage, setInternalPage] = useState(page ?? 1);
//   const [internalPer, setInternalPer] = useState(perPage ?? 10);

//   const currentPage = page ?? internalPage;
//   const currentPer = perPage ?? internalPer;
//   const totalCount = total ?? 0;
//   const totalPages = Math.max(1, Math.ceil(totalCount / (currentPer || 1)));

//   const emitHandle = (nextPage: number, nextPer: number) => {
//     if (!onHandle) return;
//     if (buildParams) {
//       onHandle(buildParams(nextPage, nextPer));
//     } else {
//       onHandle(({ page: nextPage, per_page: nextPer } as unknown) as T);
//     }
//   };

//   const setPageSafe = (next: number) => {
//     const safe = Math.min(Math.max(1, next), totalPages);
//     if (onHandle) {
//       emitHandle(safe, currentPer);
//     } else if (onPageChange) {
//       onPageChange(safe);
//     } else {
//       setInternalPage(safe);
//     }
//   };

//   const setPerSafe = (next: number) => {
//     const safe = next > 0 ? next : 10;
//     if (onHandle) {
//       emitHandle(1, safe);
//     } else if (onPerPageChange) {
//       onPerPageChange(safe);
//     } else {
//       setInternalPer(safe);
//       setInternalPage(1);
//     }
//   };

//   const start = totalCount === 0 ? 0 : (currentPage - 1) * currentPer + 1;
//   const end = Math.min(totalCount, currentPage * currentPer);

//   return (
//     <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 px-4 py-3 text-sm">
//       <div className="flex items-center gap-2">
//         <Pagination className="w-auto">
//           <PaginationContent>
//             <PaginationItem>
//               <PaginationPrevious
//                 href="#prev"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   setPageSafe(currentPage - 1);
//                 }}
//                 aria-disabled={currentPage <= 1}
//                 tabIndex={currentPage <= 1 ? -1 : 0}
//                 className={cn(currentPage <= 1 && "pointer-events-none opacity-50")}
//               />
//             </PaginationItem>
//             <PaginationItem>
//               <PaginationEllipsis />
//             </PaginationItem>
//             <PaginationItem>
//               <PaginationNext
//                 href="#next"
//                 onClick={(e) => {
//                   e.preventDefault();
//                   setPageSafe(currentPage + 1);
//                 }}
//                 aria-disabled={currentPage >= totalPages}
//                 tabIndex={currentPage >= totalPages ? -1 : 0}
//                 className={cn(currentPage >= totalPages && "pointer-events-none opacity-50")}
//               />
//             </PaginationItem>
//           </PaginationContent>
//         </Pagination>
//         <span className="text-xs text-muted-foreground">
//           {start} - {end} / {totalCount} 件 ({currentPage}/{totalPages})
//         </span>
//       </div>
//       <div className="flex items-center gap-2">
//         <span className="text-xs text-muted-foreground">表示件数</span>
//         <select
//           className="h-9 rounded-md border border-input bg-background px-2"
//           value={currentPer}
//           onChange={(e) => setPerSafe(Number(e.target.value))}
//         >
//           {[10, 20, 50].map((n) => (
//             <option key={n} value={n}>
//               {n}
//             </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   );
// };

// import { useState } from 'react'

// type PaginationPayload = {
//   page: number
//   per_page: number
//   total: number
// }

// type Props<T> = {
//   /**
//    * pagination オブジェクトを渡す場合はこちらを使用
//    */
//   pagination?: PaginationPayload
//   /**
//    * 個別指定でも可（後方互換）
//    */
//   page?: number
//   perPage?: number
//   total?: number
//   /**
//    * ページ変更ハンドラ（pagination を渡さない場合）
//    */
//   onPageChange?: (page: number) => void
//   /**
//    * 件数変更ハンドラ（pagination を渡さない場合）
//    */
//   onPerPageChange?: (per: number) => void
//   /**
//    * pagination と一緒に検索パラメータを再発行する汎用ハンドラ
//    */
//   onHandle?: (params: T) => void
//   /**
//    * onHandle に渡すパラメータをカスタム生成したい場合
//    */
//   buildParams?: (page: number, perPage: number) => T
// }

// export const CustomPagination = <T,>({
//   pagination,
//   page,
//   perPage,
//   total,
//   onPageChange,
//   onPerPageChange,
//   onHandle,
//   buildParams,
// }: Props<T>) => {
//   const [internalPage, setInternalPage] = useState(page ?? pagination?.page ?? 1)
//   const [internalPer, setInternalPer] = useState(perPage ?? pagination?.per_page ?? 10)

//   const currentPage = page ?? pagination?.page ?? internalPage
//   const currentPer = perPage ?? pagination?.per_page ?? internalPer
//   const totalCount = pagination?.total ?? total ?? 0
//   const totalPages = Math.max(1, Math.ceil(totalCount / (currentPer || 1)))

//   const emitHandle = (nextPage: number, nextPer: number) => {
//     if (!onHandle) return
//     if (buildParams) {
//       onHandle(buildParams(nextPage, nextPer))
//     } else {
//       onHandle(({ page: nextPage, per_page: nextPer } as unknown) as T)
//     }
//   }

//   const handlePageChange = (next: number) => {
//     const safe = Math.min(Math.max(1, next), totalPages)
//     if (onHandle) {
//       emitHandle(safe, currentPer)
//     } else if (onPageChange) {
//       onPageChange(safe)
//     } else {
//       setInternalPage(safe)
//     }
//   }

//   const handlePerChange = (next: number) => {
//     const safe = next > 0 ? next : 10
//     if (onHandle) {
//       emitHandle(1, safe)
//     } else if (onPerPageChange) {
//       onPerPageChange(safe)
//     } else {
//       setInternalPer(safe)
//       setInternalPage(1)
//     }
//   }

//   const prev = () => handlePageChange(currentPage - 1)
//   const next = () => handlePageChange(currentPage + 1)

//   const start = totalCount === 0 ? 0 : (currentPage - 1) * currentPer + 1
//   const end = Math.min(totalCount, currentPage * currentPer)

//   return (
//     <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 px-3 py-2 text-sm">
//       <div className="flex items-center gap-2">
//         <button className="underline disabled:text-muted-foreground" onClick={prev} disabled={currentPage <= 1}>
//           前へ
//         </button>
//         <span>
//           {currentPage} / {totalPages}
//         </span>
//         <button
//           className="underline disabled:text-muted-foreground"
//           onClick={next}
//           disabled={currentPage >= totalPages}
//         >
//           次へ
//         </button>
//         <span className="text-xs text-muted-foreground">
//           {start} - {end} / {totalCount} 件
//         </span>
//       </div>
//       <div className="flex items-center gap-2">
//         <span>表示件数</span>
//         <select
//           className="rounded-md border border-input bg-background px-2 py-1"
//           value={currentPer}
//           onChange={(e) => handlePerChange(Number(e.target.value))}
//         >
//           {[10, 20, 50].map((n) => (
//             <option key={n} value={n}>
//               {n}
//             </option>
//           ))}
//         </select>
//       </div>
//     </div>
//   )
