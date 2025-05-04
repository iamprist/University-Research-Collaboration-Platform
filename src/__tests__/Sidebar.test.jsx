
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "../pages/Admin/Sidebar";
import { auth } from "../config/firebaseConfig";
import axios from "axios";

// Mock Firebase and Firestore once at the top
jest.mock("../config/firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "12345", displayName: "Test User" },
    signOut: jest.fn(() => Promise.resolve()),
  },
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: "127.0.0.1" } })),
}));

describe("Sidebar Component", () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("renders sidebar with all buttons", () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    expect(screen.getByText("View Logs")).toBeInTheDocument();
    expect(screen.getByText("Manage Researchers")).toBeInTheDocument();
    expect(screen.getByText("Manage Reviewers")).toBeInTheDocument();
    expect(screen.getByText("Manage Admin")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("handles signOut error", async () => {
    auth.signOut.mockRejectedValueOnce(new Error("Logout failed"));

    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  test("logs event on logout", async () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Logging out user")
    );
  });

  test("renders correct activeTab styles", () => {
    const { rerender } = render(
      <Router>
        <Sidebar activeTab="logs" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    expect(screen.getByText("View Logs")).toHaveClass("active-tab");

    rerender(
      <Router>
        <Sidebar activeTab="reviewers" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    expect(screen.getByText("Manage Reviewers")).toHaveClass("active-tab");
  });

  test("calls signOut when Logout button is clicked", async () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    const logoutButton = screen.getByText("Logout");
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  test("fetches IP address on mount", async () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("https://api.ipify.org?format=json");
    });
  });

  test("updates activeTab on button click", () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    const logsButton = screen.getByText("View Logs");
    fireEvent.click(logsButton);

    expect(mockSetActiveTab).toHaveBeenCalledWith("logs");
  });

  test("does not render sidebar if no user is logged in", () => {
    // Temporarily change auth.currentUser to null
    auth.currentUser = null;

    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});
