import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path if needed
import { connectToDB } from '@/lib/db';
import User from '@/models/User';

// === PUT: Follow or Unfollow a user ===
export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);

  // 1. Check for authentication
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await connectToDB();

  const currentUserId = session.user.id;
  const targetUserId = params.id; // The ID of the user to follow/unfollow

  // 2. Prevent user from following themselves
  if (currentUserId === targetUserId) {
    return NextResponse.json({ message: 'You cannot follow yourself' }, { status: 400 });
  }

  try {
    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // 3. Check if the current user is already following the target user
    const isFollowing = currentUser.following.includes(targetUserId);

    if (isFollowing) {
      // --- UNFOLLOW LOGIC ---
      // Remove target user from current user's 'following' list
      await User.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      // Remove current user from target user's 'followers' list
      await User.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      
      return NextResponse.json({ message: 'Successfully unfollowed user', isFollowing: false });

    } else {
      // --- FOLLOW LOGIC ---
      // Add target user to current user's 'following' list
      await User.findByIdAndUpdate(currentUserId, { $push: { following: targetUserId } });
      // Add current user to target user's 'followers' list
      await User.findByIdAndUpdate(targetUserId, { $push: { followers: currentUserId } });

      return NextResponse.json({ message: 'Successfully followed user', isFollowing: true });
    }

  } catch (error) {
    console.error('[FOLLOW_USER_ERROR]', error);
    return NextResponse.json({ message: 'Failed to update follow status' }, { status: 500 });
  }
}
