import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { db, auth } from "../../config/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminPage() {
  const navigate = useNavigate();
  const [reviewers, setReviewers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showApps, setShowApps] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const logsPerPage = 10;
  const [showSidebar, setShowSidebar] = useState(true); // ⭐ Added sidebar state

  // Fetch reviewer applications
  useEffect(() => {
    const fetchReviewers = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "reviewers"),
          where("status", "!=", "rejected")
        );
        const snap = await getDocs(q);
        setReviewers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchReviewers();
  }, []);

  // Fetch logs when showing logs tab
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "logs"));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    if (!showApps) fetchLogs();
  }, [showApps]);

  // Process logs
  const filteredLogs = logs
    .filter(l => 
      Object.values(l).some(v =>
        v?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate());

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage) || 1;
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Statistics calculations
  const stats = {
    Users: new Set(logs.map(l => l.userId)).size,
    Logins: logs.filter(l => l.action === "Login").length,
    Logouts: logs.filter(l => l.action === "Logout").length,
    Listings: logs.filter(l => l.action === "Posted Listing").length,
    ReviewerApps: logs.filter(l => l.action === "Apply to Be Reviewer").length,
  };

  // Engagement chart data
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const engagement = days.map(date => ({
    date,
    count: logs.filter(l => 
      l.timestamp?.toDate?.().toISOString().slice(0, 10) === date
    ).length,
  }));

  // Handlers
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "reviewers", id), { 
      status: "approved",
      updatedAt: new Date(),
    });
    setReviewers(r => r.filter(x => x.id !== id));
  };

  const handleReject = async (id) => {
    await updateDoc(doc(db, "reviewers", id), {
      status: "rejected",
      updatedAt: new Date(),
    });
    setReviewers(r => r.filter(x => x.id !== id));
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/signin");
  };

  // Styling
  const sidebarBtn = isActive => ({
    padding: "0.75rem 1rem",
    backgroundColor: isActive ? "#3a5a72" : "#243447",
    color: isActive ? "#ffffff" : "#B1EDE8",
    border: "none",
    borderRadius: "0.5rem",
    textAlign: "left",
    cursor: "pointer",
  });

  const cardStyle = {
    backgroundColor: "#1b2a3b",
    borderRadius: "1rem",
    padding: "1rem",
    marginBottom: "1rem",
  };

  return (
    <div style={{ display: "flex", backgroundColor: "#0e2433", color: "#ffffff", minHeight: "100vh" }}>
      {/* Sidebar */} 
      {showSidebar && ( // ⭐ Conditional rendering
        <aside style={{
          width: "220px",
          backgroundColor: "#0f1a25",
          padding: "2rem 1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          position: "fixed",
          height: "100%"
        }}>
          <h2 style={{ color: "#64CCC5", marginBottom: "1.5rem" }}>Admin</h2>

          <button
            style={sidebarBtn(showApps)}
            onClick={() => setShowApps(true)}
          >
            Reviewer Apps
          </button>

          <button
            style={sidebarBtn(!showApps)}
            onClick={() => {
              setShowApps(false);
              setCurrentPage(1);
            }}
          >
            Platform Logs
          </button>

          <button
            onClick={handleLogout}
            style={{
              marginTop: "auto",
              padding: "0.75rem",
              backgroundColor: "#8b1c1c",
              color: "#ffffff",
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
        marginLeft: showSidebar ? "220px" : 0, // ⭐ Dynamic margin
        padding: "2rem",
        transition: "margin 0.3s"
      }}>
        {/* Hamburger Menu */}
        <div 
          style={{
            width: "30px",
            height: "30px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            marginBottom: "1.5rem"
          }}
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <div style={{ height: "3px", width: "100%", backgroundColor: "#64CCC5" }}></div>
          <div style={{ height: "3px", width: "100%", backgroundColor: "#64CCC5" }}></div>
          <div style={{ height: "3px", width: "100%", backgroundColor: "#64CCC5" }}></div>
        </div>

        {showApps ? (
          <>
            <h1 style={{ marginBottom: "1rem" }}>Reviewer Applications</h1>
            {loading ? (
              <p>Loading applications…</p>
            ) : reviewers.length === 0 ? (
              <p>No pending applications.</p>
            ) : (
              reviewers.map(r => (
                <div key={r.id} style={cardStyle}>
                  <h3 style={{ color: "#64CCC5", marginBottom: "0.5rem" }}>{r.name}</h3>
                  <p><strong>Email:</strong> {r.email}</p>
                  <p><strong>Institution:</strong> {r.institution || "N/A"}</p>
                  <p><strong>Expertise:</strong> {Array.isArray(r.expertiseTags) ? r.expertiseTags.join(", ") : "N/A"}</p>
                  <p><strong>Experience:</strong> {r.yearsExperience ?? "N/A"} years</p>
                  {r.publications?.length > 0 ? (
                    <p><strong>Publications:</strong>
                      {r.publications.map((pub, i) => (
                        <div key={i}>
                          <a href={pub} target="_blank" rel="noopener noreferrer" style={{ color: "#64CCC5" }}>
                            {pub}
                          </a>
                        </div>
                      ))}
                    </p>
                  ) : <p><strong>Publications:</strong> None</p>}
                  <a
                    href={r.cvUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      margin: "0.5rem 0",
                      padding: "0.5rem 1rem",
                      backgroundColor: "#64CCC5",
                      color: "#132238",
                      borderRadius: "0.5rem",
                      textDecoration: "none",
                    }}
                  >
                    View CV
                  </a>
                  <div>
                    <button
                      onClick={() => handleApprove(r.id)}
                      style={{ marginRight: "0.5rem", padding: "0.5rem 1rem", backgroundColor: "#64CCC5", color: "#132238", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
                    >Approve</button>
                    <button
                      onClick={() => handleReject(r.id)}
                      style={{ padding: "0.5rem 1rem", backgroundColor: "#FF6B6B", color: "#ffffff", border: "none", borderRadius: "0.5rem", cursor: "pointer" }}
                    >Reject</button>
                  </div>
                </div>
              ))
            )}
          </>
        ) : (
          <>
            <h1 style={{ marginBottom: "1rem" }}>Platform Logs</h1>

            {/* Statistics Cards */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              marginBottom: "2rem"
            }}>
              {Object.entries(stats).map(([label, value]) => (
                <div key={label} style={{
                  backgroundColor: "#1b2a3b",
                  padding: "1rem",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ color: "#B1EDE8", fontSize: "0.9rem" }}>{label}</div>
                  <div style={{ fontSize: "1.5rem", color: "#64CCC5" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Engagement Chart */}
            <div style={{
              backgroundColor: "#1b2a3b",
              borderRadius: "8px",
              padding: "1.5rem",
              marginBottom: "2rem"
            }}>
              <h3 style={{ color: "#64CCC5", marginBottom: "1rem" }}>User Engagement (Last 7 Days)</h3>
              <div style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={engagement}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#273b4e" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fill: "#B1EDE8" }}
                      axisLine={{ stroke: "#273b4e" }}
                    />
                    <YAxis 
                      allowDecimals={false}
                      tick={{ fill: "#B1EDE8" }}
                      axisLine={{ stroke: "#273b4e" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1b2a3b",
                        border: "1px solid #273b4e",
                        borderRadius: "6px",
                        color: "#ffffff"
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#64CCC5" 
                      strokeWidth={2}
                      dot={{ fill: "#64CCC5", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Search and Table */}
            <input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                padding: "0.5rem",
                marginBottom: "1rem",
                width: "300px",
                backgroundColor: "#1b2a3b",
                color: "white",
                border: "1px solid #273b4e",
                borderRadius: "4px"
              }}
            />

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#273b4e" }}>
                    {["#", "Timestamp", "Role", "User", "Action", "Details", "IP"].map(header => (
                      <th key={header} style={{ padding: "0.75rem", textAlign: "left" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.map((log, index) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid #273b4e" }}>
                      <td style={{ padding: "0.75rem" }}>
                        {(currentPage - 1) * logsPerPage + index + 1}
                      </td>
                      <td style={{ padding: "0.75rem" }}>
                        {log.timestamp?.toDate()?.toLocaleString() || "N/A"}
                      </td>
                      <td style={{ padding: "0.75rem" }}>{log.role || "N/A"}</td>
                      <td style={{ padding: "0.75rem" }}>{log.userName || "N/A"}</td>
                      <td style={{ padding: "0.75rem" }}>{log.action}</td>
                      <td style={{ padding: "0.75rem" }}>{log.details}</td>
                      <td style={{ padding: "0.75rem" }}>{log.ip || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i+1}
                  onClick={() => setCurrentPage(i+1)}
                  style={{
                    padding: "0.25rem 0.5rem",
                    backgroundColor: currentPage === i+1 ? "#64CCC5" : "#1b2a3b",
                    color: currentPage === i+1 ? "#0e2433" : "white",
                    border: "1px solid #273b4e",
                    borderRadius: "4px",
                    cursor: "pointer"
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