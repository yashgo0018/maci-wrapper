"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import CreatePollModal from "./_components/CreatePollModal";
import { useAccount } from "wagmi";
import Paginator from "~~/components/Paginator";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { useFetchPolls } from "~~/hooks/useFetchPolls";
import { useTotalPages } from "~~/hooks/useTotalPages";

export default function AdminPage() {
  const { address } = useAccount();
  const [openCreatePollModal, setOpenCreatePollModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { data: admin } = useScaffoldContractRead({ contractName: "MACI", functionName: "owner" });
  const [limit] = useState(10);
  const { totalPolls, polls } = useFetchPolls(currentPage, limit);
  const totalPages = useTotalPages(totalPolls, limit);

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
                <th className="border border-slate-600 bg-primary">End Time</th>
                <th className="border border-slate-600 bg-primary">Start Time</th>
                <th className="border border-slate-600 bg-primary">Status</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll: any) => (
                <tr key={poll.id} className="pt-10 text-center">
                  <td>{poll.name}</td>
                  <td>{new Date(Number(poll.startTime) * 1000).toLocaleString()}</td>
                  <td>{new Date(Number(poll.endTime) * 1000).toLocaleString()}</td>
                  <td>Poll Open</td>
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

      <CreatePollModal setOpen={setOpenCreatePollModal} show={openCreatePollModal} />
    </div>
  );
}
