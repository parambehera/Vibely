import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectToDB();
    const session = await getServerSession(authOptions);
    if (!session) return new Response("Unauthorized", { status: 401 });

    const user = await User.findById(session.user.id);
    return new Response(JSON.stringify(user), { status: 200 });
  } catch (err) {
    console.error("[USER_FETCH_ERROR]", err);
    return new Response("Error fetching user", { status: 500 });
  }
}
