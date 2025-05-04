// NotificationHandler.jsx
import { useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, getDoc, doc,updateDoc, serverTimestamp, arrayUnion} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationHandler = () => {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const requestsRef = collection(db, 'collaboration-requests');
    const q = query(
      requestsRef,
      where('researcherId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const request = change.doc.data();
          toast.info(
            <div>
              <p>{request.requesterName} wants to collaborate on your project!</p>
              <button 
                onClick={() => handleResponse(change.doc.id, 'accepted')}
                style={{ marginRight: '10px' }}
              >
                Accept
              </button>
              <button onClick={() => handleResponse(change.doc.id, 'rejected')}>
                Reject
              </button>
            </div>,
            { autoClose: false }
          );
        }
      });
    });

    const handleResponse = async (requestId, response) => {
        try {
          const requestRef = doc(db, "collaboration-requests", requestId);
          await updateDoc(requestRef, { status: response });
      
          if (response === "accepted") {
            const request = (await getDoc(requestRef)).data();
            
            // 1. Create collaboration
            await addDoc(collection(db, "collaborations"), {
              listingId: request.listingId,
              researcherId: request.researcherId,
              collaboratorId: request.requesterId,
              joinedAt: serverTimestamp()
            });
      
            // 2. Update listing collaborators
            await updateDoc(doc(db, "research-listings", request.listingId), {
              collaborators: arrayUnion(request.requesterId)
            });
      
            // 3. Update user's active collabs
            await updateDoc(doc(db, "users", request.requesterId), {
              activeCollabs: arrayUnion(request.listingId)
            });
          }
        } catch (error) {
          console.error(error);
          toast.error("Failed to process request");
        }
      };

    return () => unsubscribe();
  }, []);

  return null;
};

export default NotificationHandler;