import { useRef, useState } from "react";

const LEVELS = [
  {
    pairs: [
      { color: "#ff5c5c", a: [14, 18], b: [84, 78] },
      { color: "#4d96ff", a: [84, 18], b: [16, 78] },
      { color: "#ffd93d", a: [50, 12], b: [50, 88] },
      { color: "#6bcb77", a: [12, 50], b: [88, 50] },
    ],
  },
  {
    pairs: [
      { color: "#ff5c5c", a: [12, 18], b: [86, 78] },
      { color: "#4d96ff", a: [86, 18], b: [14, 82] },
      { color: "#ffd93d", a: [48, 12], b: [50, 88] },
      { color: "#6bcb77", a: [12, 50], b: [88, 50] },
      { color: "#a66cff", a: [28, 88], b: [72, 12] },
    ],
  },
  {
    pairs: [
      { color: "#ff5c5c", a: [10, 16], b: [90, 84] },
      { color: "#4d96ff", a: [90, 16], b: [10, 84] },
      { color: "#ffd93d", a: [50, 8], b: [50, 92] },
      { color: "#6bcb77", a: [8, 50], b: [92, 50] },
      { color: "#a66cff", a: [24, 28], b: [76, 72] },
      { color: "#ff8fab", a: [76, 28], b: [24, 72] },
    ],
  },
];

const DOT_RADIUS = 6;
const LINE_WIDTH = 2.8;
const SAMPLE_DISTANCE = 1.5;
const COLLISION_DISTANCE = 4.2;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToSegmentDistance(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return distance(point, a);
  }

  let t =
    ((point.x - a.x) * dx +
      (point.y - a.y) * dy) /
    lengthSquared;

  t = Math.max(0, Math.min(1, t));

  return distance(point, {
    x: a.x + t * dx,
    y: a.y + t * dy,
  });
}

function segmentsIntersect(a, b, c, d) {
  function orientation(p, q, r) {
    const value =
      (q.y - p.y) * (r.x - q.x) -
      (q.x - p.x) * (r.y - q.y);

    if (Math.abs(value) < 0.0001) return 0;

    return value > 0 ? 1 : 2;
  }

  function onSegment(p, q, r) {
    return (
      q.x <= Math.max(p.x, r.x) + 0.001 &&
      q.x >= Math.min(p.x, r.x) - 0.001 &&
      q.y <= Math.max(p.y, r.y) + 0.001 &&
      q.y >= Math.min(p.y, r.y) - 0.001
    );
  }

  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 !== o2 && o3 !== o4) {
    return true;
  }

  if (o1 === 0 && onSegment(a, c, b)) return true;
  if (o2 === 0 && onSegment(a, d, b)) return true;
  if (o3 === 0 && onSegment(c, a, d)) return true;
  if (o4 === 0 && onSegment(c, b, d)) return true;

  return false;
}

function segmentsTooClose(a, b, c, d) {
  if (segmentsIntersect(a, b, c, d)) {
    return true;
  }

  return (
    pointToSegmentDistance(a, c, d) <
      COLLISION_DISTANCE ||
    pointToSegmentDistance(b, c, d) <
      COLLISION_DISTANCE ||
    pointToSegmentDistance(c, a, b) <
      COLLISION_DISTANCE ||
    pointToSegmentDistance(d, a, b) <
      COLLISION_DISTANCE
  );
}

