import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ViewLogs from "../pages/Admin/ViewLogs";
import { getDocs } from "firebase/firestore";

// Mock Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(), // Mock getFirestore
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
}));

describe("ViewLogs Component", () => {
  const mockLogs = [
    {
      id: "1",
      timestamp: { toDate: () => new Date("2023-01-01T10:00:00Z") },
      role: "Admin",
      userName: "John Doe",
      action: "Login",
      target: "Dashboard",
      details: "User logged in",
      ip: "127.0.0.1",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    getDocs.mockResolvedValue({
      docs: mockLogs.map((log) => ({
        id: log.id,
        data: () => log,
      })),
    });
  });

  test("renders table headers correctly", async () => {
    render(<ViewLogs />);

    // Wait for logs to load
    await waitFor(() => expect(getDocs).toHaveBeenCalled());

    // Check table headers
    expect(screen.getByText("Timestamp")).toBeInTheDocument();
    expect(screen.getByText("User Role")).toBeInTheDocument();
    expect(screen.getByText("User Name")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("IP Address")).toBeInTheDocument();
  });

  test("displays logs fetched from Firestore", async () => {
    render(<ViewLogs />);

    // Wait for logs to load
    await waitFor(() => expect(getDocs).toHaveBeenCalled());

    // Check if logs are displayed
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("127.0.0.1")).toBeInTheDocument();
  });
});