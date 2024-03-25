"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { Keypair } from "@se-2/hardhat/maci-ts/domainobjs";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldEventSubscriber } from "~~/hooks/scaffold-eth";
import { fetchOrCreateUserKeyPair } from "~~/utils/crypto";

interface IAuthContext {
  isRegistered: boolean;
  keypair: Keypair | null;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

export default function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { address } = useAccount();
  const [keypair, setKeyPair] = useState<Keypair | null>(null);

  useEffect(() => {
    setKeyPair(fetchOrCreateUserKeyPair(address));
  }, [address]);

  const { data: isRegistered, refetch: refetchIsRegistered } = useScaffoldContractRead({
    contractName: "MACI",
    functionName: "isPublicKeyRegistered",
    args: keypair
      ? [BigInt(keypair.pubKey.asContractParam().x), BigInt(keypair.pubKey.asContractParam().y)]
      : [undefined, undefined],
  });

  useScaffoldEventSubscriber({
    contractName: "MACI",
    eventName: "SignUp",
    listener: logs => {
      logs.forEach(log => {
        log.args._userPubKeyX === keypair?.pubKey.asContractParam().x &&
          log.args._userPubKeyY === keypair?.pubKey.asContractParam().y &&
          refetchIsRegistered();
      });
    },
  });

  return (
    <AuthContext.Provider value={{ isRegistered: Boolean(isRegistered), keypair }}>{children}</AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
