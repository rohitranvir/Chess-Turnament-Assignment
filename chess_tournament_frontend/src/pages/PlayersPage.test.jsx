import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import PlayersPage from "./PlayersPage";
import { playersAPI } from "../api";
import { AuthProvider } from "../context/AuthContext";
import { BrowserRouter } from "react-router-dom";

// Mock API
vi.mock("../api", () => ({
  playersAPI: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  }
}));

// Mock useAuth directly to control admin state
vi.mock("../context/AuthContext", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});
import { useAuth } from "../context/AuthContext";

const renderPage = () => {
  return render(
    <BrowserRouter>
      <PlayersPage />
    </BrowserRouter>
  );
};

describe("PlayersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAdmin: true });
  });

  test("renders players list", async () => {
    playersAPI.list.mockResolvedValueOnce({
      data: [
        { id: 1, name: "Magnus", email: "mag@nus.com", rating: 2882, country: "NOR" }
      ]
    });

    renderPage();

    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Magnus")).toBeInTheDocument();
      expect(screen.getByText("2882")).toBeInTheDocument();
    });
  });

  test("adds a new player", async () => {
    playersAPI.list.mockResolvedValue({ data: [] });
    playersAPI.create.mockResolvedValueOnce({ data: {} });

    renderPage();

    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });

    const addBtn = screen.getByText("+ Add Player");
    await userEvent.click(addBtn);

    expect(screen.getByRole("heading", { name: "Add Player" })).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Name/i), "Hikaru");
    await userEvent.type(screen.getByLabelText(/Email/i), "hikaru@tsm.com");
    await userEvent.clear(screen.getByLabelText(/Rating/i));
    await userEvent.type(screen.getByLabelText(/Rating/i), "2700");

    const saveBtn = screen.getByRole("button", { name: /Save Player/i });
    await userEvent.click(saveBtn);

    await waitFor(() => {
      expect(playersAPI.create).toHaveBeenCalledWith({
        name: "Hikaru",
        email: "hikaru@tsm.com",
        rating: "2700",
        country: ""
      });
    });
  });

  test("hides add button for viewers", async () => {
    useAuth.mockReturnValue({ isAdmin: false });
    playersAPI.list.mockResolvedValue({ data: [] });
    
    renderPage();

    await waitFor(() => {
      expect(screen.queryByText("+ Add Player")).not.toBeInTheDocument();
    });
  });
});
