import { Dialog } from "@headlessui/react";
import { useContractRead } from "wagmi";
import AccQueueAbi from "~~/abi/AccQueue";
import PollAbi from "~~/abi/Poll";
import Modal from "~~/components/Modal";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";
import { Poll } from "~~/types/poll";
import { useMergeMessages } from "~~/utils/useMergeMessages";
import { useMergeSignups } from "~~/utils/useMergeSignups";

const stepNames = ["Merge SignUps", "Merge Main Roots", "Compute Main Root"];

export default function PollStatusModal({
  poll,
  show,
  setOpen,
}: {
  show: boolean;
  setOpen: (value: boolean) => void;
  poll: Poll | undefined;
}) {
  // console.log("stateAq", stateAq, subTreesMerged);

  const { data: stateAq } = useScaffoldContractRead({ contractName: "MACI", functionName: "stateAq" });
  const { data: stateTreeDepth, refetch: refetchStateTreeDepth } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "stateTreeDepth",
  });
  const { data: mainRoot1, refetch: refetchMainRoot1 } = useContractRead({
    abi: AccQueueAbi,
    address: stateAq,
    functionName: "getMainRoot",
    args: stateTreeDepth ? [BigInt(stateTreeDepth)] : undefined,
  });

  const { data: treeDepths, refetch: refetchTreeDepths } = useContractRead({
    abi: PollAbi,
    address: poll?.pollContracts.poll,
    functionName: "treeDepths",
  });
  const [, , messageTreeDepth] = treeDepths || [undefined, undefined, undefined, undefined];
  const { data: extContracts, refetch: refetchExtContracts } = useContractRead({
    abi: PollAbi,
    address: poll?.pollContracts.poll,
    functionName: "extContracts",
  });
  const [, messageAq] = extContracts || [undefined, undefined, undefined];
  const { data: mainRoot2, refetch: refetchMainRoot2 } = useContractRead({
    abi: AccQueueAbi,
    address: messageAq,
    functionName: "getMainRoot",
    args: messageTreeDepth ? [BigInt(messageTreeDepth)] : undefined,
  });

  // check if the message AQ has been fully merged
  // const messageTreeDepth = Number((await pollContract.treeDepths()).messageTreeDepth);

  // check if the main root was not already computed
  // const mainRoot = (await accQueueContract.getMainRoot(messageTreeDepth.toString())).toString();

  function refetch() {
    refetchStateTreeDepth();
    refetchTreeDepths();
    refetchExtContracts();
    refetchMainRoot1();
    refetchMainRoot2();
  }

  let step = 1;
  if (mainRoot1) {
    step = 2;
    if (mainRoot2) {
      step = 3;
    }
  }

  const { merge: mergeSignups } = useMergeSignups({ pollContractAddress: poll?.pollContracts.poll, refresh: refetch });
  const { merge: mergeMessages } = useMergeMessages({
    pollContractAddress: poll?.pollContracts.poll,
    refresh: refetch,
  });

  return (
    <Modal show={show} setOpen={setOpen}>
      <div className="mt-3 text-center sm:mt-5 mb-6">
        <Dialog.Title as="h3" className="font-bold leading-6 text-2xl text-neutral-content">
          Required Actions
        </Dialog.Title>
      </div>
      <div className=" ">
        <div className="text-center text-lg">
          Step {step} - {stepNames[step - 1]}
        </div>
        {step === 1 && (
          <div className="text-center">
            <div className="text-sm">Merge the signup subtrees of the accumulator queue</div>
          </div>
        )}

        {step === 2 && (
          <div className="text-center">
            <div className="text-sm">Merge the signup subtrees of the accumulator queue</div>
          </div>
        )}

        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          {step === 1 && (
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-primary text-primary-content px-3 py-2 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              onClick={mergeSignups}
            >
              Merge Signups
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md bg-primary text-primary-content px-3 py-2 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
              onClick={mergeMessages}
            >
              Merge Messages
            </button>
          )}
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
