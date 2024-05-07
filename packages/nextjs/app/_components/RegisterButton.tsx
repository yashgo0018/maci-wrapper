import { Keypair, PrivKey } from "maci-domainobjs";
import { useAuthContext } from "~~/contexts/AuthContext";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";

export default function RegisterButton() {
  const { keypair, isRegistered, signMessageAsync } = useAuthContext();

  const { writeAsync } = useScaffoldContractWrite({
    contractName: "MACIWrapper",
    functionName: "signUp",
    args: [keypair?.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"],
  });

  async function register() {
    try {
      let userKeypair = keypair;
      if (!userKeypair) {
        const signature = await signMessageAsync();
        userKeypair = new Keypair(new PrivKey(signature));
      }

      await writeAsync({ args: [userKeypair?.pubKey.asContractParam() as { x: bigint; y: bigint }, "0x", "0x"] });
    } catch (err) {
      console.log(err);
    }
  }

  if (isRegistered) return <div>Thanks for Registration</div>;

  return (
    <button className="border border-slate-600 bg-primary px-3 py-2 rounded-lg font-bold" onClick={register}>
      Register
    </button>
  );
}
