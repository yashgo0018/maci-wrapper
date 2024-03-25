import { useEffect } from "react";
import { permanentRedirect } from "next/navigation";
import { useAuthContext } from "~~/contexts/AuthContext";

export function useAuthUserOnly({ inverted }: { inverted?: boolean }) {
  const { isRegistered } = useAuthContext();

  useEffect(() => {
    if (inverted && isRegistered) {
      permanentRedirect("/");
    }

    if (!inverted && !isRegistered) {
      permanentRedirect("/register");
    }
  }, [isRegistered]);

  return;
}
