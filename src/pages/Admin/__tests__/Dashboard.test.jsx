import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { act } from "react";
import Dashboard from "../Dashboard";
import * as firestore from "firebase/firestore";

// Mock Firebase Firestore methods
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getFirestore: jest.fn(),
}));

// Mock data for Firestore collections
const mockLogs = [
  { id: "1", action: "Login", timestamp: { toDate: () => new Date() } },
  { id: "2", action: "Logout", timestamp: { toDate: () => new Date() } },
  { id: "3", action: "Login", timestamp: { toDate: () => new Date() } },
];
const mockReviewers = [
  { id: "1", status: "in_progress" },
  { id: "2", status: "approved" },
];
const mockUsers = [
  { id: "1", email: "user1@example.com" },
  { id: "2", email: "user2@example.com" },
];
const mockListings = [{ id: "1" }, { id: "2" }, { id: "3" }];

// Helper to mock getDocs for different collections
function mockGetDocs(collectionRef) {
  if (collectionRef === "logs") {
    return { docs: mockLogs.map((doc) => ({ id: doc.id, data: () => doc })) };
  }
  if (collectionRef === "reviewers") {
    return { docs: mockReviewers.map((doc) => ({ id: doc.id, data: () => doc })) };
  }
  if (collectionRef === "users") {
    return { docs: mockUsers.map((doc) => ({ id: doc.id, data: () => doc })) };
  }
  if (collectionRef === "research-listings") {
    return { size: mockListings.length, docs: mockListings.map((doc) => ({ id: doc.id, data: () => doc })) };
  }
  return { docs: [] };
}

describe("Dashboard", () => {
  beforeEach(() => {
    // Mock collection to return the collection name for identification
    firestore.collection.mockImplementation((_, name) => name);

    // Mock getDocs to return mock data based on collection name
    firestore.getDocs.mockImplementation(async (collectionRef) => mockGetDocs(collectionRef));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<Dashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders dashboard metrics after data loads", async () => {
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
    // Now assert metrics
    expect(screen.getByText(/total users/i)).toBeInTheDocument();
    expect(screen.getByText(/logins/i)).toBeInTheDocument();
    expect(screen.getByText(/logouts/i)).toBeInTheDocument();
    expect(screen.getByText(/listings posted/i)).toBeInTheDocument();
    expect(screen.getByText(/reviewer applications/i)).toBeInTheDocument();

    // Use within to scope to the correct card for each metric
    expect(
      within(screen.getByText(/total users/i).closest("article")).getByText("2")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText(/logins/i).closest("article")).getByText("2")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText(/logouts/i).closest("article")).getByText("1")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText(/listings posted/i).closest("article")).getByText("3")
    ).toBeInTheDocument();
    expect(
      within(screen.getByText(/reviewer applications/i).closest("article")).getByText("1")
    ).toBeInTheDocument();
  });

  it("renders engagement chart", async () => {
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText(/engagement \(logs per day\)/i)).toBeInTheDocument();
    });
  });

  // Test for line 89: "No logs found" message
  it('shows "No logs found" if logs are empty', async () => {
    // Override logs to be empty
    firestore.getDocs.mockImplementation(async (collectionRef) => {
      if (collectionRef === "logs") {
        return { docs: [] };
      }
      return mockGetDocs(collectionRef);
    });
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(screen.getByText(/no logs found/i)).toBeInTheDocument();
    });
  });

  // Test for lines 140-141: "No reviewer applications found" message
  it('shows 0 in "Reviewer Applications" if no in_progress reviewers', async () => {
    // Override reviewers to have no in_progress status
    firestore.getDocs.mockImplementation(async (collectionRef) => {
      if (collectionRef === "reviewers") {
        return { docs: [{ id: "2", data: () => ({ status: "approved" }) }] };
      }
      return mockGetDocs(collectionRef);
    });
    await act(async () => {
      render(<Dashboard />);
    });
    await waitFor(() => {
      expect(
        within(screen.getByText(/reviewer applications/i).closest("article")).getByText("0")
      ).toBeInTheDocument();
    });
  });
});