#!/bin/bash
set -o pipefail

cd "$(dirname "$0")"
cd ..

# Delete old files
rm -rf ./artifacts/*
rm -rf ./cache/*
rm -rf ./typechain-types/*

echo 'Writing Merkle zeros contracts'
bash ./maci-scripts/writeMerkleZeroesContracts.sh 

echo 'Writing empty ballot tree root contract'
yarn exec ts-node maci-ts/ts/genEmptyBallotRootsContract.ts

echo 'Building contracts with Hardhat'
TS_NODE_TRANSPILE_ONLY=1 yarn exec hardhat compile

echo 'Building Poseidon libraries from bytecode' 
yarn exec ts-node maci-ts/ts/buildPoseidon.ts
