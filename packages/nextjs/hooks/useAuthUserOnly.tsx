import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuthContext } from "~~/contexts/AuthContext";

export function useAuthUserOnly({ inverted }: { inverted?: boolean }) {
  const { isRegistered } = useAuthContext();

  useEffect(() => {
    if (inverted && isRegistered) {
      redirect("/polls");
    }

    if (!inverted && !isRegistered) {
      redirect("/");
    }
  }, [isRegistered, inverted]);

  return;
}
