"use client";

import { useParams } from "next/navigation";
import PollDetail from "~~/components/PollDetail";

export default function PollDetailPage() {
  const { id } = useParams<{ id: string }>();

  return <PollDetail id={BigInt(id)} />;
}
