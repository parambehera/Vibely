import { connectToDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import PostCard from "@/components/PostCard";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    await connectToDB();
    const session = await getServerSession(authOptions);

    // If no user is logged in, redirect to the login page
    if (!session) {
        redirect('/login');
    }

    // Find the current user and get their 'following' list
    const currentUser = await User.findById(session.user.id).lean();
    if (!currentUser) {
        redirect('/login');
    }

    // Create a list of user IDs to fetch posts from:
    // It includes the current user's own ID and everyone they follow.
    const userIdsToFetch = [currentUser._id, ...currentUser.following];

    // Fetch posts where the author is in the list we created
    const posts = await Post.find({ author: { $in: userIdsToFetch } })
        .sort({ createdAt: -1 })
        .populate('author')
        .populate({
            path: 'comments',
            populate: {
                path: 'user',
                model: 'User',
                select: 'name username image'
            }
        })
        .lean();

    // Serialize the post data to safely pass to the client component
    const serializedPosts = posts.map(post => {
        // Safely handle posts that may not have an author object
        const author = post.author && typeof post.author === 'object' ? {
            _id: post.author._id.toString(),
            name: post.author.name,
            username: post.author.username,
            image: post.author.image || null,
        } : { _id: null, name: 'Unknown', username: 'unknown', image: null };

        return {
            _id: post._id.toString(),
            content: post.content,
            image: post.image || null,
            author: author,
            // --- FIX APPLIED HERE ---
            // Provide a fallback empty array `[]` to prevent errors if post.likes is undefined.
            likes: (post.likes || []).map(id => id.toString()),
            // Provide a fallback for comments as well for robustness.
            comments: (post.comments || []).map(comment => ({
                _id: comment._id.toString(),
                text: comment.text,
                createdAt: comment.createdAt.toISOString(),
                // Safely handle comments that may not have a user object
                user: comment.user && typeof comment.user === 'object' ? {
                    _id: comment.user._id.toString(),
                    name: comment.user.name,
                    username: comment.user.username,
                    image: comment.user.image || null,
                } : { _id: null, name: 'Unknown', username: 'unknown', image: null }
            })),
            createdAt: post.createdAt.toISOString(),
        };
    });

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-6">Your Feed</h1>
            {serializedPosts.length > 0 ? (
                <div className="space-y-6">
                    {serializedPosts.map((post) => (
                        <PostCard key={post._id} post={post} />
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 mt-10 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <p className="text-lg">Your feed is empty.</p>
                    <p className="mt-2">Follow some people to see their posts here!</p>
                </div>
            )}
        </div>
    );
}
