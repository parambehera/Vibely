"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import axios from "axios";
import { useState, useEffect, useRef } from "react";
import { FaHeart, FaCommentDots, FaTrash } from "react-icons/fa";
import { io } from "socket.io-client";
import toast from "react-hot-toast";

// Single Comment
const CommentCard = ({ comment, onDelete }) => {
    const { data: session } = useSession();
    const user = comment.user || {};
    const [formattedDate, setFormattedDate] = useState("");

    useEffect(() => {
        setFormattedDate(
            new Date(comment.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
            })
        );
    }, [comment.createdAt]);

    const isOwner = session?.user?.id === user._id;

    const handleDeleteComment = () => {
        toast((t) => (
            <div>
                <p>Delete this comment?</p>
                <div className="flex space-x-2 mt-2">
                    <button onClick={() => { onDelete(comment._id); toast.dismiss(t.id); }} className="px-2 py-1 bg-red-500 text-white rounded">Yes</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-2 py-1 bg-gray-300 rounded">No</button>
                </div>
            </div>
        ), { duration: 4000 });
    };

    return (
        <div className="flex items-start space-x-3 py-2 group">
            <Link href={`/profile/${user.username}`}>
                <img src={user.image || "/default-avatar.png"} alt={user.name || "User"} className="w-9 h-9 rounded-full object-cover cursor-pointer"/>
            </Link>
            <div className="flex-1 bg-gray-100 dark:bg-gray-100 rounded-xl p-3 text-black">
                <div className="flex items-baseline space-x-2">
                    <Link href={`/profile/${user.username}`}>
                        <p className="font-semibold text-sm text-gray-100 dark:text-gray-800 hover:underline">{user.name || "Anonymous"}</p>
                    </Link>
                    <p className="text-xs text-gray-800 dark:text-gray-800">{formattedDate}</p>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-800 mt-1">{comment.text}</p>
            </div>
            {isOwner && (
                <button onClick={handleDeleteComment} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete comment">
                    <FaTrash />
                </button>
            )}
        </div>
    );
};

