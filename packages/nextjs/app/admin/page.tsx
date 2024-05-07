"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import CreatePollModal from "./_components/CreatePollModal";
import PollStatusModal from "./_components/PollStatusModal";
import { useAccount } from "wagmi";
import Paginator from "~~/components/Paginator";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useFetchPolls } from "~~/hooks/useFetchPolls";
import { useTotalPages } from "~~/hooks/useTotalPages";
import { Poll, PollStatus } from "~~/types/poll";

export default function AdminPage() {
  const { address } = useAccount();
  const [openCreatePollModal, setOpenCreatePollModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: admin } = useScaffoldContractRead({ contractName: "MACIWrapper", functionName: "owner" });
  const [limit] = useState(10);
  const { totalPolls, polls, refetch: refetchPolls } = useFetchPolls(currentPage, limit);
  const totalPages = useTotalPages(totalPolls, limit);
  const [selectedPollForStatusModal, setSelectedPollForStatusModal] = useState<Poll>();

  useEffect(() => {
    if (!admin || !address) return;
    if (address !== admin) {
      redirect("/");
    }
  }, [address, admin]);

  return (
    <div className="container mx-auto pt-10">
      <div className="flex">
        <div className="flex-1 text-2xl">Polls</div>
        <button
          className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold"
          onClick={() => setOpenCreatePollModal(true)}
        >
          Create Poll
        </button>
      </div>

      {polls && polls.length !== 0 ? (
        <>
          <table className="border-separate w-full mt-7 mb-4">
            <thead>
              <tr className="text-lg font-extralight">
                <th className="border border-slate-600 bg-primary">Poll Name</th>
                <th className="border border-slate-600 bg-primary">Start Time</th>
                <th className="border border-slate-600 bg-primary">End Time</th>
                <th className="border border-slate-600 bg-primary">Status</th>
              </tr>
            </thead>
            <tbody>
              {polls.map(poll => (
                <tr key={poll.id} className="pt-10 text-center">
                  <td>{poll.name}</td>
                  <td>{new Date(Number(poll.startTime) * 1000).toLocaleString()}</td>
                  <td>{new Date(Number(poll.endTime) * 1000).toLocaleString()}</td>
                  <td>
                    {poll.status == PollStatus.CLOSED ? (
                      <>
                        {poll.status}{" "}
                        <button className=" text-accent underline" onClick={() => setSelectedPollForStatusModal(poll)}>
                          (Required Actions)
                        </button>
                      </>
                    ) : poll.status == PollStatus.RESULT_COMPUTED ? (
                      <>
                        {poll.status}{" "}
                        <Link href={`/polls/${poll.id}`} className="text-accent underline">
                          (View Results)
                        </Link>
                      </>
                    ) : (
                      poll.status
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Paginator currentPage={currentPage} totalPages={totalPages} setPageNumber={setCurrentPage} />
          )}
        </>
      ) : (
        <div>No polls found</div>
      )}

      <CreatePollModal refetchPolls={refetchPolls} show={openCreatePollModal} setOpen={setOpenCreatePollModal} />

      <PollStatusModal
        poll={selectedPollForStatusModal}
        setOpen={() => setSelectedPollForStatusModal(undefined)}
        show={Boolean(selectedPollForStatusModal)}
      />
    </div>
  );
}
