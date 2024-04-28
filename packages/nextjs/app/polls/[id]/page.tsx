"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { genRandomSalt } from "@se-2/hardhat/maci-ts/crypto";
import { Keypair, PCommand, PubKey } from "@se-2/hardhat/maci-ts/domainobjs";
import { useContractRead, useContractWrite } from "wagmi";
import PollAbi from "~~/abi/Poll";
import VoteCard from "~~/components/card/VoteCard";
import { useAuthContext } from "~~/contexts/AuthContext";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";
import { useFetchPoll } from "~~/hooks/useFetchPoll";
import { PollType } from "~~/types/poll";
import { notification } from "~~/utils/scaffold-eth";

export default function PollDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: poll, error, isLoading } = useFetchPoll(id);
  const [pollType, setPollType] = useState(PollType.NOT_SELECTED);

  useAuthUserOnly({});

  const { keypair, stateIndex } = useAuthContext();

  const [votes, setVotes] = useState<{ index: number; votes: number }[]>([]);

  const [isVotesInvalid, setIsVotesInvalid] = useState<Record<number, boolean>>({});

  const isAnyInvalid = Object.values(isVotesInvalid).some(v => v);

  useEffect(() => {
    if (!poll || !poll.metadata) {
      return;
    }

    try {
      const { pollType } = JSON.parse(poll.metadata);
      setPollType(pollType);
    } catch (err) {
      console.log("err", err);
    }
  }, [poll]);

  const { data: coordinatorPubKeyResult } = useContractRead({
    abi: PollAbi,
    address: poll?.pollContracts.poll,
    functionName: "coordinatorPubKey",
  });

  const { writeAsync: publishMessage } = useContractWrite({
    abi: PollAbi,
    address: poll?.pollContracts.poll,
    functionName: "publishMessage",
  });

  const { writeAsync: publishMessageBatch } = useContractWrite({
    abi: PollAbi,
    address: poll?.pollContracts.poll,
    functionName: "publishMessageBatch",
  });

  const [coordinatorPubKey, setCoordinatorPubKey] = useState<PubKey>();

  useEffect(() => {
    if (!coordinatorPubKeyResult) {
      return;
    }

    const coordinatorPubKey_ = new PubKey([
      BigInt((coordinatorPubKeyResult as any)[0].toString()),
      BigInt((coordinatorPubKeyResult as any)[1].toString()),
    ]);

    setCoordinatorPubKey(coordinatorPubKey_);
  }, [coordinatorPubKeyResult]);

  const castVote = async () => {
    if (!poll || stateIndex == null || !coordinatorPubKey || !keypair) return;

    // check if the votes are valid
    if (isAnyInvalid) {
      notification.error("Please enter a valid number of votes");
      return;
    }

    // check if no votes are selected
    if (votes.length === 0) {
      notification.error("Please select at least one option to vote");
      return;
    }

    // check if the poll is closed
    // if (Number(poll.endTime) * 1000 < new Date().getTime()) {
    //   notification.error("Voting is closed for this poll");
    //   return;
    // }

    // TODO: check if the poll is not started

    const votesToMessage = votes.map((v, i) =>
      getMessageAndEncKeyPair(
        stateIndex,
        poll.id,
        BigInt(v.index),
        BigInt(v.votes),
        BigInt(votes.length - i),
        coordinatorPubKey,
        keypair,
      ),
    );

    try {
      if (votesToMessage.length === 1) {
        await publishMessage({
          args: [votesToMessage[0].message.asContractParam(), votesToMessage[0].encKeyPair.pubKey.asContractParam()],
        });
      } else {
        await publishMessageBatch({
          args: [
            votesToMessage.map(v => v.message.asContractParam()),
            votesToMessage.map(v => v.encKeyPair.pubKey.asContractParam()),
          ],
        });
      }

      //   // setLoaderMessage("Casting the vote, please wait...");
      //   // router.push(`/voted-success?id=${clickedIndex}`);
    } catch (err) {
      console.log("err", err);
      notification.error("Casting vote failed, please try again ");
    }
  };

  function getMessageAndEncKeyPair(
    stateIndex: bigint,
    pollIndex: bigint,
    candidateIndex: bigint,
    weight: bigint,
    nonce: bigint,
    coordinatorPubKey: PubKey,
    keypair: Keypair,
  ) {
    const command: PCommand = new PCommand(
      stateIndex,
      keypair.pubKey,
      candidateIndex,
      weight,
      nonce,
      pollIndex,
      genRandomSalt(),
    );

    const signature = command.sign(keypair.privKey);

    const encKeyPair = new Keypair();

    const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encKeyPair.privKey, coordinatorPubKey));

    return { message, encKeyPair };
  }

  function voteUpdated(index: number, checked: boolean, voteCounts: number) {
    if (pollType === PollType.SINGLE_VOTE) {
      if (checked) {
        setVotes([{ index, votes: voteCounts }]);
      }
      return;
    }

    if (checked) {
      setVotes([...votes.filter(v => v.index !== index), { index, votes: voteCounts }]);
    } else {
      setVotes(votes.filter(v => v.index !== index));
    }
  }

  if (isLoading) return <div>Loading...</div>;

  if (error) return <div>Poll not found</div>;

  return (
    <div className="container mx-auto pt-10">
      <div className="flex h-full flex-col md:w-2/3 lg:w-1/2 mx-auto">
        <div className="flex flex-row items-center my-5">
          <div className="text-2xl font-bold ">Vote for {poll?.name}</div>
        </div>
        {poll?.options.map((candidate, index) => (
          <div className="pb-5 flex" key={index}>
            <VoteCard
              index={index}
              candidate={candidate}
              clicked={false}
              pollType={pollType}
              onChange={(checked, votes) => voteUpdated(index, checked, votes)}
              isInvalid={Boolean(isVotesInvalid[index])}
              setIsInvalid={status => setIsVotesInvalid({ ...isVotesInvalid, [index]: status })}
            />
          </div>
        ))}
        <div className={`mt-2 shadow-2xl`}>
          <button
            onClick={castVote}
            disabled={!true}
            className="hover:border-black border-2 border-accent w-full text-lg text-center bg-accent py-3 rounded-xl font-bold"
          >
            {true ? "Vote Now" : "Voting Closed"}{" "}
          </button>
        </div>
      </div>
    </div>
  );
}
