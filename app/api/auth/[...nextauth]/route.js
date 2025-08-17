// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { connectToDB } from "@/lib/db"
import User from "@/models/User"
import bcrypt from "bcryptjs"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await connectToDB()
          const user = await User.findOne({ email: credentials.email })
          if (!user) throw new Error("No user found")
          const isMatch = await bcrypt.compare(credentials.password, user.password)
          if (!isMatch) throw new Error("Incorrect password")
          return user
        } catch (err) {
          console.error("Auth error:", err)
          throw new Error("Invalid email or password")
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],

  callbacks: {
  async jwt({ token, user }) {
    if (user) {
      await connectToDB();
      const dbUser = await User.findOne({ email: user.email });

      // If not in DB, create them
      if (!dbUser) {
        const newUser = await User.create({
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.email.split("@")[0], // default username
        });
        token.id = newUser._id;
        token.username = newUser.username;
      } else {
        token.id = dbUser._id;
        token.username = dbUser.username;
      }
    }
    return token;
  },

  async session({ session, token }) {
    session.user.id = token.id;
    session.user.username = token.username;
    return session;
  },
}
,
  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
}

// Required to export this way in app/api/
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
