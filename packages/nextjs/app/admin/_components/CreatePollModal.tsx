import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { LuCross } from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import { RxCross2 } from "react-icons/rx";
import Modal from "~~/components/Modal";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function Example({ show, setOpen }: { show: boolean; setOpen: (value: boolean) => void }) {
  const [pollData, setPollData] = useState({ title: "Dummy Title", options: [""] });
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  const handleAddOption = () => {
    setPollData({ ...pollData, options: [...pollData.options, ""] });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    setPollData({ ...pollData, options: newOptions });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPollData({ ...pollData, title: e.target.value });
  };

  const handleEditTitleClick = () => {
    setIsEditingTitle(true);
  };

  const handleSaveTitleClick = () => {
    setIsEditingTitle(false);
  };

  function removeOptions(index: number): void {
    const newOptions = [...pollData.options];
    newOptions.splice(index, 1);
    setPollData({ ...pollData, options: newOptions });
  }

  const { writeAsync, data, isLoading } = useScaffoldContractWrite({
    contractName: "PollManager",
    functionName: "createPoll",
    args: [pollData?.title, pollData?.options || [], "", 300n],
  });

  console.log(data);

  useEffect(() => {
    //      setIsLoading(isLoading);
  }, [isLoading]);

  async function onSubmit() {
    console.log("A");
    try {
      await writeAsync();
    } catch (err) {
      console.log(err);
    }

    setOpen(false);
  }

  return (
    <Modal show={show} setOpen={setOpen}>
      <div className="mt-3 text-center sm:mt-5 mb-6">
        <Dialog.Title as="h3" className="font-bold leading-6 text-2xl text-neutral-content">
          Create a Poll
        </Dialog.Title>
      </div>

      <div className="flex justify-between items-center mb-4">
        {isEditingTitle ? (
          <input
            type="text"
            className="border border-gray-300 rounded-md px-4 py-2 w-full focus:outline-none bg-white text-black"
            placeholder="Enter Poll Title"
            value={pollData.title}
            onChange={handleTitleChange}
          />
        ) : (
          <h2 className="text-xl font-semibold font-mono text-neutral-content mb-0 mt-2">{pollData.title}</h2>
        )}

        <label className="btn btn-circle swap swap-rotate ml-3 bg-primary hover:bg-primary-content text-primary-content hover:text-primary">
          <input
            type="checkbox"
            onChange={() => {
              if (isEditingTitle) {
                handleSaveTitleClick();
              } else {
                handleEditTitleClick();
              }
            }}
          />

          <div className="swap-off fill-current">
            <MdEdit size={25} />
          </div>

          <div className="swap-on fill-current">
            <RxCross2 size={25} />
          </div>
        </label>
      </div>

      <div className="w-full h-[0.5px] bg-[#3647A4] shadow-2xl my-5" />

      <div className="mb-3 text-neutral-content">Create the options</div>

      {pollData.options.map((option, index) => (
        <div key={index} className="mb-2 flex flex-row">
          <input
            type="text"
            className="border border-[#3647A4] bg-secondary rounded-md px-4 py-2 w-full focus:outline-none "
            placeholder={`Candidate ${index + 1}`}
            value={option}
            onChange={e => handleOptionChange(index, e.target.value)}
          />
          {index === pollData.options.length - 1 ? (
            <button
              className="btn btn-outline ml-4 text-primary hover:bg-primary hover:text-primary-content bg-primary-content"
              onClick={handleAddOption}
            >
              <LuCross size={20} />
            </button>
          ) : (
            <button
              className="btn btn-outline ml-4 text-primary hover:bg-primary hover:text-primary-content bg-primary-content"
              onClick={() => removeOptions(index)}
            >
              <RxCross2 size={20} />
            </button>
          )}
        </div>
      ))}

      <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-md bg-primary text-primary-content px-3 py-2 font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:col-start-2"
          onClick={onSubmit}
        >
          Create
        </button>
        <button
          type="button"
          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
