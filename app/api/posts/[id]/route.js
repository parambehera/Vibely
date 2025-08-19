import { connectToDB } from "@/lib/db";
import Post from "@/models/Post";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import User from '@/models/User';
import { NextResponse } from 'next/server';
import pusher from "@/lib/pusher";

// ✅ DELETE post (No changes)
export async function DELETE(req, { params }) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);
        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        const post = await Post.findById(params.id);
        if (!post) {
            return new Response("Post not found", { status: 404 });
        }

        if (post.author.toString() !== session.user.id) {
            return new Response("Forbidden", { status: 403 });
        }

        await Post.findByIdAndDelete(params.id);
        await pusher.trigger("posts", "delete-post", post._id);

        return new Response("Post deleted", { status: 200 });
    } catch (err) {
        console.error("[POST_DELETE_ERROR]", err);
        return new Response("Failed to delete post", { status: 500 });
    }
}

// ✅ Like / Unlike post (No changes)
export async function PUT(req, { params }) {
    try {
        await connectToDB();
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new Response("Unauthorized", { status: 401 });
        }

        const post = await Post.findById(params.id);
        if (!post) {
            return new Response("Post not found", { status: 404 });
        }

        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        const userId = session.user.id;
        const alreadyLiked = post.likes.some((uid) => uid.toString() === userId);
         
        if (alreadyLiked) {
            post.likes = post.likes.filter((uid) => uid.toString() !== userId);
        } else {
            post.likes.push(userId);
        }

        await post.save();
        // Return the new count of likes
        await pusher.trigger(`post-${post._id}`, "like-count", post.likes.length);
        
        return new Response(JSON.stringify({ likesCount: post.likes.length }), {
            status: 200,
        });
    } catch (err) {
        console.error("[POST_LIKE_ERROR]", err);
        return new Response("Error liking post", { status: 500 });
    }
}


// ✅ Add a comment (Corrected)
export async function POST(request, { params }) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDB();

    // --- THIS IS THE FIX ---
    // Use params.id to match the folder name [id] and other functions in this file.
    const postId = await params.id; 
    const { text } = await request.json();

    if (!text || !text.trim()) {
        return NextResponse.json(
            { message: "Comment text cannot be empty" },
            { status: 400 }
        );
    }

    try {
        const newComment = {
            user: session.user.id,
            text: text,
            createdAt: new Date(),
        };

        const updatedPost = await Post.findByIdAndUpdate(
            postId, // Now using the correct postId
            { $push: { comments: newComment } },
            { new: true }
        );
         
        
        if (!updatedPost) {
            return NextResponse.json({ message: "Post not found" }, { status: 404 });
        }

        const addedComment = updatedPost.comments[updatedPost.comments.length - 1];
        const authorDetails = await User.findById(session.user.id)
            .select("name username image")
            .lean();

        const responseComment = {
            _id: addedComment._id.toString(),
            text: addedComment.text,
            createdAt: addedComment.createdAt.toISOString(),
            user: {
                _id: authorDetails._id.toString(),
                name: authorDetails.name,
                username: authorDetails.username,
                image: authorDetails.image,
            },
        };

        await pusher.trigger(`post-${postId}`, "new-comment", responseComment);

        return NextResponse.json(responseComment, { status: 201 });
    } catch (error) {
        console.error("Failed to create comment:", error);
        return NextResponse.json(
            { message: "Failed to create comment", error: error.message },
            { status: 500 }
        );
    }
}
