export enum PollStatus {
  NOT_STARTED = "Not Started",
  OPEN = "Open",
  CLOSED = "Closed",
  RESULT_COMPUTED = "Result Computed",
}

export interface RawPoll {
  id: bigint;
  name: string;
  encodedOptions: `0x${string}`;
  metadata: string;
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

export interface Poll extends RawPoll {
  status: PollStatus;
}

export enum PollType {
  NOT_SELECTED,
  SINGLE_VOTE,
  MULTIPLE_VOTE,
  WEIGHTED_MULTIPLE_VOTE,
}

/**
 * Supported verification key modes
 */
export enum EMode {
  QV,
  NON_QV,
}
