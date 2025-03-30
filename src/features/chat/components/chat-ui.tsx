// "use client";
// import React, { useState, useEffect } from "react";
// import ChatMessage from "./chat-message";
// import ChatInput from "./chat-input";
// import { useSendMessage } from "../api/use-send-message";
// import { useReceiveMessage } from "../api/use-receive-message";
// import { useChatHistory } from "../api/use-chat-history";
// import { User, Message } from "../types";

// interface ChatUIProps {
//   workspaceId: string;
// }

// const ChatUI: React.FC<ChatUIProps> = ({ workspaceId }) => {
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [selectedUser, setSelectedUser] = useState<User | null>(null);
//   const [users, setUsers] = useState<User[]>([]);
//   const sendMessage = useSendMessage();
//   const receiveMessage = useReceiveMessage();
//   const getHistory = useChatHistory();

//   useEffect(() => {
//     // Load chat history for specific workspace
//     const history = getHistory(workspaceId);
//     setMessages(history);

//     // Mô phỏng nhận tin nhắn mỗi 2 giây
//     const interval = setInterval(() => {
//       receiveMessage((newMessage) => {
//         setMessages((prevMessages) => [...prevMessages, newMessage]);
//       });
//     }, 2000);

//     return () => clearInterval(interval);
//   }, [workspaceId, getHistory, receiveMessage]);

//   // Thêm loading khi gửi tin nhắn
//   const handleSendMessage = async (message: Message) => {
//     setIsLoading(true);
//     try {
//       await sendMessage(message);
//       setMessages((prev) => [...prev, message]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Thêm function xử lý upload file
//   const handleFileUpload = async (file: File) => {
//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append("file", file);
//       // Gọi API upload file của bạn ở đây
//       const fileUrl = await uploadFile(formData);

//       const newMessage: Message = {
//         id: Date.now().toString(),
//         content: fileUrl,
//         senderId: "currentUserId",
//         type: file.type.startsWith("image/") ? "image" : "file",
//         fileUrl,
//         fileName: file.name,
//         timestamp: new Date(),
//       };

//       await sendMessage(newMessage);
//       setMessages((prev) => [...prev, newMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Thêm theo dõi trạng thái typing
//   let typingTimeout: NodeJS.Timeout;
//   const handleTyping = () => {
//     setIsTyping(true);
//     // Gửi trạng thái typing tới server
//     sendTypingStatus(true);

//     clearTimeout(typingTimeout);
//     typingTimeout = setTimeout(() => {
//       setIsTyping(false);
//       sendTypingStatus(false);
//     }, 1000);
//   };

//   return (
//     <div style={styles.chatUIContainer}>
//       {/* Sidebar: Danh sách các cuộc trò chuyện */}
//       <div style={styles.sidebar}>
//         <div style={styles.sidebarHeader}>
//           <h3>Chats</h3>
//         </div>
//         <div style={styles.chatList}>
//           {users.map((user) => (
//             <div
//               key={user.id}
//               style={styles.chatItem}
//               onClick={() => setSelectedUser(user)}
//             >
//               <div style={styles.avatar}></div>
//               <div style={styles.chatInfo}>
//                 <p style={styles.chatName}>
//                   {user.name}
//                   <span
//                     style={{
//                       width: 8,
//                       height: 8,
//                       borderRadius: "50%",
//                       backgroundColor: user.isOnline ? "#4CAF50" : "#9e9e9e",
//                       display: "inline-block",
//                       marginLeft: 5,
//                     }}
//                   />
//                 </p>
//                 {!user.isOnline && user.lastSeen && (
//                   <p style={styles.lastSeen}>
//                     Last seen: {new Date(user.lastSeen).toLocaleTimeString()}
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Chat Area: Cuộc trò chuyện hiện tại */}
//       <div style={styles.chatArea}>
//         <div style={styles.chatHeader}>
//           <div style={styles.chatHeaderAvatar}></div>
//           <span style={styles.chatHeaderTitle}>
//             {selectedUser ? selectedUser.name : "Nguyễn"}
//           </span>
//         </div>

//         <div style={styles.messagesArea}>
//           {messages.map((message, index) => (
//             <ChatMessage key={index} message={message} />
//           ))}
//         </div>

//         {isTyping && (
//           <div style={styles.typingIndicator}>
//             {selectedUser?.name} đang nhập...
//           </div>
//         )}

