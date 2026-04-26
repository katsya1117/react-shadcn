import React from "react";

export const CustomPagination = ({ onHandle }: any) => (
  <button data-testid="pagination-mock" onClick={() => onHandle({ page: 2 })}>
    paginate
  </button>
);
