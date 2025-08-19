"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import PostCard from "@/components/PostCard";
import toast from "react-hot-toast";
import Landing from "@/components/Landing";
import Pusher from "pusher-js";

export default function HomePage() {
  const { data: session } = useSession();

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  // User profile state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [profileImage, setProfileImage] = useState("");

  // --- 1️⃣ Fetch existing posts on first render ---
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get("/api/posts");
        setPosts(res.data.posts);
      } catch (err) {
        toast.error("Failed to fetch posts");
      }
    };
    fetchPosts();
  }, []);

  // --- 2️⃣ Subscribe to Pusher for real-time posts ---
  useEffect(() => {
    const pusherClient = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    });

    const channel = pusherClient.subscribe("posts");
    channel.bind("new-post", (post) => {
      setPosts((prev) => {
        if (prev.some((c) => c._id === post._id)) return prev;
        return [post, ...prev]; // prepend newest
      });
    });
    channel.bind("delete-post", (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.disconnect();
    };
  }, []); // run once

  // --- 3️⃣ Fetch user profile ---
  useEffect(() => {
    if (!session?.user) return;

    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/user/me");
        const user = res.data;
        setName(user?.name || "");
        setUsername(user?.username || "");
        setFollowers(user?.followers?.length || 0);
        setFollowing(user?.following?.length || 0);
        setProfileImage(user?.image || "");
      } catch {
        toast.error("Failed to fetch profile");
      }
    };
    fetchUser();
  }, [session?.user]);

  // --- 4️⃣ Create new post ---
  const handleCreate = async () => {
    if (!content.trim() && !image) {
      toast.error("Post cannot be empty");
      return;
    }
    setLoading(true);
    toast.loading("Publishing your post...");
    try {
      const formData = new FormData();
      formData.append("content", content);
      if (image) formData.append("image", image);

   const res =  await axios.post("/api/posts", formData); // Pusher triggered by backend
      setContent("");
      setImage(null);
      toast.dismiss();
      if(res.status==201)
      toast.success("Post published 🎉");
    } catch (err) {
      toast.dismiss();
      toast.error(err?.response?.data?.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return <Landing />;

  return (
    <div className="min-h-screen bg-[rgb(244,242,238)]">
      <div className="container mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-2rem)]">
          
          {/* LEFT SIDEBAR */}
          <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-8 self-start">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 text-center hover:shadow-lg transition-all duration-300">
              <div className="relative inline-block">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Profile"
                    className="w-20 h-20 rounded-full mx-auto object-cover border border-gray-200 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto"></div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <h2 className="text-xl font-bold mt-4 text-gray-800">{name}</h2>
              <p className="text-sm text-gray-500 mb-4">@{username}</p>
              <div className="flex justify-around pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{followers}</div>
                  <div className="text-xs text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-800">{following}</div>
                  <div className="text-xs text-gray-500">Following</div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN FEED */}
          <div className="order-2 lg:col-span-2 space-y-6 overflow-y-auto no-scrollbar pr-2">
            
            {/* Create Post */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300 text-black">
              <div className="flex items-center space-x-4 mb-4">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                )}
                <div className="flex-1">
                  <textarea
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-400 bg-gray-50 text-gray-800 placeholder-gray-400"
                    rows="3"
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm">Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files[0])}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={handleCreate}
                  disabled={(!content.trim() && !image) || loading}
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                    loading || (!content.trim() && !image)
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-black text-white hover:bg-gray-800"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    "Post"
                  )}
                </button>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6 pb-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onPostDeleted={(deletedId) =>
                    setPosts((prev) => prev.filter((p) => p._id !== deletedId))
                  }
                />
              ))}
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="order-3 hidden lg:block lg:col-span-1 lg:sticky lg:top-8 self-start">
            <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all duration-300">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Sponsored</h3>
              <div className="space-y-4">
                <div className="bg-gray-100 h-32 flex items-center justify-center rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-400 rounded-full mx-auto mb-2"></div>
                    <span className="text-sm text-gray-500">Ad Banner 1</span>
                  </div>
                </div>
                <div className="bg-gray-100 h-32 flex items-center justify-center rounded-lg border border-gray-200 hover:shadow-sm transition-all duration-200">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-gray-500 rounded-full mx-auto mb-2"></div>
                    <span className="text-sm text-gray-500">Ad Banner 2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
