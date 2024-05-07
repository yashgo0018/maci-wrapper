import { useRef, useState } from "react";
import { PollType } from "~~/types/poll";

type VoteCardProps = {
  index: number;
  candidate: string;
  clicked: boolean;
  pollType: PollType;
  onChange: (checked: boolean, votes: number) => void;
  setIsInvalid: (value: boolean) => void;
  isInvalid: boolean;
  pollOpen: boolean;
};

const VoteCard = ({ index, candidate, onChange, pollType, isInvalid, setIsInvalid, pollOpen }: VoteCardProps) => {
  const [selected, setSelected] = useState(false);
  const [votes, setVotes] = useState(0);
  const votesFieldRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="bg-primary flex w-full px-2 py-2 rounded-lg">
        {pollOpen && (
          <input
            type={pollType === PollType.SINGLE_VOTE ? "radio" : "checkbox"}
            className="mr-2"
            value={index}
            onChange={e => {
              console.log(e.target.checked);
              setSelected(e.target.checked);
              if (e.target.checked) {
                switch (pollType) {
                  case PollType.SINGLE_VOTE:
                    onChange(true, 1);
                    break;
                  case PollType.MULTIPLE_VOTE:
                    onChange(true, 1);
                    break;
                  case PollType.WEIGHTED_MULTIPLE_VOTE:
                    if (votes) {
                      onChange(true, votes);
                    } else {
                      setIsInvalid(true);
                    }
                    break;
                }
              } else {
                onChange(false, 0);
                setIsInvalid(false);
                setVotes(0);
                if (votesFieldRef.current) {
                  votesFieldRef.current.value = "";
                }
              }
            }}
            name={pollType === PollType.SINGLE_VOTE ? "candidate-votes" : `candidate-votes-${index}`}
          />
        )}

        <div className={!pollOpen ? "ml-2" : ""}>{candidate}</div>
      </div>

      {pollOpen && pollType === PollType.WEIGHTED_MULTIPLE_VOTE && (
        <input
          ref={votesFieldRef}
          type="number"
          className={
            "border border-slate-600 bg-primary text-primary-content placeholder:text-accent-content placeholder:font-light rounded-lg px-2 py-2 ml-2 w-20" +
            (isInvalid ? " border-red-500" : "")
          }
          disabled={!selected}
          placeholder="Votes"
          min={0}
          step={1}
          onChange={function (e) {
            if (
              Number(e.currentTarget.value) < 0 ||
              (selected && (e.currentTarget.value === "" || Number(e.currentTarget.value) == 0))
            ) {
              setIsInvalid(true);
            } else {
              setIsInvalid(false);
              setVotes(Number(e.currentTarget.value));
              onChange(selected, Number(e.currentTarget.value));
            }
          }}
        />
      )}
    </>
  );
};

export default VoteCard;
