"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

export default function FollowButton({
  targetUserId,
  isFollowing: initialIsFollowing,
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      const response = await axios.put(`/api/users/${targetUserId}/follow`);
      setIsFollowing(response.data.isFollowing);
      // Refresh the page server-side to update follower counts
      router.refresh();
    } catch (error) {
      console.error("Failed to follow/unfollow user:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`py-2.5 px-6 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? "bg-white/80 backdrop-blur-sm text-gray-700 hover:bg-white border border-gray-200"
          : "bg-gradient-to-r from-blue-100 to-blue-100 text-black hover:from-blue-100 hover:to-blue-100"
      }`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          {isFollowing ? "Unfollowing..." : "Following..."}
        </div>
      ) : isFollowing ? (
        "Unfollow"
      ) : (
        "Follow"
      )}
    </button>
  );
}
