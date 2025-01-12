import { getAccountDetails, getAurinkoToken } from "@/lib/aurinko";
import { waitUntil } from "@vercel/functions";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import axios from "axios";
import { type NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const params = req.nextUrl.searchParams;
  const status = params.get("status");
  if (status !== "success")
    return NextResponse.json(
      { error: "Account connection failed" },
      { status: 400 },
    );

  const code = params.get("code");
  const token = await getAurinkoToken(code as string);
  if (!token)
    return NextResponse.json(
      { error: "Failed to fetch token" },
      { status: 400 },
    );
  const accountDetails = await getAccountDetails(token.accessToken);
  await db.account.upsert({
    where: { id: token.accountId.toString() },
    create: {
      id: token.accountId.toString(),
      userId,
      token: token.accessToken,
      provider: "Aurinko",
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
    update: {
      token: token.accessToken,
    },
  });
  // waitUntil(
  //   axios
  //     .post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
  //       accountId: token.accountId.toString(),
  //       userId,
  //     })
  //     .then((res) => {
  //       console.log(res.data);
  //     })
  //     .catch((err) => {
  //       console.log(err.response.data);
  //     }),
  // );

  // Call initial-sync endpoint
  try {
    await axios.post(`${process.env.NEXT_PUBLIC_URL}/api/initial-sync`, {
      accountId: token.accountId.toString(),
      userId,
    });
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.error(err.response?.data || err.message);
    } else {
      console.error(err);
    }
  }

  return NextResponse.redirect(new URL("/mail", req.url));
};

export const handler = async (event: any, context: any) => {
  // Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "UNAUTHORIZED" }),
    };
  }

  // Parse query parameters
  const params = new URLSearchParams(event.queryStringParameters);
  const status = params.get("status");
  if (status !== "success") {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Account connection failed" }),
    };
  }

  // Get code and fetch token
  const code = params.get("code");
  const token = await getAurinkoToken(code as string);
  if (!token) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Failed to fetch token" }),
    };
  }

  // Fetch account details
  const accountDetails = await getAccountDetails(token.accessToken);

  // Upsert account in database
  await db.account.upsert({
    where: { id: token.accountId.toString() },
    create: {
      id: token.accountId.toString(),
      userId,
      token: token.accessToken,
      provider: "Aurinko",
      emailAddress: accountDetails.email,
      name: accountDetails.name,
    },
    update: {
      token: token.accessToken,
    },
  });
};
