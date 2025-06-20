import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatApp = () => {
  const [socket, setSocket] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [roomData, setRoomData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [generatedLink, setGeneratedLink] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Common emojis for quick access
  const commonEmojis = ['😀', '😃', '😄', '😁', '😆', '🥹', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🔥', '⭐', '✨', '💫', '⚡', '💥', '💢', '💨', '💦', '💤', '🎉', '🎊'];

  useEffect(() => {
    const newSocket = io('https://kuvaka-backend-5jl5.onrender.com');
    setSocket(newSocket);

    // Check if we're accessing a room via URL
    const path = window.location.pathname;
    const roomIdFromUrl = path.startsWith('/room/') ? path.split('/room/')[1] : null;
    if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl);
      setCurrentPage('join');
    }

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('room-joined', (data) => {
      setRoomData(data);
      setActiveUsers(data.activeUsers);
      setCurrentPage('chat');
      loadMessages();
      // Add current user to participants
      setParticipants(prev => [...prev.filter(p => p !== username), username]);
    });

    socket.on('receive-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    socket.on('user-joined', (data) => {
      setMessages(prev => [...prev, {
        username: 'System',
        message: data.message,
        timestamp: new Date(),
        isSystem: true
      }]);
      setActiveUsers(data.activeUsers);
      // Add new user to participants
      const newUsername = data.message.split(' joined')[0];
      setParticipants(prev => [...prev.filter(p => p !== newUsername), newUsername]);
    });

    socket.on('user-left', (data) => {
      setMessages(prev => [...prev, {
        username: 'System',
        message: data.message,
        timestamp: new Date(),
        isSystem: true
      }]);
      setActiveUsers(data.activeUsers);
      // Remove user from participants
      const leftUsername = data.message.split(' left')[0];
      setParticipants(prev => prev.filter(p => p !== leftUsername));
    });

    socket.on('user-typing', (data) => {
      setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
    });

    socket.on('user-stop-typing', (data) => {
      setTypingUsers(prev => prev.filter(u => u !== data.username));
    });

    socket.on('error', (error) => {
      alert(error);
    });

    return () => {
      socket.off('room-joined');
      socket.off('receive-message');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('user-typing');
      socket.off('user-stop-typing');
      socket.off('error');
    };
  }, [socket, username]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`https://kuvaka-backend-5jl5.onrender.com/api/rooms/${roomId}/messages`);
      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
        // Extract unique participants from messages
        const uniqueParticipants = [...new Set(data.messages.filter(m => !m.isSystem).map(m => m.username))];
        setParticipants(prev => [...new Set([...prev, ...uniqueParticipants])]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const createRoom = async () => {
    if (!roomName.trim()) {
      alert('Please enter a room name');
      return;
    }

    try {
      const response = await fetch('https://kuvaka-backend-5jl5.onrender.com/api/rooms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roomName }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedLink(data.link);
        setRoomId(data.roomId);
        setCurrentPage('created');
      } else {
        alert('Failed to create room');
      }
    } catch (error) {
      alert('Error creating room');
    }
  };

  const joinRoom = async () => {
    if (!username.trim()) {
      alert('Please enter your username');
      return;
    }

    if (!roomId.trim()) {
      alert('Room ID is required');
      return;
    }

    try {
      const response = await fetch(`https://kuvaka-backend-5jl5.onrender.com/api/rooms/${roomId}`);
      const data = await response.json();
      
      if (!data.success) {
        alert('Room not found');
        return;
      }

      socket.emit('join-room', { roomId, username });
    } catch (error) {
      alert('Error joining room');
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit('send-message', {
      roomId,
      username,
      message: message.trim()
    });
    
    setMessage('');
    setShowEmojiPicker(false);
    handleStopTyping();
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { roomId, username });
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      handleStopTyping();
    }, 1000);
  };

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socket.emit('stop-typing', { roomId, username });
    }
    clearTimeout(typingTimeout.current);
  };

  const copyLink = () => {
    const link = generatedLink || `https://kuvaka-frontend-nine.vercel.app//room/${roomId}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Home Page
  if (currentPage === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Nexus Chat
            </h1>
            <p className="text-slate-400 mt-2">Connect • Collaborate • Communicate</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter room name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              />
            </div>
            
            <button
              onClick={createRoom}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Create Room
            </button>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1 h-px bg-slate-600"></div>
              <span className="text-slate-400 text-sm">OR</span>
              <div className="flex-1 h-px bg-slate-600"></div>
            </div>
            
            <button
              onClick={() => setCurrentPage('join')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 border border-slate-600"
            >
              Join Existing Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Room Created Page
  if (currentPage === 'created') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
              Room Created Successfully!
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Room Link:
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={generatedLink}
                  readOnly
                  className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-l-xl text-white text-sm"
                />
                <button
                  onClick={copyLink}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-4 py-2 rounded-r-xl transition-all"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            
            <button
              onClick={joinRoom}
              className="w-full bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
            >
              Join Your Room
            </button>
            
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl transition-all border border-slate-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Join Room Page
  if (currentPage === 'join') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Join Chat Room
            </h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <input
                type="text"
                placeholder="Enter room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
              />
            </div>
            
            <button
              onClick={joinRoom}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300"
            >
              Join Room
            </button>
            
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-xl transition-all border border-slate-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat Room Page
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex">
      {/* Main Chat Area - 75% */}
      <div className="flex-1 flex flex-col" style={{ width: '75%' }}>
        {/* Header */}
        <div className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              {roomData?.roomName}
            </h1>
            <p className="text-sm text-slate-400">
              {activeUsers} {activeUsers === 1 ? 'user' : 'users'} online
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg transition-all duration-300"
          >
            Leave Room
          </button>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  msg.isSystem
                    ? 'bg-slate-700/50 text-slate-300 text-center text-sm mx-auto border border-slate-600'
                    : msg.username === username
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                    : 'bg-slate-700/80 backdrop-blur-sm text-white border border-slate-600'
                }`}
              >
                {!msg.isSystem && msg.username !== username && (
                  <div className="text-xs text-slate-300 mb-1 font-medium">{msg.username}</div>
                )}
                <div className="whitespace-pre-wrap">{msg.message}</div>
                {!msg.isSystem && (
                  <div className={`text-xs mt-1 ${
                    msg.username === username ? 'text-cyan-100' : 'text-slate-400'
                  }`}>
                    {formatTime(msg.timestamp)}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {typingUsers.length > 0 && (
            <div className="text-sm text-slate-400 italic flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="bg-slate-800/90 backdrop-blur-xl border-t border-slate-700 p-4">
          {showEmojiPicker && (
            <div className="mb-4 p-3 bg-slate-700/80 rounded-xl border border-slate-600 max-h-32 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => addEmoji(emoji)}
                    className="text-xl hover:bg-slate-600 rounded p-1 transition-all"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl transition-all border border-slate-600"
            >
              😀
            </button>
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
            />
            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-2 rounded-xl transition-all duration-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      
      {/* Sidebar - 25% */}
      <div className="bg-slate-800/90 backdrop-blur-xl border-l border-slate-700 flex flex-col" style={{ width: '25%' }}>
        {/* Participants Header */}
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Participants
          </h3>
          <p className="text-sm text-slate-400">{participants.length} member{participants.length !== 1 ? 's' : ''}</p>
        </div>
        
        {/* Participants List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {participants.map((participant, index) => (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-xl ${
                participant === username
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30'
                  : 'bg-slate-700/50 border border-slate-600'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                participant === username
                  ? 'bg-gradient-to-r from-cyan-400 to-purple-400 text-white'
                  : 'bg-slate-600 text-slate-200'
              }`}>
                {participant.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{participant}</p>
                {participant === username && (
                  <p className="text-xs text-cyan-400">You</p>
                )}
              </div>
              <div className={`w-2 h-2 rounded-full ${
                participant === username ? 'bg-green-400' : 'bg-slate-500'
              }`}></div>
            </div>
          ))}
        </div>
        
        {/* Copy Link Button */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={copyLink}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 border border-slate-600 flex items-center justify-center space-x-2"
          >
            <span>📋</span>
            <span>Copy Room Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;