import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const fcm = admin.messaging();

interface MessageData {
  receiverId: string;
  content: string;
}

// Function to send a new message
export const sendMessage = functions.https.onCall(async (data: MessageData, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { receiverId, content } = data;
  const senderId = context.auth.uid;

  try {
    // Create or get existing chat
    const chatId = [senderId, receiverId].sort().join('_');
    const chatRef = db.collection('chats').doc(chatId);
    const messageRef = chatRef.collection('messages');

    // Create new message
    const newMessage = {
      senderId,
      receiverId,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    };

    // Add message to chat
    const messageDoc = await messageRef.add(newMessage);

    // Update chat document
    await chatRef.set({
      participants: [senderId, receiverId],
      lastMessage: {
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderId,
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Get receiver's FCM token
    const receiverDoc = await db.collection('users').doc(receiverId).get();
    const receiverData = receiverDoc.data();
    const fcmToken = receiverData?.fcmToken;

    // Send push notification if token exists
    if (fcmToken) {
      const senderDoc = await db.collection('users').doc(senderId).get();
      const senderData = senderDoc.data();
      const senderName = senderData?.name || 'Someone';

      await fcm.send({
        token: fcmToken,
        notification: {
          title: `New message from ${senderName}`,
          body: content,
        },
        data: {
          chatId,
          messageId: messageDoc.id,
          type: 'new_message',
        },
      });
    }

    return { success: true, messageId: messageDoc.id };
  } catch (error) {
    console.error('Error sending message:', error);
    throw new functions.https.HttpsError('internal', 'Error sending message');
  }
});

interface MarkReadData {
  chatId: string;
}

// Function to mark messages as read
export const markMessagesAsRead = functions.https.onCall(async (data: MarkReadData, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { chatId } = data;
  const userId = context.auth.uid;

  try {
    const messagesRef = db.collection('chats').doc(chatId).collection('messages');
    const unreadMessages = await messagesRef
      .where('receiverId', '==', userId)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    unreadMessages.docs.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw new functions.https.HttpsError('internal', 'Error marking messages as read');
  }
}); 