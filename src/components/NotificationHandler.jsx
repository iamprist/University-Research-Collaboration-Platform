import { useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc,
  addDoc,
  arrayUnion
} from 'firebase/firestore';
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
              <p><strong>{request.requesterName}</strong> wants to collaborate on your project!</p>
              <div style={{ marginTop: '10px' }}>
                <button 
                  onClick={async () => {
                    await handleResponse(change.doc.id, 'accepted', request);
                    toast.success("Collaboration accepted!");
                  }}
                  style={{ 
                    marginRight: '10px',
                    background: '#64CCC5',
                    color: '#132238',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px'
                  }}
                >
                  Accept
                </button>
                <button 
                  onClick={async () => {
                    await handleResponse(change.doc.id, 'rejected', request);
                    toast.warning("Request rejected");
                  }}
                  style={{
                    background: '#FF6B6B',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '4px'
                  }}
                >
                  Reject
                </button>
              </div>
            </div>,
            { 
              autoClose: false,
              closeButton: false,
              position: 'bottom-right'
            }
          );
        }
      });
    });

    const handleResponse = async (requestId, response, requestData) => {
      try {
        const requestRef = doc(db, 'collaboration-requests', requestId);
        await updateDoc(requestRef, { 
          status: response,
          respondedAt: new Date()
        });

        if (response === 'accepted') {
          // Add to collaborations collection
          await addDoc(collection(db, 'collaborations'), {
            listingId: requestData.listingId,
            researcherId: requestData.researcherId,
            collaboratorId: requestData.requesterId,
            joinedAt: new Date(),
            status: 'active'
          });

          // Update the listing's collaborators array
          await updateDoc(doc(db, 'research-listings', requestData.listingId), {
            collaborators: arrayUnion(requestData.requesterId)
          });
        }
      } catch (error) {
        console.error("Error handling response:", error);
        toast.error("Failed to process request");
      }
    };

    return () => unsubscribe();
  }, []);

  return null;
};

export default NotificationHandler;