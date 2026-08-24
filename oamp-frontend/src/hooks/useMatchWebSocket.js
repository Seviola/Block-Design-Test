import { useState, useEffect, useRef, useCallback } from "react";

function getWsUrl(roomId) {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
  const host = base.replace(/\/api\/v1$/, "").replace(/^http/, "ws");
  return `${host}/ws/match/${roomId}?role=spectator`;
}

const INITIAL_PLAYERS = {
  P1: { game_score: 0, blocks_hit: 0, status: "waiting", player_name: "" },
  P2: { game_score: 0, blocks_hit: 0, status: "waiting", player_name: "" },
};

const PLAYER_MAP = { P1: "P1", P2: "P2" };

export function useMatchWebSocket(roomId) {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [connectionStatus, setConnectionStatus] = useState("connecting");
  const [lastEvent, setLastEvent] = useState(null);
  const [matchStatus, setMatchStatus] = useState("waiting");
  const [winner, setWinner] = useState(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const timeoutRef = useRef(null);

  const scheduleReconnect = useRef(() => {});

  const connect = useCallback(() => {
    if (!roomId) return;

    const url = getWsUrl(roomId);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("connected");
      retryRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastEvent(msg);

        if (msg.type === "match_start") {
          setMatchStatus("playing");
          setStartTime(Date.now());
          return;
        }

        if (msg.type === "match_result") {
          setMatchStatus("finished");
          setWinner(msg.winner || null);
          if (msg.p1_score !== undefined) setP1Score(msg.p1_score);
          if (msg.p2_score !== undefined) setP2Score(msg.p2_score);
          return;
        }

        if (msg.type === "room_update") {
          setMatchStatus((prev) => {
            if (msg.status === "playing") return "playing";
            if (msg.status === "finished") return "finished";
            return prev;
          });
          if (msg.player1_name) {
            setPlayers((prev) => ({
              ...prev,
              P1: { ...prev.P1, player_name: msg.player1_name, status: msg.status === "playing" ? "playing" : "waiting" },
            }));
          }
          if (msg.player2_name) {
            setPlayers((prev) => ({
              ...prev,
              P2: { ...prev.P2, player_name: msg.player2_name, status: msg.status === "playing" ? "playing" : prev.P2.status },
            }));
          }
          return;
        }

        if (msg.type === "GAME_OVER") {
          setMatchStatus("finished");
          if (msg.player_id && PLAYER_MAP[msg.player_id]) {
            setPlayers((prev) => ({
              ...prev,
              [msg.player_id]: {
                ...prev[msg.player_id],
                game_score: msg.game_score ?? prev[msg.player_id].game_score,
                blocks_hit: msg.blocks_hit ?? prev[msg.player_id].blocks_hit,
                status: "finished",
              },
            }));
          }
          return;
        }

        if (msg.type === "join" && msg.player_id) {
          setPlayers((prev) => ({
            ...prev,
            [msg.player_id]: {
              ...prev[msg.player_id],
              status: "playing",
              player_name: msg.player_name || prev[msg.player_id].player_name,
            },
          }));
          return;
        }

        if (msg.type === "score_update" && msg.player_id) {
          setPlayers((prev) => ({
            ...prev,
            [msg.player_id]: {
              ...prev[msg.player_id],
              game_score: msg.game_score ?? prev[msg.player_id].game_score,
              blocks_hit: msg.blocks_hit ?? prev[msg.player_id].blocks_hit,
            },
          }));
          return;
        }

        if (msg.type === "leave" && msg.player_id) {
          setPlayers((prev) => ({
            ...prev,
            [msg.player_id]: {
              ...prev[msg.player_id],
              status: "left",
            },
          }));
          return;
        }

        if (msg.player_id && PLAYER_MAP[msg.player_id]) {
          setPlayers((prev) => ({
            ...prev,
            [msg.player_id]: {
              ...prev[msg.player_id],
              game_score: msg.game_score ?? prev[msg.player_id].game_score,
              blocks_hit: msg.blocks_hit ?? prev[msg.player_id].blocks_hit,
              status: msg.status ?? prev[msg.player_id].status,
            },
          }));
        }
      } catch {
        // ignore non-JSON
      }
    };

    ws.onclose = () => {
      setConnectionStatus("disconnected");
      scheduleReconnect.current?.();
    };

    ws.onerror = () => {
      setConnectionStatus("disconnected");
    };
  }, [roomId]);

  useEffect(() => {
    scheduleReconnect.current = () => {
      const delay = Math.min(2000 * 2 ** retryRef.current, 16000);
      retryRef.current += 1;
      timeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    };
  });

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      clearTimeout(timeoutRef.current);
    };
  }, [connect]);

  return { players, connectionStatus, lastEvent, matchStatus, winner, p1Score, p2Score, startTime };
}