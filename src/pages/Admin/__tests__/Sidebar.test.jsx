import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Sidebar from "../Sidebar";

// Mock dependencies
jest.mock("react-router-dom", () => ({
  useNavigate: () => jest.fn(),
}));
jest.mock("../../../config/firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "testuid", displayName: "Test Admin" },
    signOut: jest.fn(() => Promise.resolve()),
  },
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: "127.0.0.1" } })),
}));

describe("Sidebar", () => {
  it("renders sidebar navigation buttons", () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={jest.fn()} />);
    expect(screen.getByText(/View Logs/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Researchers/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Reviewers/i)).toBeInTheDocument();
    expect(screen.getByText(/Manage Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Logout/i)).toBeInTheDocument();
  });

  it("calls setActiveTab when navigation buttons are clicked", () => {
    const setActiveTab = jest.fn();
    render(<Sidebar activeTab="dashboard" setActiveTab={setActiveTab} />);
    fireEvent.click(screen.getByText(/View Logs/i));
    expect(setActiveTab).toHaveBeenCalledWith("logs");
    fireEvent.click(screen.getByText(/Manage Researchers/i));
    expect(setActiveTab).toHaveBeenCalledWith("researchers");
    fireEvent.click(screen.getByText(/Manage Reviewers/i));
    expect(setActiveTab).toHaveBeenCalledWith("reviewers");
    fireEvent.click(screen.getByText(/Manage Admin/i));
    expect(setActiveTab).toHaveBeenCalledWith("admins");
  });

  it("toggles sidebar collapse/expand", () => {
    render(<Sidebar activeTab="dashboard" setActiveTab={jest.fn()} />);
    const toggleBtn = screen.getAllByRole("button").find(btn => btn.textContent === "☰");
    expect(screen.getByText(/View Logs/i)).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    // After collapse, navigation buttons should not be visible
    expect(screen.queryByText(/View Logs/i)).not.toBeInTheDocument();
    // Expand again
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/View Logs/i)).toBeInTheDocument();
  });

  it("calls handleLogout when logout button is clicked", async () => {
    const { auth } = require("../../../config/firebaseConfig");
    render(<Sidebar activeTab="dashboard" setActiveTab={jest.fn()} />);
    fireEvent.click(screen.getByText(/Logout/i));
    await waitFor(() => {
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  it("fetches and sets IP address on mount", async () => {
    const axios = require("axios");
    render(<Sidebar activeTab="dashboard" setActiveTab={jest.fn()} />);
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith("https://api.ipify.org?format=json");
    });
  });
});