"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Keypair, PrivKey } from "maci-domainobjs";
import { useAccount, useSignMessage } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldContractRead, useScaffoldEventHistory, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

interface IAuthContext {
  isRegistered: boolean;
  keypair: Keypair | null;
  stateIndex: bigint | null;
  generateKeypair: () => Promise<void>;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [keypair, setKeyPair] = useState<Keypair | null>(null);
  const [stateIndex, setStateIndex] = useState<bigint | null>(null);
  const [signatureMessage, setSignatureMessage] = useState<string>("");

  const { signMessageAsync } = useSignMessage({ message: signatureMessage });

  useEffect(() => {
    setSignatureMessage(`Login to ${window.location.origin}`);
  }, []);

  useEffect(() => {
    setKeyPair(null);

    if (!address) {
      return;
    }

    generateKeypair();
  }, [address]);

  async function generateKeypair() {
    if (!address) return;

    const signature = await signMessageAsync();
    const userKeyPair = new Keypair(new PrivKey(signature));
    setKeyPair(userKeyPair);
  }

  const { data: isRegistered, refetch: refetchIsRegistered } = useScaffoldContractRead({
    contractName: "MACIWrapper",
    functionName: "isPublicKeyRegistered",
    args: keypair ? keypair.pubKey.rawPubKey : [0n, 0n],
  });

  const chainId = scaffoldConfig.targetNetworks[0].id;

  const {
    MACIWrapper: { deploymentBlockNumber },
  } = deployedContracts[chainId];

  const { data: SignUpEvents } = useScaffoldEventHistory({
    contractName: "MACIWrapper",
    eventName: "SignUp",
    filters: {
      _userPubKeyX: BigInt(keypair?.pubKey.asContractParam().x || 0n),
      _userPubKeyY: BigInt(keypair?.pubKey.asContractParam().y || 0n),
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
    contractName: "MACIWrapper",
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
    <AuthContext.Provider value={{ isRegistered: Boolean(isRegistered), keypair, stateIndex, generateKeypair }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
