export const InitialVoiceCreditProxyContractName = "ConstantInitialVoiceCreditProxy";
export const GatekeeperContractName = "FreeForAllGatekeeper";
export const VerifierContractName = "Verifier";
export const TopupCreditContractName = "TopupCredit";

// zk registry config
export const stateTreeDepth = 10;
export const intStateTreeDepth = 1;
export const messageTreeDepth = 2;
export const voteOptionTreeDepth = 2;
export const messageBatchDepth = 1;
export const useQuadraticVoting = true;

export const processMessagesZkeyPath = useQuadraticVoting
  ? "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey"
  : "./zkeys/ProcessMessagesNonQv_10-2-1-2_test/ProcessMessagesNonQv_10-2-1-2_test.0.zkey";
export const tallyVotesZkeyPath = useQuadraticVoting
  ? "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey"
  : "./zkeys/TallyVotesNonQv_10-1-2_test/TallyVotesNonQv_10-1-2_test.0.zkey";
