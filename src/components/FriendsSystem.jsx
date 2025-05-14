import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayRemove, 
  arrayUnion,
  collection,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './FriendsSystem.css';

const FriendsSystem = () => {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receivedRequestsData, setReceivedRequestsData] = useState([]);
  const [sendingRequest, setSendingRequest] = useState(null);

  // Real-time listener for user data
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setFriends(data.friends || []);
        setPendingReceived(data.pendingReceivedRequests || []);
        setPendingSent(data.pendingSentRequests || []);
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch details of users who sent friend requests
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (pendingReceived.length === 0) {
        setReceivedRequestsData([]);
        return;
      }
      
      try {
        const requestersData = await Promise.all(
          pendingReceived.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return userDoc.exists() ? { 
              id: userId, 
              name: userDoc.data().name,
              researchArea: userDoc.data().researchArea,
              
            } : null;
          })
        );
        
        setReceivedRequestsData(requestersData.filter(Boolean));
      } catch (error) {
        console.error("Error fetching request details:", error);
        toast.error("Failed to load request details");
      }
    };

    fetchRequestDetails();
  }, [pendingReceived]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const results = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => 
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          user.id !== auth.currentUser?.uid &&
          !friends.includes(user.id) &&
          !pendingSent.includes(user.id)
        );
      
      setSearchResults(results);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      setSendingRequest(userId);
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      await updateDoc(doc(db, 'users', currentUser.uid), {
        pendingSentRequests: arrayUnion(userId)
      });

      await updateDoc(doc(db, 'users', userId), {
        pendingReceivedRequests: arrayUnion(currentUser.uid)
      });

      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  const respondToRequest = async (userId, accept) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      if (accept) {
        // Add to each other's friends list
        await updateDoc(doc(db, 'users', currentUser.uid), {
          friends: arrayUnion(userId),
          pendingReceivedRequests: arrayRemove(userId)
        });
        await updateDoc(doc(db, 'users', userId), {
          friends: arrayUnion(currentUser.uid),
          pendingSentRequests: arrayRemove(currentUser.uid)
        });
        
        toast.success('Friend added successfully!');
      } else {
        // Just remove the pending request
        await updateDoc(doc(db, 'users', currentUser.uid), {
          pendingReceivedRequests: arrayRemove(userId)
        });
        await updateDoc(doc(db, 'users', userId), {
          pendingSentRequests: arrayRemove(currentUser.uid)
        });
        
        toast.info('Request declined');
      }
    } catch (error) {
      toast.error('Failed to process request');
    }
  };

  return (
    <div className="friends-system">
      <h2>Friends System</h2>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="Search for researchers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Received Requests Section */}
      <div className="requests-section">
        <h3>Friend Requests</h3>
        {receivedRequestsData.length > 0 ? (
          <div className="requests-list">
            {receivedRequestsData.map(user => (
              <div key={user.id} className="request-card">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                  
                  {user.researchArea && (
                    <span className="research-area">{user.researchArea}</span>
                  )}
                </div>
                <div className="request-actions">
                  <button 
                    className="accept-btn"
                    onClick={() => respondToRequest(user.id, true)}
                  >
                    Accept
                  </button>
                  <button 
                    className="decline-btn"
                    onClick={() => respondToRequest(user.id, false)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-requests">No pending friend requests</p>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Search Results</h3>
          {searchResults.map(user => {
            const isPending = pendingSent.includes(user.id);
            const isSending = sendingRequest === user.id;
            
            return (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <span className="user-name">{user.name}</span>
                 
                  {user.researchArea && (
                    <span className="research-area">{user.researchArea}</span>
                  )}
                </div>
                {isPending ? (
                  <span className="request-sent-label">Request Sent</span>
                ) : (
                  <button 
                    className="add-friend-btn"
                    onClick={() => sendFriendRequest(user.id)}
                    disabled={isSending}
                  >
                    {isSending ? 'Sending...' : 'Add Friend'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Friends List */}
      <div className="friends-list">
        <h3>Your Friends ({friends.length})</h3>
        {friends.length > 0 ? (
          friends.map(friendId => (
            <FriendCard key={friendId} userId={friendId} />
          ))
        ) : (
          <p className="no-friends">You haven't added any friends yet</p>
        )}
      </div>
    </div>
  );
};

const FriendCard = ({ userId }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    };
    fetchUser();
  }, [userId]);

  if (!userData) return <div className="user-card loading">Loading...</div>;

  return (
    <div className="user-card friend">
      <div className="user-info">
        <span className="user-name">{userData.name}</span>
      
        {userData.researchArea && (
          <span className="research-area">{userData.researchArea}</span>
        )}
      </div>
      <span className="friend-status">Friends</span>
    </div>
  );
};

export default FriendsSystem;