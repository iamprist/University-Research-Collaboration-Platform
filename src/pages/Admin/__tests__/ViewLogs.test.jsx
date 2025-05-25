import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ViewLogs from "../ViewLogs";

// Mock Firestore and PDF dependencies
jest.mock("../../../config/firebaseConfig", () => ({
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));
jest.mock("jspdf", () => {
  // Provide all methods that might be called by jspdf-autotable
  return jest.fn().mockImplementation(() => ({
    text: jest.fn(),
    save: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    setTextColor: jest.fn(),
    addPage: jest.fn(),
    // Add any other methods your code or jspdf-autotable might call
  }));
});
jest.mock("jspdf-autotable", () => jest.fn());

const { getDocs } = require("firebase/firestore");

beforeEach(() => {
  jest.clearAllMocks();
  // Default mock for all tests: always return { docs: [] }
  getDocs.mockResolvedValue({ docs: [] });
});

describe("ViewLogs", () => {
  it("renders export button, search input, and logs table", async () => {
    render(<ViewLogs />);
    expect(screen.getByText(/Export Logs/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search logs/i)).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("shows 'No logs found.' when there are no logs", async () => {
    // getDocs already mocked to return { docs: [] }
    render(<ViewLogs />);
    expect(await screen.findByText(/No logs found/i)).toBeInTheDocument();
  });

  it("renders logs in the table when logs are present", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({
            timestamp: { toDate: () => new Date("2024-01-01T12:00:00Z") },
            role: "admin",
            userName: "Alice",
            action: "login",
            target: "dashboard",
            details: "Successful login",
            ip: "127.0.0.1",
          }),
        },
      ],
    });
    render(<ViewLogs />);
    await waitFor(() => screen.getByText(/Alice/i));
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
    // There may be multiple elements with "login" (e.g., "Successful login"), so check at least one matches exactly "login"
    expect(screen.getAllByText(/^login$/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/127.0.0.1/i)).toBeInTheDocument();
  });

  it("filters logs based on search input", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({
            timestamp: { toDate: () => new Date("2024-01-01T12:00:00Z") },
            role: "admin",
            userName: "Alice",
            action: "login",
            target: "dashboard",
            details: "Successful login",
            ip: "127.0.0.1",
          }),
        },
        {
          id: "2",
          data: () => ({
            timestamp: { toDate: () => new Date("2024-01-02T12:00:00Z") },
            role: "reviewer",
            userName: "Bob",
            action: "logout",
            target: "profile",
            details: "User logged out",
            ip: "192.168.1.1",
          }),
        },
      ],
    });
    render(<ViewLogs />);
    await waitFor(() => screen.getByText(/Alice/i));
    fireEvent.change(screen.getByPlaceholderText(/Search logs/i), {
      target: { value: "Bob" },
    });
    expect(screen.getByText(/Bob/i)).toBeInTheDocument();
    expect(screen.queryByText(/Alice/i)).not.toBeInTheDocument();
  });
});