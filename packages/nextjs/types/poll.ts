export enum PollStatus {
  NOT_STARTED = "Not Started",
  OPEN = "Open",
  CLOSED = "Closed",
  RESULT_COMPUTED = "Result Computed",
}

export interface RawPoll {
  id: bigint;
  maciPollId: bigint;
  name: string;
  encodedOptions: `0x${string}`;
  ipfsHash: string;
  pollContracts: {
    poll: string;
    messageProcessor: string;
    tally: string;
  };
  startTime: bigint;
  endTime: bigint;
  numOfOptions: bigint;
  options: readonly string[];
  tallyJsonCID: string;
}

export interface Poll {
  id: bigint;
  maciPollId: bigint;
  name: string;
  encodedOptions: `0x${string}`;
  ipfsHash: string;
  pollContracts: {
    poll: string;
    messageProcessor: string;
    tally: string;
  };
  startTime: bigint;
  endTime: bigint;
  numOfOptions: bigint;
  options: readonly string[];
  tallyJsonCID: string;
  status: PollStatus;
}
