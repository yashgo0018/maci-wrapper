import { ArrowLongLeftIcon, ArrowLongRightIcon } from "@heroicons/react/20/solid";

function PaginatorButton({
  pageNumber,
  setPageNumber,
  active,
}: {
  pageNumber: number;
  setPageNumber: (value: number) => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={() => setPageNumber(pageNumber)}
      className={
        active
          ? "inline-flex items-center border-t-2 border-info px-4 pt-4 text-sm font-medium text-info"
          : "inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium  hover:border-accent hover:text-accent"
      }
    >
      {pageNumber}
    </button>
  );
}

export default function Paginator({
  currentPage,
  totalPages,
  setPageNumber,
}: {
  currentPage: number;
  totalPages: number;
  setPageNumber: (value: number) => void;
}) {
  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="-mt-px flex w-0 flex-1">
        <button
          onClick={() => setPageNumber(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex items-center border-t-2 border-transparent pr-1 pt-4 text-sm font-medium hover:border-info hover:text-info disabled:cursor-not-allowed"
        >
          <ArrowLongLeftIcon className="mr-3 h-5 w-5 " aria-hidden="true" />
          Previous
        </button>
      </div>
      <div className="hidden md:-mt-px md:flex">
        {currentPage > 1 && (
          <>
            {currentPage > 5 ? (
              <>
                {new Array(3).fill(0).map((_, index) => (
                  <PaginatorButton key={index} pageNumber={index + 1} setPageNumber={setPageNumber} />
                ))}

                <span className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">
                  ...
                </span>
                <PaginatorButton pageNumber={currentPage - 1} setPageNumber={setPageNumber} />
              </>
            ) : (
              <>
                {new Array(currentPage - 1).fill(0).map((_, index) => (
                  <PaginatorButton key={index} pageNumber={index + 1} setPageNumber={setPageNumber} />
                ))}
              </>
            )}
          </>
        )}

        <PaginatorButton pageNumber={currentPage} setPageNumber={setPageNumber} active />

        {currentPage < totalPages && (
          <>
            {totalPages - currentPage >= 5 ? (
              <>
                <PaginatorButton pageNumber={currentPage + 1} setPageNumber={setPageNumber} />

                <span className="inline-flex items-center border-t-2 border-transparent px-4 pt-4 text-sm font-medium text-gray-500">
                  ...
                </span>
                {new Array(3).fill(0).map((_, index) => (
                  <PaginatorButton key={index} pageNumber={totalPages + index - 2} setPageNumber={setPageNumber} />
                ))}
              </>
            ) : (
              <>
                {new Array(totalPages - currentPage).fill(0).map((_, index) => (
                  <PaginatorButton key={index} pageNumber={currentPage + index + 1} setPageNumber={setPageNumber} />
                ))}
              </>
            )}
          </>
        )}
      </div>
      <div className="-mt-px flex w-0 flex-1 justify-end">
        <button
          onClick={() => setPageNumber(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex items-center border-t-2 border-transparent pl-1 pt-4 text-sm font-medium  hover:border-info hover:text-info disabled:cursor-not-allowed"
        >
          Next
          <ArrowLongRightIcon className="ml-3 h-5 w-5 " aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