//         <div style={styles.chatInputContainer}>
//           <input
//             type="file"
//             id="fileInput"
//             style={{ display: "none" }}
//             onChange={(e) =>
//               e.target.files && handleFileUpload(e.target.files[0])
//             }
//           />
//           <button
//             style={styles.attachButton}
//             onClick={() => document.getElementById("fileInput")?.click()}
//           >
//             📎
//           </button>
//           <ChatInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
//         </div>
//       </div>
//     </div>
//   );
// };

// const styles = {
//   chatUIContainer: {
//     display: "flex",
//     height: "calc(100vh - 2rem)", // Điều chỉnh chiều cao để phù hợp với container
//     backgroundColor: "#f7f7f7",
//     transformStyle: "preserve-3d",
//     transition: "transform 0.3s ease-in-out",
//     boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
//     borderRadius: "1rem",
//     overflow: "hidden",
//   },

//   sidebar: {
//     width: "280px",
//     background: "#ffffff",
//     padding: "20px",
//     borderRight: "1px solid #ddd",
//     boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
//     transform: "translateZ(0)",
//   },

//   sidebarHeader: {
//     marginBottom: "20px",
//     fontSize: "20px",
//     fontWeight: "bold",
//     color: "#0078d4",
//   },

//   chatList: {
//     marginTop: "20px",
//     padding: "10px 0",
//   },

//   chatItem: {
//     display: "flex",
//     alignItems: "center",
//     padding: "10px 15px",
//     borderRadius: "8px",
//     cursor: "pointer",
//     transition: "transform 0.2s ease, background-color 0.2s ease",
//   },

//   chatItemHover: {
//     transform: "scale(1.05)",
//     backgroundColor: "#f0f0f0",
//   },

//   avatar: {
//     width: "40px",
//     height: "40px",
//     backgroundColor: "#ccc",
//     borderRadius: "50%",
//     marginRight: "15px",
//   },

//   chatInfo: {
//     flexGrow: 1,
//   },

//   chatName: {
//     fontWeight: "bold",
//   },

//   chatPreview: {
//     color: "#888",
//   },

//   chatArea: {
//     flexGrow: 1,
//     backgroundColor: "#fff",
//     display: "flex",
//     flexDirection: "column",
//     padding: "20px",
//     boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
//     transformStyle: "preserve-3d",
//     overflow: "hidden",
//   },

//   chatHeader: {
//     display: "flex",
//     alignItems: "center",
//     paddingBottom: "10px",
//     borderBottom: "1px solid #ddd",
//     marginBottom: "20px",
//   },

//   chatHeaderAvatar: {
//     width: "40px",
//     height: "40px",
//     backgroundColor: "#ccc",
//     borderRadius: "50%",
//     marginRight: "15px",
//   },

//   chatHeaderTitle: {
//     fontSize: "18px",
//     fontWeight: "bold",
//   },

//   messagesArea: {
//     flexGrow: 1,
//     overflowY: "auto",
//     padding: "10px",
//     backgroundColor: "#f9f9f9",
//     borderRadius: "8px",
//     marginBottom: "10px",
//     transformStyle: "preserve-3d",
//   },

//   sendButton: {
//     background: "#007bff",
//     color: "white",
//     padding: "10px 15px",
//     borderRadius: "20px",
//     border: "none",
//     cursor: "pointer",
//     transition: "background 0.3s",
//   },

//   chatMessage: {
//     marginBottom: "15px",
//     animation: "fadeIn 0.5s ease-out",
//     boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
//   },

//   chatInputContainer: {
//     padding: "15px",
//     display: "flex",
//     alignItems: "center",
//     backgroundColor: "#fff",
//     borderTop: "1px solid #ddd",
//   },

//   chatInput: {
//     flexGrow: 1,
//     padding: "10px",
//     borderRadius: "20px",
//     border: "1px solid #ccc",
//     marginRight: "10px",
//   },

//   sendMessage: {
//     background: "#007bff",
//     color: "white",
//     padding: "10px 15px",
//     borderRadius: "20px",
//     border: "none",
//     cursor: "pointer",
//     transition: "background 0.3s",
//   },

//   typingIndicator: {
//     padding: "8px",
//     color: "#666",
//     fontStyle: "italic",
//     fontSize: "0.9em",
//   },

//   attachButton: {
//     background: "none",
//     border: "none",
//     fontSize: "20px",
//     cursor: "pointer",
//     padding: "0 10px",
//   },

//   lastSeen: {
//     fontSize: "0.8em",
//     color: "#666",
//   },
// };

// export default ChatUI;
