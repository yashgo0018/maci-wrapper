import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function RegisterButton() {
  const { keypair, isRegistered, generateKeypair } = useAuthContext();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACIWrapper",
    functionName: "signUp",
    args: [keypair?.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"],
  });

  async function register() {
    if (!keypair) return;

    try {
      await writeAsync({ args: [keypair.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"] });
    } catch (err) {
      console.log(err);
    }
  }

  if (!keypair) {
    return (
      <button
        className="border border-slate-600 rounded-lg font-bold bg-yellow-500 text-black px-20 py-3 text-lg"
        onClick={generateKeypair}
      >
        Login
      </button>
    );
  }

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <>
      (You are not registered yet)
      <button
        className="border border-slate-600 rounded-lg font-bold bg-yellow-500 text-black px-20 py-3 text-lg"
        onClick={register}
      >
        Register Here
      </button>
    </>
  );
}
