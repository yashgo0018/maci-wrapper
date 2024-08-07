// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MACI } from "maci-contracts/contracts/MACI.sol";
import { IPollFactory } from "maci-contracts/contracts/interfaces/IPollFactory.sol";
import { IMessageProcessorFactory } from "maci-contracts/contracts/interfaces/IMPFactory.sol";
import { ITallyFactory } from "maci-contracts/contracts/interfaces/ITallyFactory.sol";
import { SignUpGatekeeper } from "maci-contracts/contracts/gatekeepers/SignUpGatekeeper.sol";
import { InitialVoiceCreditProxy } from "maci-contracts/contracts/initialVoiceCreditProxy/InitialVoiceCreditProxy.sol";

/// @title MACI - Minimum Anti-Collusion Infrastructure Version 1
/// @notice A contract which allows users to sign up, and deploy new polls
contract MACIWrapper is MACI, Ownable(msg.sender) {
	struct PollData {
		uint256 id;
		string name;
		bytes encodedOptions;
		string metadata;
		MACIWrapper.PollContracts pollContracts;
		uint256 startTime;
		uint256 endTime;
		uint256 numOfOptions;
		string[] options;
		string tallyJsonCID;
	}

	mapping(uint256 => PollData) internal _polls;

	TreeDepths public treeDepths;
	PubKey public coordinatorPubKey;
	address public verifier;
	address public vkRegistry;

	mapping(address => uint256) public pollIds;

	event PollCreated(
		uint256 indexed pollId,
		address indexed creator,
		MACIWrapper.PollContracts pollContracts,
		string name,
		string[] options,
		string metadata,
		uint256 startTime,
		uint256 endTime
	);

	event PollTallyCIDUpdated(uint256 indexed pollId, string tallyJsonCID);

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
		uint8 _stateTreeDepth,
		uint256[5] memory _emptyBallotRoots
	)
		MACI(
			_pollFactory,
			_messageProcessorFactory,
			_tallyFactory,
			_signUpGatekeeper,
			_initialVoiceCreditProxy,
			_stateTreeDepth,
			_emptyBallotRoots
		)
	{}

	function setConfig(
		TreeDepths memory _treeDepths,
		PubKey memory _coordinatorPubKey,
		address _verifier,
		address _vkRegistry
	) public onlyOwner {
		treeDepths = _treeDepths;
		coordinatorPubKey = _coordinatorPubKey;
		verifier = _verifier;
		vkRegistry = _vkRegistry;
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

		super.signUp(
			_pubKey,
			_signUpGatekeeperData,
			_initialVoiceCreditProxyData
		);

		isPublicKeyRegistered[_pubKey.x][_pubKey.y] = true;
	}

	function createPoll(
		string calldata _name,
		string[] calldata _options,
		string calldata _metadata,
		uint256 _duration,
		Mode isQv
	) public onlyOwner {
		// TODO: check if the number of options are more than limit

		uint256 pollId = nextPollId;

		deployPoll(
			_duration,
			treeDepths,
			coordinatorPubKey,
			verifier,
			vkRegistry,
			isQv
		);

		PollContracts memory pollContracts = MACI.polls[pollId];

		pollIds[pollContracts.poll] = pollId;

		// encode options to bytes for retrieval
		bytes memory encodedOptions = abi.encode(_options);

		uint256 endTime = block.timestamp + _duration;

		// create poll
		_polls[pollId] = PollData({
			id: pollId,
			name: _name,
			encodedOptions: encodedOptions,
			numOfOptions: _options.length,
			metadata: _metadata,
			startTime: block.timestamp,
			endTime: endTime,
			pollContracts: pollContracts,
			options: _options,
			tallyJsonCID: ""
		});

		emit PollCreated(
			pollId,
			msg.sender,
			pollContracts,
			_name,
			_options,
			_metadata,
			block.timestamp,
			endTime
		);
	}

	function getPollId(address _poll) public view returns (uint256 pollId) {
		if (pollIds[_poll] >= nextPollId) revert PollAddressDoesNotExist(_poll);
		pollId = pollIds[_poll];
	}

	function updatePollTallyCID(
		uint256 _pollId,
		string calldata _tallyJsonCID
	) public onlyOwner {
		if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
		PollData storage poll = _polls[_pollId];
		poll.tallyJsonCID = _tallyJsonCID;

		emit PollTallyCIDUpdated(_pollId, _tallyJsonCID);
	}

	function fetchPolls(
		uint256 _page,
		uint256 _perPage,
		bool _ascending
	) public view returns (PollData[] memory polls_) {
		uint256 start = (_page - 1) * _perPage;
		uint256 end = start + _perPage - 1;

		if (start >= nextPollId) {
			return new PollData[](0);
		}

		if (end >= nextPollId) {
			end = nextPollId - 1;
		}

		polls_ = new PollData[](end - start + 1);

		uint256 index = 0;
		for (uint256 i = start; i <= end; i++) {
			uint256 pollIndex = i;
			if (!_ascending) {
				pollIndex = nextPollId - i - 1;
			}
			polls_[index++] = _polls[pollIndex];
		}
	}

	function fetchPoll(
		uint256 _pollId
	) public view returns (PollData memory poll_) {
		if (_pollId >= nextPollId) revert PollDoesNotExist(_pollId);
		return _polls[_pollId];
	}
}
