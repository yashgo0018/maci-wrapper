"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import "../assets/anim.css";
import RegisterButton from "./_components/RegisterButton";
import type { NextPage } from "next";
import { useAccount, useNetwork } from "wagmi";
import PollDetail from "~~/components/PollDetail";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { getTargetNetworks } from "~~/utils/scaffold-eth";

const Home: NextPage = () => {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const chains = getTargetNetworks();

  const { isRegistered } = useAuthContext();

  const [usable, setUsable] = useState(false);

  const { data: owner } = useScaffoldContractRead({ contractName: "MACIWrapper", functionName: "owner" });
  const { data: nextPollId } = useScaffoldContractRead({ contractName: "MACIWrapper", functionName: "nextPollId" });
  const currentPollId = nextPollId === undefined || nextPollId == 0n ? undefined : nextPollId - 1n;

  useEffect(() => {
    if (!chains) {
      return;
    }
    setUsable(chains.some(c => c.id == chain?.id));
  }, [chain, chains]);

  return (
    <>
      <main className="w-full min-h-screen bg-black relative">
        <div className="flex flex-col gap-y-5 my-10 items-center">
          <div className="">
            <h1 className="text-4xl font-bold text-center">Let&apos;s settle the debate</h1>
            <h2 className="text-3xl font-bold text-center">once and for all</h2>
          </div>
          <div className="flex flex-row">
            <RainbowKitCustomConnectButton />
          </div>
          {usable &&
            (!isRegistered ? (
              <RegisterButton />
            ) : currentPollId !== undefined ? (
              <PollDetail id={currentPollId} />
            ) : (
              <div className="flex flex-col items-center gap-y-5">
                <img
                  src="https://cdn3d.iconscout.com/3d/premium/thumb/people-getting-404-not-found-11282893-9091569.png?f=webp"
                  alt=""
                />
                <h2 className="font-semibold text-3xl text-red-500">Poll you were looking for was not found</h2>
              </div>
            ))}

          <div className="mt-14 bg-slate-800 rounded-3xl flex overflow-hidden w-[90vw] mobile:flex-col">
            <img className="w-full aspect-video object-cover object-top" src="/fai.jpg" />
            <div className="flex flex-col p-5 gap-y-3 mobile:gap-y-0">
              <h1 className="text-2xl font-bold mobile:text-lg">Cast your Vote securely and privately</h1>
              <p className="mobile:text-sm">
                Welcome to our privacy-focused voting platform. We prioritize your privacy and the security of your vote
                with advanced encryption technology. Cast your vote with confidence, knowing your privacy is protected.
              </p>
              <a
                target="_blank"
                href="https://app.buidlguidl.com/build/LPoia03Y8bVgrC1MDiCk"
                className="bg-black w-max px-6 py-3 rounded-lg hover:bounce hover:scale-105 duration-300 active:duration-500 active:bg-gray-900 active:scale-90 mobile:text-xs"
              >
                Want to make your own Maci service? <u>Fork me now</u>
              </a>
            </div>
          </div>

          <div className="absolute right-6 bottom-2 flex items-center flex-col">
            {owner == address && (
              <Link
                href={"/admin"}
                passHref
                className={`hover:bg-secondary hover:shadow-md focus:!bg-secondary active:!text-neutral py-1.5 px-3 text-sm rounded-full gap-2 grid grid-flow-col`}
              >
                Admin Panel
              </Link>
            )}
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
