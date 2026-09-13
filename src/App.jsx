import { useEffect, useRef, useState } from "react";
import "./style.css";

const COLORS = [
  "#ff5b5b",
  "#4b83ff",
  "#35c878",
  "#ff9b38",
  "#a56bff",
  "#22bfc2",
  "#e94f9b",
  "#7660e8",
];

const LEVELS = [
  {
    n: 5,
    paths: [
      [[0,0],[1,0],[1,1],[2,1],[2,2],[3,2],[4,2],[4,3],[4,4]],
      [[0,4],[0,3],[0,2],[0,1],[1,1],[2,1],[3,1],[3,0],[4,0]],
      [[2,0],[2,1],[2,2],[2,3],[2,4]],
      [[4,1],[3,1],[3,2],[3,3],[3,4]],
    ],
  },
  {
    n: 6,
    paths: [
      [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[5,2],[5,3],[5,4],[5,5]],
      [[0,5],[0,4],[0,3],[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0]],
      [[3,5],[3,4],[3,3],[2,3],[2,2],[2,1],[3,1],[4,1],[4,2],[4,3],[4,4],[4,5]],
      [[5,1],[4,1],[4,2],[4,3],[3,3],[2,3],[2,4],[1,4],[1,5],[0,5]],
    ],
  },
  {
    n: 7,
    paths: [
      [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[5,2],[6,2],[6,3],[6,4],[6,5],[6,6]],
      [[0,6],[0,5],[0,4],[1,4],[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0]],
      [[3,6],[3,5],[3,4],[2,4],[2,3],[3,3],[4,3],[4,4],[4,5],[4,6]],
      [[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,2],[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[4,3],[3,3],[3,4],[3,5],[3,6]],
    ],
  },
  {
    n: 7,
    paths: [
      [[0,0],[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4],[4,4],[5,4],[6,4],[6,5],[6,6]],
      [[0,6],[0,5],[0,4],[1,4],[1,3],[2,3],[2,2],[2,1],[2,0],[3,0],[4,0],[5,0],[6,0]],
      [[3,6],[4,6],[4,5],[4,4],[4,3],[4,2],[5,2],[6,2]],
      [[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,3],[1,3],[1,2],[2,2],[2,3],[3,3],[3,2],[4,2],[4,1],[4,0]],
    ],
  },
  {
    n: 8,
    paths: [
      [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]],
      [[0,7],[0,6],[0,5],[1,5],[1,4],[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]],
      [[3,7],[3,6],[3,5],[2,5],[2,4],[3,4],[4,4],[4,5],[4,6],[4,7]],
      [[5,7],[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,3],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[4,2],[4,1],[4,0]],
      [[6,7],[6,6],[6,5],[6,4],[6,3],[6,2],[6,1],[6,0]],
    ],
  },
  {
    n: 8,
    paths: [
      [[0,0],[1,0],[1,1],[1,2],[2,2],[3,2],[3,3],[3,4],[4,4],[5,4],[6,4],[7,4],[7,5],[7,6],[7,7]],
      [[0,7],[0,6],[0,5],[0,4],[1,4],[1,3],[2,3],[2,2],[2,1],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0]],
      [[3,7],[4,7],[4,6],[4,5],[4,4],[4,3],[5,3],[6,3],[6,2],[6,1],[6,0]],
      [[5,7],[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,2],[0,1],[1,1],[2,1],[3,1],[4,1],[4,2],[5,2],[5,3],[4,3],[3,3],[3,4],[2,4],[2,5],[2,6],[2,7]],
      [[7,2],[7,1],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7]],
    ],
  },
  {
    n: 9,
    paths: [
      [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8]],
      [[0,8],[0,7],[0,6],[1,6],[1,5],[1,4],[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]],
      [[3,8],[3,7],[3,6],[2,6],[2,5],[3,5],[4,5],[4,6],[4,7],[4,8]],
      [[5,8],[5,7],[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,3],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[4,2],[4,1],[4,0]],
      [[7,8],[7,7],[7,6],[7,5],[7,4],[7,3],[7,2],[7,1],[7,0]],
    ],
  },
  {
    n: 10,
    paths: [
      [[0,0],[1,0],[2,0],[2,1],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9]],
      [[0,9],[0,8],[0,7],[1,7],[1,6],[1,5],[1,4],[1,3],[1,2],[1,1],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0]],
      [[3,9],[3,8],[3,7],[2,7],[2,6],[3,6],[4,6],[4,7],[4,8],[4,9]],
      [[5,9],[5,8],[5,7],[5,6],[5,5],[5,4],[5,3],[5,2],[5,1],[5,0]],
      [[0,3],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[4,2],[4,1],[4,0]],
      [[8,9],[8,8],[8,7],[8,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0]],
    ],
  },
];

