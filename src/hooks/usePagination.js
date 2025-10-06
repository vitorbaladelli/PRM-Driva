import React, { useState, useMemo, useEffect } from 'react';
import Paginator from '../components/common/Paginator';

const usePagination = (data, itemsPerPage = 10) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    }, [data, currentPage, itemsPerPage]);

    useEffect(() => {
      if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(totalPages);
      } else if (currentPage < 1 && totalPages > 0) {
        setCurrentPage(1);
      } else if (data.length > 0 && totalPages > 0 && currentPage === 0) {
        setCurrentPage(1);
      }
    }, [data.length, totalPages, currentPage]);

    const PaginatorComponent = () => <Paginator currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />;

    return [paginatedData, PaginatorComponent, currentPage, setCurrentPage];
};

export default usePagination;
