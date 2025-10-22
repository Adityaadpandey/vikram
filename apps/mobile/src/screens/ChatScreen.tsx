import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  Modal,
  Animated,
  Image,
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { IconButton } from "../components/common/IconButton";
import { useTheme } from "../contexts/ThemeContext";
import { MOCK_MESSAGES, Message } from "../services/mock/MockData";
import { WebSocketService } from "../services/api/WebSocketService";
import { EncryptionService } from "../services/security/EncryptionService";
import { SecureStorage } from "../services/security/SecureStorage";

const { width } = Dimensions.get("window");

export const ChatScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { groupId, groupName, chatType, highlightMessageId } = route.params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(
    MOCK_MESSAGES[groupId] || [],
  );
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const recordingAnimation = useRef(new Animated.Value(1)).current;

  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);

  const [recipientPublicKey, setRecipientPublicKey] = useState<string>("");
  const [recipientId, setRecipientId] = useState<string>("");

  const [recipientPublicKeys, setRecipientPublicKeys] = useState<{
    [userId: string]: string;
  }>({});
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    requestPermissions();
    initializeWebSocket();

    // Scroll to highlighted message
    if (highlightMessageId) {
      setTimeout(() => {
        const index = messages.findIndex((m) => m.id === highlightMessageId);
        if (index !== -1) {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }, 500);
    }

    return () => {
      // Cleanup
    };
  }, []);

  const initializeWebSocket = async () => {
    try {
      if (!WebSocketService.isConnected()) {
        await WebSocketService.connect();
        WebSocketService.startHeartbeat();
      }

      if (chatType === "group") {
        // Group chat
        WebSocketService.onGroupMessage(handleIncomingGroupMessage);

        // Get group info and member keys
        if (route.params.members) {
          const members = route.params.members;
          setGroupMembers(members);

          // Build public keys map
          const keysMap: { [userId: string]: string } = {};
          members.forEach((member: any) => {
            keysMap[member.id] = member.publicKey;
          });
          setRecipientPublicKeys(keysMap);
        }
      } else {
        // Direct chat
        WebSocketService.onMessage(handleIncomingMessage);

        setRecipientId(groupId);

        if (route.params.recipientPublicKey) {
          setRecipientPublicKeys({
            [groupId]: route.params.recipientPublicKey,
          });
        } else {
          WebSocketService.requestPublicKey(groupId);
        }
      }
    } catch (error) {
      console.error("Failed to initialize WebSocket:", error);
      Alert.alert("Connection Error", "Failed to connect to server");
    }
  };

  const handleIncomingGroupMessage = async (incomingMessage: any) => {
    try {
      const privateKey = await SecureStorage.getPrivateKey();
      if (!privateKey) {
        throw new Error("Private key not found");
      }

      const userId = await SecureStorage.getUserId();
      if (!userId) {
        throw new Error("User ID not found");
      }

      // Get encrypted key for current user
      const encryptedKey = incomingMessage.encryptedKeys[userId];
      if (!encryptedKey) {
        console.error("No encrypted key for current user");
        return;
      }

      // Decrypt message
      const decryptedText = await EncryptionService.decryptMessage(
        incomingMessage.encryptedContent,
        encryptedKey,
        incomingMessage.iv,
        privateKey,
      );

      const newMessage: Message = {
        id: incomingMessage.messageId,
        senderId: incomingMessage.senderId,
        senderName: incomingMessage.senderName,
        text: decryptedText,
        timestamp: new Date(incomingMessage.timestamp).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          },
        ),
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to decrypt group message:", error);
    }
  };

  const handleIncomingMessage = async (incomingMessage: any) => {
    try {
      // Get private key to decrypt
      const privateKey = await SecureStorage.getItem("privateKey");
      if (!privateKey) {
        throw new Error("Private key not found");
      }

      // Decrypt message
      const decryptedText = await EncryptionService.decryptMessage(
        incomingMessage.encryptedContent,
        incomingMessage.encryptedKey,
        incomingMessage.iv,
        privateKey,
      );

      const newMessage: Message = {
        id: incomingMessage.messageId,
        senderId: incomingMessage.senderId,
        senderName: incomingMessage.senderName,
        text: decryptedText,
        timestamp: new Date(incomingMessage.timestamp).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          },
        ),
        type: "text",
      };

      setMessages((prev) => [...prev, newMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to decrypt message:", error);
    }
  };

  // Toggle star on message
  const toggleStarMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg,
      ),
    );

    const message = messages.find((m) => m.id === messageId);
    if (message) {
      Alert.alert(
        "Success",
        message.isStarred
          ? "Message removed from starred"
          : "Message added to starred",
      );
    }
  };

  // Handle long press on message
  const handleLongPress = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  // Delete message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== messageId),
            );
            setShowMessageMenu(false);
            setSelectedMessage(null);
          },
        },
      ],
    );
  };

  useEffect(() => {
    requestPermissions();

    // Scroll to highlighted message
    if (highlightMessageId) {
      setTimeout(() => {
        const index = messages.findIndex((m) => m.id === highlightMessageId);
        if (index !== -1) {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5,
          });
        }
      }, 500);
    }
  }, []);

  const requestPermissions = async () => {
    await Audio.requestPermissionsAsync();
    await ImagePicker.requestMediaLibraryPermissionsAsync();
    await ImagePicker.requestCameraPermissionsAsync();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (message.trim()) {
      try {
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        if (chatType === "group") {
          // Group message - encrypt for all members
          if (Object.keys(recipientPublicKeys).length === 0) {
            Alert.alert("Error", "Group member keys not loaded");
            return;
          }

          const { encryptedContent, encryptedKeys, iv } =
            await EncryptionService.encryptMessageForGroup(
              message.trim(),
              recipientPublicKeys,
            );

          WebSocketService.sendGroupMessage({
            groupId,
            encryptedContent,
            encryptedKeys,
            iv,
            messageId,
            timestamp: Date.now(),
          });
        } else {
          // Direct message
          const publicKey = recipientPublicKeys[recipientId];
          if (!publicKey) {
            Alert.alert("Error", "Recipient public key not available");
            return;
          }

          const { encryptedContent, encryptedKey, iv } =
            await EncryptionService.encryptMessage(message.trim(), publicKey);

          WebSocketService.sendMessage({
            recipientId,
            encryptedContent,
            encryptedKey,
            iv,
            messageId,
            timestamp: Date.now(),
          });
        }

        // Add to local messages
        const newMessage: Message = {
          id: messageId,
          senderId: "c1",
          senderName: "You",
          text: message.trim(),
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "text",
        };

        setMessages([...messages, newMessage]);
        setMessage("");
        scrollToBottom();
      } catch (error) {
        console.error("Failed to send message:", error);
        Alert.alert("Error", "Failed to send message");
      }
    }
  };

  const handleVoiceCall = () => {
    navigation.navigate("Call", {
      callId: Date.now().toString(),
      contactName: groupName,
      isVideoCall: false,
    });
  };

  const handleVideoCall = () => {
    navigation.navigate("Call", {
      callId: Date.now().toString(),
      contactName: groupName,
      isVideoCall: true,
    });
  };

  // Voice Recording
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(recording);
      setIsRecording(true);

      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimation, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert("Error", "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setRecording(null);
      setIsRecording(false);
      recordingAnimation.setValue(1);

      if (uri) {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "c1",
          senderName: "You",
          text: "Voice message",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "audio",
          fileUrl: uri,
        };

        setMessages([...messages, newMessage]);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  // File Attachments
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "c1",
          senderName: "You",
          text: file.name,
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "document",
          fileUrl: file.uri,
          fileName: file.name,
          fileSize: file.size
            ? `${(file.size / 1024).toFixed(2)} KB`
            : undefined,
        };

        setMessages([...messages, newMessage]);
        setShowAttachmentMenu(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error picking document:", err);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "c1",
          senderName: "You",
          text: "Photo",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "image",
          fileUrl: result.assets[0].uri,
        };

        setMessages([...messages, newMessage]);
        setShowAttachmentMenu(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error picking image:", err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "c1",
          senderName: "You",
          text: "Photo",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "image",
          fileUrl: result.assets[0].uri,
        };

        setMessages([...messages, newMessage]);
        setShowAttachmentMenu(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error taking photo:", err);
    }
  };

  const handlePickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newMessage: Message = {
          id: `m${Date.now()}`,
          senderId: "c1",
          senderName: "You",
          text: "Video",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          type: "video",
          fileUrl: result.assets[0].uri,
        };

        setMessages([...messages, newMessage]);
        setShowAttachmentMenu(false);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error picking video:", err);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderName === "You";
    const isHighlighted = item.id === highlightMessageId;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item)}
        className={`mb-3 px-4 ${isOwnMessage ? "items-end" : "items-start"}`}
        style={
          isHighlighted
            ? {
                backgroundColor: theme.colors.accent + "20",
                paddingVertical: 8,
              }
            : {}
        }
      >
        {!isOwnMessage && chatType === "group" && (
          <Text
            className="text-xs mb-1 ml-3"
            style={{ color: theme.colors.accent }}
            selectable={false}
          >
            {item.senderName}
          </Text>
        )}

        <View
          className={`rounded-2xl overflow-hidden ${
            isOwnMessage ? "rounded-tr-sm" : "rounded-tl-sm"
          }`}
          style={{
            backgroundColor: isOwnMessage
              ? theme.colors.accent
              : theme.colors.cardBg,
            maxWidth: "80%",
          }}
        >
          {/* Image Preview */}
          {item.type === "image" && item.fileUrl && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FileViewer", {
                  fileUrl: item.fileUrl,
                  fileType: "image",
                })
              }
            >
              <Image
                source={{ uri: item.fileUrl }}
                style={{
                  width: width * 0.6,
                  height: width * 0.6,
                  resizeMode: "cover",
                }}
              />
              <View className="px-4 py-2">
                <Text
                  className="text-sm"
                  style={{
                    color: isOwnMessage
                      ? "#FFFFFF"
                      : theme.colors.textSecondary,
                  }}
                  selectable={false}
                >
                  📷 {item.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Video Preview */}
          {item.type === "video" && item.fileUrl && (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("FileViewer", {
                  fileUrl: item.fileUrl,
                  fileType: "video",
                })
              }
            >
              <View
                className="items-center justify-center"
                style={{
                  width: width * 0.6,
                  height: width * 0.4,
                  backgroundColor: "#000",
                }}
              >
                <Ionicons name="play-circle" size={64} color="#FFFFFF" />
              </View>
              <View className="px-4 py-2">
                <Text
                  className="text-sm"
                  style={{
                    color: isOwnMessage
                      ? "#FFFFFF"
                      : theme.colors.textSecondary,
                  }}
                  selectable={false}
                >
                  🎥 {item.text}
                </Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Audio Message */}
          {item.type === "audio" && (
            <View
              className="px-4 py-3 flex-row items-center"
              style={{ minWidth: 200 }}
            >
              <Ionicons
                name="mic"
                size={24}
                color={isOwnMessage ? "#FFFFFF" : theme.colors.accent}
              />
              <View className="flex-1 ml-3">
                <Text
                  className="text-sm"
                  style={{
                    color: isOwnMessage ? "#FFFFFF" : theme.colors.textPrimary,
                  }}
                  selectable={false}
                >
                  🎤 {item.text}
                </Text>
                <Text
                  className="text-xs mt-1"
                  style={{
                    color: isOwnMessage
                      ? "#FFFFFF"
                      : theme.colors.textSecondary,
                  }}
                  selectable={false}
                >
                  0:15
                </Text>
              </View>
              <TouchableOpacity>
                <Ionicons
                  name="play"
                  size={28}
                  color={isOwnMessage ? "#FFFFFF" : theme.colors.accent}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Document */}
          {item.type === "document" && (
            <TouchableOpacity
              className="px-4 py-3 flex-row items-center"
              style={{ minWidth: 200 }}
              onPress={() =>
                navigation.navigate("FileViewer", {
                  fileUrl: item.fileUrl,
                  fileType: "document",
                })
              }
            >
              <View
                className="w-12 h-12 rounded-lg items-center justify-center"
                style={{
                  backgroundColor: isOwnMessage
                    ? "rgba(255,255,255,0.2)"
                    : theme.colors.secondaryBg,
                }}
              >
                <Ionicons
                  name="document"
                  size={24}
                  color={isOwnMessage ? "#FFFFFF" : theme.colors.accent}
                />
              </View>
              <View className="ml-3 flex-1">
                <Text
                  className="font-semibold"
                  numberOfLines={1}
                  style={{
                    color: isOwnMessage ? "#FFFFFF" : theme.colors.textPrimary,
                  }}
                  selectable={false}
                >
                  {item.fileName || item.text}
                </Text>
                {item.fileSize && (
                  <Text
                    className="text-xs mt-1"
                    style={{
                      color: isOwnMessage
                        ? "#FFFFFF"
                        : theme.colors.textSecondary,
                    }}
                    selectable={false}
                  >
                    {item.fileSize}
                  </Text>
                )}
              </View>
              <Ionicons
                name="download"
                size={20}
                color={isOwnMessage ? "#FFFFFF" : theme.colors.accent}
              />
            </TouchableOpacity>
          )}

          {/* Text Message */}
          {item.type === "text" && (
            <View className="px-4 py-3">
              {item.mentions && item.mentions.length > 0 && (
                <View className="flex-row items-center mb-2">
                  <Ionicons
                    name="at"
                    size={14}
                    color={isOwnMessage ? "#FFFFFF" : theme.colors.accent}
                  />
                  <Text
                    className="text-xs ml-1"
                    style={{
                      color: isOwnMessage ? "#FFFFFF" : theme.colors.accent,
                    }}
                    selectable={false}
                  >
                    Mentioned you
                  </Text>
                </View>
              )}

              <Text
                className="text-base"
                style={{
                  color: isOwnMessage ? "#FFFFFF" : theme.colors.textPrimary,
                }}
                selectable={false}
              >
                {item.text}
              </Text>
            </View>
          )}

          {/* Timestamp & Star */}
          <View className="px-4 pb-2 flex-row items-center justify-end gap-2">
            <Text
              className="text-xs"
              style={{
                color: isOwnMessage ? "#FFFFFF" : theme.colors.textSecondary,
              }}
              selectable={false}
            >
              {item.timestamp}
            </Text>
            {item.isStarred && (
              <Ionicons name="star" size={12} color={theme.colors.warning} />
            )}
            {isOwnMessage && (
              <Ionicons name="checkmark-done" size={14} color="#FFFFFF" />
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      style={{ backgroundColor: theme.colors.primaryBg }}
    >
      {/* Header */}
      <View
        className="px-4 pt-12 pb-4 shadow-lg"
        style={{ backgroundColor: theme.colors.secondaryBg }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3"
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>

            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: theme.colors.accent }}
            >
              {chatType === "group" ? (
                <MaterialCommunityIcons
                  name="account-group"
                  size={20}
                  color="#FFFFFF"
                />
              ) : (
                <Ionicons name="person" size={20} color="#FFFFFF" />
              )}
            </View>

            <View className="flex-1">
              <Text
                className="text-base font-bold"
                style={{ color: theme.colors.textPrimary }}
                numberOfLines={1}
                selectable={false}
              >
                {groupName}
              </Text>
              <Text
                className="text-xs"
                style={{ color: theme.colors.textSecondary }}
                selectable={false}
              >
                {chatType === "group"
                  ? `${messages.length} messages`
                  : "Online"}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <IconButton
              name="videocam"
              size={24}
              color={theme.colors.textPrimary}
              onPress={handleVideoCall}
            />
            <IconButton
              name="call"
              size={22}
              color={theme.colors.textPrimary}
              onPress={handleVoiceCall}
            />
            <IconButton
              name="ellipsis-vertical"
              size={22}
              color={theme.colors.textPrimary}
              onPress={() => {}}
            />
          </View>
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={scrollToBottom}
        keyboardShouldPersistTaps="handled"
      />

      {/* Input Bar */}
      <View
        style={{
          paddingBottom: Platform.OS === "ios" ? 20 : 10,
          backgroundColor: theme.colors.secondaryBg,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        }}
      >
        <View className="px-4 py-3">
          <View className="flex-row items-end">
            <TouchableOpacity
              className="mr-2"
              onPress={() => setShowAttachmentMenu(true)}
            >
              <Ionicons
                name="add-circle"
                size={28}
                color={theme.colors.accent}
              />
            </TouchableOpacity>

            <View className="flex-1">
              <TextInput
                ref={inputRef}
                className="px-4 py-3 rounded-full"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  color: theme.colors.textPrimary,
                  maxHeight: 100,
                }}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textSecondary}
                value={message}
                onChangeText={setMessage}
                multiline
                onFocus={scrollToBottom}
                contextMenuHidden={true}
                selectTextOnFocus={false}
              />
            </View>

            {message.trim() ? (
              <TouchableOpacity className="ml-2" onPress={handleSend}>
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: theme.colors.accent }}
                >
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="ml-2"
                onLongPress={startRecording}
                onPressOut={stopRecording}
              >
                <Animated.View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: isRecording
                      ? theme.colors.error
                      : "transparent",
                    transform: [{ scale: recordingAnimation }],
                  }}
                >
                  <Ionicons
                    name={isRecording ? "stop-circle" : "mic"}
                    size={28}
                    color={isRecording ? "#FFFFFF" : theme.colors.accent}
                  />
                </Animated.View>
              </TouchableOpacity>
            )}
          </View>

          {isRecording && (
            <View className="mt-2 flex-row items-center justify-center">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: theme.colors.error }}
              />
              <Text
                className="text-sm"
                style={{ color: theme.colors.error }}
                selectable={false}
              >
                Recording... (Release to send)
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Attachment Menu Modal */}
      <Modal
        visible={showAttachmentMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAttachmentMenu(false)}
      >
        <TouchableOpacity
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => setShowAttachmentMenu(false)}
        >
          <View className="flex-1 justify-end">
            <TouchableOpacity activeOpacity={1}>
              <View
                className="rounded-t-3xl p-6"
                style={{ backgroundColor: theme.colors.secondaryBg }}
              >
                <View
                  className="w-12 h-1 rounded-full self-center mb-6"
                  style={{ backgroundColor: theme.colors.border }}
                />

                <Text
                  className="text-xl font-bold mb-4"
                  style={{ color: theme.colors.textPrimary }}
                  selectable={false}
                >
                  Share
                </Text>

                <View className="flex-row flex-wrap gap-4">
                  <TouchableOpacity
                    className="items-center"
                    style={{ width: "30%" }}
                    onPress={handleTakePhoto}
                  >
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: theme.colors.accent }}
                    >
                      <Ionicons name="camera" size={28} color="#FFFFFF" />
                    </View>
                    <Text
                      className="text-sm text-center"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Camera
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="items-center"
                    style={{ width: "30%" }}
                    onPress={handlePickImage}
                  >
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: theme.colors.success }}
                    >
                      <Ionicons name="image" size={28} color="#FFFFFF" />
                    </View>
                    <Text
                      className="text-sm text-center"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Gallery
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="items-center"
                    style={{ width: "30%" }}
                    onPress={handlePickVideo}
                  >
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: theme.colors.error }}
                    >
                      <Ionicons name="videocam" size={28} color="#FFFFFF" />
                    </View>
                    <Text
                      className="text-sm text-center"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Video
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="items-center"
                    style={{ width: "30%" }}
                    onPress={handlePickDocument}
                  >
                    <View
                      className="w-16 h-16 rounded-full items-center justify-center mb-2"
                      style={{ backgroundColor: theme.colors.warning }}
                    >
                      <Ionicons name="document" size={28} color="#FFFFFF" />
                    </View>
                    <Text
                      className="text-sm text-center"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Document
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  className="py-4 mt-6 rounded-xl"
                  style={{ backgroundColor: theme.colors.cardBg }}
                  onPress={() => setShowAttachmentMenu(false)}
                >
                  <Text
                    className="text-center font-semibold"
                    style={{ color: theme.colors.textPrimary }}
                    selectable={false}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      {/* Message Menu Modal */}
      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowMessageMenu(false);
          setSelectedMessage(null);
        }}
      >
        <TouchableOpacity
          className="flex-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={() => {
            setShowMessageMenu(false);
            setSelectedMessage(null);
          }}
        >
          <View className="flex-1 justify-center items-center px-6">
            <TouchableOpacity activeOpacity={1}>
              <View
                className="rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: theme.colors.secondaryBg,
                  minWidth: 280,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                {/* Message Preview */}
                {selectedMessage && (
                  <View
                    className="p-4 border-b"
                    style={{ borderBottomColor: theme.colors.border }}
                  >
                    <Text
                      className="text-sm"
                      style={{ color: theme.colors.textSecondary }}
                      numberOfLines={2}
                      selectable={false}
                    >
                      {selectedMessage.text}
                    </Text>
                  </View>
                )}

                {/* Options */}
                <View>
                  {/* Star/Unstar */}
                  <TouchableOpacity
                    className="flex-row items-center p-4"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                    onPress={() => {
                      if (selectedMessage) {
                        toggleStarMessage(selectedMessage.id);
                        setShowMessageMenu(false);
                        setSelectedMessage(null);
                      }
                    }}
                  >
                    <Ionicons
                      name={
                        selectedMessage?.isStarred ? "star" : "star-outline"
                      }
                      size={24}
                      color={
                        selectedMessage?.isStarred
                          ? theme.colors.warning
                          : theme.colors.textPrimary
                      }
                    />
                    <Text
                      className="ml-4 text-base"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      {selectedMessage?.isStarred
                        ? "Remove from Starred"
                        : "Add to Starred"}
                    </Text>
                  </TouchableOpacity>

                  {/* Reply */}
                  <TouchableOpacity
                    className="flex-row items-center p-4"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                    onPress={() => {
                      setShowMessageMenu(false);
                      setSelectedMessage(null);
                      // TODO: Implement reply feature
                      Alert.alert("Reply", "Reply to this message");
                    }}
                  >
                    <Ionicons
                      name="arrow-undo-outline"
                      size={24}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      className="ml-4 text-base"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Reply
                    </Text>
                  </TouchableOpacity>

                  {/* Info */}
                  <TouchableOpacity
                    className="flex-row items-center p-4"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}
                    onPress={() => {
                      setShowMessageMenu(false);
                      setSelectedMessage(null);
                      if (selectedMessage) {
                        Alert.alert(
                          "Message Info",
                          `From: ${selectedMessage.senderName}\nTime: ${selectedMessage.timestamp}\nType: ${selectedMessage.type}\n${selectedMessage.isStarred ? "Status: Starred" : ""}`,
                        );
                      }
                    }}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={24}
                      color={theme.colors.textPrimary}
                    />
                    <Text
                      className="ml-4 text-base"
                      style={{ color: theme.colors.textPrimary }}
                      selectable={false}
                    >
                      Message Info
                    </Text>
                  </TouchableOpacity>

                  {/* Delete (Own messages only) */}
                  {selectedMessage?.senderName === "You" && (
                    <TouchableOpacity
                      className="flex-row items-center p-4"
                      onPress={() => {
                        if (selectedMessage) {
                          handleDeleteMessage(selectedMessage.id);
                        }
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={24}
                        color={theme.colors.error}
                      />
                      <Text
                        className="ml-4 text-base"
                        style={{ color: theme.colors.error }}
                        selectable={false}
                      >
                        Delete Message
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Cancel */}
                <TouchableOpacity
                  className="p-4"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                  }}
                  onPress={() => {
                    setShowMessageMenu(false);
                    setSelectedMessage(null);
                  }}
                >
                  <Text
                    className="text-center font-semibold"
                    style={{ color: theme.colors.textPrimary }}
                    selectable={false}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};
