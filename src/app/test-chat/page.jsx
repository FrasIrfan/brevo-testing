'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, setDoc, serverTimestamp, collection, query, orderBy, onSnapshot, addDoc, getDocs, where, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup } from '../../lib/firebase';

export default function TestChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Debug logging for auth state
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Logged in user:', user.email);
        setCurrentUser(user);
        setStatus(`Already logged in as: ${user.email}`);
      } else {
        console.log('No user logged in');
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch available users with debug logging
  useEffect(() => {
    if (!currentUser) {
      console.log('No current user, skipping users fetch');
      return;
    }

    console.log('Setting up users listener for:', currentUser.email);
    console.log('Current user ID:', currentUser.uid);
    
    const q = query(collection(db, 'users'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Users snapshot received. Document count:', snapshot.docs.length);
      const rawData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Document data:', { id: doc.id, ...data });
        return { id: doc.id, ...data };
      });
      console.log('Raw snapshot data (detailed):', JSON.stringify(rawData, null, 2));
      
      const usersList = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data
          };
        })
        .filter(user => {
          const shouldInclude = user.uid !== currentUser.uid;
          console.log(`Checking user ${user.email}: ${shouldInclude ? 'including' : 'filtering out'}`);
          return shouldInclude;
        });
      
      console.log('Current user ID being filtered:', currentUser.uid);
      console.log('Filtered users list:', JSON.stringify(usersList, null, 2));
      setUsers(usersList);
    }, (error) => {
      console.error('Error fetching users:', error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Listen for messages between current user and selected user
  useEffect(() => {
    if (!currentUser || !selectedUser) return;

    // Create a unique conversation ID (smaller UID first)
    const conversationId = [currentUser.uid, selectedUser.uid].sort().join('_');

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [currentUser, selectedUser]);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      console.log('Signing in user:', user.email);
      console.log('User data:', {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL
      });
      
      const userDocRef = doc(db, 'users', user.uid);
      console.log('Attempting to save user document with ID:', user.uid);
      
      const userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp()
      };
      console.log('Saving user data:', JSON.stringify(userData, null, 2));
      
      try {
        await setDoc(userDocRef, userData, { merge: true });
        console.log('Document successfully saved');

        // Verify the document was created
        const docSnap = await getDoc(userDocRef);
        const savedData = docSnap.exists() ? docSnap.data() : 'Document does not exist';
        console.log('Saved user document data:', JSON.stringify(savedData, null, 2));
        
        // Double check the users collection with error handling
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          console.log('Total users in collection:', usersSnapshot.size);
          const allUsers = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log('Found user document:', doc.id, JSON.stringify(data, null, 2));
            return { id: doc.id, ...data };
          });
          console.log('All users in database:', JSON.stringify(allUsers, null, 2));
        } catch (error) {
          console.error('Error fetching all users:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
        }
      } catch (error) {
        console.error('Error saving user document:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      }
      
      setCurrentUser(user);
      setStatus(`Successfully logged in as: ${user.email}`);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setStatus(`Error signing in: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
      setSelectedUser(null);
      setMessages([]);
      setStatus('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      setStatus(`Error signing out: ${error.message}`);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUser || !selectedUser) return;

    try {
      // Create a unique conversation ID (smaller UID first)
      const conversationId = [currentUser.uid, selectedUser.uid].sort().join('_');
      
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: message,
        sender: currentUser.uid,
        receiver: selectedUser.uid,
        senderName: currentUser.displayName,
        senderEmail: currentUser.email,
        senderPhoto: currentUser.photoURL,
        timestamp: serverTimestamp()
      });

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setStatus(`Error sending message: ${error.message}`);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat Testing Interface</h1>
      
      <div className="mb-8 flex justify-between items-center">
        {!currentUser ? (
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className={`bg-white text-gray-700 px-6 py-3 rounded shadow-md flex items-center space-x-2 ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
            }`}
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="w-5 h-5"
            />
            <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img 
                src={currentUser.photoURL} 
                alt={currentUser.displayName} 
                className="w-8 h-8 rounded-full"
              />
              <span className="text-sm font-medium">{currentUser.displayName}</span>
            </div>
            <button
              onClick={signOut}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      {currentUser && (
        <div className="grid grid-cols-4 gap-4">
          {/* Users List */}
          <div className="col-span-1 bg-white rounded-lg shadow p-4">
            <h2 className="font-semibold mb-4">Available Users</h2>
            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.uid}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center space-x-2 p-2 rounded ${
                    selectedUser?.uid === user.uid
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <img
                    src={user.photoURL}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </button>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-gray-500 text-center">
                  No other users available
                </p>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="col-span-3">
            {selectedUser ? (
              <div className="bg-white rounded-lg shadow">
                {/* Selected User Header */}
                <div className="p-4 border-b flex items-center space-x-2">
                  <img
                    src={selectedUser.photoURL}
                    alt={selectedUser.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedUser.name}</p>
                    <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-2 ${
                          msg.sender === currentUser.uid ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        <img
                          src={msg.senderPhoto}
                          alt={msg.senderName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender === currentUser.uid
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-xs font-medium">{msg.senderName}</p>
                            {msg.timestamp && (
                              <p className="text-xs opacity-75 ml-2">
                                {formatTimestamp(msg.timestamp)}
                              </p>
                            )}
                          </div>
                          <p className="break-words">{msg.text}</p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Message ${selectedUser.name}...`}
                      className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (message.trim()) {
                            sendMessage(e);
                          }
                        }
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                <p className="text-lg">Select a user to start chatting</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 className="font-semibold mb-2">Testing Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Open this page in two different browsers (e.g., Chrome and Firefox)</li>
          <li>Sign in with different Google accounts in each browser</li>
          <li>Select the other user from the users list on the left</li>
          <li>Send messages to test private chat</li>
          <li>Messages will appear instantly with timestamps</li>
          <li>Switch browsers to reply from the other account</li>
          <li>Refresh the page to test message history persistence</li>
        </ol>
      </div>
    </div>
  );
} 