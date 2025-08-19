import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function POST(req) {
  const body = await req.json();
  const { action, postId, comment, commentId,post } = body;

  if (action === "new-comment") {
    await pusher.trigger(`post-${postId}`, "new-comment", comment);
  }

  if (action === "delete-comment") {
    await pusher.trigger(`post-${postId}`, "delete-comment", { commentId });
  }
  
  if(action==="new-post"){
    await pusher.trigger("posts","new-post",post)
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
