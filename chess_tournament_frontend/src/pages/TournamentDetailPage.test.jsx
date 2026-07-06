import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import TournamentDetailPage from "./TournamentDetailPage";
import { tournamentsAPI, playersAPI, matchesAPI } from "../api";
import { BrowserRouter } from "react-router-dom";

vi.mock("../api", () => ({
  tournamentsAPI: {
    get: vi.fn(),
    players: vi.fn(),
    rankings: vi.fn(),
    addPlayer: vi.fn(),
    removePlayer: vi.fn(),
    generateMatches: vi.fn(),
    simulateRound: vi.fn(),
  },
  playersAPI: {
    list: vi.fn(),
  },
  matchesAPI: {
    list: vi.fn(),
  }
}));

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
      <TournamentDetailPage />
    </BrowserRouter>
  );
};

describe("TournamentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({ isAdmin: true });

    // Default mock returns to prevent errors
    tournamentsAPI.get.mockResolvedValue({ data: { id: 1, name: "World Cup", start_date: "2026-01-01", end_date: "2026-01-10", status: "ongoing" } });
    tournamentsAPI.players.mockResolvedValue({ data: [] });
    matchesAPI.list.mockResolvedValue({ data: [] });
    tournamentsAPI.rankings.mockResolvedValue({ data: [] });
    playersAPI.list.mockResolvedValue({ data: [] });
  });

  test("renders tournament details and rankings (including <3 players edge case)", async () => {
    tournamentsAPI.rankings.mockResolvedValueOnce({
      data: [
        { player_id: 1, player_name: "Garry", points: 2, tiebreaker_wins: 2 },
        { player_id: 2, player_name: "Anatoly", points: 1, tiebreaker_wins: 1 }
      ]
    }); // Only 2 players

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("World Cup")).toBeInTheDocument();
    });

    expect(screen.getByText("🥇 1st")).toBeInTheDocument();
    expect(screen.getByText("Garry")).toBeInTheDocument();
    expect(screen.getByText("🥈 2nd")).toBeInTheDocument();
    expect(screen.getByText("Anatoly")).toBeInTheDocument();
    expect(screen.queryByText("🥉 3rd")).not.toBeInTheDocument();
  });

  test("admin can generate matches", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Round #")).toBeInTheDocument();
    });

    const roundInput = screen.getByPlaceholderText("Round #");
    const generateBtn = screen.getByText("Generate");

    await userEvent.type(roundInput, "1");
    await userEvent.click(generateBtn);

    await waitFor(() => {
      expect(tournamentsAPI.generateMatches).toHaveBeenCalled();
    });
  });

  test("viewer cannot see write actions", async () => {
    useAuth.mockReturnValue({ isAdmin: false });
    renderPage();
    
    await waitFor(() => {
      expect(screen.getByText("World Cup")).toBeInTheDocument();
    });

    expect(screen.queryByText("Generate")).not.toBeInTheDocument();
    expect(screen.queryByText("Add")).not.toBeInTheDocument();
    expect(screen.queryByText("⚡ Simulate Round")).not.toBeInTheDocument();
    expect(screen.queryByText("Remove")).not.toBeInTheDocument();
  });
});
