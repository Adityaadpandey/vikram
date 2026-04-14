import "dotenv/config";
import { PrismaClient } from "./generated/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import crypto from "crypto";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to generate fake encrypted data
function generateEncryptedData() {
  const cipher = crypto.randomBytes(32).toString("hex");
  const iv = crypto.randomBytes(16).toString("hex");
  return { cipher, iv };
}

// Sample messages for variety
const sampleMessages = [
  "Hey, how are you?",
  "Let's grab coffee tomorrow",
  "Did you complete the mission briefing?",
  "Call me when you're free",
  "Thanks for the update",
  "What's your status report?",
  "See you at the meeting",
  "Everything is ready to go",
  "Can you send me the files?",
  "Mission accomplished!",
  "Standing by for further instructions",
  "Roger that",
  "Message received",
  "All clear",
  "Awaiting your confirmation",
];

// Sample notification messages
const sampleNotifications = [
  "New message from {name}",
  "You missed a call from {name}",
  "{name} sent you a file",
  "Mission update: {name} has arrived",
  "Group notification: New member added",
  "{name} is typing...",
  "New task assignment from {name}",
  "Emergency alert from {name}",
  "Status update from {name}",
  "You have been added to a group",
];

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Get or create test users
    const user1 = await prisma.user.upsert({
      where: { armyId: "ARMY001" },
      update: {},
      create: {
        armyId: "ARMY001",
        phone: "+919876543210",
        name: "Captain Vikram",
        designation: "Commanding Officer",
      },
    });

    const user2 = await prisma.user.upsert({
      where: { armyId: "ARMY002" },
      update: {},
      create: {
        armyId: "ARMY002",
        phone: "+919876543211",
        name: "Lieutenant Sharma",
        designation: "Field Officer",
      },
    });

    const user3 = await prisma.user.upsert({
      where: { armyId: "ARMY003" },
      update: {},
      create: {
        armyId: "ARMY003",
        phone: "+919876543212",
        name: "Major Patel",
        designation: "Operations Head",
      },
    });

    const user4 = await prisma.user.upsert({
      where: { armyId: "ARMY004" },
      update: {},
      create: {
        armyId: "ARMY004",
        phone: "+919876543213",
        name: "Soldier Kumar",
        designation: "Team Member",
      },
    });

    const demoUserIds = new Set([user1.id, user2.id, user3.id, user4.id]);
    const existingUsers = await prisma.user.findMany();
    const additionalUsers = existingUsers
      .filter((u) => !demoUserIds.has(u.id))
      .slice(0, 4);
    const userPool = [user1, user2, user3, user4, ...additionalUsers];

    console.log("✅ Users created/updated");

    // Create friendships
    await prisma.friend.createMany({
      data: [
        { userId: user1.id, friendId: user2.id },
        { userId: user1.id, friendId: user3.id },
        { userId: user1.id, friendId: user4.id },
        { userId: user2.id, friendId: user1.id },
        { userId: user2.id, friendId: user3.id },
        { userId: user3.id, friendId: user1.id },
        { userId: user3.id, friendId: user2.id },
        { userId: user4.id, friendId: user1.id },
      ],
      skipDuplicates: true,
    });

    const extraFriendships = additionalUsers.flatMap((extraUser) => [
      { userId: user1.id, friendId: extraUser.id },
      { userId: extraUser.id, friendId: user1.id },
    ]);

    if (extraFriendships.length > 0) {
      await prisma.friend.createMany({
        data: extraFriendships,
        skipDuplicates: true,
      });
    }

    console.log("✅ Friendships created");

    // Create dummy messages
    console.log("📨 Creating dummy messages...");
    const baseTime = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

    const messageIds: string[] = [];
    for (let i = 0; i < 20; i++) {
      const sender = userPool[i % userPool.length];
      const recipient = userPool[(i + 1) % userPool.length];

      if (sender.id === recipient.id) continue;

      const messageId = crypto.randomUUID();
      const { cipher, iv } = generateEncryptedData();

      await prisma.message.create({
        data: {
          id: messageId,
          senderId: sender.id,
          recipientId: recipient.id,
          encryptedContent: cipher,
          iv: iv,
          status: ["sent", "delivered", "read"][Math.floor(Math.random() * 3)],
          timestamp: new Date(baseTime.getTime() + i * (6 * 60 * 60 * 1000)),
        },
      });

      messageIds.push(messageId);
    }

    console.log(`✅ Created 20 dummy messages`);

    // Create dummy group
    const groupUsers = userPool.slice(0, Math.min(userPool.length, 8));
    const group = await prisma.group.create({
      data: {
        name: "Alpha Team",
        createdById: user1.id,
        members: {
          create: groupUsers.map((u) => ({
            userId: u.id,
            role: u.id === user1.id ? "admin" : "member",
          })),
        },
      },
    });

    console.log("✅ Created group chat");

    // Create group messages
    console.log("📨 Creating dummy group messages...");
    for (let i = 0; i < 15; i++) {
      const sender = groupUsers[i % groupUsers.length];
      const { cipher, iv } = generateEncryptedData();

      // Create encrypted keys for group members
      const encryptedKeys: { [key: string]: string } = {};
      groupUsers.forEach((user) => {
        encryptedKeys[user.id] = crypto.randomBytes(32).toString("hex");
      });

      await prisma.message.create({
        data: {
          id: crypto.randomUUID(),
          senderId: sender.id,
          groupId: group.id,
          encryptedContent: cipher,
          encryptedKeys: encryptedKeys,
          iv: iv,
          status: "delivered",
          timestamp: new Date(
            baseTime.getTime() + (20 + i) * (6 * 60 * 60 * 1000),
          ),
        },
      });
    }

    console.log(`✅ Created 15 dummy group messages`);

    // Create dummy notifications
    console.log("🔔 Creating dummy notifications...");
    for (let i = 0; i < 16; i++) {
      const user = userPool[i % userPool.length];
      const otherUser = userPool[(i + 1) % userPool.length];
      const notificationTemplate =
        sampleNotifications[i % sampleNotifications.length];
      const message = notificationTemplate.replace(
        "{name}",
        otherUser.name || "User",
      );

      await prisma.notification.create({
        data: {
          userId: user.id,
          message: message,
        },
      });
    }

    console.log(`✅ Created 16 dummy notifications`);

    // Create dummy calls
    console.log("📞 Creating dummy calls...");
    const callStartTimes = [
      new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
      new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
      new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    ];

    for (let i = 0; i < 12; i++) {
      const caller = userPool[i % userPool.length];
      const recipients = userPool.filter((u) => u.id !== caller.id);

      const callType = i % 2 === 0 ? "voice" : "video";
      const callStatus = ["missed", "completed", "ongoing"][
        Math.floor(Math.random() * 3)
      ];
      const startedAt = callStartTimes[i % callStartTimes.length];
      const duration =
        callStatus === "missed" ? null : Math.floor(Math.random() * 1800) + 60; // 1-30 minutes

      const call = await prisma.call.create({
        data: {
          callerId: caller.id,
          type: callType,
          status: callStatus,
          startedAt: startedAt,
          endedAt: duration
            ? new Date(startedAt.getTime() + duration * 1000)
            : null,
          duration: duration,
          participants: {
            create: recipients.map((recipient) => ({
              userId: recipient.id,
              status: callStatus === "missed" ? "missed" : "accepted",
            })),
          },
        },
      });
    }

    console.log(`✅ Created 12 dummy calls with participants`);

    // Create some starred messages
    console.log("⭐ Creating starred messages...");
    const starredCount = Math.min(messageIds.length, 5);
    for (let i = 0; i < starredCount; i++) {
      const user = userPool[i % userPool.length];
      await prisma.starredMessage.create({
        data: {
          userId: user.id,
          messageId: messageIds[i],
        },
      });
    }

    console.log(`✅ Starred ${starredCount} messages`);

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: 4`);
    console.log(`   - Friendships: 8`);
    console.log(`   - Direct Messages: 20`);
    console.log(`   - Group: 1`);
    console.log(`   - Group Messages: 15`);
    console.log(`   - Notifications: 16`);
    console.log(`   - Calls: 12`);
    console.log(`   - Starred Messages: ${starredCount}`);
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

seed();
