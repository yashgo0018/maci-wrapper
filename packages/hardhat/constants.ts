const USE_QUADRADIC_VOTING = true;

export const InitialVoiceCreditProxyContractName = "ConstantInitialVoiceCreditProxy";
export const GatekeeperContractName = "FreeForAllGatekeeper";
export const VerifierContractName = "Verifier";
export const TopupCreditContractName = "TopupCredit";
export const TallyFactoryContractName = USE_QUADRADIC_VOTING ? "TallyFactory" : "TallyNonQvFactory";

// zk registry config
export const stateTreeDepth = 10;
export const intStateTreeDepth = 1;
export const messageTreeDepth = 2;
export const voteOptionTreeDepth = 2;
export const messageBatchDepth = 1;
export const processMessagesZkeyPath = "./zkeys/ProcessMessages_10-2-1-2_test/ProcessMessages_10-2-1-2_test.0.zkey";
export const tallyVotesZkeyPath = "./zkeys/TallyVotes_10-1-2_test/TallyVotes_10-1-2_test.0.zkey";
export const useQuadraticVoting = false;
