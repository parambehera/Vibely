import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(req,{params}){
    await connectToDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
      }
      const userId = params.id;
      if (session.user.id !== userId) {
        return new Response(JSON.stringify({ error: "Not allowed" }), { status: 403 });
      }
      await Post.deleteMany({ author: userId });

      // 2. Remove this user from likes in all other posts
      await Post.updateMany({}, { $pull: { likes: userId } });
    
      // 3. Remove all comments made by this user from all posts
      await Post.updateMany({}, { $pull: { comments: { user: userId } } });
    
      // 4. Remove this user from followers/following lists of other users
      await User.updateMany({}, { $pull: { followers: userId, following: userId } });
    
      // 5. Finally, delete the user
      await User.findByIdAndDelete(userId);
      
      return new Response(JSON.stringify({ message: "Account deleted successfully" }), { status: 200 });
}   