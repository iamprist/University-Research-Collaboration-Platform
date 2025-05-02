// src/pages/Admin/AdminPage.jsx
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import {
  LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

export default function AdminPage() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeTab, setActiveTab] = useState("applications");

  // Reviewer applications state
  const [reviewers, setReviewers] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  // Logs state
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Fetch reviewer applications
  useEffect(() => {
    const fetchApps = async () => {
      setLoadingApps(true);
      try {
        const q = query(collection(db, "reviewers"), where("status", "!=", "rejected"));
        const snap = await getDocs(q);
        setReviewers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoadingApps(false);
    };
    fetchApps();
  }, []);

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const snap = await getDocs(collection(db, "logs"));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoadingLogs(false);
    };
    fetchLogs();
  }, []);

  // Approve/reject handlers
  const handleApprove = async id => {
    await updateDoc(doc(db, "reviewers", id), { status: "approved", updatedAt: new Date() });
    setReviewers(r => r.filter(x => x.id !== id));
  };
  const handleReject = async id => {
    await updateDoc(doc(db, "reviewers", id), { status: "rejected", updatedAt: new Date() });
    setReviewers(r => r.filter(x => x.id !== id));
  };

  // Logout
  const handleLogout = async () => {
    await auth.signOut();
    window.location.href = "/signin";
  };

  // Prepare logs for display
  const sortedLogs = [...logs].sort(
    (a, b) => b.timestamp?.toDate?.() - a.timestamp?.toDate?.()
  );
  const filteredLogs = sortedLogs.filter(l =>
    Object.values(l).some(v =>
      v?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Stats summary
  const stats = {
    Users: new Set(logs.map(l => l.userId)).size,
    Logins: logs.filter(l => l.action === "Login").length,
    Logouts: logs.filter(l => l.action === "Logout").length,
    Listings: logs.filter(l => l.action === "Posted Listing").length,
    ReviewerApps: logs.filter(l => l.action === "Apply to Be Reviewer").length,
  };

  // Engagement data (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const engagement = days.map(date => ({
    date,
    count: logs.filter(
      l =>
        l.timestamp &&
        l.timestamp.toDate &&
        l.timestamp.toDate().toISOString().slice(0, 10) === date
    ).length,
  }));

  // Color palette
  const colors = {
    bg: "#0e2433",
    sidebarBg: "#0f1a25",
    cardBg: "#1b2a3b",
    highlight: "#64CCC5",
    textLight: "#B1EDE8",
    text: "#ffffff",
    border: "#273b4e",
    danger: "#8b1c1c",
  };

  // Hamburger icon style
  const hamburger = {
    width: "24px",
    height: "18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    cursor: "pointer",
    marginRight: "1rem",
  };
  const bar = { width: "100%", height: "3px", backgroundColor: colors.text };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: colors.bg,
      color: colors.text,
      fontFamily: "Inter, sans-serif"
    }}>
      {/* Sidebar */}
      {showSidebar && (
        <aside style={{
          width: "220px",
          backgroundColor: colors.sidebarBg,
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          position: "fixed",
          height: "100%",
        }}>
          <h2 style={{ color: colors.highlight }}>Admin</h2>
          <button
            onClick={() => setActiveTab("applications")}
            style={{
              padding: "0.75rem",
              backgroundColor: activeTab === "applications" ? "#3a5a72" : "#243447",
              color: activeTab === "applications" ? colors.text : colors.textLight,
              border: "none",
              borderRadius: "0.5rem",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Reviewer Apps
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            style={{
              padding: "0.75rem",
              backgroundColor: activeTab === "logs" ? "#3a5a72" : "#243447",
              color: activeTab === "logs" ? colors.text : colors.textLight,
              border: "none",
              borderRadius: "0.5rem",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            Platform Logs
          </button>
          <button
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              padding: "0.75rem",
              backgroundColor: colors.danger,
              color: colors.text,
              border: "none",
              borderRadius: "0.5rem",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </aside>
      )}

      {/* Main Content */}
      <main style={{
        flex: 1,
        marginLeft: showSidebar ? "220px" : 0,
        padding: "2rem",
        transition: "margin 0.3s",
      }}>
        {/* Header */}
        <header style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "1.5rem"
        }}>
          <div style={hamburger} onClick={() => setShowSidebar(s => !s)}>
            <div style={bar} />
            <div style={bar} />
            <div style={bar} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
            <p style={{ margin: 0, color: colors.textLight }}>Manage platform activity</p>
          </div>
        </header>

        {/* Reviewer Applications Tab */}
        {activeTab === "logs" && (
  <>
    <h2>Platform Logs</h2>

    {/* Stats */}
    <div style={{
      display: "flex",
      gap: "1rem",
      marginBottom: "1rem",
      flexWrap: "wrap"
    }}>
      {Object.entries(stats).map(([label, value]) => (
        <div key={label} style={{
          backgroundColor: colors.cardBg,
          padding: "1rem",
          borderRadius: "0.5rem",
          textAlign: "center",
          flex: "1 1 120px",
          minWidth: "120px"
        }}>
          <div style={{ color: colors.textLight }}>{label}</div>
          <div style={{ fontSize: "1.5rem", color: colors.highlight }}>{value}</div>
        </div>
      ))}
    </div>

    {/* Engagement Chart */}
    <div style={{
      marginBottom: "1rem",
      backgroundColor: colors.cardBg,
      padding: "1rem",
      borderRadius: "0.5rem",
      width: "100%",
      overflow: "hidden"
    }}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={engagement}>
          <CartesianGrid stroke={colors.border} />
          <XAxis dataKey="date" tick={false} />
          <YAxis allowDecimals={false} tick={false} />
          <Tooltip contentStyle={{
            background: colors.cardBg,
            border: "none",
            color: colors.textLight
          }} />
          <Line type="monotone" dataKey="count" stroke={colors.highlight} strokeWidth={2} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    {/* Search */}
    <div style={{
      marginBottom: "1rem",
      backgroundColor: colors.cardBg,
      padding: "1rem",
      borderRadius: "0.5rem"
    }}>
      <input
        placeholder="Search logs..."
        style={{
          padding: "0.5rem",
          width: "100%",
          maxWidth: "300px",
          borderRadius: "0.5rem",
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          color: colors.text
        }}
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />
    </div>

    {/* Logs Table */}
    <div style={{
      backgroundColor: colors.cardBg,
      borderRadius: "0.5rem",
      padding: "1rem",
      marginBottom: "1rem",
      overflowX: "auto",
      width: "100%"
    }}>
      {!loadingLogs && (
        <div style={{
          width: "100%",
          minWidth: "800px", // Ensures table doesn't get too narrow
          overflowY: "auto",
          maxHeight: "calc(100vh - 500px)" // Adjust based on your needs
        }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: colors.cardBg,
            color: colors.text
          }}>
            <thead style={{ backgroundColor: colors.border, color: colors.textLight }}>
              <tr>
                {["#","Timestamp","Role","User","Action","Target","Details","IP"].map(h => (
                  <th key={h} style={{
                    padding: "0.75rem",
                    textAlign: "left",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap",
                    position: "sticky",
                    top: 0,
                    backgroundColor: colors.border
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentLogs.length ? currentLogs.map((l,i) => (
                <tr key={l.id} style={{
                  borderBottom: `1px solid ${colors.border}`,
                  '&:hover': {
                    backgroundColor: colors.border
                  }
                }}>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{(currentPage-1)*logsPerPage + i + 1}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.timestamp?.toDate?.().toLocaleString() || "N/A"}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.role || "N/A"}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.userName || "N/A"}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.action}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.target}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    maxWidth: "300px"
                  }}>{l.details}</td>
                  <td style={{
                    padding: "0.75rem",
                    fontSize: "0.85rem",
                    whiteSpace: "nowrap"
                  }}>{l.ip || "N/A"}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} style={{
                    padding: "1rem",
                    textAlign: "center"
                  }}>No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Pagination */}
    <div style={{
      display: "flex",
      justifyContent: "center",
      gap: "0.5rem",
      backgroundColor: colors.cardBg,
      padding: "1rem",
      borderRadius: "0.5rem"
    }}>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i+1}
          onClick={() => setCurrentPage(i+1)}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: currentPage === i+1 ? colors.highlight : colors.bg,
            border: `1px solid ${colors.border}`,
            borderRadius: "0.5rem",
            color: currentPage === i+1 ? "#132238" : colors.text,
            cursor: "pointer",
            minWidth: "40px"
          }}
        >
          {i+1}
        </button>
      ))}
    </div>
  </>
)}      
      </main>
    </div>
  );
}
