import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import axiosClient from "../api/axiosClient";

// Mock axios client for login
vi.mock("../api/axiosClient", () => ({
  default: {
    post: vi.fn(),
  }
}));

const TestComponent = () => {
  const { user, login, logout, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading Auth...</div>;

  return (
    <div>
      <div data-testid="user">{user ? user.username : "Guest"}</div>
      <button onClick={() => login("testuser", "password")}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  test("initializes with no user", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("Guest");
    });
  });

  test("login stores tokens and updates user state", async () => {
    axiosClient.post.mockResolvedValueOnce({
      data: {
        access: "mock_access_token",
        refresh: "mock_refresh_token",
        user: { id: 1, username: "testuser", role: "admin" }
      }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = await screen.findByText("Login");
    await userEvent.click(loginBtn);

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("testuser");
    });

    expect(localStorage.getItem("access_token")).toBe("mock_access_token");
    expect(localStorage.getItem("refresh_token")).toBe("mock_refresh_token");
    expect(JSON.parse(localStorage.getItem("user"))).toEqual(
      expect.objectContaining({ username: "testuser" })
    );
  });

  test("logout clears tokens and user state", async () => {
    localStorage.setItem("access_token", "token");
    localStorage.setItem("refresh_token", "refresh");
    localStorage.setItem("user", JSON.stringify({ username: "storeduser" }));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("storeduser");
    });

    const logoutBtn = screen.getByText("Logout");
    await userEvent.click(logoutBtn);

    expect(screen.getByTestId("user")).toHaveTextContent("Guest");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
