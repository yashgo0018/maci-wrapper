// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./maci-contracts/MACI.sol";
import { Params } from "./maci-contracts/utilities/Params.sol";
import { DomainObjs } from "./maci-contracts/utilities/DomainObjs.sol";

contract PollManager is Params, DomainObjs {
	struct PollContracts {
		address poll;
		address messageProcessor;
		address tally;
		address subsidy;
	}

	struct PollData {
		string name;
		bytes encodedOptions;
		string ipfsHash;
		PollContracts pollContracts;
		uint256 startTime;
		uint256 endTime;
		uint256 numOfOptions;
		string[] options;
	}

	mapping(uint256 => PollData) internal polls;
	uint256 public totalPolls;

	MACI public maci;

	TreeDepths public treeDepths;
	PubKey public coordinatorPubKey;
	address public verifier;
	address public vkRegistry;
	bool public useSubsidy;

	event PollCreated(
		uint256 indexed pollId,
		address indexed creator,
		address indexed poll,
		string name,
		string[] options,
		string ipfsHash,
		address messageProcessor,
		address tally,
		address subsidy,
		uint256 startTime,
		uint256 endTime
	);

	modifier onlyOwner() {
		require(msg.sender == owner(), "only owner can call this function");
		_;
	}

	constructor(MACI _maci) {
		maci = _maci;
	}

	function owner() public view returns (address) {
		return maci.owner();
	}

	function setConfig(
		TreeDepths memory _treeDepths,
		PubKey memory _coordinatorPubKey,
		address _verifier,
		address _vkRegistry,
		bool _useSubsidy
	) public onlyOwner {
		treeDepths = _treeDepths;
		coordinatorPubKey = _coordinatorPubKey;
		verifier = _verifier;
		vkRegistry = _vkRegistry;
		useSubsidy = _useSubsidy;
	}

	function createPoll(
		string calldata _name,
		string[] calldata _options,
		string calldata _ipfsHash,
		uint256 _duration
	) public onlyOwner {
		// TODO: check if the number of options are more than limit

		// deploy the poll contracts
		MACI.PollContracts memory c = maci.deployPoll(
			_duration,
			treeDepths,
			coordinatorPubKey,
			verifier,
			vkRegistry,
			useSubsidy
		);

		// encode options to bytes for retrieval
		bytes memory encodedOptions = abi.encode(_options);

		uint256 startTime = block.timestamp;
		uint256 endTime = block.timestamp + _duration;

		// create poll
		polls[++totalPolls] = PollData({
			name: _name,
			encodedOptions: encodedOptions,
			numOfOptions: _options.length,
			ipfsHash: _ipfsHash,
			startTime: startTime,
			endTime: endTime,
			pollContracts: PollContracts({
				poll: c.poll,
				messageProcessor: c.messageProcessor,
				tally: c.tally,
				subsidy: c.subsidy
			}),
			options: _options
		});

		emit PollCreated(
			totalPolls,
			msg.sender,
			c.poll,
			_name,
			_options,
			_ipfsHash,
			c.messageProcessor,
			c.tally,
			c.subsidy,
			startTime,
			endTime
		);
	}

	function fetchPolls(
		uint256 _page,
		uint256 _perPage,
		bool _ascending
	) public view returns (PollData[] memory polls_) {
		uint256 start = (_page - 1) * _perPage + 1;
		uint256 end = start + _perPage - 1;
		if (end > totalPolls) {
			end = totalPolls;
		}

		if (start > totalPolls) {
			return new PollData[](0);
		}

		polls_ = new PollData[](end - start + 1);

		uint256 index = 0;
		for (uint256 i = start; i <= end; i++) {
			uint256 pollIndex = i;
			if (!_ascending) {
				pollIndex = totalPolls - i + 1;
			}
			polls_[index++] = polls[pollIndex];
		}
	}

	function fetchPoll(
		uint256 _pollId
	) public view returns (PollData memory poll_) {
		require(_pollId <= totalPolls && _pollId != 0, "poll does not exist");
		return polls[_pollId];
	}
}
