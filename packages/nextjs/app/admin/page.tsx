"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import CreatePollModal from "./_components/CreatePollModal";
import { useAccount } from "wagmi";
import Paginator from "~~/components/Paginator";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export default function AdminPage() {
  const { address } = useAccount();
  const [openCreatePollModal, setOpenCreatePollModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: admin } = useScaffoldContractRead({ contractName: "MACI", functionName: "owner" });

  useEffect(() => {
    if (!admin || !address) return;
    if (address !== admin) {
      redirect("/");
    }
  }, [address, admin]);

  const { data: totalPolls } = useScaffoldContractRead({
    contractName: "PollManager",
    functionName: "totalPolls",
  });

  const { data: polls } = useScaffoldContractRead({
    contractName: "PollManager",
    functionName: "fetchPolls",
    args: [BigInt(currentPage), 10n, true],
  });

  useEffect(() => {
    if (!totalPolls) {
      setTotalPages(0);
      return;
    }
    setTotalPages(Math.ceil(Number(totalPolls) / 10));
  }, [totalPolls]);

  console.log(totalPolls);
  console.log(polls);

  return (
    <div className="container mx-auto pt-10">
      <div className="flex">
        <div className="flex-1 text-2xl">Polls</div>
        <button className="bg-primary px-3 py-2 rounded-lg" onClick={() => setOpenCreatePollModal(true)}>
          Create Poll
        </button>
      </div>
      {polls && polls.length !== 0 ? (
        <div>
          <div className="mb-2">
            {polls.map((poll: any) => (
              <div key={poll.id} className="bg-neutral text-neutral-content p-4 mt-4 rounded-lg">
                <div className="text-xl font-bold">{poll.title}</div>
                <div className="mt-2">
                  {poll.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center">
                      <input type="radio" name={poll.title} value={option} />
                      <label className="ml-2">{option}</label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {/** paginator */}
          <Paginator currentPage={currentPage} totalPages={totalPages} setPageNumber={setCurrentPage} />
        </div>
      ) : (
        <div>No polls found</div>
      )}

      <CreatePollModal setOpen={setOpenCreatePollModal} show={openCreatePollModal} />
    </div>
  );
}
