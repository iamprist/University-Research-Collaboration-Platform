import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


const styles = {
  container: {
    backgroundColor: "#1A2E40",
    minHeight: "100vh",
    padding: "2rem",
    fontFamily: "Inter, sans-serif",
    color: "#FFFFFF",
    transition: "background 0.3s",
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
    boxShadow: "0 4px 24px 0 rgba(50, 80, 120, 0.15)",
    color: "#B1EDE8",
    fontWeight: "600",
    fontSize: "1.2rem",
    transition: "transform 0.18s, box-shadow 0.18s",
    cursor: "default",
    animation: "fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
    margin: "0.5rem 0",
  },
  cardHover: {
    transform: "translateY(-6px) scale(1.03)",
    boxShadow: "0 8px 32px 0 rgba(100, 200, 200, 0.18)",
  },
  cardHeader: {
    fontSize: "1.05rem",
    fontWeight: "700",
    color: "#64CCC5",
    marginBottom: "0.4rem",
    letterSpacing: "0.5px",
  },
  cardValue: {
    fontSize: "2.2rem",
    color: "#fff",
    margin: 0,
    letterSpacing: "1px",
    fontWeight: "bold",
  },
  chartCard: {
    background: "#2B3E50",
    borderRadius: "1rem",
    padding: "1.5rem",
    minWidth: "350px",
    flex: 1,
    boxShadow: "0 4px 24px 0 rgba(50, 80, 120, 0.12)",
    color: "#B1EDE8",
    fontWeight: "600",
    fontSize: "1.1rem",
    marginBottom: "2rem",
    maxWidth: "600px",
    height: "320px",
    animation: "fadeInUp 0.7s cubic-bezier(0.23, 1, 0.32, 1)",
  },
  chartHeader: {
    marginBottom: "1rem",
    fontSize: "1.15rem",
    color: "#64CCC5",
    fontWeight: "700",
    letterSpacing: "0.5px",
  },
};

// Add this to the top of your file or in a <style> tag in your component
const fadeInKeyframes = `
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 700px) {
  .dashboard-responsive {
    flex-direction: column !important;
    gap: 1rem !important;
  }
}
`;

function useHover() {
  const [hovered, setHovered] = React.useState(false);
  const onMouseEnter = () => setHovered(true);
  const onMouseLeave = () => setHovered(false);
  return [hovered, { onMouseEnter, onMouseLeave }];
}

// Dashboard component for admin analytics and stats
export default function Dashboard() {
  // State variables for dashboard metrics
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalLogins, setTotalLogins] = useState(0);
  const [totalLogouts, setTotalLogouts] = useState(0);
  const [totalListings, setTotalListings] = useState(0);
  const [totalReviewerApps, setTotalReviewerApps] = useState(0);
  const [engagementData, setEngagementData] = useState([]); // Data for engagement chart
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]); // <-- Add this line

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch logs for login/logout and engagement
        const logsCollection = collection(db, "logs");
        const logsSnapshot = await getDocs(logsCollection);
        const logsData = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData); // <-- Set logs state here

        // Fetch reviewer applications
        const reviewersCollection = collection(db, "reviewers");
        const reviewersSnapshot = await getDocs(reviewersCollection);
        const reviewers = reviewersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch all users
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const users = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch research listings
        const listingsCollection = collection(db, "research-listings");
        const listingsSnapshot = await getDocs(listingsCollection);

        // Calculate unique users by email
        const uniqueUsers = new Set(users.map((user) => user.email)).size;
        // Count login and logout actions
        const logins = logsData.filter((log) => log.action === "Login").length;
        const logouts = logsData.filter((log) => log.action === "Logout").length;
        // Count total listings
        const listings = listingsSnapshot.size;
        // Count reviewer applications in progress
        const reviewerApps = reviewers.filter((reviewer) => reviewer.status === "in_progress").length;

        // Update state with calculated metrics
        setTotalUsers(uniqueUsers);
        setTotalLogins(logins);
        setTotalLogouts(logouts);
        setTotalListings(listings);
        setTotalReviewerApps(reviewerApps);

        // Prepare last 7 days for engagement chart
        const days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().slice(0, 10);
        });

        // Aggregate logs per day for engagement chart
        const engagement = days.map((date) => ({
          date,
          count: logsData.filter(
            (log) =>
              log.timestamp &&
              log.timestamp.toDate &&
              log.timestamp.toDate().toISOString().slice(0, 10) === date
          ).length,
        }));

        setEngagementData(engagement);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Inject keyframes for fade-in animation and responsive
  React.useEffect(() => {
    if (!document.getElementById("dashboard-fadein-keyframes")) {
      const style = document.createElement("style");
      style.id = "dashboard-fadein-keyframes";
      style.innerHTML = fadeInKeyframes;
      document.head.appendChild(style);
    }
  }, []);

  // Show loading state while fetching data
  if (loading) {
    return <section style={styles.container}>Loading...</section>;
  }

  // Responsive class for dashboard section
  const dashboardSectionProps = {
    style: styles.dashboard,
    className: "dashboard-responsive",
  };

  // Helper to render cards with hover effect
  function Card({ header, value }) {
    const [hovered, hoverProps] = useHover();
    return (
      <article
        style={{
          ...styles.card,
          ...(hovered ? styles.cardHover : {}),
        }}
        {...hoverProps}
      >
        <div style={styles.cardHeader}>{header}</div>
        <p style={styles.cardValue}>{value}</p>
      </article>
    );
  }

  return (
    <section style={styles.container}>
      <section {...dashboardSectionProps}>
        <Card header="Total Users" value={totalUsers} />
        <Card header="Logins" value={totalLogins} />
        <Card header="Logouts" value={totalLogouts} />
        <Card header="Listings Posted" value={totalListings} />
        <Card header="Reviewer Applications" value={totalReviewerApps} />
      </section>

      {/* Engagement line chart for logs per day */}
      <section style={styles.chartCard}>
        <header style={styles.chartHeader}>Engagement (Logs per Day)</header>
        {logs && logs.length === 0 && (
          <div style={{ textAlign: "center", marginTop: "1rem", color: "#b1ede8" }}>
            No logs found
          </div>
        )}
        {logs && logs.length > 0 && (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#364E68" />
              <XAxis dataKey="date" stroke="#B1EDE8" fontSize={12} />
              <YAxis allowDecimals={false} stroke="#B1EDE8" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#2B3E50", border: "none", color: "#B1EDE8" }}
                labelStyle={{ color: "#64CCC5" }}
                formatter={(value) => [value, "Logs"]}
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
        )}
      </section>
    </section>
  );
}