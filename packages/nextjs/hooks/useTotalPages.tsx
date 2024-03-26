import { useEffect, useState } from "react";

export const useTotalPages = (totalItems: number, limit: number) => {
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    if (!totalItems) {
      setTotalPages(0);
      return;
    }

    setTotalPages(Math.ceil(totalItems / limit));
  }, [totalItems, limit]);

  return totalPages;
};
