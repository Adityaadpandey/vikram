# Secure Chat API Usage Guide

This guide explains how to use the secure chat system with Twilio OTP, Redis storage, and end-to-end encryption.

## Overview

The system provides:

- **Twilio OTP verification** with Redis storage
- **Army ID-based authentication**
- **Public/Private key generation** with seed phrase encryption
- **End-to-end encrypted WebSocket chat**
- **Key decryption** using seed phrase + phone + army ID

## API Endpoints

### 1. Send OTP

```http
POST /auth/register
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

**Response:**

```json
{
  "message": "OTP sent successfully",
  "expiresIn": 300
}
```

### 2. Verify OTP and Create User

```http
POST /auth/verify
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456",
  "armyId": "army-id-123"
}
```

**Response:**

```json
{
  "message": "OTP verified successfully",
  "token": "jwt-token",
  "userId": "user-uuid",
  "armyId": "army-id-123",
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident",
  "requiresKeySetup": true
}
```

### 3. Generate Key Pair

```http
POST /auth/generate-keys
Content-Type: application/json

{
  "userId": "user-uuid"
}
```

**Response:**

```json
{
  "message": "Key pair generated successfully",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "warning": "Encrypt and store these keys securely!"
}
```

### 4. Save Encrypted Keys

```http
POST /auth/keys-saved
Content-Type: application/json

{
  "userId": "user-uuid",
  "armyId": "army-id-123",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident",
  "name": "John Doe",
  "designation": "Captain"
}
```

**Response:**

```json
{
  "message": "Keys saved successfully",
  "warning": "Store your seed phrase safely. It cannot be recovered!"
}
```

### 5. Decrypt Private Key for Chat

```http
POST /auth/decrypt-key
Content-Type: application/json

{
  "userId": "user-uuid",
  "seedPhrase": "abandon ability able about above absent absorb abstract absurd abuse access accident",
  "phone": "+1234567890",
  "armyId": "army-id-123"
}
```

**Response:**

```json
{
  "message": "Private key decrypted successfully",
  "privateKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
}
```

### 6. Get User's Public Key

```http
GET /auth/public-key/:userId
```

**Response:**

```json
{
  "message": "Public key retrieved successfully",
  "publicKey": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
  "userId": "user-uuid",
  "armyId": "army-id-123",
  "name": "John Doe"
}
```

## WebSocket Chat API

### Connection

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: "your-jwt-token" },
});
```

### Events

#### 1. Setup Encryption

```javascript
socket.emit("setup_encryption", {
  privateKey: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  publicKey: "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
});
```

#### 2. Send Message

```javascript
socket.emit("send_message", {
  recipientId: "recipient-user-id",
  message: "Hello, this is a secure message!",
});
```

#### 3. Decrypt Message

```javascript
socket.emit("decrypt_message", {
  encryptedMessage: "base64-encrypted-message",
});
```

#### 4. Get Pending Messages

```javascript
socket.emit("get_pending_messages");
```

### Listeners

#### 1. Connection Confirmation

```javascript
socket.on("connected", (data) => {
  console.log("Connected:", data);
});
```

#### 2. Encryption Ready

```javascript
socket.on("encryption_ready", (data) => {
  console.log("Encryption ready:", data);
});
```

#### 3. Receive Message

```javascript
socket.on("receive_message", (data) => {
  console.log("Received message:", data);
  // Decrypt the message
  socket.emit("decrypt_message", {
    encryptedMessage: data.encryptedMessage,
  });
});
```

#### 4. Message Decrypted

```javascript
socket.on("message_decrypted", (data) => {
  console.log("Decrypted message:", data.decryptedMessage);
});
```

#### 5. Message Sent Confirmation

```javascript
socket.on("message_sent", (data) => {
  console.log("Message sent:", data);
});
```

#### 6. Pending Messages

```javascript
socket.on("pending_messages", (messages) => {
  console.log("Pending messages:", messages);
});
```

#### 7. Error Handling

```javascript
socket.on("error", (error) => {
  console.error("Error:", error);
});
```

## Complete Flow Example

### 1. User Registration and Key Setup

```javascript
// Step 1: Send OTP
const registerResponse = await fetch("/auth/register", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ phone: "+1234567890" }),
});

// Step 2: Verify OTP
const verifyResponse = await fetch("/auth/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone: "+1234567890",
    otp: "123456",
    armyId: "army-id-123",
  }),
});

const { token, userId, seedPhrase } = await verifyResponse.json();

// Step 3: Generate keys
const keysResponse = await fetch("/auth/generate-keys", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userId }),
});

const { publicKey, privateKey } = await keysResponse.json();

// Step 4: Save encrypted keys
await fetch("/auth/keys-saved", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userId,
    armyId: "army-id-123",
    publicKey,
    privateKey,
    seedPhrase,
    name: "John Doe",
    designation: "Captain",
  }),
});
```

### 2. Chat Setup and Usage

```javascript
// Step 1: Connect to WebSocket
const socket = io("http://localhost:3000", {
  auth: { token },
});

// Step 2: Setup encryption
socket.emit("setup_encryption", {
  privateKey,
  publicKey,
});

// Step 3: Send messages
socket.emit("send_message", {
  recipientId: "recipient-id",
  message: "Hello!",
});

// Step 4: Handle incoming messages
socket.on("receive_message", (data) => {
  socket.emit("decrypt_message", {
    encryptedMessage: data.encryptedMessage,
  });
});

socket.on("message_decrypted", (data) => {
  console.log("Received:", data.decryptedMessage);
});
```

## Security Features

1. **OTP Verification**: Twilio SMS with Redis storage (5-minute expiry)
2. **Army ID Authentication**: Unique identifier for each user
3. **Seed Phrase Encryption**: Private keys encrypted with seed phrase + phone + army ID
4. **End-to-End Encryption**: RSA encryption for chat messages
5. **Key Management**: Public keys stored in Redis, private keys never stored unencrypted
6. **Session Management**: Keys cleaned up on disconnect

## Environment Variables

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Redis Configuration
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (missing/invalid parameters)
- `404`: Not Found (user/key not found)
- `500`: Internal Server Error

WebSocket events include error handling with descriptive messages.

## Notes

- **Seed phrases are only shown once** during registration
- **Private keys are never stored unencrypted**
- **Messages are encrypted with recipient's public key**
- **Redis is used for temporary storage** (OTP, keys, messages)
- **All communications are logged** for debugging purposes
