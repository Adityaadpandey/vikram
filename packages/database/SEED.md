# Database Seeding Guide

This document explains how to use the seed script to populate your database with dummy data for testing and development.

## Overview

The seed script generates realistic dummy data including:

- **4 Test Users** with different designations
- **Friendships** between users
- **20 Direct Messages** between users
- **1 Group Chat** (Alpha Team) with 4 members
- **15 Group Messages** with encrypted keys for all members
- **16 Notifications** with various types
- **12 Voice/Video Calls** with participants and durations
- **5 Starred Messages** by various users

## Prerequisites

- PostgreSQL database running
- `DATABASE_URL` environment variable configured
- All dependencies installed (`pnpm install`)
- Prisma migrations applied (`pnpm db:push`)

## Running the Seed Script

### From the database package:

```bash
cd packages/database
pnpm db:seed
```

### From workspace root (using pnpm workspace):

```bash
pnpm --filter @repo/database db:seed
```

## Prisma Configuration

This project uses Prisma 7's new configuration model:

- **Connection URL**: Configured in `prisma.config.ts` for migrations
- **Runtime Connection**: Passed via `datasourceUrl` to `PrismaClient` constructor
- **Schema**: The `prisma/schema.prisma` no longer contains the URL

## Generated Test Data

### Users Created:

1. **Captain Vikram** (ARMY001) - Commanding Officer
2. **Lieutenant Sharma** (ARMY002) - Field Officer
3. **Major Patel** (ARMY003) - Operations Head
4. **Soldier Kumar** (ARMY004) - Team Member

### Data Structure:

#### Messages

- Encrypted content with IV and encryption keys
- Status tracking: sent, delivered, read
- Timestamps spanning the last 7 days
- Both direct and group messages

#### Notifications

- User-specific notifications
- Multiple notification types
- References to other users
- Creation timestamps

#### Calls

- Mix of voice and video calls
- Various statuses: missed, completed, ongoing
- Call participants with acceptance status
- Duration tracking for completed calls

## Customization

To modify the seed data, edit `seed.ts`:

- **Sample Messages**: Modify the `sampleMessages` array
- **Sample Notifications**: Modify the `sampleNotifications` array
- **Number of Messages/Calls**: Adjust the loop counts
- **User Details**: Update the user creation section
- **Time Ranges**: Modify `baseTime` and time calculations

## Example Customizations:

### Add more messages:

```typescript
// Change from 20 to 50
for (let i = 0; i < 50; i++) {
  // ...
}
```

### Add more users:

```typescript
const user5 = await prisma.user.upsert({
  where: { armyId: "ARMY005" },
  update: {},
  create: {
    armyId: "ARMY005",
    phone: "+919876543214",
    name: "Corporal Singh",
    designation: "Support Team",
  },
});
```

### Modify notification templates:

```typescript
const sampleNotifications = [
  "New message from {name}",
  "Custom notification: {name} has sent an update",
  // Add more as needed
];
```

## Resetting the Database

To clear and reseed the database:

### Option 1: Using Prisma migrate

```bash
# Reset the database (careful: deletes all data!)
pnpm --filter @repo/database db:push -- --force-reset
pnpm --filter @repo/database db:seed
```

### Option 2: Manual PostgreSQL reset

```bash
# Connect to your database and run:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then:
pnpm --filter @repo/database db:push
pnpm --filter @repo/database db:seed
```

## Notes

- The script uses **upsert** for users to prevent duplicates
- Messages and calls have timestamps spread across the last 7 days
- All sensitive data (messages, keys) is encrypted with random values
- Call durations range from 1-30 minutes for completed calls
- Notifications use template strings `{name}` that are replaced with actual user names

## Troubleshooting

### "Database is empty"

Ensure you've run migrations first:

```bash
pnpm --filter @repo/database db:push
```

### "Connection refused"

Check that PostgreSQL is running and DATABASE_URL is correct:

```bash
echo $DATABASE_URL
```

### Script fails with errors

Check that all required permissions are set in the database and environment variables are properly configured.

## Next Steps

After seeding, you can:

1. Start your services: `pnpm dev`
2. Test messaging features with dummy data
3. View data in Prisma Studio: `pnpm --filter @repo/database studio`
4. Run automated tests with test data
