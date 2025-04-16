// src/__tests__/SignInPage.test.js
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import SignInPage from "../pages/SignInPage";

jest.mock("firebase/auth", () => ({
  signInWithPopup: jest.fn(() =>
    Promise.resolve({
      user: {
        uid: "123",
        displayName: "Nono",
        email: "2562270@students.wits.ac.za",
      },
    })
  ),
}));

jest.mock("firebase/firestore", () => ({
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock("../firebaseConfig", () => ({
  auth: {},
  provider: {},
  db: {},
}));

describe("SignInPage", () => {
  test("renders login buttons", () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );

    expect(screen.getByText("Login As:")).toBeInTheDocument();
    expect(screen.getByText("Researcher")).toBeInTheDocument();
    expect(screen.getByText("Reviewer")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  test("clicking a button triggers Google sign-in and saves user", async () => {
    render(
      <BrowserRouter>
        <SignInPage />
      </BrowserRouter>
    );

    const adminButton = screen.getByText("Admin");
    fireEvent.click(adminButton);
  });
});
