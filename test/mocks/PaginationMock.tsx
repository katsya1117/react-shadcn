import React from "react";

const CustomPagination = ({ onHandle }: any) => (
  <button data-testid="pagination-mock" onClick={() => onHandle({ page: 2 })}>
    paginate
  </button>
);

export { CustomPagination };
