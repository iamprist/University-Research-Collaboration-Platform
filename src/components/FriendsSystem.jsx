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

const FriendsSystem = () => {
  const [friends, setFriends] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const currentUser = auth.currentUser;

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

  const sendFriendRequest = async (userId) => {
    try {
      setLoading(true); // Using existing loading state instead of sendingRequest

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
      setLoading(false);
    }
  };

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
  return (
    <main className="friends-system">
      <header className="friends-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <ArrowBackIosIcon />
        </button>
        <h1>Friends</h1>
      </header>

      <section className="search-section">
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSearch();
        }}>
          <input
            type="search"
            placeholder="Search for researchers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search researchers"
          />
          <button 
            type="submit" 
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </section>

      {searchResults.length > 0 && (
        <section className="search-results" aria-live="polite">
          <h2>Search Results</h2>
          <ul className="results-list">
            {searchResults.map(user => (
              <FriendCard 
                key={user.id} 
                userId={user.id}
                isSearchResult={true}
                onRespond={(docId, friendId, accept) => {
                  if (accept) sendFriendRequest(friendId);
                }}
              />
            ))}
          </ul>
        </section>
      )}

      <section className="requests-section" aria-live="polite">
        <h2>Friend Requests</h2>
        {pendingReceived.length > 0 ? (
          <ul className="requests-list">
            {pendingReceived.map(({ docId, userId }) => (
              <FriendCard
                key={userId}
                userId={userId}
                requestDocId={docId}
                onRespond={respondToRequest}
              />
            ))}
          </ul>
        ) : (
          <p className="no-requests">No pending friend requests</p>
        )}
      </section>

      <section className="friends-list" aria-live="polite">
        <h2>Your Friends <small>({friends.length})</small></h2>
        {friends.length > 0 ? (
          <ul className="friends-ul">
            {friends.map(friendId => (
              <FriendCard key={friendId} userId={friendId} />
            ))}
          </ul>
        ) : (
          <p className="no-friends">You haven't added any friends yet</p>
        )}
      </section>
    </main>
  );
};

const FriendCard = ({ userId, requestDocId, onRespond, isSearchResult }) => {
  const navigate = useNavigate();
  const currentUser = auth.currentUser;
  const [userData, setUserData] = useState(null);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) setUserData(userDoc.data());

      if (currentUser) {
        const friendsQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', currentUser.uid),
          where('status', '==', 'accepted')
        );
        const friendsSnapshot = await getDocs(friendsQuery);
        const isFriend = friendsSnapshot.docs.some(doc => 
          doc.data().users.includes(userId)
        );
        setIsFriend(isFriend);

        const pendingQuery = query(
          collection(db, 'friends'),
          where('users', 'array-contains', currentUser.uid),
          where('status', '==', 'pending'),
          where('sender', '==', currentUser.uid)
        );
        const pendingSnapshot = await getDocs(pendingQuery);
        const hasPending = pendingSnapshot.docs.some(doc => 
          doc.data().users.includes(userId)
        );
        setHasPendingRequest(hasPending);
      }
    };

    fetchData();
  }, [userId, currentUser]);

  if (!userData) return (
    <li className="user-card loading" aria-busy="true">
      Loading...
    </li>
  );

  const handleViewProfile = () => {
    navigate(`/friend-profile/${userId}`);
  };

  return (
    <li className="user-card">
      <div 
        className="user-info"
        onClick={handleViewProfile}
        role="button"
        tabIndex="0"
        onKeyPress={(e) => e.key === 'Enter' && handleViewProfile()}
        aria-label={`View ${userData.name}'s profile`}
      >
        <h3 className="user-name">{userData.name}</h3>
        {userData.researchArea && (
          <p className="research-area">{userData.researchArea}</p>
        )}
      </div>
      
      {onRespond ? (
        <div className="request-actions">
          <button 
            className="accept-btn"
            onClick={() => onRespond(requestDocId, userId, true)}
            aria-label={`Accept friend request from ${userData.name}`}
          >
            Accept
          </button>
          <button 
            className="decline-btn"
            onClick={() => onRespond(requestDocId, userId, false)}
            aria-label={`Decline friend request from ${userData.name}`}
          >
            Decline
          </button>
        </div>
      ) : isFriend ? (
        <div className="friend-status" aria-label="Friends">
          Friends
        </div>
      ) : hasPendingRequest ? (
        <div className="request-sent-label" aria-label="Request sent">
          Request Sent
        </div>
      ) : isSearchResult ? (
        <button
          className="add-friend-btn"
          onClick={() => onRespond(null, userId, true)}
          disabled={!currentUser}
          aria-label={`Add ${userData.name} as friend`}
        >
          Add Friend
        </button>
      ) : null}
    </li>
  );
};

export default FriendsSystem;