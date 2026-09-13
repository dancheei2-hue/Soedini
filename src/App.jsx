import { useEffect, useRef, useState } from "react";

const LEVELS = [
  {
    size: 5,
    paths: [
      [18, 13, 8, 7, 6, 11, 16],
      [1, 2, 3, 4, 9, 14],
      [19, 24, 23, 22, 17, 12],
      [21, 20, 15, 10, 5, 0],
    ],
  },

  {
    size: 6,
    paths: [
      [30, 24, 25, 26, 20, 14, 13, 19],
      [17, 23, 22, 16, 15, 21, 27],
      [4, 5, 11, 10, 9, 8, 7],
      [18, 12, 6, 0, 1, 2, 3],
      [28, 29, 35, 34, 33, 32, 31],
    ],
  },

  {
    size: 7,
    paths: [
      [27, 26, 25, 18, 11, 12, 19, 20, 13],
      [44, 37, 30, 29, 36, 43, 42, 35, 28],
      [6, 5, 4, 3, 10, 9, 16, 15, 8],
      [17, 24, 31, 32, 33, 34, 41, 40, 39],
      [23, 22, 21, 14, 7, 0, 1, 2],
      [48, 47, 46, 45, 38],
    ],
  },

  {
    size: 5,
    paths: [
      [0, 1, 2, 3, 4, 9, 8],
      [7, 6, 5, 10, 11, 12],
      [13, 14, 19, 18, 17, 16],
      [15, 20, 21, 22, 23, 24],
    ],
  },

  {
    size: 6,
    paths: [
      [0, 1, 7, 13, 12, 6],
      [2, 3, 4, 10, 16, 22, 28, 34],
      [5, 11, 17, 23, 29, 35],
      [8, 9, 15, 14, 20, 26, 32],
      [18, 19, 25, 24, 30, 31, 33, 27, 21],
    ],
  },

  {
    size: 7,
    paths: [
      [0, 1, 8, 15, 14, 7],
      [2, 3, 4, 11, 18, 25, 32, 39, 46],
      [5, 6, 13, 20, 27, 34, 41, 48],
      [9, 10, 17, 16, 23, 30, 37, 44],
      [12, 19, 26, 33, 40, 47],
      [21, 22, 29, 28, 35, 36, 43, 42],
    ],
  },

  {
    size: 8,
    paths: [
      [0, 1, 9, 17, 16, 8],
      [2, 3, 4, 12, 20, 28, 36, 44, 52, 60],
      [5, 6, 7, 15, 23, 31, 39, 47, 55, 63],
      [10, 11, 19, 18, 26, 34, 42, 50, 58],
      [13, 14, 22, 30, 29, 37, 45, 53, 61],
      [21, 27, 35, 43, 51, 59],
      [24, 25, 33, 32, 40, 48, 56],
      [41, 49, 57],
    ],
  },

  {
    size: 8,
    paths: [
      [0, 8, 16, 17, 9, 1],
      [2, 3, 11, 19, 27, 35, 43, 51, 59],
      [4, 5, 6, 14, 22, 30, 38, 46, 54, 62],
      [7, 15, 23, 31, 39, 47, 55, 63],
      [10, 18, 26, 25, 33, 41, 49, 57],
      [12, 13, 21, 29, 28, 36, 44, 52, 60],
      [20, 24, 32, 40, 48, 56],
      [34, 42, 50, 58, 61, 53, 45, 37],
    ],
  },

  {
    size: 9,
    paths: [
      [0, 1, 10, 19, 18, 9],
      [2, 3, 4, 13, 22, 31, 40, 49, 58, 67, 76],
      [5, 6, 7, 8, 17, 26, 35, 44, 53, 62, 71, 80],
      [11, 12, 21, 30, 29, 38, 47, 56, 65, 74],
      [14, 15, 24, 33, 42, 51, 60, 69, 78],
      [16, 25, 34, 43, 52, 61, 70, 79],
      [20, 23, 32, 41, 50, 59, 68, 77],
      [27, 28, 37, 36, 45, 54, 63, 72],
    ],
  },

  {
    size: 9,
    paths: [
      [0, 9, 18, 19, 10, 1],
      [2, 3, 4, 13, 22, 31, 40, 49, 58, 67, 76],
      [5, 6, 15, 24, 33, 42, 51, 60, 69, 78],
      [7, 8, 17, 26, 35, 44, 53, 62, 71, 80],
      [11, 12, 21, 30, 39, 48, 57, 66, 75],
      [14, 23, 32, 41, 50, 59, 68, 77],
      [16, 25, 34, 43, 52, 61, 70, 79],
      [20, 29, 28, 37, 46, 55, 64, 73, 72],
    ],
  },
];

