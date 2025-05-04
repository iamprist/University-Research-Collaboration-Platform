import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Dashboard from "../pages/Admin/Dashboard";
import { getDocs, collection } from "firebase/firestore";

// Mock Firestore
jest.mock("firebase/firestore", () => ({
  getFirestore: jest.fn(), // Mock getFirestore
  getDocs: jest.fn(),
  collection: jest.fn(),
}));

describe("Dashboard Component", () => {
  const mockLogs = [
    {
      id: "1",
      userId: "user1",
      action: "Login",
      timestamp: { toDate: () => new Date("2023-01-01T10:00:00Z") },
    },
    {
      id: "2",
      userId: "user2",
      action: "Logout",
      timestamp: { toDate: () => new Date("2023-01-01T12:00:00Z") },
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

  test("renders loading state initially", () => {
    render(<Dashboard />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});