//AdminPage.jsx
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { Dialog, List, ListItem, ListItemButton, ListItemText, IconButton } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import ManageReviewers from "./ManageReviewers";
import ManageResearchers from "./ManageResearchers";
import ManageAdmins from "./ManageAdmins";
import ViewLogs from "./ViewLogs";
import ChatRoom from "../Researcher/ChatRoom"; 
import './AdminPage.css';

// Main admin page component
export default function AdminPage({ initialTab = "dashboard" }) {
  // State to track which tab is currently active
  const [activeTab, setActiveTab] = useState(initialTab);
  const [open, setOpen] = useState(false);
  const [supportChats, setSupportChats] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Debug: log the currently active tab
  console.log("ActiveTab is:", activeTab);

  useEffect(() => {
    // Fetch all chat docs with id starting with 'support_'
    async function fetchSupportChats() {
      const chatsSnap = await getDocs(collection(db, 'chats'));
      const support = [];
      chatsSnap.forEach(doc => {
        if (doc.id.startsWith('support_')) {
          support.push({ id: doc.id });
        }
      });
      setSupportChats(support);
    }
    if (open) fetchSupportChats();
  }, [open]);

  return (
    // Main container for the admin page
    <section className="admin-container">
      {/* Sidebar navigation for switching tabs */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* Main content area */}
      <main className="admin-main">
        {/* Header with dynamic title and subtitle based on active tab */}
        <header className="admin-header">
          <h1 className="admin-title">
            {console.log("Heading is rendering for:", activeTab)}
            {activeTab === "dashboard"
              ? "Dashboard"
              : activeTab === "logs"
              ? "System Logs"
              : activeTab === "researchers"
              ? "Manage Researchers"
              : activeTab === "admins"
              ? "Manage Admins"
              : activeTab === "reviewers"
              ? "Manage Reviewers"
              : "User Management"}
          </h1>
          <p className="admin-subtitle">
            {activeTab === "dashboard"
              ? "Overview of platform usage and engagement."
              : activeTab === "logs"
              ? "View detailed activity logs for all users."
              : activeTab === "researchers"
              ? "Manage researcher accounts and permissions."
              : activeTab === "admins"
              ? "Manage admin accounts and permissions."
              : activeTab === "reviewers"
              ? "Manage reviewer accounts and permissions."
              : "Manage user accounts and permissions."}
          </p>
        </header>
        {/* Render the selected tab's component */}
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "logs" && <ViewLogs />}
        {activeTab === "researchers" && <ManageResearchers />}
        {activeTab === "admins" && <ManageAdmins />}
        {activeTab === "reviewers" && <ManageReviewers />}
      </main>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 2000,
          bgcolor: '#1a2a42',
          color: '#B1EDE8',
          boxShadow: 3,
          '&:hover': { bgcolor: '#5AA9A3', color: '#fff' }
        }}
        size="large"
        aria-label="View support chats"
      >
        <HelpOutlineIcon fontSize="inherit" />
      </IconButton>
      <Dialog open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { minWidth: 350, maxWidth: 500 } }}>
        <div style={{ background: '#1a2a42', color: '#B1EDE8', padding: '1rem', fontWeight: 600 }}>
          User Support Chats
        </div>
        <List>
          {supportChats.length === 0 && <ListItem><ListItemText primary="No support chats yet." /></ListItem>}
          {supportChats.map(chat => (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton onClick={() => setSelectedChatId(chat.id)}>
                <ListItemText primary={chat.id.replace('support_', 'User: ')} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Dialog>
      {/* Show chat dialog when a chat is selected */}
      <Dialog open={!!selectedChatId} onClose={() => setSelectedChatId(null)} PaperProps={{ sx: { minWidth: 350, maxWidth: 500 } }}>
        <div style={{ background: '#1a2a42', color: '#B1EDE8', padding: '1rem', fontWeight: 600 }}>
          Support Chat: {selectedChatId}
        </div>
        {selectedChatId && <ChatRoom chatId={selectedChatId} />}
      </Dialog>
    </section>
  );
}