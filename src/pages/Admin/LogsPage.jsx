import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;
  const navigate = useNavigate();

  // Define the logEvent function locally
  const logEvent = async ({ userId, role, userName, action, target, details, ip }) => {
    try {
      await addDoc(collection(db, "logs"), {
        userId,
        role,
        userName,
        action,
        target,
        details,
        ip,
        timestamp: serverTimestamp(),
      });
      console.log("Event logged:", { userId, role, action, details });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsCollection = collection(db, "logs");
        const logsSnapshot = await getDocs(logsCollection);
        const logsData = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching logs:", error);
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    const handleTabClose = async () => {
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Admin",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User closed the browser/tab",
        });
      }
    };

    window.addEventListener("beforeunload", handleTabClose);
    return () => window.removeEventListener("beforeunload", handleTabClose);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log("User logged in:", user);
      } else {
        console.log("User logged out");
        await logEvent({
          userId: "N/A",
          role: "Admin",
          userName: "N/A",
          action: "Logout",
          details: "Session expired or user logged out",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      console.log("Attempting to log out...");

      // Log the logout event before signing out
      if (auth.currentUser) {
        await logEvent({
          userId: auth.currentUser.uid,
          role: "Admin",
          userName: auth.currentUser.displayName || "N/A",
          action: "Logout",
          details: "User logged out",
        });
        console.log("Logout event recorded.");
      } else {
        console.warn("No authenticated user found to log the event.");
      }

      // Perform logout using Firebase Auth
      await auth.signOut();

      console.log("Logout successful. Redirecting to /signin...");
      // Redirect the user to the login page
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // --- Data Processing for Summary and Graph ---
  const filteredLogs = logs.filter((log) =>
    Object.values(log).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

  // Summary stats (for all users)
  const totalUsers = new Set(logs.map((log) => log.userId)).size;
  const totalLogins = logs.filter((log) => log.action === "Login").length;
  const totalLogouts = logs.filter((log) => log.action === "Logout").length;
  const totalListings = logs.filter((log) => log.action === "Posted Listing").length;
  const totalReviewerApps = logs.filter((log) => log.action === "Apply to Be Reviewer").length;

  // Engagement graph: logs per day (last 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
  const engagementData = days.map((date) => ({
    date,
    count: logs.filter(
      (log) =>
        log.timestamp &&
        log.timestamp.toDate &&
        log.timestamp.toDate().toISOString().slice(0, 10) === date
    ).length,
  }));

  // --- Styles ---
  const styles = {
    container: {
      backgroundColor: "#1A2E40",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      color: "#FFFFFF",
    },
    header: {
      fontSize: "2.2rem",
      fontWeight: "bold",
      marginBottom: "0.5rem",
      textAlign: "center",
      color: "#FFFFFF",
    },
    subHeader: {
      fontSize: "1.1rem",
      marginBottom: "2rem",
      textAlign: "center",
      color: "#B1EDE8",
    },
    dashboard: {
      display: "flex",
      flexWrap: "wrap",
      gap: "2rem",
      marginBottom: "2rem",
      justifyContent: "center",
    },
    card: {
      background: "#2B3E50",
      borderRadius: "1rem",
      padding: "1.5rem 2rem",
      minWidth: "180px",
      textAlign: "center",
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      color: "#B1EDE8",
      fontWeight: "600",
      fontSize: "1.2rem",
    },
    controls: {
      display: "flex",
      gap: "1rem",
      alignItems: "center",
      marginBottom: "1.5rem",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    input: {
      padding: "0.75rem",
      width: "250px",
      border: "1px solid #D1D5DB",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      color: "#132238",
    },
    button: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#64CCC5",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    logoutButton: {
      padding: "0.75rem 1.5rem",
      backgroundColor: "#f44336",
      color: "#FFFFFF",
      border: "none",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      fontWeight: "600",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    tableContainer: {
      backgroundColor: "#2B3E50",
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      maxWidth: "100%",
      margin: "0 auto",
      marginTop: "2rem",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.97rem",
    },
    th: {
      borderBottom: "2px solid #D1D5DB",
      padding: "0.75rem",
      backgroundColor: "#364E68",
      color: "#B1EDE8",
      textAlign: "left",
    },
    td: {
      borderBottom: "1px solid #D1D5DB",
      padding: "0.75rem",
      color: "#FFFFFF",
    },
    noResults: {
      textAlign: "center",
      padding: "1rem",
      color: "#888",
    },
    pagination: {
      display: "flex",
      justifyContent: "center",
      marginTop: "1.5rem",
    },
    pageButton: {
      margin: "0 0.5rem",
      padding: "0.5rem 1rem",
      border: "1px solid #D1D5DB",
      borderRadius: "0.5rem",
      backgroundColor: "#FFFFFF",
      color: "#132238",
      cursor: "pointer",
      fontSize: "1rem",
    },
    activePageButton: {
      backgroundColor: "#64CCC5",
      color: "#FFFFFF",
    },
    chartCard: {
      background: "#2B3E50",
      borderRadius: "1rem",
      padding: "1.5rem",
      minWidth: "350px",
      flex: 1,
      boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
      color: "#B1EDE8",
      fontWeight: "600",
      fontSize: "1.1rem",
      marginBottom: "2rem",
      maxWidth: "600px",
      height: "320px",
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Platform Logs</h1>
      <p style={styles.subHeader}>
        Usage overview, engagement, and detailed activity logs for all users.
      </p>

      {/* Dashboard Summary */}
      <div style={styles.dashboard}>
        <div style={styles.card}>
          <div>Total Users</div>
          <div style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalUsers}</div>
        </div>
        <div style={styles.card}>
          <div>Logins</div>
          <div style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalLogins}</div>
        </div>
        <div style={styles.card}>
          <div>Logouts</div>
          <div style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalLogouts}</div>
        </div>
        <div style={styles.card}>
          <div>Listings Posted</div>
          <div style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalListings}</div>
        </div>
        <div style={styles.card}>
          <div>Reviewer Applications</div>
          <div style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalReviewerApps}</div>
        </div>
      </div>

      {/* Engagement Line Graph */}
      <div style={styles.chartCard}>
        <div style={{ marginBottom: "1rem" }}>Engagement (Logs per Day)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#364E68" />
            <XAxis dataKey="date" stroke="#B1EDE8" fontSize={12} tick={false} /> {/* Hide X-axis labels */}
            <YAxis allowDecimals={false} stroke="#B1EDE8" fontSize={12} tick={false} /> {/* Hide Y-axis labels */}
            <Tooltip
              contentStyle={{ background: "#2B3E50", border: "none", color: "#B1EDE8" }}
              labelStyle={{ color: "#64CCC5" }}
              formatter={(value, name) => [value, "Logs"]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#64CCC5"
              strokeWidth={3}
              dot={{ r: 5, stroke: "#2B3E50", strokeWidth: 2, fill: "#64CCC5" }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search logs..."
          style={styles.input}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            style={styles.button}
            onClick={() => alert("Exporting logs...")}
          >
            Export Logs
          </button>
          <button
            style={styles.logoutButton}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#FFFFFF" }}>Loading logs...</p>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>User Role</th>
                <th style={styles.th}>User Name</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Target</th>
                <th style={styles.th}>Details</th>
                <th style={styles.th}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={styles.td}>
                      {log.timestamp?.toDate
                        ? log.timestamp.toDate().toLocaleString()
                        : "N/A"}
                    </td>
                    <td style={styles.td}>{log.role || "N/A"}</td>
                    <td style={styles.td}>{log.userName || "N/A"}</td>
                    <td style={styles.td}>{log.action}</td>
                    <td style={styles.td}>{log.target}</td>
                    <td style={styles.td}>{log.details}</td>
                    <td style={styles.td}>{log.ip || "N/A"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={styles.noResults}>
                    No logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={styles.pagination}>
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                style={{
                  ...styles.pageButton,
                  ...(currentPage === index + 1 ? styles.activePageButton : {}),
                }}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}