// Post Card
export default function PostCard({ post }) {
    const { data: session } = useSession();
    const author = post.author || {};
    const socketRef = useRef(null);

    const [formattedPostDate, setFormattedPostDate] = useState("");
    const [likes, setLikes] = useState(post.likes?.length || 0);
    const [liked, setLiked] = useState(post.likes?.includes(session?.user?.id) || false);
    const [comments, setComments] = useState(post.comments || []);
    const [newCommentText, setNewCommentText] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const handleDelete = () => {
        toast((t) => (
            <div>
                <p>Delete this post?</p>
                <div className="flex space-x-2 mt-2">
                    <button onClick={async () => {
                        try {
                            await axios.delete(`/api/posts/${post._id}`);
                            toast.success("Post deleted!");
                            toast.dismiss(t.id);
                            window.location.reload();
                        } catch (err) {
                            toast.error("Failed to delete post.");
                            toast.dismiss(t.id);
                        }
                    }} className="px-2 py-1 bg-red-500 text-white rounded">Yes</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-2 py-1 bg-gray-300 rounded">No</button>
                </div>
            </div>
        ), { duration: 4000 });
    };

    const handleLike = async () => {
        try {
            const res = await axios.put(`/api/posts/${post._id}`);
            setLiked(!liked);
            setLikes(res.data.likesCount);
        } catch (err) {
            toast.error("Failed to like post.");
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newCommentText.trim() || !session) return;
        setIsSubmittingComment(true);
        try {
            const response = await axios.post(`/api/posts/${post._id}`, { text: newCommentText });
            const createdComment = response.data;
            if (socketRef.current) {
                socketRef.current.emit("new-comment-broadcast", { postId: post._id, comment: createdComment });
            }
            setComments((prevComments) => [...prevComments, createdComment]);
            setNewCommentText("");
        } catch (error) {
            toast.error("Failed to post comment.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleCommentDelete = async (commentId) => {
        try {
            await axios.delete(`/api/posts/${post._id}/comments/${commentId}`);
            setComments(prev => prev.filter(c => c._id !== commentId));
            if (socketRef.current) {
                socketRef.current.emit('delete-comment-broadcast', { postId: post._id, commentId });
            }
            toast.success("Comment deleted");
        } catch (error) {
            toast.error('Could not delete comment.');
        }
    };

    useEffect(() => {
        setFormattedPostDate(new Date(post.createdAt).toLocaleString());

        const socketInitializer = async () => {
            await fetch("/api/socket");
            socketRef.current = io();
            socketRef.current.on("connect", () => {
                socketRef.current.emit("join-post-room", post._id);
            });
            socketRef.current.on("comment-received", (receivedComment) => {
                setComments(prev => {
                    if (prev.some(c => c._id === receivedComment._id)) return prev;
                    return [...prev, receivedComment];
                });
            });
            socketRef.current.on('comment-deleted-received', (data) => {
                if (data.postId === post._id) {
                    setComments(prev => prev.filter(c => c._id !== data.commentId));
                }
            });
        };

        socketInitializer();

        return () => socketRef.current?.disconnect();
    }, [post._id]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 space-y-5 border border-gray-200">
      {/* Author */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img
            src={author.image || "/default-avatar.png"}
            alt={author.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-100"
          />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <Link href={`/profile/${author.username}`}>
            <p className="font-bold text-gray-900 hover:text-blue-600 transition-colors duration-200">
              {author.name || "Anonymous"}
            </p>
          </Link>
          <p className="text-sm text-gray-500 font-medium">{formattedPostDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-gray-800 leading-relaxed text-base">{post.content}</p>
        {post.image && (
          <div className="rounded-xl overflow-hidden bg-gray-50 shadow-inner">
            <img
              src={post.image || "/placeholder.svg"}
              alt="Post content"
              className="w-full h-auto object-contain max-h-[500px]"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-8">
          <button
            onClick={handleLike}
            className="flex items-center space-x-2 group transition-all duration-200 hover:scale-105"
          >
            <div
              className={`p-2 rounded-full transition-all duration-200 ${liked ? "bg-red-50" : "hover:bg-gray-100"}`}
            >
              <FaHeart
                className={`text-lg  cursor-pointer ${liked ? "text-red-500" : "text-gray-400 group-hover:text-red-400"} transition-colors duration-200`}
              />
            </div>
            <span className="font-semibold text-gray-700">{likes|| 0}</span>
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 group transition-all duration-200 hover:scale-105"
          >
            <div className="p-2 rounded-full hover:bg-gray-100 transition-all duration-200">
              <FaCommentDots className="text-lg cursor-pointer text-gray-400 group-hover:text-blue-400 transition-colors duration-200" />
            </div>
            <span className="font-semibold text-gray-700">{comments.length}</span>
          </button>
        </div>
        {session?.user?.id === post.author._id && (
          <button
            onClick={handleDelete}
            className="flex items-center space-x-2 text-gray-500 hover:text-red-500 transition-all duration-200 hover:scale-105 group"
          >
            <div className="p-2 rounded-full hover:bg-red-50 transition-all duration-200">
              <FaTrash className="text-sm group-hover:text-red-500 transition-colors duration-200" />
            </div>
            <span className="font-medium">Delete</span>
          </button>
        )}
      </div>

            {/* Comments */}
            {showComments && (
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                    {session && (
                        <form onSubmit={handleCommentSubmit} className="flex items-start space-x-3 mb-4">
                            <img src={session.user.image || "/default-avatar.png"} alt="Your avatar" className="w-9 h-9 rounded-full object-cover"/>
                            <div className="flex-1">
                                <textarea value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Add a comment..." className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-200 dark:text-black" rows="1"/>
                                <button type="submit" disabled={isSubmittingComment || !newCommentText.trim()} className="mt-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:bg-blue-300 disabled:cursor-not-allowed">
                                    {isSubmittingComment ? "Posting..." : "Post"}
                                </button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-2">
                        {comments.length > 0 ? comments.map(c => <CommentCard key={c._id} comment={c} onDelete={handleCommentDelete} />) : (
                            <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">No comments yet. Be the first!</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