export default function App() {
  const canvasRef = useRef(null);
  const boardRef = useRef(null);

  const [level, setLevel] = useState(0);
  const [completed, setCompleted] = useState([]);
  const [active, setActive] = useState(null);
  const [hints, setHints] = useState(3);
  const [hintMarks, setHintMarks] = useState([]);
  const [won, setWon] = useState(false);

  const current = LEVELS[level];

  const cellSize = () =>
    boardRef.current
      ? boardRef.current.clientWidth / current.n
      : 0;

  const position = (cell) => {
    const s = cellSize();
    return {
      x: (cell[0] + 0.5) * s,
      y: (cell[1] + 0.5) * s,
    };
  };

  const sameCell = (a, b) =>
    a && b && a[0] === b[0] && a[1] === b[1];

  const getCellFromEvent = (event) => {
    const rect = boardRef.current.getBoundingClientRect();
    const s = rect.width / current.n;

    return [
      Math.floor((event.clientX - rect.left) / s),
      Math.floor((event.clientY - rect.top) / s),
    ];
  };

  const isOccupied = (cell, ignoreIndex) => {
    for (let i = 0; i < completed.length; i++) {
      if (i === ignoreIndex || !completed[i]) continue;

      if (completed[i].some((c) => sameCell(c, cell))) {
        return true;
      }
    }

    if (
      active &&
      active.index !== ignoreIndex &&
      active.cells.some((c) => sameCell(c, cell))
    ) {
      return true;
    }

    return false;
  };

  const startLine = (event) => {
    if (won) return;

    const cell = getCellFromEvent(event);

    const index = current.paths.findIndex(
      (path) =>
        sameCell(path[0], cell) ||
        sameCell(path[path.length - 1], cell)
    );

    if (index === -1) return;

    const path = current.paths[index];
    const reverse = sameCell(path[path.length - 1], cell);

    setActive({
      index,
      color: COLORS[index % COLORS.length],
      cells: [cell],
      reverse,
    });

    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveLine = (event) => {
    if (!active) return;

    const cell = getCellFromEvent(event);
    const last = active.cells[active.cells.length - 1];

    if (
      cell[0] < 0 ||
      cell[1] < 0 ||
      cell[0] >= current.n ||
      cell[1] >= current.n
    ) {
      return;
    }

    const distance =
      Math.abs(cell[0] - last[0]) +
      Math.abs(cell[1] - last[1]);

    if (distance !== 1) return;

    if (active.cells.some((c) => sameCell(c, cell))) return;

    if (isOccupied(cell, active.index)) return;

    setActive({
      ...active,
      cells: [...active.cells, cell],
    });
  };

  const endLine = () => {
    if (!active) return;

    const path = current.paths[active.index];

    const target = active.reverse
      ? path[0]
      : path[path.length - 1];

    const last = active.cells[active.cells.length - 1];

    if (!sameCell(last, target)) {
      setActive(null);
      return;
    }

    const next = [...completed];
    next[active.index] = active.cells;

    setCompleted(next);
    setActive(null);

    if (next.filter(Boolean).length === current.paths.length) {
      setWon(true);
    }
  };

  const undo = () => {
    if (active) {
      setActive(null);
      return;
    }

    const next = [...completed];

    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i]) {
        next[i] = null;
        setCompleted(next);
        setWon(false);
        return;
      }
    }
  };

  const restart = () => {
    setCompleted([]);
    setActive(null);
    setHints(3);
    setHintMarks([]);
    setWon(false);
  };

  const useHint = () => {
    if (hints <= 0 || won) return;

    const index = completed.findIndex((item) => !item);

    if (index === -1) return;

    const path = current.paths[index];

    /*
      Подсказка ставится на следующую точку
      правильного маршрута и остаётся до конца уровня.
    */
    const already = completed[index]?.length || 0;
    const pointIndex = Math.min(
      already + 1,
      path.length - 2
    );

    const point = path[pointIndex];

    const exists = hintMarks.some(
      (hint) =>
        hint.index === index &&
        sameCell(hint.point, point)
    );

    if (exists) return;

    setHintMarks([
      ...hintMarks,
      {
        index,
        point,
      },
    ]);

    setHints(hints - 1);
  };

  const nextLevel = () => {
    if (!won) return;

    setLevel((value) => (value + 1) % LEVELS.length);
    setCompleted([]);
    setActive(null);
    setHints(3);
    setHintMarks([]);
    setWon(false);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const board = boardRef.current;

    if (!canvas || !board) return;

    const dpr = window.devicePixelRatio || 1;
    const size = board.clientWidth;

    canvas.width = size * dpr;
    canvas.height = size * dpr;

    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, size, size);

    // Фон
    ctx.fillStyle = "#fafafa";
    ctx.fillRect(0, 0, size, size);

    const s = size / current.n;

    // Сетка
    ctx.strokeStyle = "#e7e7e7";
    ctx.lineWidth = 1;

    for (let i = 1; i < current.n; i++) {
      ctx.beginPath();
      ctx.moveTo(i * s, 0);
      ctx.lineTo(i * s, size);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * s);
      ctx.lineTo(size, i * s);
      ctx.stroke();
    }

    const drawLine = (cells, color) => {
      if (!cells || cells.length < 2) return;

      ctx.beginPath();

      const first = position(cells[0]);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < cells.length; i++) {
        const p = position(cells[i]);
        ctx.lineTo(p.x, p.y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(8, s * 0.18);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    };

    completed.forEach((path, index) => {
      if (path) {
        drawLine(
          path,
          COLORS[index % COLORS.length]
        );
      }
    });

    if (active) {
      drawLine(active.cells, active.color);
    }

    // Конечные точки
    current.paths.forEach((path, index) => {
      const color = COLORS[index % COLORS.length];

      [path[0], path[path.length - 1]].forEach((cell) => {
        const p = position(cell);

        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          Math.max(9, s * 0.24),
          0,
          Math.PI * 2
        );

        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
      });
    });

    // Подсказки
    hintMarks.forEach((hint) => {
      const p = position(hint.point);
      const color = COLORS[hint.index % COLORS.length];

      ctx.beginPath();
      ctx.arc(
        p.x,
        p.y,
        Math.max(4, s * 0.11),
        0,
        Math.PI * 2
      );

      ctx.fillStyle = color;
      ctx.fill();

      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [
    level,
    completed,
    active,
    hintMarks,
  ]);

  useEffect(() => {
    const handler = () => {
      // заставляет canvas перерисоваться после изменения размера
      setLevel((value) => value);
    };

    window.addEventListener("resize", handler);

    return () =>
      window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="app">
      <div className="top">
        <div>
          <div className="title">Соедини</div>
          <div className="sub">
            Уровень {level + 1} · поле {current.n}×{current.n}
          </div>
        </div>

        <div className="actions">
          <button className="small" onClick={undo}>
            ↶ Назад
          </button>

          <button className="small" onClick={restart}>
            ↻
          </button>
        </div>
      </div>

      <div className="card">
        <div
          ref={boardRef}
          className="board"
          onPointerDown={startLine}
          onPointerMove={moveLine}
          onPointerUp={endLine}
          onPointerCancel={() => setActive(null)}
        >
          <canvas ref={canvasRef} />
        </div>
      </div>

      <div className="info">
        <b>{current.paths.length} пар</b>
        <span>Подсказок: {hints}</span>
      </div>

      <div className={`msg ${won ? "win" : ""}`}>
        {won
          ? "Уровень пройден"
          : "Соедини точки одного цвета"}
      </div>

      <div className="bottom">
        <button
          className="btn hint"
          disabled={hints === 0 || won}
          onClick={useHint}
        >
          Подсказка · {hints}
        </button>

        <button
          className="btn next"
          disabled={!won}
          onClick={nextLevel}
        >
          Следующий уровень
        </button>
      </div>
    </div>
  );
}