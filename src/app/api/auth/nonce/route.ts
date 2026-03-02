import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

export async function POST() {
  const nonce = crypto.randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("auth_nonce", nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 300, // 5 minutes
    path: "/",
  });
  return NextResponse.json({ nonce });
}
