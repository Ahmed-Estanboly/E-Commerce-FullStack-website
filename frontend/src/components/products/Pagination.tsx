interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-center gap-6 sm:mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="min-h-11 px-3 py-2 text-sm text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
      >
        Previous
      </button>

      <span className="text-sm font-medium text-ink tabular">
        {currentPage} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="min-h-11 px-3 py-2 text-sm text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
      >
        Next
      </button>
    </div>
  );
}

export default Pagination;