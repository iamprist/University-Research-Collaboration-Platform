import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Component for viewing and exporting system logs
export default function ViewLogs() {
  // State for all logs fetched from Firestore
  const [logs, setLogs] = useState([]);
  // State for search input
  const [searchTerm, setSearchTerm] = useState("");
  // State for current page in pagination
  const [currentPage, setCurrentPage] = useState(1);
  // Number of logs to show per page
  const logsPerPage = 10;
  // State for grouping pages in pagination (for large log sets)
  const [pageGroup, setPageGroup] = useState(0);

  // Fetch logs from Firestore on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      const logsQuery = query(collection(db, "logs"), orderBy("timestamp", "desc"));
      const logsSnapshot = await getDocs(logsQuery);
      const logsList = logsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setLogs(logsList);
    };

    fetchLogs();
  }, []);

  // Filter logs based on search input (case-insensitive, checks all fields)
  const filteredLogs = logs.filter((log) =>
    Object.values(log).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Pagination calculations
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / logsPerPage));

  // Inline styles for layout and appearance
  const styles = {
    container: {
      backgroundColor: "#1A2E40",
      minHeight: "100vh",
      padding: "0.1rem",
      fontFamily: "Inter, sans-serif",
      color: "#FFFFFF",
    },
    input: {
      padding: "0.75rem",
      width: "100%",
      maxWidth: "300px",
      border: "1px solid #D1D5DB",
      borderRadius: "0.5rem",
      fontSize: "1rem",
      marginBottom: "1.5rem",
      display: "block",
      textAlign: "left",
    },
    tableContainer: {
      backgroundColor: "#2B3E50",
      borderRadius: "1rem",
      padding: "1.5rem",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      maxWidth: "100%",
      margin: "0 auto",
      marginTop: "2rem",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.97rem",
      minWidth: "1000px",
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
      flexWrap: "wrap",
    },
    pageButton: {
      margin: "0.5rem",
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
    nextButton: {
      margin: "0.5rem",
      padding: "0.5rem 1rem",
      border: "1px solid #D1D5DB",
      borderRadius: "0.5rem",
      backgroundColor: "#FFFFFF",
      color: "#132238",
      cursor: "pointer",
      fontSize: "1rem",
      fontWeight: "bold",
    },
    exportButton: {
      backgroundColor: "red",
      color: "white",
      padding: "0.75rem 1rem",
      border: "none",
      borderRadius: "0.5rem",
      cursor: "pointer",
      fontSize: "1rem",
      float: "right",
      marginBottom: "1rem",
      marginRight: "1rem",
    }
  };

  // Export all logs as a PDF file using jsPDF and autoTable
  const exportLogsAsPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Timestamp", "User Role", "User Name", "Action", "Target", "Details", "IP Address"];
    const tableRows = [];

    logs.forEach((log) => {
      const logData = [
        log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : "N/A",
        log.role || "N/A",
        log.userName || "N/A",
        log.action || "N/A",
        log.target || "N/A",
        log.details || "N/A",
        log.ip || "N/A",
      ];
      tableRows.push(logData);
    });

    doc.text("Logs Report", 14, 15);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("logs_report.pdf");
  };

  // Pagination group logic (for showing 10 pages at a time)
  const pagesPerGroup = 10;
  const startPage = pageGroup * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

  // Go to next group of pages
  const handleNextGroup = () => {
    if (endPage < totalPages) {
      setPageGroup(pageGroup + 1);
    }
  };

  // Go to previous group of pages
  const handlePreviousGroup = () => {
    if (pageGroup > 0) {
      setPageGroup(pageGroup - 1);
    }
  };

  return (
    <section style={styles.container}>
      {/* Export logs as PDF button */}
      <button style={styles.exportButton} onClick={exportLogsAsPDF}>
        Export Logs
      </button>
      {/* Search input for filtering logs */}
      <input
        type="text"
        placeholder="Search logs..."
        style={styles.input}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Logs table */}
      <section style={styles.tableContainer}>
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
      </section>

      {/* Pagination controls */}
      <section style={styles.pagination}>
        {pageGroup > 0 && (
          <button style={styles.nextButton} onClick={handlePreviousGroup}>
            Previous
          </button>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
          const pageNumber = startPage + index;
          return (
            <button
              key={pageNumber}
              style={{
                ...styles.pageButton,
                ...(currentPage === pageNumber ? styles.activePageButton : {}),
              }}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        {endPage < totalPages && (
          <button style={styles.nextButton} onClick={handleNextGroup}>
            Next
          </button>
        )}
      </section>
    </section>
  );
}
