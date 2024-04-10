"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Keypair } from "@se-2/hardhat/maci-ts/domainobjs";
import { useAccount } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { fetchOrCreateUserKeyPair } from "~~/utils/crypto";

interface IAuthContext {
  isRegistered: boolean;
  keypair: Keypair | null;
  stateIndex: bigint | null;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [keypair, setKeyPair] = useState<Keypair | null>(null);
  const [stateIndex, setStateIndex] = useState<bigint | null>(null);

  useEffect(() => {
    setKeyPair(fetchOrCreateUserKeyPair(address));
  }, [address]);

  const { data: isRegistered, refetch: refetchIsRegistered } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "isPublicKeyRegistered",
    args: keypair ? keypair.pubKey.rawPubKey : [undefined, undefined],
  });

  const chainId = scaffoldConfig.targetNetworks[0].id;

  const {
    MACI: { deploymentBlockNumber },
  } = deployedContracts[chainId];

  const { data: SignUpEvents } = useScaffoldEventHistory({
    contractName: "MACI",
    eventName: "SignUp",
    filters: {
      _userPubKeyX: keypair?.pubKey.asContractParam().x,
      _userPubKeyY: keypair?.pubKey.asContractParam().y,
    },
    fromBlock: BigInt(deploymentBlockNumber),
  });

  useEffect(() => {
    if (!keypair || !SignUpEvents || !SignUpEvents.length) {
      setStateIndex(null);
      return;
    }

    const lastSignUpEvent = SignUpEvents[SignUpEvents.length - 1];
    setStateIndex(lastSignUpEvent.args._stateIndex || null);
  }, [keypair, SignUpEvents]);

  useScaffoldEventSubscriber({
    contractName: "MACI",
    eventName: "SignUp",
    listener: logs => {
      logs.forEach(log => {
        if (
          log.args._userPubKeyX !== keypair?.pubKey.asContractParam().x ||
          log.args._userPubKeyY !== keypair?.pubKey.asContractParam().y
        )
          return;
        refetchIsRegistered();
        setStateIndex(log.args._stateIndex || null);
      });
    },
  });

  return (
    <AuthContext.Provider value={{ isRegistered: Boolean(isRegistered), keypair, stateIndex }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
