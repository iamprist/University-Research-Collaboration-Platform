import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

  // Fetch all dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch logs for login/logout and engagement
        const logsCollection = collection(db, "logs");
        const logsSnapshot = await getDocs(logsCollection);
        const logs = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

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
        const logins = logs.filter((log) => log.action === "Login").length;
        const logouts = logs.filter((log) => log.action === "Logout").length;
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
          count: logs.filter(
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

  // Inline styles for dashboard layout and cards
  const styles = {
    container: {
      backgroundColor: "#1A2E40",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: "Inter, sans-serif",
      color: "#FFFFFF",
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

  // Show loading state while fetching data
  if (loading) {
    return <section style={styles.container}>Loading...</section>;
  }

  return (
    <section style={styles.container}>
      {/* Dashboard metric cards */}
      <section style={styles.dashboard}>
        <article style={styles.card}>
          <header>Total Users</header>
          <p style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalUsers}</p>
        </article>
        <article style={styles.card}>
          <header>Logins</header>
          <p style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalLogins}</p>
        </article>
        <article style={styles.card}>
          <header>Logouts</header>
          <p style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalLogouts}</p>
        </article>
        <article style={styles.card}>
          <header>Listings Posted</header>
          <p style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalListings}</p>
        </article>
        <article style={styles.card}>
          <header>Reviewer Applications</header>
          <p style={{ fontSize: "2rem", color: "#64CCC5" }}>{totalReviewerApps}</p>
        </article>
      </section>

      {/* Engagement line chart for logs per day */}
      <section style={styles.chartCard}>
        <header style={{ marginBottom: "1rem" }}>Engagement (Logs per Day)</header>
        <ResponsiveContainer width="100%" height={200}>
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
      </section>
    </section>
  );
}