import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust this path if it's different
import { connectToDB } from '@/lib/db';
import Post from '@/models/Post';

// === DELETE: Delete a specific comment from a post ===
export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);

  // 1. Check if the user is authenticated
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDB();
  // 2. Get the post ID and comment ID from the URL
  const { id: postId, commentId } = params;
  if (!postId || !commentId) {
    return NextResponse.json({ message: 'Post ID and Comment ID are required' }, { status: 400 });
  }

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 });
    }

    // 3. Find the specific comment within the post's comments array
    const comment = post.comments.id(commentId);
    if (!comment) {
      return NextResponse.json({ message: 'Comment not found' }, { status: 404 });
    }

    // 4. Verify that the logged-in user is the owner of the comment
    if (comment.user.toString() !== session.user.id) {
      return NextResponse.json({ message: 'Forbidden: You are not the owner of this comment' }, { status: 403 });
    }

    // 5. Use $pull to remove the comment from the array in the database
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: { _id: commentId } }
    });

    return NextResponse.json({ message: 'Comment deleted successfully' }, { status: 200 });

  } catch (error) {
    console.error('[COMMENT_DELETE_ERROR]', error);
    return NextResponse.json({ message: 'Failed to delete comment', error: error.message }, { status: 500 });
  }
}
