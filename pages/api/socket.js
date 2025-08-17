import { Server } from 'socket.io';

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket.IO server is already running.');
  } else {
    console.log('✅ Initializing a new Socket.IO server...');
    const io = new Server(res.socket.server, {
      path: '/socket.io',
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      
      socket.on('join-post-room', (postId) => {
        socket.join(postId);
        console.log(`🚪 Client ${socket.id} joined room for post: ${postId}`);
      });

      socket.on('new-comment-broadcast', (data) => {
        socket.to(data.postId).emit('comment-received', data.comment);
        console.log(`📢 Broadcasting new comment to room: ${data.postId}`);
      });

      // --- NEW: Listener for comment deletion ---
      socket.on('delete-comment-broadcast', (data) => {
        // Broadcast to all other clients in the room that a comment was deleted
        socket.to(data.postId).emit('comment-deleted-received', data);
        console.log(`📢 Broadcasting comment deletion to room: ${data.postId}`);
      });
      // --- END OF NEW LISTENER ---

      socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
      });
    });
  }
  res.end();
};

export default SocketHandler;
