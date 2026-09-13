import { useEffect, useRef, useState } from "react";
import { LEVELS } from "./levels.js";

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
            до точки, заполнив все поле
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
  (path, index) => {
    const pairIndex =
      endpointToPair.get(path[0]);

    return (
      <polyline
        key={`line-${index}`}
        points={pathPoints(path)}
        className="connection-line"
        stroke={
          COLORS[
            pairIndex % COLORS.length
          ]
        }
      />
    );
  }
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