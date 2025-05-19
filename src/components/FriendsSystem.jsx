// FriendsSystem.jsx - Manages friend requests, searching users, and displaying friends list
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db, auth } from '../config/firebaseConfig';
import {
  collection,
  query,
  where,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { toast } from 'react-toastify';
import './FriendsSystem.css';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

// Main component for the friends system
const FriendsSystem = () => {
  // State variables for friends, requests, search, and UI
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(null);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

  // Listen for changes in the friends collection for the current user
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friends'),
      where('users', 'array-contains', currentUser.uid)
    );
   
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const received = [];
      const sent = [];
      const accepted = [];

      // Categorize friend documents by status
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const otherUserId = data.users.find((u) => u !== currentUser.uid);

        if (data.status === 'accepted') {
          accepted.push(otherUserId);
        } else if (data.status === 'pending') {
          if (data.sender === currentUser.uid) {
            sent.push(otherUserId);
          } else {
            received.push({ docId: docSnap.id, userId: otherUserId });
          }
        }
      });

      setFriends(accepted);
      setPendingSent(sent);
      setPendingReceived(received);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Search for users by name, excluding current friends and pending requests
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
          user.id !== currentUser?.uid &&
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

  // Send a friend request to another user
  const sendFriendRequest = async (userId) => {
    try {
      setSendingRequest(userId);

      await addDoc(collection(db, 'friends'), {
        users: [currentUser.uid, userId],
        status: 'pending',
        sender: currentUser.uid,
        createdAt: serverTimestamp()
      });

      toast.success('Friend request sent!');
    } catch (error) {
      toast.error('Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  // Accept or decline a received friend request
  const respondToRequest = async (docId, userId, accept) => {
    try {
      if (accept) {
        await updateDoc(doc(db, 'friends', docId), {
          status: 'accepted'
        });
        toast.success('Friend request accepted!');
      } else {
        await updateDoc(doc(db, 'friends', docId), {
          status: 'declined'
        });
        toast.info('Request declined');
      }
    } catch (error) {
      toast.error('Failed to respond to request');
    }
  };

  // Render the friends system UI
  return (
    <section className="friends-system">
        {/* Back button to navigate to previous page */}
        <button 
              className="back-button"
              onClick={() => navigate(-1)}
              style={{ 
                color: 'var(--white)',
                marginRight: '1.5rem'
              }}
            >
            <ArrowBackIosIcon />
        </button>
      <h2>Friends</h2>

      {/* Search bar for finding researchers */}
      <section className="search-section">
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
      </section>
      {/* Display search results if any */}
      {searchResults.length > 0 && (
        <section className="search-results">
          <h3>Search Results</h3>
          {searchResults.map(user => {
            const isPending = pendingSent.includes(user.id);
            const isSending = sendingRequest === user.id;

            return (
              <section key={user.id} className="user-card">
                <section className="user-info">
                  <span className="user-name">{user.name}</span>
                  {user.researchArea && (
                    <span className="research-area">{user.researchArea}</span>
                  )}
                </section>
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
              </section>
            );
          })}
        </section>
      )}
      {/* Section for received friend requests */}
      <section className="requests-section">
        <h3>Friend Requests</h3>
        {pendingReceived.length > 0 ? (
          <section className="requests-list">
            {pendingReceived.map(({ docId, userId }) => (
              <FriendCard
                key={userId}
                userId={userId}
                requestDocId={docId}
                onRespond={respondToRequest}
              />
            ))}
          </section>
        ) : (
          <p className="no-requests">No pending friend requests</p>
        )}
      </section>

      {/* Section for displaying current friends */}
      <section className="friends-list">
        <h3>Your Friends ({friends.length})</h3>
        {friends.length > 0 ? (
          friends.map(friendId => (
            <FriendCard key={friendId} userId={friendId} />
          ))
        ) : (
          <p className="no-friends">You haven't added any friends yet</p>
        )}
      </section>
    </section>
  );
};

// Card component for displaying user info and request actions
const FriendCard = ({ userId, requestDocId, onRespond }) => {
  const [userData, setUserData] = useState(null);

  // Fetch user data for the card
  useEffect(() => {
    const fetchUser = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) setUserData(userDoc.data());
    };
    fetchUser();
  }, [userId]);

  if (!userData) return <section className="user-card loading">Loading...</section>;

  return (
    <section className="user-card">
      <section className="user-info">
        <span className="user-name">{userData.name}</span>
        {userData.researchArea && (
          <span className="research-area">{userData.researchArea}</span>
        )}
      </section>
      {onRespond ? (
        <section className="request-actions">
          <button className="accept-btn" onClick={() => onRespond(requestDocId, userId, true)}>
            Accept
          </button>
          <button className="decline-btn" onClick={() => onRespond(requestDocId, userId, false)}>
            Decline
          </button>
        </section>
      ) : (
        <span className="friend-status">Friends</span>
      )}
    </section>
  );
};

export default FriendsSystem;
