"use client";

import { useParams } from "next/navigation";
import PollDetail from "~~/components/PollDetail";
import { useAuthUserOnly } from "~~/hooks/useAuthUserOnly";

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();
  useAuthUserOnly({});

  return <PollDetail id={BigInt(id)} />;
}
