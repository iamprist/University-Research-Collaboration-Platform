import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  // Fetch all logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snap = await getDocs(collection(db, "logs"));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  // Sort descending by timestamp
  const sorted = [...logs].sort(
    (a, b) => b.timestamp?.toDate?.() - a.timestamp?.toDate?.()
  );

  // Filter & paginate
  const filtered = sorted.filter(l =>
    Object.values(l).some(v =>
      v?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );
  const totalPages = Math.ceil(filtered.length / logsPerPage);
  const current = filtered.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  // Stats cards
  const stats = {
    Users: new Set(logs.map(l => l.userId)).size,
    Logins: logs.filter(l => l.action === "Login").length,
    Logouts: logs.filter(l => l.action === "Logout").length,
    Listings: logs.filter(l => l.action === "Posted Listing").length,
    ReviewerApps: logs.filter(l => l.action === "Apply to Be Reviewer").length
  };

  // Engagement last 7 days
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
    ).length
  }));

  return (
    <div style={{
      padding: "2rem",
      backgroundColor: "#0e2433",
      color: "#ffffff",
      minHeight: "100vh"
    }}>
      <h1 style={{ marginBottom: "1rem" }}>Platform Logs</h1>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        {Object.entries(stats).map(([label, value]) => (
          <div key={label} style={{
            backgroundColor: "#1b2a3b",
            padding: "1rem",
            borderRadius: "0.5rem",
            textAlign: "center",
            flex: 1
          }}>
            <div style={{ color: "#B1EDE8" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", color: "#64CCC5" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Engagement Chart */}
      <div style={{
        marginBottom: "1rem",
        backgroundColor: "#1b2a3b",
        padding: "1rem",
        borderRadius: "0.5rem"
      }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={engagement}>
            <CartesianGrid stroke="#273b4e" />
            <XAxis dataKey="date" tick={false} />
            <YAxis allowDecimals={false} tick={false} />
            <Tooltip contentStyle={{ background: "#1b2a3b", border: "none", color: "#B1EDE8" }} />
            <Line type="monotone" dataKey="count" stroke="#64CCC5" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Search */}
      <input
        placeholder="Search logs..."
        style={{
          marginBottom: "1rem",
          padding: "0.5rem",
          width: "100%",
          maxWidth: "300px",
          borderRadius: "0.5rem",
          border: "1px solid #273b4e",
          backgroundColor: "#1b2a3b",
          color: "#ffffff"
        }}
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
      />

      {/* Logs Table */}
      {!loading && (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "1rem"
        }}>
          <thead style={{ backgroundColor: "#273b4e", color: "#B1EDE8" }}>
            <tr>
              <th style={{ padding: "0.5rem" }}>#</th>
              <th style={{ padding: "0.5rem" }}>Timestamp</th>
              <th style={{ padding: "0.5rem" }}>Role</th>
              <th style={{ padding: "0.5rem" }}>User</th>
              <th style={{ padding: "0.5rem" }}>Action</th>
              <th style={{ padding: "0.5rem" }}>Target</th>
              <th style={{ padding: "0.5rem" }}>Details</th>
              <th style={{ padding: "0.5rem" }}>IP</th>
            </tr>
          </thead>
          <tbody>
            {current.length ? (
              current.map((l, i) => (
                <tr key={l.id} style={{
                  backgroundColor: "#1b2a3b",
                  borderBottom: "1px solid #273b4e"
                }}>
                  <td style={{ padding: "0.5rem" }}>
                    {(currentPage - 1) * logsPerPage + i + 1}
                  </td>
                  <td style={{ padding: "0.5rem" }}>
                    {l.timestamp?.toDate
                      ? l.timestamp.toDate().toLocaleString()
                      : "N/A"}
                  </td>
                  <td style={{ padding: "0.5rem" }}>{l.role || "N/A"}</td>
                  <td style={{ padding: "0.5rem" }}>{l.userName || "N/A"}</td>
                  <td style={{ padding: "0.5rem" }}>{l.action}</td>
                  <td style={{ padding: "0.5rem" }}>{l.target}</td>
                  <td style={{ padding: "0.5rem" }}>{l.details}</td>
                  <td style={{ padding: "0.5rem" }}>{l.ip || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: "1rem", textAlign: "center" }}>
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: currentPage === i + 1 ? "#64CCC5" : "#1b2a3b",
              border: "1px solid #273b4e",
              borderRadius: "0.5rem",
              color: currentPage === i + 1 ? "#132238" : "#ffffff"
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