function App() {
  const [level, setLevel] = useState(0);
  const [lines, setLines] = useState([]);
  const [activeLine, setActiveLine] = useState(null);
  const [message, setMessage] = useState(
    "Зажми точку и веди линию"
  );

  const boardRef = useRef(null);

  const current = LEVELS[level];

  function getPosition(event) {
    const board = boardRef.current;

    if (!board) return null;

    const rect = board.getBoundingClientRect();

    return {
      x:
        ((event.clientX - rect.left) /
          rect.width) *
        100,

      y:
        ((event.clientY - rect.top) /
          rect.height) *
        100,
    };
  }

  function findDot(point) {
    for (
      let pairIndex = 0;
      pairIndex < current.pairs.length;
      pairIndex++
    ) {
      const pair = current.pairs[pairIndex];

      const distanceA = distance(point, {
        x: pair.a[0],
        y: pair.a[1],
      });

      if (distanceA <= DOT_RADIUS) {
        return {
          pairIndex,
          side: "a",
        };
      }

      const distanceB = distance(point, {
        x: pair.b[0],
        y: pair.b[1],
      });

      if (distanceB <= DOT_RADIUS) {
        return {
          pairIndex,
          side: "b",
        };
      }
    }

    return null;
  }

  function lineHitsExistingLines(points) {
    if (points.length < 2) {
      return false;
    }

    const a = points[points.length - 2];
    const b = points[points.length - 1];

    for (const line of lines) {
      for (
        let i = 1;
        i < line.points.length;
        i++
      ) {
        const c = line.points[i - 1];
        const d = line.points[i];

        if (segmentsTooClose(a, b, c, d)) {
          return true;
        }
      }
    }

    return false;
  }

  function lineHitsOtherDots(points, pairIndex) {
    if (points.length < 2) {
      return false;
    }

    const point = points[points.length - 1];

    for (
      let index = 0;
      index < current.pairs.length;
      index++
    ) {
      if (index === pairIndex) continue;

      const pair = current.pairs[index];

      if (
        distance(point, {
          x: pair.a[0],
          y: pair.a[1],
        }) <
        DOT_RADIUS + 2
      ) {
        return true;
      }

      if (
        distance(point, {
          x: pair.b[0],
          y: pair.b[1],
        }) <
        DOT_RADIUS + 2
      ) {
        return true;
      }
    }

    return false;
  }

  function startLine(event) {
    const point = getPosition(event);

    if (!point) return;

    const dot = findDot(point);

    if (!dot) return;

    const alreadyConnected = lines.some(
      (line) => line.pairIndex === dot.pairIndex
    );

    if (alreadyConnected) return;

    event.preventDefault();

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    setActiveLine({
      pairIndex: dot.pairIndex,
      startSide: dot.side,
      points: [point],
    });

    setMessage("Веди линию к точке такого же цвета");
  }

  function moveLine(event) {
    if (!activeLine) return;

    event.preventDefault();

    const point = getPosition(event);

    if (!point) return;

    const last =
      activeLine.points[
        activeLine.points.length - 1
      ];

    if (
      distance(point, last) <
      SAMPLE_DISTANCE
    ) {
      return;
    }

    const nextPoints = [
      ...activeLine.points,
      point,
    ];

    if (
      lineHitsExistingLines(nextPoints) ||
      lineHitsOtherDots(
        nextPoints,
        activeLine.pairIndex
      )
    ) {
      setMessage(
        "Нельзя пересекать другие линии"
      );
      return;
    }

    setActiveLine({
      ...activeLine,
      points: nextPoints,
    });
  }

  function finishLine(event) {
    if (!activeLine) return;

    event.preventDefault();

    const point = getPosition(event);

    if (!point) {
      cancelLine();
      return;
    }

    const pair =
      current.pairs[activeLine.pairIndex];

    const target =
      activeLine.startSide === "a"
        ? pair.b
        : pair.a;

    const targetDistance = distance(point, {
      x: target[0],
      y: target[1],
    });

    if (targetDistance <= DOT_RADIUS) {
      const finalPoints = [
        ...activeLine.points,
        {
          x: target[0],
          y: target[1],
        },
      ];

      if (
        !lineHitsExistingLines(finalPoints)
      ) {
        setLines([
          ...lines,
          {
            pairIndex:
              activeLine.pairIndex,
            color: pair.color,
            points: finalPoints,
          },
        ]);

        setMessage(
          "Соединено. Выбери следующую пару"
        );
      } else {
        setMessage(
          "Нельзя пересекать другую линию"
        );
      }
    } else {
      setMessage(
        "Не попал в точку — попробуй ещё раз"
      );
    }

    setActiveLine(null);
  }

  function cancelLine() {
    setActiveLine(null);

    setMessage(
      "Попробуй провести линию другим маршрутом"
    );
  }

  function resetLevel() {
    setLines([]);
    setActiveLine(null);

    setMessage(
      "Зажми точку и веди линию"
    );
  }

  function nextLevel() {
    setLevel(
      (value) =>
        (value + 1) % LEVELS.length
    );

    setLines([]);
    setActiveLine(null);

    setMessage(
      "Зажми точку и веди линию"
    );
  }

  const completed =
    lines.length ===
    current.pairs.length;

  function pointsToString(points) {
    return points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="logo">
            СОЕДИНИ
          </div>

          <div className="subtitle">
            Соедини точки, не пересекая линии
          </div>
        </div>

        <div className="level">
          УРОВЕНЬ{" "}
          <strong>{level + 1}</strong>
        </div>
      </header>

      <main className="game">
        <div className="info">
          <span>
            Соединено{" "}
            <strong>
              {lines.length}
            </strong>{" "}
            / {current.pairs.length}
          </span>

          <button
            onClick={resetLevel}
          >
            Заново
          </button>
        </div>

        <div
          ref={boardRef}
          className="board"
          onPointerDown={startLine}
          onPointerMove={moveLine}
          onPointerUp={finishLine}
          onPointerCancel={cancelLine}
        >
          <svg
            className="lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {lines.map((line) => (
              <polyline
                key={line.pairIndex}
                points={pointsToString(
                  line.points
                )}
                className="connection-line"
                stroke={line.color}
              />
            ))}

            {activeLine && (
              <polyline
                points={pointsToString(
                  activeLine.points
                )}
                className="connection-line active-line"
                stroke={
                  current.pairs[
                    activeLine.pairIndex
                  ].color
                }
              />
            )}
          </svg>

          {current.pairs.map(
            (pair, pairIndex) => (
              <div
                key={pairIndex}
              >
                <span
                  className="dot"
                  style={{
                    left: `${pair.a[0]}%`,
                    top: `${pair.a[1]}%`,
                    backgroundColor:
                      pair.color,
                    "--dot-color":
                      pair.color,
                  }}
                />

                <span
                  className="dot"
                  style={{
                    left: `${pair.b[0]}%`,
                    top: `${pair.b[1]}%`,
                    backgroundColor:
                      pair.color,
                    "--dot-color":
                      pair.color,
                  }}
                />
              </div>
            )
          )}
        </div>

        {completed ? (
          <div className="success">
            <div className="success-title">
              Уровень пройден
            </div>

            <div className="success-text">
              Все пары соединены без пересечений
            </div>

            <button
              className="next"
              onClick={nextLevel}
            >
              Следующий уровень
            </button>
          </div>
        ) : (
          <div className="hint">
            {message}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
