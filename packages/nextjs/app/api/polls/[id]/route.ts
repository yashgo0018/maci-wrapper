import { NextRequest, NextResponse } from "next/server";
import { coordinator } from "~~/utils/coordinator";

export const POST = async (req: NextRequest, { params: { id } }: { params: { id: string } }) => {
  coordinator.closePoll(parseInt(id));
  return NextResponse.json({ message: "Hello, World!" });
};
