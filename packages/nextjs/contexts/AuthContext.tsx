"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Keypair, PrivKey } from "@se-2/hardhat/maci-ts/domainobjs";
import { useAccount, useSignMessage } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

interface IAuthContext {
  isRegistered: boolean;
  keypair: Keypair | null;
  stateIndex: bigint | null;
  signMessageAsync: () => Promise<`0x${string}`>;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [keypair, setKeyPair] = useState<Keypair | null>(null);
  const [stateIndex, setStateIndex] = useState<bigint | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string>("");

  const { signMessage, signMessageAsync, data: signature } = useSignMessage({ message: signatureMessage });

  useEffect(() => {
    setSignatureMessage(`Login to ${window.location.origin}`);
  }, []);

  useEffect(() => {
    if (!address || !signMessage) {
      setKeyPair(null);
      return;
    }

    signMessage();
  }, [address, signMessage]);

  useEffect(() => {
    if (!signature) return;

    const userKeyPair = new Keypair(new PrivKey(signature));
    setKeyPair(userKeyPair);
  }, [signature]);

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
    <AuthContext.Provider value={{ isRegistered: Boolean(isRegistered), keypair, stateIndex, signMessageAsync }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
