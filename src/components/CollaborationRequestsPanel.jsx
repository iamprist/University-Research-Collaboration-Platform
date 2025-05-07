import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { collection, query, where, onSnapshot, updateDoc, doc, addDoc, arrayUnion , getDoc} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CollaborationRequestsPanel = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, 'collaboration-requests'),
      where('researcherId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRequests(requestsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleResponse = async (requestId, response) => {
    try {
      const requestRef = doc(db, 'collaboration-requests', requestId);
      const requestDoc = await getDoc(requestRef);
      const requestData = requestDoc.data();

      await updateDoc(requestRef, { 
        status: response,
        respondedAt: new Date()
      });

      if (response === 'accepted') {
        // Create collaboration
        await addDoc(collection(db, 'collaborations'), {
          listingId: requestData.listingId,
          researcherId: requestData.researcherId,
          collaboratorId: requestData.requesterId,
          joinedAt: new Date(),
          status: 'active'
        });

        // Update listing collaborators
        await updateDoc(doc(db, 'research-listings', requestData.listingId), {
          collaborators: arrayUnion(requestData.requesterId)
        });

        toast.success(`Collaboration with ${requestData.requesterName} accepted!`);
      } else {
        toast.info(`Request from ${requestData.requesterName} rejected`);
      }

      // Remove from local state
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error handling request:', error);
      toast.error('Failed to process request');
    }
  };

  const styles = {
    panel: {
      backgroundColor: '#1A2E40',
      borderRadius: '0.5rem',
      padding: '1rem',
      margin: '1rem 0',
      color: 'white'
    },
    requestItem: {
      borderBottom: '1px solid #64CCC5',
      padding: '1rem 0',
      marginBottom: '1rem'
    },
    buttonGroup: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    acceptButton: {
      backgroundColor: '#64CCC5',
      color: '#132238',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      cursor: 'pointer'
    },
    rejectButton: {
      backgroundColor: '#FF6B6B',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.25rem',
      cursor: 'pointer'
    }
  };

  if (loading) return <p>Loading requests...</p>;

  return (
    <div style={styles.panel}>
      <h3>Collaboration Requests</h3>
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        requests.map(request => (
          <div key={request.id} style={styles.requestItem}>
            <p>
              <strong>{request.requesterName}</strong> wants to collaborate on your project.
            </p>
            {request.message && <p>Message: "{request.message}"</p>}
            <div style={styles.buttonGroup}>
              <button 
                style={styles.acceptButton}
                onClick={() => handleResponse(request.id, 'accepted')}
              >
                Accept
              </button>
              <button
                style={styles.rejectButton}
                onClick={() => handleResponse(request.id, 'rejected')}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default CollaborationRequestsPanel;