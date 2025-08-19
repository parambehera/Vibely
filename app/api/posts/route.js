// app/api/posts/route.js

import { connectToDB } from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import cloudinary from '@/lib/cloudinary';
import pusher from '@/lib/pusher';

// Helper for consistent JSON response
const jsonResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// === POST: Create new post ===
export async function POST(req) {
  try {
    await connectToDB();

    const session = await getServerSession(authOptions);
    if (!session) return jsonResponse({ message: 'Unauthorized' }, 401);

    const formData = await req.formData();
    const content = formData.get('content');
    const imageFile = formData.get('image');

    let imageUrl = '';
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'posts' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = result.secure_url;
    }

    const user = await User.findById(session.user.id);

    const post = await Post.create({
      author: user._id,
      content,
      image: imageUrl,
    });
    const newPost = await Post.findById(post._id) 
      .populate('author', 'name email image username')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name username image',
        },
      });

      await pusher.trigger("posts", "new-post", newPost.toJSON());

    return jsonResponse({ message: 'Post created successfully', newPost }, 201);
    
  } catch (err) {
    console.error('[POST ERROR]', err);
    return jsonResponse({ message: 'Error creating post', error: err.message }, 500);
  }
}

// === GET: Fetch all posts ===
export async function GET() {
  try {
    await connectToDB();

    const posts = await Post.find()
      .sort({ createdAt: -1 }) // newest first
      .populate('author', 'name email image username')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: 'name username image',
        },
      });

    return jsonResponse({ message: 'Posts fetched successfully', posts }, 200);
  } catch (err) {
    console.error('[GET_POSTS_ERROR]', err);
    return jsonResponse({ message: 'Error fetching posts', error: err.message }, 500);
  }
}
