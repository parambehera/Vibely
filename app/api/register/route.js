// app/api/register/route.js
import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { name, email, password,username } = await req.json();
  try {
    await connectToDB();
    const usernameExists = await User.findOne({ username });
    const emailExits = await User.findOne({email});
    if (usernameExists || emailExits) {
      return  Response.json({ message: "user already exists" }, { status: 400 });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name,
      email,
      password: hashedPassword,
      username,
    });
    return Response.json({ message: "Registered successfully" }, { status:201 });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json({ message: "server error" }, { status: 500 });
  }
}
