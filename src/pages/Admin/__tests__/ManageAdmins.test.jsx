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

const { getDocs, addDoc, updateDoc } = require("firebase/firestore");

beforeEach(() => {
  jest.clearAllMocks();
  getDocs.mockResolvedValue({ docs: [] });
});

describe("ManageAdmins", () => {
  it("renders headings for both admin sections", () => {
    render(<ManageAdmins />);
    expect(screen.getByText(/Manage Admins/i)).toBeInTheDocument();
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

  it("adds a new admin with valid email", async () => {
    // First call: no existing admin, Second call: after add, still no admin
    getDocs.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({ docs: [] });
    render(<ManageAdmins />);
    fireEvent.change(screen.getByPlaceholderText(/Enter admin email/i), {
      target: { value: "newadmin@test.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Admin/i }));
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
      expect(screen.getByText(/added successfully/i)).toBeInTheDocument();
    });
  });

  it("shows 'No admins found' if no admins", async () => {
    render(<ManageAdmins />);
    expect(await screen.findByText(/No admins found/i)).toBeInTheDocument();
  });

  it("shows admins and opens revoke modal", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({ email: "admin@test.com", role: "admin" }),
        },
      ],
    }).mockResolvedValueOnce({ docs: [] }); // For revoked admins
    render(<ManageAdmins />);
    await waitFor(() => expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Revoke Admin/i }));
    expect(screen.getByLabelText(/reason for revoking/i)).toBeInTheDocument();
  });

  it("shows error if revoke reason is empty", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({ email: "admin@test.com", role: "admin" }),
        },
      ],
    }).mockResolvedValueOnce({ docs: [] });
    render(<ManageAdmins />);
    await waitFor(() => expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Revoke Admin/i }));
    fireEvent.click(screen.getByRole("button", { name: /Confirm Revoke/i }));
    const reasonErrors = await screen.findAllByText(/provide a reason/i);
    expect(reasonErrors.length).toBeGreaterThan(0);
  });

  it("revokes an admin with a reason", async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          id: "1",
          data: () => ({ email: "admin@test.com", role: "admin" }),
        },
      ],
    }).mockResolvedValueOnce({ docs: [] }); // For revoked admins
    render(<ManageAdmins />);
    await waitFor(() => expect(screen.getAllByText("admin@test.com").length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole("button", { name: /Revoke Admin/i }));
    fireEvent.change(screen.getByLabelText(/reason for revoking/i), {
      target: { value: "Violation of rules" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Confirm Revoke/i }));
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(screen.getByText(/revoked successfully/i)).toBeInTheDocument();
    });
  });

  it("shows revoked admins with reason", async () => {
    // First getDocs: admins, Second getDocs: revoked admins
    getDocs
      .mockResolvedValueOnce({ docs: [] }) // admins
      .mockResolvedValueOnce({
        docs: [
          {
            id: "2",
            data: () => ({
              email: "revoked@test.com",
              role: "revokedAdmin",
              revokeReason: "Spam",
            }),
          },
        ],
      });
    render(<ManageAdmins />);
    await waitFor(() => expect(screen.getAllByText("revoked@test.com").length).toBeGreaterThan(0));
    expect(screen.getByText(/revoke reason/i)).toBeInTheDocument();
    expect(screen.getByText(/Spam/i)).toBeInTheDocument();
  });

  it("filters revoked admins by search", async () => {
    getDocs
      .mockResolvedValueOnce({ docs: [] }) // admins
      .mockResolvedValueOnce({
        docs: [
          {
            id: "2",
            data: () => ({
              email: "revoked1@test.com",
              role: "revokedAdmin",
              revokeReason: "Spam",
            }),
          },
          {
            id: "3",
            data: () => ({
              email: "revoked2@test.com",
              role: "revokedAdmin",
              revokeReason: "Other",
            }),
          },
        ],
      });
    render(<ManageAdmins />);
    await waitFor(() => screen.findAllByText("revoked1@test.com"));
    fireEvent.change(
      screen.getAllByPlaceholderText(/search by admin name or email/i)[1],
      { target: { value: "revoked2" } }
    );
    const revoked2Matches = screen.getAllByText("revoked2@test.com");
    expect(revoked2Matches.length).toBeGreaterThan(0);
    expect(screen.queryByText("revoked1@test.com")).not.toBeInTheDocument();
  });
});