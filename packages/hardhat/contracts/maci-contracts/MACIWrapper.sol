// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { MACI } from "maci-contracts/contracts/MACI.sol";
import { IPollFactory } from "maci-contracts/contracts/interfaces/IPollFactory.sol";
import { IMessageProcessorFactory } from "maci-contracts/contracts/interfaces/IMPFactory.sol";
import { ITallyFactory } from "maci-contracts/contracts/interfaces/ITallyFactory.sol";
import { SignUpGatekeeper } from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import { InitialVoiceCreditProxy } from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";
import { TopupCredit } from "maci-contracts/contracts/TopupCredit.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
/// @notice A contract which allows users to sign up, and deploy new polls
contract MACIWrapper is MACI {
	mapping(address => uint256) public pollIds;

	// pubkey.x => pubkey.y => bool
	mapping(uint256 => mapping(uint256 => bool)) public isPublicKeyRegistered; 

	error PubKeyAlreadyRegistered();
	error PollAddressDoesNotExist(address _poll);

	constructor(
		IPollFactory _pollFactory,
		IMessageProcessorFactory _messageProcessorFactory,
		ITallyFactory _tallyFactory,
		SignUpGatekeeper _signUpGatekeeper,
		InitialVoiceCreditProxy _initialVoiceCreditProxy,
		TopupCredit _topupCredit,
		uint8 _stateTreeDepth
	  ) MACI(
		_pollFactory,
		_messageProcessorFactory,
		_tallyFactory,
		_signUpGatekeeper,
		_initialVoiceCreditProxy,
		_topupCredit,
		_stateTreeDepth
	  ) {
	}

	/// @notice Allows any eligible user sign up. The sign-up gatekeeper should prevent
	/// double sign-ups or ineligible users from doing so.  This function will
	/// only succeed if the sign-up deadline has not passed. It also enqueues a
	/// fresh state leaf into the state AccQueue.
	/// @param _pubKey The user's desired public key.
	/// @param _signUpGatekeeperData Data to pass to the sign-up gatekeeper's
	///     register() function. For instance, the POAPGatekeeper or
	///     SignUpTokenGatekeeper requires this value to be the ABI-encoded
	///     token ID.
	/// @param _initialVoiceCreditProxyData Data to pass to the
	///     InitialVoiceCreditProxy, which allows it to determine how many voice
	///     credits this user should have.
	function signUp(
		PubKey memory _pubKey,
		bytes memory _signUpGatekeeperData,
		bytes memory _initialVoiceCreditProxyData
	) public override {
		// check if the pubkey is already registered
		if (isPublicKeyRegistered[_pubKey.x][_pubKey.y])
			revert PubKeyAlreadyRegistered();

		super.signUp(_pubKey, _signUpGatekeeperData, _initialVoiceCreditProxyData);

		isPublicKeyRegistered[_pubKey.x][_pubKey.y] = true;
	}

	/// @notice Deploy a new Poll contract.
	/// @param _duration How long should the Poll last for
	/// @param _treeDepths The depth of the Merkle trees
	/// @param _coordinatorPubKey The coordinator's public key
	/// @param _verifier The Verifier Contract
	/// @param _vkRegistry The VkRegistry Contract
	/// @param _mode Whether to support QV or not
	/// @return pollAddr a new Poll contract address
	function deployPoll(
		uint256 _duration,
		TreeDepths memory _treeDepths,
		PubKey memory _coordinatorPubKey,
		address _verifier,
		address _vkRegistry,
		Mode _mode
	) public override returns (PollContracts memory pollAddr) {
		uint256 pollId = nextPollId;	

		PollContracts memory p = super.deployPoll(
			_duration,
			_treeDepths,
			_coordinatorPubKey,
			_verifier,
			_vkRegistry,
			_mode
		);

		pollIds[p.poll] = pollId;

		return p;
	}

	function getPollId(address _poll) public view returns (uint256 pollId) {
		if (pollIds[_poll] >= nextPollId) revert PollAddressDoesNotExist(_poll);
		pollId = pollIds[_poll];
	}
}
