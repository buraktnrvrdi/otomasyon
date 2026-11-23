import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ basari: true });
  res.cookies.delete("super_session");
  return res;
}
