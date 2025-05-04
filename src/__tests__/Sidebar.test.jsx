import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router-dom";
import Sidebar from "../pages/Admin/Sidebar";
import { auth } from "../config/firebaseConfig";

// Mock Firebase Auth and Firestore
jest.mock("../config/firebaseConfig", () => ({
  auth: {
    currentUser: { uid: "12345", displayName: "Test User" },
    signOut: jest.fn(() => Promise.resolve()), // Mock signOut as a resolved promise
  },
  db: {}, // Mock Firestore database object
}));

// Mock Firebase Firestore
jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  serverTimestamp: jest.fn(),
}));

// Mock Axios
jest.mock("axios", () => ({
  get: jest.fn(() => Promise.resolve({ data: { ip: "127.0.0.1" } })),
}));

describe("Sidebar Component", () => {
  const mockSetActiveTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console errors
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

    // Check if the sidebar buttons are rendered
    expect(screen.getByText("View Logs")).toBeInTheDocument();
    expect(screen.getByText("Manage Researchers")).toBeInTheDocument();
    expect(screen.getByText("Manage Reviewers")).toBeInTheDocument();
    expect(screen.getByText("Manage Admin")).toBeInTheDocument();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  test("updates activeTab on button click", () => {
    render(
      <Router>
        <Sidebar activeTab="dashboard" setActiveTab={mockSetActiveTab} />
      </Router>
    );

    const logsButton = screen.getByText("View Logs");
    fireEvent.click(logsButton);

    // Check if setActiveTab is called with the correct argument
    expect(mockSetActiveTab).toHaveBeenCalledWith("logs");
  });
});