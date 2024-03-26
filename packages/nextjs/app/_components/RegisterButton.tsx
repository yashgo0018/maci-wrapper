import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function RegisterButton() {
  const { keypair, isRegistered } = useAuthContext();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACI",
    functionName: "signUp",
    args: [keypair?.pubKey.asContractParam(), "0x", "0x"],
  });

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <button className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold" onClick={() => writeAsync()}>
      Register
    </button>
  );
}
