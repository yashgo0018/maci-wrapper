"use client";

import { useEffect, useState } from "react";
import { genRandomSalt } from "maci-crypto";
import { Keypair, PCommand, PubKey } from "maci-domainobjs";
import { useContractRead, useContractWrite } from "wagmi";
import PollAbi from "~~/abi/Poll";
import VoteCard from "~~/components/card/VoteCard";
import { useAuthContext } from "~~/contexts/AuthContext";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";
import { useFetchPoll } from "~~/hooks/useFetchPoll";
import { getPollStatus } from "~~/hooks/useFetchPolls";
import { PollStatus, PollType } from "~~/types/poll";
import { getDataFromPinata } from "~~/utils/pinata";
import { notification } from "~~/utils/scaffold-eth";

export default function PollDetail({ id }: { id: bigint }) {
  const { data: poll, error, isLoading } = useFetchPoll(id);
  const [pollType, setPollType] = useState(PollType.NOT_SELECTED);

  useAuthUserOnly({});

  const { keypair, stateIndex } = useAuthContext();

  const [votes, setVotes] = useState<{ index: number; votes: number }[]>([]);

  const [isVotesInvalid, setIsVotesInvalid] = useState<Record<number, boolean>>({});

  const isAnyInvalid = Object.values(isVotesInvalid).some(v => v);
  const [result, setResult] = useState<{ candidate: string; votes: number }[] | null>(null);
  const [status, setStatus] = useState<PollStatus>();
  const [voted, setVoted] = useState(false);
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  function getRemainingTime(finalTimestamp: number): { days: number; hours: number; minutes: number; seconds: number } {
    const now = Date.now();
    let distance = finalTimestamp - now;

    if (distance < 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(distance / (60 * 60 * 24));
    distance %= 60 * 60 * 24;

    const hours = Math.floor(distance / (60 * 60));
    distance %= 60 * 60;

    const minutes = Math.floor(distance / 60);
    distance %= 60;

    const seconds = Math.floor(distance);

    return { days, hours, minutes, seconds };
  }

  useEffect(() => {
    if (!poll) return;
    const interval = setInterval(() => {
      const _remaining = getRemainingTime(Number(poll.endTime));
      setRemaining(_remaining);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [poll]);

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

    if (poll.tallyJsonCID) {
      (async () => {
        try {
          const {
            results: { tally },
          } = await getDataFromPinata(poll.tallyJsonCID);
          if (poll.options.length > tally.length) {
            throw new Error("Invalid tally data");
          }
          const tallyCounts: number[] = tally.map((v: string) => Number(v)).slice(0, poll.options.length);
          const result = [];
          for (let i = 0; i < poll.options.length; i++) {
            const candidate = poll.options[i];
            const votes = tallyCounts[i];
            result.push({ candidate, votes });
          }
          result.sort((a, b) => b.votes - a.votes);
          setResult(result);
          console.log("data", result);
        } catch (err) {
          console.log("err", err);
        }
      })();
    }

    const statusUpdateInterval = setInterval(async () => {
      setStatus(getPollStatus(poll));
    }, 1000);

    return () => {
      clearInterval(statusUpdateInterval);
    };
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
    if (status !== PollStatus.OPEN) {
      notification.error("Voting is closed for this poll");
      return;
    }

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
          args: [
            votesToMessage[0].message.asContractParam() as unknown as {
              msgType: bigint;
              data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
            },
            votesToMessage[0].encKeyPair.pubKey.asContractParam() as unknown as { x: bigint; y: bigint },
          ],
        });
      } else {
        await publishMessageBatch({
          args: [
            votesToMessage.map(
              v =>
                v.message.asContractParam() as unknown as {
                  msgType: bigint;
                  data: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
                },
            ),
            votesToMessage.map(v => v.encKeyPair.pubKey.asContractParam() as { x: bigint; y: bigint }),
          ],
        });
      }

      notification.success("Vote casted successfully");
      setVoted(true);
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
    <div className="container mx-auto pt-10 mobile:px-8">
      <div className="flex h-full flex-col md:w-2/3 lg:w-1/2 mx-auto">
        {voted ? (
          <div className="flex flex-col items-center text-black bg-green-300 rounded-xl">
            <img
              src="https://cdn-icons-png.flaticon.com/512/9746/9746205.png"
              className="w-1/2 translate-x-[8%] mb-4 drop-shadow"
              alt="success"
            />
            <h1 className="text-3xl font-semibold">Vote Successful</h1>
            <p className="font-medium opacity-60">Thanks for making your voice heard!</p>
          </div>
        ) : (
          <>
            {poll &&
              (status == PollStatus.OPEN ? (
                <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center">
                  <h1 className="text-2xl font-bold">Time Left</h1>

                  <div className="flex gap-x-3 text-lg font-semibold -my-2">
                    <p>
                      <span className="text-2xl font-black text-yellow-300">{remaining.days}</span> Days
                    </p>
                    <p>
                      <span className="text-2xl font-black text-yellow-300">{remaining.hours}</span> Hrs
                    </p>
                    <p>
                      <span className="text-2xl font-black text-yellow-300">{remaining.minutes}</span> Mins
                    </p>
                    <p>
                      <span className="text-2xl font-black text-yellow-300">{remaining.seconds}</span> Secs
                    </p>
                  </div>

                  <p className="opacity-70">Get in before the voting period ends</p>
                </div>
              ) : (
                <div className="bg-gray-800 p-5 rounded-xl flex flex-col items-center">
                  {status == PollStatus.NOT_STARTED
                    ? "Poll Not Started Yet"
                    : status == PollStatus.CLOSED
                    ? "Poll Over, results are being calculated"
                    : "Poll Results are out"}
                </div>
              ))}
            <div className="flex flex-row items-center my-5">
              <div className="text-2xl font-bold ">{poll?.name}</div>
            </div>
            {poll?.options.map((candidate, index) => (
              <div className="pb-5 flex" key={index}>
                <VoteCard
                  pollOpen={status === PollStatus.OPEN}
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
            {status === PollStatus.OPEN && (
              <div className={`mt-2 shadow-2xl`}>
                <button
                  onClick={castVote}
                  disabled={!true}
                  className="hover:border-black duration-300 bg-yellow-500 text-black border-2 border-yellow-400 w-full text-lg text-center py-3 rounded-xl font-bold active:scale-90"
                >
                  {true ? "Cast Vote" : "Voting Closed"}{" "}
                </button>
              </div>
            )}
          </>
        )}
        {result && (
          <div className="mt-5">
            <div className="text-2xl font-bold">Results</div>
            <div className="mt-3">
              <table className="border-separate w-full mt-7 mb-4">
                <thead>
                  <tr className="text-lg font-extralight">
                    <th className="border border-slate-600 bg-primary">Rank</th>
                    <th className="border border-slate-600 bg-primary">Candidate</th>
                    <th className="border border-slate-600 bg-primary">Votes</th>
                  </tr>
                </thead>
                <tbody>
                  {result.map((r, i) => (
                    <tr key={i} className="text-center">
                      <td>{i + 1}</td>
                      <td>{r.candidate}</td>
                      <td>{r.votes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
