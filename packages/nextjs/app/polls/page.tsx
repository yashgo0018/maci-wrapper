"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Paginator from "~~/components/Paginator";
import HoverBorderCard from "~~/components/card/HoverBorderCard";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";
import { useFetchPolls } from "~~/hooks/useFetchPolls";
import { useTotalPages } from "~~/hooks/useTotalPages";

export default function Polls() {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const { totalPolls, polls } = useFetchPolls(currentPage, limit);
  const totalPages = useTotalPages(totalPolls, limit);
  useAuthUserOnly({});

  console.log(polls);

  const router = useRouter();

  return (
    <div className="container mx-auto pt-10">
      <div className="flex mb-5">
        <div className="flex-1 text-2xl">Polls</div>
      </div>
      {polls !== undefined ? (
        polls.length !== 0 ? (
          <>
            <div className="mb-3 flex flex-col gap-y-2">
              {polls.map(poll => (
                <HoverBorderCard key={poll.id} showArrow={true} click={() => router.push(`/polls/${poll.id}`)}>
                  <div className="flex">
                    <div className="flex-1 flex flex-col">
                      <h1 className="text-lg font-bold">
                        {poll.name} ({poll.status})
                      </h1>
                      <h1 className="text-md text-sm">{poll.options.length} Candidates</h1>
                    </div>
                  </div>
                </HoverBorderCard>
              ))}
            </div>
            {totalPages > 1 && (
              <Paginator currentPage={currentPage} totalPages={totalPages} setPageNumber={setCurrentPage} />
            )}
          </>
        ) : (
          <div>No polls found</div>
        )
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
