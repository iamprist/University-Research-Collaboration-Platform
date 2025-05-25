import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ManageAdmins from "../ManageAdmins";

// Mock Firebase Firestore methods
jest.mock("../../../config/firebaseConfig", () => ({
  db: {},
}));
jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  addDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  doc: jest.fn(),
  updateDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(),
  where: jest.fn(),
}));

describe("ManageAdmins", () => {
  it("renders headings for both admin sections", () => {
    render(<ManageAdmins />);
    expect(screen.getByText(/Manage Admins/i)).toBeInTheDocument();
    // Use getAllByText to avoid error when multiple elements match
    expect(screen.getAllByText(/Revoked Admins/i).length).toBeGreaterThan(0);
  });

  it("shows add admin form with input and button", () => {
    render(<ManageAdmins />);
    expect(screen.getByPlaceholderText(/Enter admin email/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add Admin/i })).toBeInTheDocument();
  });

  it("shows error for invalid email", async () => {
    render(<ManageAdmins />);
    fireEvent.change(screen.getByPlaceholderText(/Enter admin email/i), {
      target: { value: "invalidemail" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Admin/i }));
    expect(await screen.findByText(/valid email address/i)).toBeInTheDocument();
  });

  it("shows 'No admins found' if no admins", async () => {
    render(<ManageAdmins />);
    expect(await screen.findByText(/No admins found/i)).toBeInTheDocument();
  });

  it("opens revoke modal when 'Revoke Admin' is clicked", async () => {
    // Mock getDocs to return one admin
    const { getDocs } = require("firebase/firestore");
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({ email: "admin@test.com", role: "admin" }),
        },
      ],
    });
    render(<ManageAdmins />);
    // Wait for admin to appear
    await waitFor(async () => {
      const admins = await screen.findAllByText("admin@test.com");
      expect(admins.length).toBeGreaterThan(0);
    });
    fireEvent.click(screen.getByRole("button", { name: /Revoke Admin/i }));
    const revokeAdminElements = await screen.findAllByText(/Revoke Admin/i);
    expect(revokeAdminElements.length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/reason for revoking/i)).toBeInTheDocument();
  });
});