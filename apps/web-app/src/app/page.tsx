'use client';

import { api } from '@/utils/api';
import { decryptMessage, encryptMessage, generateKeyPair } from '@/utils/encryption';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  from: string;
  to: string;
  encryptedMessage: string;
  timestamp: string;
  decrypted?: string;
}

interface User {
  userId: string;
  phone: string;
  token: string;
  seedPhrase: string;
  publicKey?: string;
  privateKey?: string;
}

export default function Home() {
  // Auth State
  const [step, setStep] = useState<'phone' | 'otp' | 'keys' | 'chat'>('phone');
  const [phone, setPhone] = useState('+1234567890');
  const [otp, setOtp] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [armyId, setArmyId] = useState('');
  const [designation, setDesignation] = useState('');

  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize WebSocket
  useEffect(() => {
    if (user?.token && step === 'chat' && !socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
        auth: { token: user.token },
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to WebSocket');
        setConnected(true);
        setError('');
      });

      newSocket.on('receive_message', (data: Message) => {
        console.log('📨 Received message:', data);
        const decrypted = decryptMessage(data.encryptedMessage, user.privateKey || '');
        setMessages((prev) => [...prev, { ...data, decrypted }]);
      });

      newSocket.on('message_sent', (data: Message) => {
        console.log('✅ Message sent:', data);
        const decrypted = decryptMessage(data.encryptedMessage, user.privateKey || '');
        setMessages((prev) => [...prev, { ...data, decrypted }]);
      });

      newSocket.on('error', (err: any) => {
        console.error('❌ Socket error:', err);
        setError(err.message || 'Socket error');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from WebSocket');
        setConnected(false);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user, step, socket]);

  // Step 1: Send OTP
  const handleSendOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/register', { phone });
      console.log('OTP sent:', response.data);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/verify', { phone, otp });
      const { token, userId, seedPhrase, requiresKeySetup } = response.data;

      const userData: User = {
        userId,
        phone,
        token,
        seedPhrase,
      };

      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('seedPhrase', seedPhrase);

      if (requiresKeySetup) {
        setStep('keys');
      } else {
        setStep('chat');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save Keys
  const handleSaveKeys = async () => {
    setLoading(true);
    setError('');
    try {
      const { publicKey, privateKey } = generateKeyPair();

      await api.post('/auth/keys-saved', {
        userId: user?.userId,
        armyId,
        publicKey,
        privateKey,
        seedPhrase: user?.seedPhrase,
        name,
        designation,
      });

      setUser((prev) => (prev ? { ...prev, publicKey, privateKey } : null));
      localStorage.setItem('publicKey', publicKey);
      localStorage.setItem('privateKey', privateKey);

      setStep('chat');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save keys');
    } finally {
      setLoading(false);
    }
  };

  // Send Message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !recipientId.trim() || !socket) return;

    const encrypted = encryptMessage(messageInput, user?.publicKey || '');
    const encryptedForSender = encryptMessage(messageInput, user?.publicKey || '');

    socket.emit('send_message', {
      recipientId,
      encryptedMessage: encrypted,
      encryptedForSender,
    });

    setMessageInput('');
  };

  // Logout
  const handleLogout = () => {
    localStorage.clear();
    socket?.close();
    setSocket(null);
    setUser(null);
    setStep('phone');
    setMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">
          Secure Chat App
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Phone Number */}
        {step === 'phone' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Enter Phone Number</h2>
            <input
              type="tel"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Enter OTP</h2>
            <p className="text-sm text-gray-600">OTP sent to {phone}</p>
            <input
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <button
              onClick={() => setStep('phone')}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
            >
              Back
            </button>
          </div>
        )}

        {/* Step 3: Setup Keys */}
        {step === 'keys' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Setup Profile & Keys</h2>
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded">
              <p className="font-bold">Save your seed phrase:</p>
              <p className="text-sm break-all">{user?.seedPhrase}</p>
            </div>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Army ID"
              value={armyId}
              onChange={(e) => setArmyId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveKeys}
              disabled={loading || !name || !armyId}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        )}

        {/* Step 4: Chat */}
        {step === 'chat' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Chat</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    connected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></span>
                <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg text-sm">
              <p>
                <strong>User ID:</strong> {user?.userId}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phone}
              </p>
            </div>

            <input
              type="text"
              placeholder="Recipient User ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <div className="border rounded-lg h-64 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center">No messages yet</p>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-3 p-3 rounded-lg ${
                      msg.from === user?.userId
                        ? 'bg-blue-100 ml-auto'
                        : 'bg-gray-200'
                    } max-w-xs`}
                  >
                    <p className="text-sm font-semibold">
                      {msg.from === user?.userId ? 'You' : msg.from}
                    </p>
                    <p className="break-words">{msg.decrypted || msg.encryptedMessage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!connected || !messageInput.trim() || !recipientId.trim()}
                className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                Send
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
