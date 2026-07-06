// API service modules — export thin wrappers around axiosClient

import axiosClient from "./axiosClient";

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data)        => axiosClient.post("/auth/register/", data),
  login:    (credentials) => axiosClient.post("/auth/login/", credentials),
  refresh:  (refresh)     => axiosClient.post("/auth/refresh/", { refresh }),
};

// ─── Players ──────────────────────────────────────────────────────────────────
export const playersAPI = {
  list:   (params) => axiosClient.get("/players/", { params }),
  get:    (id)     => axiosClient.get(`/players/${id}/`),
  create: (data)   => axiosClient.post("/players/", data),
  update: (id, data) => axiosClient.put(`/players/${id}/`, data),
  patch:  (id, data) => axiosClient.patch(`/players/${id}/`, data),
  remove: (id)     => axiosClient.delete(`/players/${id}/`),
};

// ─── Tournaments ──────────────────────────────────────────────────────────────
export const tournamentsAPI = {
  list:   (params) => axiosClient.get("/tournaments/", { params }),
  get:    (id)     => axiosClient.get(`/tournaments/${id}/`),
  create: (data)   => axiosClient.post("/tournaments/", data),
  update: (id, data) => axiosClient.put(`/tournaments/${id}/`, data),
  patch:  (id, data) => axiosClient.patch(`/tournaments/${id}/`, data),
  remove: (id)     => axiosClient.delete(`/tournaments/${id}/`),

  // Custom actions
  addPlayer:        (id, playerId)     => axiosClient.post(`/tournaments/${id}/add_player/`, { player_id: playerId }),
  removePlayer:     (id, playerId)     => axiosClient.post(`/tournaments/${id}/remove_player/`, { player_id: playerId }),
  players:          (id)               => axiosClient.get(`/tournaments/${id}/players/`),
  rankings:         (id)               => axiosClient.get(`/tournaments/${id}/rankings/`),
  generateMatches:  (id, roundNumber)  => axiosClient.post(`/tournaments/${id}/generate_matches/`, { round_number: roundNumber }),
  simulateRound:    (id, roundNumber)  => axiosClient.post(`/tournaments/${id}/simulate_round/${roundNumber}/`),
};

// ─── Matches ──────────────────────────────────────────────────────────────────
export const matchesAPI = {
  list:     (params) => axiosClient.get("/matches/", { params }),
  get:      (id)     => axiosClient.get(`/matches/${id}/`),
  simulate: (id)     => axiosClient.post(`/matches/${id}/simulate/`),
};
