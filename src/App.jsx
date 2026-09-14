import { useEffect, useRef, useState } from "react";
import { GENERATED_LEVELS } from "./generatedLevels.js";

const LEVELS = GENERATED_LEVELS;

const COLORS = [
  "#ff5c5c",
  "#4d96ff",
  "#ffd93d",
  "#6bcb77",
  "#a66cff",
  "#ff8fab",
];

const STORAGE_KEY = "soedini-completed-levels";

function App() {
  const [screen, setScreen] = useState("levels");
  const [level, setLevel] = useState(0);
  const [connections, setConnections] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [hintCells, setHintCells] = useState([]);
  const [completedLevels, setCompletedLevels] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        return [];
      }

      const parsed = JSON.parse(saved);

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 0 &&
          value < LEVELS.length
      );
    } catch {
      return [];
    }
  });
  const [showSuccess, setShowSuccess] = useState(false);

  const boardRef = useRef(null);
  const cellRefs = useRef({});

  const current = LEVELS[level];

  if (!current) {
    return null;
  }

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
      Math.abs(ar - br) +
        Math.abs(ac - bc) ===
      1
    );
  }

  function pointForCell(cell) {
    const board = boardRef.current;
    const element = cellRefs.current[cell];

    if (!board || !element) {
      return null;
    }

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
    if (!isEndpoint(cell)) {
      return;
    }

    if (isOccupied(cell)) {
      return;
    }

    setActivePath([cell]);
    setDragging(true);
  }

  function movePath(cell) {
    if (!dragging || !activePath) {
      return;
    }

    const last =
      activePath[activePath.length - 1];

    if (cell === last) {
      return;
    }

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

    if (!areAdjacent(last, cell)) {
      return;
    }

    if (isOccupied(cell)) {
      return;
    }

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

    if (activePath.includes(cell)) {
      return;
    }

    setActivePath([
      ...activePath,
      cell,
    ]);
  }

  function moveFromPointer(event) {
    if (!dragging) {
      return;
    }

    const element =
      document.elementFromPoint(
        event.clientX,
        event.clientY
      );

    const cellElement =
      element?.closest(".cell");

    if (!cellElement) {
      return;
    }

    const cell = Number(
      cellElement.dataset.cell
    );

    if (!Number.isNaN(cell)) {
      movePath(cell);
    }
  }

  function finishPath(cell) {
    if (!dragging || !activePath) {
      return;
    }

    const pairIndex =
      endpointToPair.get(
        activePath[0]
      );

    const target =
      current.paths[pairIndex][0] ===
      activePath[0]
        ? current.paths[pairIndex][
            current.paths[pairIndex].length -
              1
          ]
        : current.paths[pairIndex][0];

    if (
      cell === target &&
      activePath.length >= 2
    ) {
      setConnections((previous) => [
        ...previous,
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
    if (!dragging) {
      return;
    }

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
    setShowSuccess(false);
  }

  function openLevel(index) {
    if (index > getHighestUnlockedLevel()) {
      return;
    }

    setLevel(index);
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
    setShowSuccess(false);
    setScreen("game");
  }

  function openLevels() {
    setActivePath(null);
    setDragging(false);
    setShowSuccess(false);
    setScreen("levels");
  }

  function getHighestUnlockedLevel() {
    let highest = 0;

    while (
      completedLevels.includes(
        highest
      ) &&
      highest + 1 < LEVELS.length
    ) {
      highest += 1;
    }

    return highest;
  }

  function isLevelUnlocked(index) {
    return (
      index <=
      getHighestUnlockedLevel()
    );
  }

  function isLevelCompleted(index) {
    return completedLevels.includes(
      index
    );
  }

  function nextLevel() {
    setShowSuccess(false);

    if (level + 1 < LEVELS.length) {
      setLevel(level + 1);
      setConnections([]);
      setActivePath(null);
      setDragging(false);
      setHintCells([]);
      setScreen("game");
    } else {
      setScreen("levels");
    }
  }

  const completed =
    connections.length ===
      totalPairs &&
    usedCells === totalCells;

  const progress = Math.min(
    100,
    Math.round(
      (usedCells / totalCells) *
        100
    )
  );

  useEffect(() => {
    if (!completed) {
      return;
    }

    setCompletedLevels(
      (previous) => {
        if (previous.includes(level)) {
          return previous;
        }

        const next = [
          ...previous,
          level,
        ].sort((a, b) => a - b);

        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(next)
          );
        } catch {
          // Прогресс останется в памяти
        }

        return next;
      }
    );

    setShowSuccess(true);
  }, [completed, level]);

  function renderLevelsScreen() {
    const completedCount =
      completedLevels.length;

    return (
      <div className="app levels-screen">
        <main className="levels-page">
          <div className="levels-header">
            <div className="brand">
              СОЕДИНИ
            </div>

            <div className="levels-kicker">
              ЛОГИЧЕСКАЯ ИГРА
            </div>

            <h1>
              Выберите уровень
            </h1>

            <p>
              Соединяйте одинаковые точки
              и заполните всё поле.
            </p>
          </div>

          <div className="levels-progress">
            <div>
              <span>
                ПРОГРЕСС
              </span>

              <strong>
                {completedCount} /{" "}
                {LEVELS.length}
              </strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${
                    LEVELS.length
                      ? (completedCount /
                          LEVELS.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="level-grid">
            {LEVELS.map(
              (_, index) => {
                const unlocked =
                  isLevelUnlocked(
                    index
                  );

                const isCompleted =
                  isLevelCompleted(
                    index
                  );

                const isNext =
                  unlocked &&
                  !isCompleted &&
                  index ===
                    getHighestUnlockedLevel();

                return (
                  <button
                    key={index}
                    className={[
                      "level-card",
                      unlocked
                        ? "unlocked"
                        : "locked",
                      isCompleted
                        ? "completed"
                        : "",
                      isNext
                        ? "next-level"
                        : "",
                    ].join(" ")}
                    onClick={() =>
                      openLevel(
                        index
                      )
                    }
                    disabled={
                      !unlocked
                    }
                  >
                    <span className="level-number">
                      {index + 1}
                    </span>

                    {isCompleted ? (
                      <span className="level-status completed-status">
                        ✓
                      </span>
                    ) : unlocked ? (
                      <span className="level-status play-status">
                        →
                      </span>
                    ) : (
                      <span className="level-status lock-status">
                        ●
                      </span>
                    )}

                    <span className="level-label">
                      {isCompleted
                        ? "Пройден"
                        : unlocked
                        ? "Играть"
                        : "Закрыт"}
                    </span>
                  </button>
                );
              }
            )}
          </div>

          <div className="levels-footer">
            <span>
              Новый уровень
              открывается после
              прохождения предыдущего
            </span>
          </div>
        </main>
      </div>
    );
  }

  function renderGameScreen() {
    return (
      <div className="app game-screen">
        <header className="game-header">
          <button
            className="back-button"
            onClick={openLevels}
          >
            ← Уровни
          </button>

          <div className="game-title">
            <div className="game-logo">
              СОЕДИНИ
            </div>

            <div className="game-level">
              УРОВЕНЬ{" "}
              <strong>
                {level + 1}
              </strong>
            </div>
          </div>

          <div className="game-progress">
            {progress}%
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
                onClick={
                  undoLastMove
                }
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
                    endpointToPair.get(
                      path[0]
                    );

                  return (
                    <polyline
                      key={`line-${index}`}
                      points={pathPoints(
                        path
                      )}
                      className="connection-line"
                      stroke={
                        COLORS[
                          pairIndex %
                            COLORS.length
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
                    path.includes(
                      index
                    )
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
                    item.cell ===
                    index
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

          {!showSuccess && (
            <div className="hint">
              Зажми цветную точку и
              веди по клеткам
            </div>
          )}
        </main>

        {showSuccess && (
          <div className="success-overlay">
            <div className="confetti">
              {Array.from({
                length: 28,
              }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    "--i": index,
                    "--delay": `${
                      (index % 7) *
                      0.08
                    }s`,
                  }}
                />
              ))}
            </div>

            <div className="success-modal">
              <div className="success-icon">
                ✓
              </div>

              <div className="success-kicker">
                УРОВЕНЬ {level + 1}
              </div>

              <h2>
                Ура!
                <br />
                Вы прошли уровень!
              </h2>

              <p>
                Поле заполнено.
                Все пары соединены.
              </p>

              <div className="success-actions">
                {level + 1 <
                  LEVELS.length && (
                  <button
                    className="success-next"
                    onClick={
                      nextLevel
                    }
                  >
                    Следующий уровень
                    <span>→</span>
                  </button>
                )}

                <button
                  className="success-levels"
                  onClick={
                    openLevels
                  }
                >
                  Все уровни
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (screen === "levels") {
    return renderLevelsScreen();
  }

  return renderGameScreen();
}

export default App;