const COLORS = [
  "#ff5c5c",
  "#4d96ff",
  "#ffd93d",
  "#6bcb77",
  "#a66cff",
  "#ff8fab",
];

function App() {
  const [level, setLevel] = useState(0);
  const [connections, setConnections] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [hintCells, setHintCells] = useState([]);
  const [showLevels, setShowLevels] = useState(false);

  const boardRef = useRef(null);
  const cellRefs = useRef({});

  const current = LEVELS[level];
  const totalPairs = current.paths.length;
  const totalCells = current.size * current.size;

  const usedCells = connections.reduce(
    (sum, path) => sum + path.length,
    0
  );

  const endpointToPair = new Map();

  current.paths.forEach((path, pairIndex) => {
    endpointToPair.set(path[0], pairIndex);
    endpointToPair.set(
      path[path.length - 1],
      pairIndex
    );
  });

  function isEndpoint(cell) {
    return endpointToPair.has(cell);
  }

  function getColor(cell) {
    const pairIndex = endpointToPair.get(cell);
    return COLORS[pairIndex % COLORS.length];
  }

  function isOccupied(cell) {
    return connections.some((path) =>
      path.includes(cell)
    );
  }

  function areAdjacent(a, b) {
    const ar = Math.floor(a / current.size);
    const ac = a % current.size;

    const br = Math.floor(b / current.size);
    const bc = b % current.size;

    return (
      Math.abs(ar - br) + Math.abs(ac - bc) === 1
    );
  }

  function pointForCell(cell) {
    const board = boardRef.current;
    const element = cellRefs.current[cell];

    if (!board || !element) return null;

    const boardRect =
      board.getBoundingClientRect();

    const cellRect =
      element.getBoundingClientRect();

    return {
      x:
        ((cellRect.left +
          cellRect.width / 2 -
          boardRect.left) /
          boardRect.width) *
        100,

      y:
        ((cellRect.top +
          cellRect.height / 2 -
          boardRect.top) /
          boardRect.height) *
        100,
    };
  }

  function pathPoints(path) {
    return path
      .map(pointForCell)
      .filter(Boolean)
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");
  }

  function startPath(cell) {
    if (!isEndpoint(cell)) return;

    if (isOccupied(cell)) return;

    setActivePath([cell]);
    setDragging(true);
  }

  function movePath(cell) {
    if (!dragging || !activePath) return;

    const last =
      activePath[activePath.length - 1];

    if (cell === last) return;

    // Движение назад.
    if (
      activePath.length > 1 &&
      cell ===
        activePath[
          activePath.length - 2
        ]
    ) {
      setActivePath(
        activePath.slice(0, -1)
      );
      return;
    }

    // Только соседняя клетка.
    if (!areAdjacent(last, cell))
      return;

    // Нельзя проходить через занятую клетку.
    if (isOccupied(cell)) return;

    // Нельзя заходить в чужую точку.
    if (isEndpoint(cell)) {
      const pairIndex =
        endpointToPair.get(
          activePath[0]
        );

      if (
        endpointToPair.get(cell) !==
        pairIndex
      ) {
        return;
      }
    }

    // Нельзя замыкать линию на себя.
    if (activePath.includes(cell))
      return;

    setActivePath([
      ...activePath,
      cell,
    ]);
  }

  function moveFromPointer(event) {
    if (!dragging) return;

    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY
      );

    const cellElement =
      element?.closest(".cell");

    if (!cellElement) return;

    const cell = Number(
      cellElement.dataset.cell
    );

    if (!Number.isNaN(cell)) {
      movePath(cell);
    }
  }

  function finishPath(cell) {
    if (!dragging || !activePath)
      return;

    const pairIndex =
      endpointToPair.get(
        activePath[0]
      );

    const target =
      current.paths[pairIndex][0] ===
      activePath[0]
        ? current.paths[pairIndex][
            current.paths[pairIndex]
              .length - 1
          ]
        : current.paths[pairIndex][0];

    if (
      cell === target &&
      activePath.length >= 2
    ) {
      setConnections([
        ...connections,
        activePath,
      ]);
    }

    setActivePath(null);
    setDragging(false);
  }

  function handlePointerDown(
    event,
    cell
  ) {
    event.preventDefault();

    event.currentTarget.setPointerCapture?.(
      event.pointerId
    );

    startPath(cell);
  }

  function handlePointerMove(event) {
    if (!dragging) return;

    event.preventDefault();
    moveFromPointer(event);
  }

  function handlePointerUp(event) {
    event.preventDefault();

    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY
      );

    const cellElement =
      element?.closest(".cell");

    if (cellElement) {
      const cell = Number(
        cellElement.dataset.cell
      );

      if (!Number.isNaN(cell)) {
        finishPath(cell);
        return;
      }
    }

    setActivePath(null);
    setDragging(false);
  }

  useEffect(() => {
    function handleWindowPointerUp() {
      if (dragging) {
        setActivePath(null);
        setDragging(false);
      }
    }

    window.addEventListener(
      "pointerup",
      handleWindowPointerUp
    );

    return () => {
      window.removeEventListener(
        "pointerup",
        handleWindowPointerUp
      );
    };
  }, [dragging]);

  function undoLastMove() {
    if (
      connections.length === 0 ||
      dragging
    ) {
      return;
    }

    setConnections((previous) =>
      previous.slice(0, -1)
    );
  }

  function addHint() {
    const availablePaths =
      current.paths
        .map((path, pairIndex) => ({
          path,
          pairIndex,
        }))
        .filter(({ pairIndex }) => {
          return !connections.some(
            (connection) =>
              endpointToPair.get(
                connection[0]
              ) === pairIndex
          );
        });

    for (const {
      path,
      pairIndex,
    } of availablePaths) {
      const middleCells =
        path.slice(1, -1);

      const revealedCells =
        hintCells
          .filter(
            (hint) =>
              hint.pairIndex ===
              pairIndex
          )
          .map(
            (hint) => hint.cell
          );

      const nextCell =
        middleCells.find(
          (cell) =>
            !revealedCells.includes(
              cell
            )
        );

      if (
        nextCell !== undefined
      ) {
        setHintCells(
          (previous) => [
            ...previous,
            {
              cell: nextCell,
              pairIndex,
            },
          ]
        );

        return;
      }
    }
  }

  function resetLevel() {
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
  }

  function selectLevel(index) {
    setLevel(index);
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
    setShowLevels(false);
  }

  function nextLevel() {
    setLevel(
      (previous) =>
        (previous + 1) %
        LEVELS.length
    );

    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
  }

  const completed =
    connections.length ===
      totalPairs &&
    usedCells === totalCells;

  const progress = Math.round(
    (usedCells / totalCells) *
      100
  );

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="logo">
            СОЕДИНИ
          </div>

          <div className="subtitle">
            Проведи каждую линию от точки
            до точки
          </div>
        </div>

        <div className="level-selector">
          <button
            className="level-current"
            onClick={() =>
              setShowLevels(
                (previous) =>
                  !previous
              )
            }
          >
            УРОВЕНЬ{" "}
            <strong>
              {level + 1}
            </strong>

            <span className="level-arrow">
              {showLevels
                ? "▲"
                : "▼"}
            </span>
          </button>

          {showLevels && (
            <div className="levels-menu">
              {LEVELS.map(
                (_, index) => {
                  const isCurrent =
                    index === level;

                  return (
                    <button
                      key={index}
                      className={
                        isCurrent
                          ? "level-option current"
                          : "level-option"
                      }
                      onClick={() =>
                        selectLevel(
                          index
                        )
                      }
                    >
                      <span>
                        Уровень{" "}
                        {index + 1}
                      </span>

                      {isCurrent && (
                        <span className="check">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </header>

      <main className="game">
        <div className="info">
          <div className="stats">
            <span>
              Линии{" "}
              <strong>
                {connections.length}
              </strong>
              /{totalPairs}
            </span>

            <span>
              Поле{" "}
              <strong>
                {progress}%
              </strong>
            </span>
          </div>

          <div className="controls">
            <button
              onClick={undoLastMove}
              disabled={
                connections.length ===
                  0 ||
                dragging
              }
            >
              ← Назад
            </button>

            <button
              onClick={addHint}
              disabled={dragging}
            >
              Подсказка
            </button>

            <button
              onClick={resetLevel}
            >
              Заново
            </button>
          </div>
        </div>

        <div
          ref={boardRef}
          className="board"
          style={{
            gridTemplateColumns:
              `repeat(${current.size}, 1fr)`,
            gridTemplateRows:
              `repeat(${current.size}, 1fr)`,
          }}
          onPointerMove={
            handlePointerMove
          }
        >
          <svg
            className="lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {connections.map(
              (path, index) => (
                <polyline
                  key={`line-${index}`}
                  points={pathPoints(
                    path
                  )}
                  className="connection-line"
                  stroke={
                    COLORS[
                      index %
                        COLORS.length
                    ]
                  }
                />
              )
            )}

            {activePath && (
              <polyline
                points={pathPoints(
                  activePath
                )}
                className="connection-line active-line"
                stroke={getColor(
                  activePath[0]
                )}
              />
            )}
          </svg>

          {Array.from({
            length: totalCells,
          }).map((_, index) => {
            const endpoint =
              isEndpoint(index);

            const connected =
              connections.some(
                (path) =>
                  path.includes(index)
              );

            const active =
              activePath?.includes(
                index
              );

            const color = endpoint
              ? getColor(index)
              : null;

            const hint =
              hintCells.find(
                (item) =>
                  item.cell === index
              );

            return (
              <button
                key={index}
                ref={(element) => {
                  if (element) {
                    cellRefs.current[
                      index
                    ] = element;
                  }
                }}
                data-cell={index}
                className={`cell ${
                  endpoint
                    ? "endpoint"
                    : ""
                } ${
                  connected
                    ? "connected"
                    : ""
                } ${
                  active
                    ? "active"
                    : ""
                }`}
                onPointerDown={(
                  event
                ) =>
                  handlePointerDown(
                    event,
                    index
                  )
                }
                onPointerUp={
                  handlePointerUp
                }
                style={
                  endpoint
                    ? {
                        "--dot-color":
                          color,
                      }
                    : undefined
                }
                aria-label={`Клетка ${
                  index + 1
                }`}
              >
                {endpoint && (
                  <span
                    className="dot"
                    style={{
                      backgroundColor:
                        color,
                    }}
                  />
                )}

                {hint && (
                  <span
                    className="hint-dot"
                    style={{
                      backgroundColor:
                        COLORS[
                          hint.pairIndex %
                            COLORS.length
                        ],
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {completed && (
          <div className="success">
            <div className="success-title">
              Уровень пройден
            </div>

            <div className="success-text">
              Поле заполнено. Все пары
              соединены.
            </div>

            <button
              className="next"
              onClick={nextLevel}
            >
              Следующий уровень
            </button>
          </div>
        )}

        {!completed && (
          <div className="hint">
            Зажми цветную точку и веди
            по клеткам
          </div>
        )}
      </main>
    </div>
  );
}

export default App;