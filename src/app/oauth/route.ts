import { createAdminClient } from "@/lib/appwrite";
import { cookies } from "next/headers";
import { NextResponse, NextRequest } from "next/server";
import { AUTH_COOKIE } from "@/features/auth/constants";
export async function GET(request: NextRequest) {
  const nextUrl = new URL(request.url);
  const userId = nextUrl.searchParams.get("userId");
  const secret = nextUrl.searchParams.get("secret");

  if (!userId || !secret) {
    return new Response("Missing userId or secret", { status: 400 });
  }

  const { account } = await createAdminClient();
  const session = await account.createSession(userId, secret);

  cookies().set(AUTH_COOKIE, session.secret, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: true,
  });

  return NextResponse.redirect(`${request.nextUrl.origin}/`);
}
