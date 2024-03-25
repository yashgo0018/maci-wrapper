import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { keyToParam } from "~~/utils/crypto";

export default function RegisterButton() {
  const { keypair, isRegistered } = useAuthContext();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACI",
    functionName: "signUp",
    args: [keyToParam(keypair?.pubKey), "0x", "0x"],
  });

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <button className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold" onClick={() => writeAsync()}>
      Register
    </button>
  );
}
