"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import CreatePollModal from "./_components/CreatePollModal";
import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export default function AdminPage() {
  const { address } = useAccount();
  const [openCreatePollModal, setOpenCreatePollModal] = useState(false);

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
    functionName: "paginatePolls",
    args: [1n, 10n],
  });

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
      <CreatePollModal setOpen={setOpenCreatePollModal} show={openCreatePollModal} />
    </div>
  );
}
