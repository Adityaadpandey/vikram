"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  LogOut,
  MoreVertical,
  Phone,
  Search,
  Send,
  Shield,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function E2EChatApp() {
  const [screen, setScreen] = useState("loading");
  const [authStep, setAuthStep] = useState("choice");
  const [config, setConfig] = useState({
    apiUrl: "http://localhost:7123/api/v1/auth",
    wsUrl: "ws://localhost:7123/api/v1/ws",
    sessionToken: "",
    privateKey: "",
    publicKey: "",
    userId: "",
    armyId: "",
    phone: "",
  });

  const [armyId, setArmyId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [savedSeedPhrase, setSavedSeedPhrase] = useState("");
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [copied, setCopied] = useState(false);

  const [isConnected, setIsConnected] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState({});
  const [currentMessage, setCurrentMessage] = useState("");
  const [newFriendId, setNewFriendId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const privateKeyRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedContact]);

  // Security measures
  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      if (
        e.keyCode === 123 ||
        (e.ctrlKey && e.shiftKey && e.keyCode === 73) ||
        (e.ctrlKey && e.shiftKey && e.keyCode === 74) ||
        (e.ctrlKey && e.keyCode === 85)
      ) {
        e.preventDefault();
        return false;
      }
    };

    const disableCapture = () => {
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
    };

    const detectDevTools = () => {
      const threshold = 160;
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        document.body.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#1e293b;color:#fff;"><div style="text-center;"><h1>⚠️ Developer Tools Detected</h1><p>This application cannot be used with developer tools open.</p></div></div>';
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    disableCapture();

    const devToolsInterval = setInterval(detectDevTools, 1000);

    if (navigator.mediaDevices?.getDisplayMedia) {
      const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia;
      navigator.mediaDevices.getDisplayMedia = function () {
        alert("⚠️ Screen recording is not allowed for security reasons.");
        return Promise.reject(new Error("Screen capture blocked"));
      };
    }

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsInterval);
    };
  }, []);

  // Load previous chats from localStorage
  const loadChatHistory = () => {
    try {
      const savedChats = localStorage.getItem("chat_history");
      if (savedChats) {
        const chats = JSON.parse(atob(savedChats));
        setMessages(chats);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  // Save chat history
  const saveChatHistory = (newMessages) => {
    try {
      const encoded = btoa(JSON.stringify(newMessages));
      localStorage.setItem("chat_history", encoded);
    } catch (error) {
      console.error("Failed to save chat history:", error);
    }
  };

  // Load session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedSession = localStorage.getItem("secure_chat_session");
        if (savedSession) {
          const sessionData = JSON.parse(atob(savedSession));

          const sessionAge = Date.now() - sessionData.timestamp;
          if (sessionAge < 86400000) {
            const newConfig = {
              ...config,
              sessionToken: sessionData.sessionToken,
              privateKey: sessionData.privateKey,
              publicKey: sessionData.publicKey,
              userId: sessionData.userId,
              armyId: sessionData.armyId,
              phone: sessionData.phone,
            };

            setConfig(newConfig);
            privateKeyRef.current = sessionData.privateKey;

            // Load chat history
            loadChatHistory();

            await new Promise((resolve) => setTimeout(resolve, 100));
            connectWebSocket(sessionData.sessionToken, sessionData.privateKey);
            return;
          } else {
            localStorage.removeItem("secure_chat_session");
          }
        }
      } catch (error) {
        console.error("Failed to load session:", error);
        localStorage.removeItem("secure_chat_session");
      }

      setScreen("auth");
    };

    loadSession();
  }, []);

  const saveSession = (sessionData) => {
    try {
      const dataToSave = {
        ...sessionData,
        timestamp: Date.now(),
      };

      const encoded = btoa(JSON.stringify(dataToSave));
      localStorage.setItem("secure_chat_session", encoded);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const clearSession = () => {
    localStorage.removeItem("secure_chat_session");
  };

  const clearChatHistory = (contactId = null) => {
    if (contactId) {
      const newMessages = { ...messages };
      delete newMessages[contactId];
      setMessages(newMessages);
      saveChatHistory(newMessages);
    } else {
      setMessages({});
      localStorage.removeItem("chat_history");
    }
  };

  const encryptMessage = async (message, recipientPublicKey) => {
    try {
      const aesKey = crypto.getRandomValues(new Uint8Array(32));
      const iv = crypto.getRandomValues(new Uint8Array(16));

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        aesKey,
        { name: "AES-CBC" },
        false,
        ["encrypt"],
      );

      const encoder = new TextEncoder();
      const encryptedContent = await crypto.subtle.encrypt(
        { name: "AES-CBC", iv },
        cryptoKey,
        encoder.encode(message),
      );

      const publicKeyImported = await importPublicKey(recipientPublicKey);
      const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKeyImported,
        aesKey,
      );

      return {
        encryptedContent: arrayBufferToBase64(encryptedContent),
        encryptedKey: arrayBufferToBase64(encryptedKey),
        iv: arrayBufferToBase64(iv),
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw error;
    }
  };

  const decryptMessage = async (
    encryptedContent,
    encryptedKey,
    iv,
    privateKeyToUse,
  ) => {
    try {
      const keyToUse =
        privateKeyToUse || privateKeyRef.current || config.privateKey;

      if (!keyToUse || !keyToUse.includes("-----BEGIN PRIVATE KEY-----")) {
        throw new Error("Private key not available");
      }

      const privateKeyImported = await importPrivateKey(keyToUse);
      const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey);
      const aesKeyBuffer = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKeyImported,
        encryptedKeyBuffer,
      );

      const aesKey = await crypto.subtle.importKey(
        "raw",
        aesKeyBuffer,
        { name: "AES-CBC" },
        false,
        ["decrypt"],
      );

      const ivBuffer = base64ToArrayBuffer(iv);
      const encryptedBuffer = base64ToArrayBuffer(encryptedContent);

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-CBC", iv: ivBuffer },
        aesKey,
        encryptedBuffer,
      );

      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("Decryption error:", error);
      return "[Failed to decrypt]";
    }
  };

  const importPublicKey = async (pem) => {
    const cleanPem = pem.replace(/\\n/g, "\n");
    const pemContents = cleanPem
      .replace("-----BEGIN PUBLIC KEY-----", "")
      .replace("-----END PUBLIC KEY-----", "")
      .replace(/\s+/g, "");

    const binaryDer = base64ToArrayBuffer(pemContents);
    return await crypto.subtle.importKey(
      "spki",
      binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["encrypt"],
    );
  };

  const importPrivateKey = async (pem) => {
    const cleanPem = pem.replace(/\\n/g, "\n");
    const pemContents = cleanPem
      .replace("-----BEGIN PRIVATE KEY-----", "")
      .replace("-----END PRIVATE KEY-----", "")
      .replace(/\s+/g, "");

    const binaryDer = base64ToArrayBuffer(pemContents);
    return await crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      false,
      ["decrypt"],
    );
  };

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const base64ToArrayBuffer = (base64) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const handleRegister = async () => {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${config.apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyId, phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("OTP sent to your phone");
        setAuthStep("register-otp");
      } else {
        setStatus(data.message || "Registration failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${config.apiUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyId, phoneNumber, otp, name, designation }),
      });

      const data = await response.json();

      if (response.ok) {
        setSavedSeedPhrase(data.seedPhrase);
        setConfig((prev) => ({
          ...prev,
          publicKey: data.publicKey,
          userId: data.userId,
        }));
        setStatus("Registration successful!");
      } else {
        setStatus(data.message || "Verification failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${config.apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyId, phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("OTP sent to your phone");
        setAuthStep("login-otp");
      } else {
        setStatus(data.message || "Login failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginVerify = async () => {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch(`${config.apiUrl}/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ armyId, phoneNumber, otp, seedPhrase }),
      });

      const data = await response.json();

      if (response.ok) {
        const sessionData = {
          sessionToken: data.sessionToken,
          privateKey: data.keys.privateKey,
          publicKey: data.keys.publicKey,
          userId: data.user.id,
          armyId: data.user.armyId,
          phone: data.user.phone,
        };

        setConfig((prev) => ({
          ...prev,
          ...sessionData,
        }));

        privateKeyRef.current = data.keys.privateKey;
        saveSession(sessionData);
        loadChatHistory();

        setStatus("Login successful!");
        connectWebSocket(data.sessionToken, data.keys.privateKey);
      } else {
        setStatus(data.message || "Login verification failed");
      }
    } catch (error) {
      setStatus("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = (token, privateKey) => {
    const ws = new WebSocket(config.wsUrl);
    privateKeyRef.current = privateKey;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "auth",
          sessionToken: token,
        }),
      );
    };

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "auth_success":
          setIsConnected(true);
          setScreen("chat");
          ws.send(JSON.stringify({ type: "get_contacts" }));
          break;

        case "contacts":
          setContacts(data.contacts || []);
          break;

        case "message":
          try {
            const decrypted = await decryptMessage(
              data.encryptedContent,
              data.encryptedKey,
              data.iv,
              privateKey,
            );

            const newMessage = {
              id: data.messageId,
              senderId: data.senderId,
              senderName: data.senderArmyId || "Unknown",
              content: decrypted,
              timestamp: data.timestamp,
              isOwn: false,
              status: "read",
            };

            setMessages((prev) => {
              const contactMessages = prev[data.senderId] || [];
              const updated = {
                ...prev,
                [data.senderId]: [...contactMessages, newMessage],
              };
              saveChatHistory(updated);
              return updated;
            });

            ws.send(
              JSON.stringify({
                type: "read",
                messageId: data.messageId,
              }),
            );
          } catch (error) {
            console.error("Failed to process message:", error);
          }
          break;

        case "friend_added":
          setContacts((prev) => [...prev, data.friend]);
          setStatus("Friend added successfully");
          setTimeout(() => setStatus(""), 3000);
          break;

        case "user_status":
          setContacts((prev) =>
            prev.map((c) =>
              c.id === data.userId ? { ...c, status: data.status } : c,
            ),
          );
          break;

        case "error":
          setStatus(data.message);
          setTimeout(() => setStatus(""), 3000);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setStatus("Disconnected");
    };

    wsRef.current = ws;
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !selectedContact || !wsRef.current) return;

    try {
      const { encryptedContent, encryptedKey, iv } = await encryptMessage(
        currentMessage,
        selectedContact.publicKey,
      );

      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      wsRef.current.send(
        JSON.stringify({
          type: "message",
          recipientId: selectedContact.id,
          encryptedContent,
          encryptedKey,
          iv,
          messageId,
          timestamp: Date.now(),
        }),
      );

      const newMessage = {
        id: messageId,
        senderId: config.userId,
        senderName: "You",
        content: currentMessage,
        timestamp: Date.now(),
        isOwn: true,
        status: "sent",
      };

      setMessages((prev) => {
        const contactMessages = prev[selectedContact.id] || [];
        const updated = {
          ...prev,
          [selectedContact.id]: [...contactMessages, newMessage],
        };
        saveChatHistory(updated);
        return updated;
      });

      setCurrentMessage("");
    } catch (error) {
      console.error("Send error:", error);
    }
  };

  const addFriend = () => {
    if (!newFriendId.trim() || !wsRef.current) return;

    wsRef.current.send(
      JSON.stringify({
        type: "add_friend",
        armyId: newFriendId,
      }),
    );
    setNewFriendId("");
  };

  const disconnect = async () => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      await fetch(`${config.apiUrl}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken: config.sessionToken }),
      });
    } catch (error) {
      console.error("Logout error:", error);
    }

    clearSession();

    setIsConnected(false);
    setScreen("auth");
    setAuthStep("choice");
    setSelectedContact(null);
    setConfig((prev) => ({
      ...prev,
      sessionToken: "",
      privateKey: "",
      userId: "",
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessage = (contactId) => {
    const contactMessages = messages[contactId] || [];
    if (contactMessages.length === 0) return "No messages yet";
    const lastMsg = contactMessages[contactMessages.length - 1];
    return lastMsg.content.length > 40
      ? lastMsg.content.slice(0, 40) + "..."
      : lastMsg.content;
  };

  const getLastMessageTime = (contactId) => {
    const contactMessages = messages[contactId] || [];
    if (contactMessages.length === 0) return "";
    const lastMsg = contactMessages[contactMessages.length - 1];
    const date = new Date(lastMsg.timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000)
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.armyId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (screen === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-2xl animate-pulse">
              <Shield className="w-16 h-16 text-white" />
            </div>
          </div>
          <p className="text-slate-700 font-semibold mt-6 text-lg">
            Loading Secure Chat...
          </p>
          <p className="text-slate-500 text-sm mt-2">
            Establishing encrypted connection
          </p>
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-2xl shadow-lg">
                  <Shield className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Vikram
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Military-grade encrypted communication
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {authStep === "choice" && (
              <div className="space-y-3">
                <Button
                  onClick={() => setAuthStep("register")}
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  size="lg"
                >
                  <Shield className="w-5 h-5 mr-2" />
                  Create New Account
                </Button>
                <Button
                  onClick={() => setAuthStep("login")}
                  variant="outline"
                  className="w-full h-12 text-base border-2"
                  size="lg"
                >
                  <Lock className="w-5 h-5 mr-2" />
                  Login to Account
                </Button>
              </div>
            )}

            {authStep === "register" && (
              <>
                <Button
                  onClick={() => setAuthStep("choice")}
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Army ID
                    </label>
                    <Input
                      value={armyId}
                      onChange={(e) => setArmyId(e.target.value)}
                      placeholder="Enter your Army ID"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Phone Number
                    </label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      type="tel"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Name (Optional)
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Designation (Optional)
                    </label>
                    <Input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="Your designation"
                      className="h-12 text-base"
                    />
                  </div>
                  {status && (
                    <Alert
                      className={
                        status.includes("failed")
                          ? "border-red-200 bg-red-50"
                          : "border-blue-200 bg-blue-50"
                      }
                    >
                      <AlertDescription
                        className={
                          status.includes("failed")
                            ? "text-red-800"
                            : "text-blue-800"
                        }
                      >
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleRegister}
                    disabled={loading || !armyId || !phoneNumber}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Phone className="w-5 h-5 mr-2" />
                    )}
                    Send OTP
                  </Button>
                </div>
              </>
            )}

            {authStep === "register-otp" && (
              <>
                <Button
                  onClick={() => setAuthStep("register")}
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Enter the OTP sent to {phoneNumber}
                    </AlertDescription>
                  </Alert>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      OTP Code
                    </label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="h-14 text-center text-2xl tracking-[0.5em] font-semibold"
                    />
                  </div>
                  {status && (
                    <Alert
                      className={
                        status.includes("failed")
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }
                    >
                      <AlertDescription
                        className={
                          status.includes("failed")
                            ? "text-red-800"
                            : "text-green-800"
                        }
                      >
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleVerifyOTP}
                    disabled={loading || otp.length !== 6}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Check className="w-5 h-5 mr-2" />
                    )}
                    Verify & Create Account
                  </Button>
                </div>

                {savedSeedPhrase && (
                  <Alert className="bg-amber-50 border-2 border-amber-300 mt-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <AlertDescription className="text-amber-900">
                      <p className="font-bold text-base mb-3">
                        🔐 Your Recovery Phrase
                      </p>
                      <div className="bg-white p-4 rounded-lg border-2 border-amber-200 mb-3 relative">
                        <div
                          className={`font-mono text-sm break-all leading-relaxed ${showSeedPhrase ? "" : "blur-md select-none"}`}
                        >
                          {savedSeedPhrase}
                        </div>
                        <Button
                          onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-8 w-8 p-0"
                        >
                          {showSeedPhrase ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-sm mb-3 font-medium">
                        ⚠️ Write this down on paper. You'll need it to login.
                        Never share it with anyone!
                      </p>
                      <div className="space-y-2">
                        <Button
                          onClick={() => copyToClipboard(savedSeedPhrase)}
                          variant="outline"
                          size="sm"
                          className="w-full h-10"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 mr-2" />
                          ) : (
                            <Copy className="w-4 h-4 mr-2" />
                          )}
                          {copied ? "Copied!" : "Copy to Clipboard"}
                        </Button>
                        <Button
                          onClick={() => setAuthStep("login")}
                          className="w-full h-10 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Continue to Login
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {authStep === "login" && (
              <>
                <Button
                  onClick={() => setAuthStep("choice")}
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Army ID
                    </label>
                    <Input
                      value={armyId}
                      onChange={(e) => setArmyId(e.target.value)}
                      placeholder="Enter your Army ID"
                      className="h-12 text-base"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Phone Number
                    </label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1234567890"
                      type="tel"
                      className="h-12 text-base"
                    />
                  </div>
                  {status && (
                    <Alert
                      className={
                        status.includes("failed")
                          ? "border-red-200 bg-red-50"
                          : "border-blue-200 bg-blue-50"
                      }
                    >
                      <AlertDescription
                        className={
                          status.includes("failed")
                            ? "text-red-800"
                            : "text-blue-800"
                        }
                      >
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleLogin}
                    disabled={loading || !armyId || !phoneNumber}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Phone className="w-5 h-5 mr-2" />
                    )}
                    Send OTP
                  </Button>
                </div>
              </>
            )}

            {authStep === "login-otp" && (
              <>
                <Button
                  onClick={() => setAuthStep("login")}
                  variant="ghost"
                  size="sm"
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Enter OTP sent to {phoneNumber}
                    </AlertDescription>
                  </Alert>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      OTP Code
                    </label>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      className="h-14 text-center text-2xl tracking-[0.5em] font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">
                      Recovery Phrase
                    </label>
                    <div className="relative">
                      <Textarea
                        value={seedPhrase}
                        onChange={(e) => setSeedPhrase(e.target.value)}
                        placeholder="Enter your 12-word recovery phrase"
                        className={`font-mono text-sm pr-12 ${showSeedPhrase ? "" : "text-security-disc"}`}
                        rows={3}
                      />
                      <Button
                        onClick={() => setShowSeedPhrase(!showSeedPhrase)}
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        type="button"
                      >
                        {showSeedPhrase ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {status && (
                    <Alert
                      className={
                        status.includes("failed")
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                      }
                    >
                      <AlertDescription
                        className={
                          status.includes("failed")
                            ? "text-red-800"
                            : "text-green-800"
                        }
                      >
                        {status}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={handleLoginVerify}
                    disabled={loading || otp.length !== 6 || !seedPhrase.trim()}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    size="lg"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    ) : (
                      <Lock className="w-5 h-5 mr-2" />
                    )}
                    Login Securely
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {!selectedContact ? (
        <>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white/30">
                  <AvatarFallback className="bg-white/20 text-white font-bold">
                    {getInitials(config.armyId)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-bold text-white">Vikram</h1>
                  <p className="text-xs text-white/80">{config.armyId}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => clearChatHistory()}>
                    <Archive className="w-4 h-4 mr-2" />
                    Clear All Chats
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={disconnect}
                    className="text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="h-10 pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
              />
            </div>
          </div>

          <div className="p-4 bg-white border-b shadow-sm">
            <div className="flex gap-2">
              <Input
                value={newFriendId}
                onChange={(e) => setNewFriendId(e.target.value)}
                placeholder="Enter Army ID to add friend"
                className="h-11 flex-1 text-base"
                onKeyPress={(e) => e.key === "Enter" && addFriend()}
              />
              <Button
                onClick={addFriend}
                className="h-11 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <UserPlus className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full mb-4">
                  <UserPlus className="w-12 h-12 text-blue-600" />
                </div>
                <p className="text-slate-700 font-semibold text-lg">
                  No contacts yet
                </p>
                <p className="text-sm text-slate-500 mt-2 max-w-xs">
                  Add friends using their Army ID to start secure conversations
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedContact(contact)}
                    className="p-4 bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 active:from-blue-100 active:to-indigo-100 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold">
                            {getInitials(contact.name || contact.armyId)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            contact.status === "online"
                              ? "bg-green-500"
                              : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-slate-900 truncate text-base">
                            {contact.name || contact.armyId}
                          </h3>
                          <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                            {getLastMessageTime(contact.id)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-500 truncate flex-1">
                            {getLastMessage(contact.id)}
                          </p>
                          <Lock className="w-3 h-3 text-green-600 flex-shrink-0 ml-2" />
                        </div>
                        {contact.designation && (
                          <Badge variant="secondary" className="mt-1.5 text-xs">
                            {contact.designation}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {status && (
            <div className="px-4 py-3 bg-blue-50 border-t border-blue-100">
              <p className="text-sm text-blue-700 text-center font-medium">
                {status}
              </p>
            </div>
          )}

          <div className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
            <div className="flex items-center justify-center gap-2 text-xs text-green-700">
              <Lock className="w-3 h-3" />
              <span className="font-medium">
                End-to-end encrypted •{" "}
                {isConnected ? "Connected" : "Connecting..."}
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 shadow-lg flex items-center gap-3">
            <Button
              onClick={() => setSelectedContact(null)}
              variant="ghost"
              size="icon"
              className="flex-shrink-0 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div
              className="flex items-center gap-3 flex-1 min-w-0"
              onClick={() => setShowContactInfo(!showContactInfo)}
            >
              <Avatar className="h-10 w-10 border-2 border-white/30">
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {getInitials(selectedContact.name || selectedContact.armyId)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-white truncate text-base">
                  {selectedContact.name || selectedContact.armyId}
                </h2>
                <div className="flex items-center gap-1.5 text-xs">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      selectedContact.status === "online"
                        ? "bg-green-400"
                        : "bg-white/40"
                    }`}
                  />
                  <span className="text-white/80">
                    {selectedContact.status === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => setShowContactInfo(!showContactInfo)}
                >
                  <Info className="w-4 h-4 mr-2" />
                  Contact Info
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => clearChatHistory(selectedContact.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Chat
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {showContactInfo && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-blue-100">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Army ID:</span>
                  <span className="text-slate-900 font-semibold">
                    {selectedContact.armyId}
                  </span>
                </div>
                {selectedContact.designation && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">
                      Designation:
                    </span>
                    <Badge variant="secondary">
                      {selectedContact.designation}
                    </Badge>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">
                    Encryption:
                  </span>
                  <div className="flex items-center gap-1 text-green-700">
                    <Lock className="w-3 h-3" />
                    <span className="font-semibold">E2EE Active</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 p-4 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="space-y-3 pb-4">
              {(messages[selectedContact.id] || []).map((msg, idx) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div
                    className={`max-w-[85%] ${msg.isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    {!msg.isOwn && (
                      <span className="text-xs font-medium text-slate-600 px-2">
                        {msg.senderName}
                      </span>
                    )}
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-md ${
                        msg.isOwn
                          ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md"
                          : "bg-white text-slate-900 rounded-bl-md border border-slate-200"
                      }`}
                    >
                      <p className="text-[15px] leading-relaxed break-words">
                        {msg.content}
                      </p>
                      <div
                        className={`flex items-center gap-1.5 mt-1.5 text-xs ${
                          msg.isOwn
                            ? "text-white/80 justify-end"
                            : "text-slate-500"
                        }`}
                      >
                        <span className="font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.isOwn && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${msg.status === "read" ? "text-blue-200" : ""}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="bg-white border-t border-slate-200 text-black p-3 shadow-lg">
            <div className="flex gap-2">
              <Input
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Type a message..."
                className="h-12 flex-1 text-base border-2 focus:border-blue-500"
              />
              <Button
                onClick={sendMessage}
                disabled={!currentMessage.trim()}
                className="h-12 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-xs text-green-600">
              <Lock className="w-3 h-3" />
              <span className="font-medium">
                Messages are end-to-end encrypted
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
