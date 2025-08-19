import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import PostCard from "@/components/PostCard";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { redirect } from "next/navigation";
// import { useRouter } from "next/navigation";
export default async function ProfilePage({ params }) {

  await connectToDB();
  const session = await getServerSession(authOptions);
  const { username } = await params; // await the params object
// const decodedUsername = decodeURIComponent(username);
  // const username = decodeURIComponent(params.username);
 if(!session){
  redirect("/login");
  return;
 }
  const userDoc = await User.findOne({ username }).lean();
  if (!userDoc) {
    return <div className="text-center mt-20 text-red-500">User not found</div>;
  }

  let currentUser = null;
  if (session) {
    currentUser = await User.findById(session.user.id).lean();
  }

  // --- FIX APPLIED HERE ---
  // Provide a fallback empty array `[]` to prevent an error if currentUser.following is undefined.
  const isFollowing = currentUser
    ? (currentUser.following || []).some(
        (id) => id.toString() === userDoc._id.toString()
      )
    : false;

  const serializedUser = {
    _id: userDoc._id.toString(),
    name: userDoc.name,
    username: userDoc.username,
    about: userDoc.about,
    image: userDoc.image || null,
    skills: userDoc.skills || [],
    followersCount: (userDoc.followers || []).length,
    followingCount: (userDoc.following || []).length,
  };

  const posts = await Post.find({ author: userDoc._id })
    .sort({ createdAt: -1 })
    .populate("author")
    .populate({
      path: "comments",
      populate: {
        path: "user",
        model: "User",
        select: "name username image",
      },
    })
    .lean();

  const serializedPosts = posts.map((post) => {
    const author =
      post.author && typeof post.author === "object"
        ? {
            _id: post.author._id.toString(),
            name: post.author.name,
            username: post.author.username,
            image: post.author.image || null,
          }
        : { _id: null, name: "Unknown", username: "unknown", image: null };

    return {
      _id: post._id.toString(),
      content: post.content,
      image: post.image || null,
      author: author,
      likes: (post.likes || []).map((id) => id.toString()),
      comments: (post.comments || []).map((comment) => ({
        _id: comment._id.toString(),
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        user:
          comment.user && typeof comment.user === "object"
            ? {
                _id: comment.user._id.toString(),
                name: comment.user.name,
                username: comment.user.username,
                image: comment.user.image || null,
              }
            : { _id: null, name: "Unknown", username: "unknown", image: null },
      })),
      createdAt: post.createdAt.toISOString(),
    };
  });

  const isOwner = session?.user?.id === userDoc._id.toString();

//   const router = useRouter();


  return (
    <div className="min-h-screen bg-[rgb(244,242,238)]">
      <div className="max-w-4xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 border border-white/20 flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6 md:gap-8">
          <div className="relative flex-shrink-0">
            {/* <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full p-1"> */}
              {/* Responsive avatar sizes */}
              <img
          src={serializedUser.image || "/default-avatar.png"}
          alt={serializedUser.name}
          className="w-28 h-28 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
        />
            {/* </div> */}
            <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 bg-green-500 border-2 sm:border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <div className="flex-grow text-center lg:text-left w-full">
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-2 sm:gap-4 mb-3">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {serializedUser.name}
              </h1>
              <div className="sm:ml-auto flex-shrink-0 mt-2 sm:mt-0">
                {isOwner ? (
                  <Link
                    href="/edit-profile"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 px-4 sm:py-2.5 sm:px-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium text-sm sm:text-base"
                  >
                    Edit Profile
                  </Link>
                ) : session ? (
                  <FollowButton targetUserId={serializedUser._id} isFollowing={isFollowing} />
                ) : (
                  <Link
                    href="/login"
                    className="bg-white/80 backdrop-blur-sm text-gray-700 py-2 px-4 sm:py-2.5 sm:px-6 rounded-xl hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 border border-gray-200 font-medium text-sm sm:text-base"
                  >
                    Follow
                  </Link>
                )}
              </div>
            </div>

            <p className="text-gray-500 font-medium mb-4 sm:mb-6 text-sm sm:text-base">@{serializedUser.username}</p>

            <div className="mt-4 sm:mt-6 flex gap-3 sm:gap-6 md:gap-8 justify-center lg:justify-start">
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px] ">
                <p className="font-bold text-lg sm:text-xl text-gray-800">{serializedPosts.length}</p>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Posts</p>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px] ">
                <p className="font-bold text-lg sm:text-xl text-gray-800">{serializedUser.followersCount}</p>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Followers</p>
              </div>
              <div className="text-center bg-white/60 backdrop-blur-sm rounded-xl p-3 sm:p-4 min-w-[70px] sm:min-w-[80px] ">
                <p className="font-bold text-lg sm:text-xl text-gray-800">{serializedUser.followingCount}</p>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Following</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 bg-gray-50/80 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base max-w-full lg:max-w-lg">
                {serializedUser.about}
              </p>
            </div>

            {/* {(serializedUser.skills || []).length > 0 && (
              <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                {serializedUser.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-200/50"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )} */}
          </div>

          {isOwner && (
            <div className="mt-4 lg:mt-0 flex-shrink-0">
              <DeleteAccountButton userId={session?.user?.id.toString()} />
            </div>
          )}
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 flex items-center gap-2 sm:gap-3">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
            Posts
          </h2>
          {serializedPosts.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {serializedPosts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 mt-8 sm:mt-12 bg-white/80 backdrop-blur-sm p-6 sm:p-8 md:p-12 rounded-2xl shadow-lg border border-white/20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-lg sm:text-xl font-medium text-gray-600">No posts to show... yet!</p>
              <p className="text-gray-500 mt-2 text-sm sm:text-base">Share your first post to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
