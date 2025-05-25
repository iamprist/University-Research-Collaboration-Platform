import React from "react";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import './ViewLogs.css';

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
    <section className="viewlogs-container">
      {/* Export logs as PDF button */}
      <button className="viewlogs-export-btn" onClick={exportLogsAsPDF}>
        Export Logs
      </button>
      {/* Search input for filtering logs */}
      <input
        type="text"
        placeholder="Search logs..."
        className="viewlogs-search-input"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Logs table */}
      <section className="viewlogs-table-container">
        <table className="viewlogs-table">
          <thead>
            <tr>
              <th className="viewlogs-th">Timestamp</th>
              <th className="viewlogs-th">User Role</th>
              <th className="viewlogs-th">User Name</th>
              <th className="viewlogs-th">Action</th>
              <th className="viewlogs-th">Target</th>
              <th className="viewlogs-th">Details</th>
              <th className="viewlogs-th">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {currentLogs.length > 0 ? (
              currentLogs.map((log) => (
                <tr key={log.id}>
                  <td className="viewlogs-td">
                    {log.timestamp?.toDate
                      ? log.timestamp.toDate().toLocaleString()
                      : "N/A"}
                  </td>
                  <td className="viewlogs-td">{log.role || "N/A"}</td>
                  <td className="viewlogs-td">{log.userName || "N/A"}</td>
                  <td className="viewlogs-td">{log.action}</td>
                  <td className="viewlogs-td">{log.target}</td>
                  <td className="viewlogs-td">{log.details}</td>
                  <td className="viewlogs-td">{log.ip || "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="viewlogs-no-results">
                  No logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Pagination controls */}
      <section className="viewlogs-pagination">
        {pageGroup > 0 && (
          <button className="viewlogs-next-btn" onClick={handlePreviousGroup}>
            Previous
          </button>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
          const pageNumber = startPage + index;
          return (
            <button
              key={pageNumber}
              className={`viewlogs-page-btn${currentPage === pageNumber ? " active" : ""}`}
              onClick={() => setCurrentPage(pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        {endPage < totalPages && (
          <button className="viewlogs-next-btn" onClick={handleNextGroup}>
            Next
          </button>
        )}
      </section>
    </section>
  );
}
