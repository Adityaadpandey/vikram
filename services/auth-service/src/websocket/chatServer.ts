import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { prisma } from '../config/db';
import { verifyToken } from '../config/jwt';
import { redis } from '../config/redis';


interface AuthenticatedSocket extends Socket {
    userId?: string;
}

export const initializeWebSocket = (httpServer: HTTPServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // Configure properly in production
            methods: ['GET', 'POST'],
        },
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = verifyToken(token);

            if (!decoded) {
                return next(new Error('Invalid token'));
            }

            socket.userId = decoded.userId;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', async (socket: AuthenticatedSocket) => {
        console.log(`✅ User connected: ${socket.userId}`);

        // Join user to their personal room
        socket.join(`user:${socket.userId}`);

        // Store user's socket ID in Redis for presence
        await redis.setex(`socket:${socket.userId}`, 3600, socket.id);

        // Handle sending encrypted message
        socket.on('send_message', async (data) => {
            try {
                const { recipientId, encryptedMessage, encryptedForSender } = data;

                // Verify recipient exists
                const recipient = await prisma.user.findUnique({
                    where: { id: recipientId },
                });

                if (!recipient) {
                    socket.emit('error', { message: 'Recipient not found' });
                    return;
                }

                // Check if recipient is online
                const recipientSocketId = await redis.get(`socket:${recipientId}`);

                const messageData = {
                    from: socket.userId,
                    to: recipientId,
                    encryptedMessage,
                    timestamp: new Date().toISOString(),
                };

                // Send to recipient if online
                if (recipientSocketId) {
                    io.to(`user:${recipientId}`).emit('receive_message', messageData);
                }

                // Send confirmation back to sender with their encrypted copy
                socket.emit('message_sent', {
                    ...messageData,
                    encryptedMessage: encryptedForSender,
                    status: recipientSocketId ? 'delivered' : 'pending',
                });

                // Store message in Redis for offline delivery
                if (!recipientSocketId) {
                    await redis.lpush(
                        `messages:${recipientId}`,
                        JSON.stringify(messageData)
                    );
                    await redis.expire(`messages:${recipientId}`, 86400); // 24 hours
                }

                console.log(`📨 Message from ${socket.userId} to ${recipientId}`);
            } catch (error) {
                console.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing', async (data) => {
            const { recipientId, isTyping } = data;
            io.to(`user:${recipientId}`).emit('user_typing', {
                userId: socket.userId,
                isTyping,
            });
        });

        // Get pending messages on connect
        socket.on('get_pending_messages', async () => {
            try {
                const messages = await redis.lrange(`messages:${socket.userId}`, 0, -1);

                if (messages.length > 0) {
                    const parsedMessages = messages.map((msg) => JSON.parse(msg));
                    socket.emit('pending_messages', parsedMessages);

                    // Clear pending messages
                    await redis.del(`messages:${socket.userId}`);
                }
            } catch (error) {
                console.error('Get pending messages error:', error);
            }
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`❌ User disconnected: ${socket.userId}`);
            await redis.del(`socket:${socket.userId}`);
        });
    });

    return io;
};
