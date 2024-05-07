import React from "react";
import { Dialog } from "@headlessui/react";
import Modal from "~~/components/Modal";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { Poll } from "~~/types/poll";
import { uploadToPinata } from "~~/utils/pinata";
import { notification } from "~~/utils/scaffold-eth";

export default function PollStatusModal({
  poll,
  show,
  setOpen,
}: {
  show: boolean;
  setOpen: (value: boolean) => void;
  poll: Poll | undefined;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACIWrapper",
    functionName: "updatePollTallyCID",
    args: [undefined, undefined],
  });

  function uploadTallyFile() {
    if (!fileInputRef.current?.files?.length || !poll) {
      return;
    }

    const file = fileInputRef.current.files[0];
    console.log(file);
    const reader = new FileReader();

    reader.onload = async () => {
      const content = reader.result as string;

      let data: any;
      try {
        data = JSON.parse(content);
      } catch (err) {
        notification.error("Invalid file", { showCloseButton: false });
        return;
      }

      if (!data || !data.results?.tally || !Array.isArray(data.results.tally)) {
        notification.error("Invalid file", { showCloseButton: false });
        return;
      }

      const ipfsHash = await uploadToPinata(data);

      await writeAsync({ args: [poll.id, ipfsHash] });

      setOpen(false);
    };

    reader.readAsText(file);
  }

  return (
    <Modal show={show} setOpen={setOpen}>
      <div className="mt-3 text-center sm:mt-5 mb-6">
        <Dialog.Title as="h3" className="font-bold leading-6 text-2xl text-neutral-content">
          Required Actions
        </Dialog.Title>
      </div>
      <div className=" ">
        <div className="text-center">
          <div className="text-sm">Upload the tally file</div>
          <div className="mt-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              className="file-input file-input-bordered w-full bg-primary text-neutral max-w-xs"
            />
          </div>
        </div>
        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-primary text-primary-content px-3 py-2 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
            onClick={uploadTallyFile}
          >
            Upload
          </button>
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
