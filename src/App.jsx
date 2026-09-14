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

const COMPLETED_STORAGE_KEY = "soedini-completed-levels";
const COINS_STORAGE_KEY = "soedini-coins";

const HINT_COST = 2;
const UNDO_COST = 1;

const STAGES = [
  {
    name: "СТАРТ",
    from: 1,
    to: 10,
    description: "Знакомство с игрой",
    color: "#6bcb77",
  },
  {
    name: "РАЗМИНКА",
    from: 11,
    to: 25,
    description: "Первые серьёзные задачи",
    color: "#4d96ff",
  },
  {
    name: "НАПРЯЖЕНИЕ",
    from: 26,
    to: 45,
    description: "Придётся подумать",
    color: "#ffd93d",
  },
  {
    name: "СЛОЖНО",
    from: 46,
    to: 70,
    description: "Для внимательных",
    color: "#ff8c42",
  },
  {
    name: "МАСТЕР",
    from: 71,
    to: 100,
    description: "Настоящий вызов",
    color: "#a66cff",
  },
];

function readStoredArray(key) {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredCoins() {
  try {
    const saved = localStorage.getItem(COINS_STORAGE_KEY);

    if (saved === null) {
      return 0;
    }

    const value = Number(saved);

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.floor(value));
  } catch {
    return 0;
  }
}

function getStageForLevel(index) {
  const levelNumber = index + 1;

  return (
    STAGES.find(
      (stage) =>
        levelNumber >= stage.from &&
        levelNumber <= stage.to
    ) || STAGES[0]
  );
}

function App() {
  const [screen, setScreen] = useState("levels");
  const [level, setLevel] = useState(0);

  const [connections, setConnections] = useState([]);
  const [activePath, setActivePath] = useState(null);
  const [dragging, setDragging] = useState(false);

  const [hintCells, setHintCells] = useState([]);

  const [completedLevels, setCompletedLevels] = useState(() => {
    return readStoredArray(COMPLETED_STORAGE_KEY)
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 0 &&
          value < LEVELS.length
      )
      .sort((a, b) => a - b);
  });

  const [coins, setCoins] = useState(readStoredCoins);

  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState("level");

  const [pendingAction, setPendingAction] = useState(null);
  const [coinMessage, setCoinMessage] = useState(null);

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

  const completed =
    connections.length === totalPairs &&
    usedCells === totalCells;

  const progress = Math.min(
    100,
    Math.round((usedCells / totalCells) * 100)
  );

  const currentStage = getStageForLevel(level);

  function getHighestUnlockedLevel() {
    let highest = 0;

    while (
      completedLevels.includes(highest) &&
      highest + 1 < LEVELS.length
    ) {
      highest += 1;
    }

    return highest;
  }

  function isLevelUnlocked(index) {
    return index <= getHighestUnlockedLevel();
  }

  function isLevelCompleted(index) {
    return completedLevels.includes(index);
  }

  function getStageProgress(stage) {
    let count = 0;

    for (
      let i = stage.from - 1;
      i <= stage.to - 1;
      i += 1
    ) {
      if (completedLevels.includes(i)) {
        count += 1;
      }
    }

    return count;
  }

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

  function handlePointerDown(event, cell) {
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

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPLETED_STORAGE_KEY,
        JSON.stringify(completedLevels)
      );
    } catch {
      // Ничего не делаем.
    }
  }, [completedLevels]);

  useEffect(() => {
    try {
      localStorage.setItem(
        COINS_STORAGE_KEY,
        String(coins)
      );
    } catch {
      // Ничего не делаем.
    }
  }, [coins]);

  function showCoinMessage(text) {
    setCoinMessage(text);

    window.setTimeout(() => {
      setCoinMessage(null);
    }, 1800);
  }

  function requestPaidAction(type, cost) {
    if (coins < cost) {
      showCoinMessage(
        "Недостаточно монет"
      );

      return;
    }

    setPendingAction({
      type,
      cost,
    });
  }

  function confirmPaidAction() {
    if (!pendingAction) {
      return;
    }

    if (coins < pendingAction.cost) {
      setPendingAction(null);

      showCoinMessage(
        "Недостаточно монет"
      );

      return;
    }

    setCoins(
      (previous) =>
        previous - pendingAction.cost
    );

    const action = pendingAction.type;

    setPendingAction(null);

    if (action === "hint") {
      revealHint();
    }

    if (action === "undo") {
      performUndo();
    }
  }

  function revealHint() {
    for (
      let pairIndex = 0;
      pairIndex < current.paths.length;
      pairIndex += 1
    ) {
      const alreadyConnected =
        connections.some(
          (connection) =>
            endpointToPair.get(
              connection[0]
            ) === pairIndex
        );

      if (alreadyConnected) {
        continue;
      }

      const path =
        current.paths[pairIndex];

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

        showCoinMessage(
          `−${HINT_COST} монеты`
        );

        return;
      }
    }

    showCoinMessage(
      "Больше подсказок нет"
    );
  }

  function addHint() {
    if (dragging) {
      return;
    }

    let available = false;

    for (
      let pairIndex = 0;
      pairIndex < current.paths.length;
      pairIndex += 1
    ) {
      const connected =
        connections.some(
          (connection) =>
            endpointToPair.get(
              connection[0]
            ) === pairIndex
        );

      if (connected) {
        continue;
      }

      const middleCells =
        current.paths[
          pairIndex
        ].slice(1, -1);

      const revealed =
        hintCells.filter(
          (hint) =>
            hint.pairIndex ===
            pairIndex
        ).length;

      if (
        revealed <
        middleCells.length
      ) {
        available = true;
        break;
      }
    }

    if (!available) {
      showCoinMessage(
        "Больше подсказок нет"
      );

      return;
    }

    requestPaidAction(
      "hint",
      HINT_COST
    );
  }

  function performUndo() {
    setConnections(
      (previous) =>
        previous.slice(0, -1)
    );

    showCoinMessage(
      `−${UNDO_COST} монета`
    );
  }

  function undoLastMove() {
    if (
      connections.length === 0 ||
      dragging
    ) {
      return;
    }

    requestPaidAction(
      "undo",
      UNDO_COST
    );
  }

  function resetLevel() {
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
    setShowSuccess(false);
    setPendingAction(null);
  }

  function openLevel(index) {
    if (!isLevelUnlocked(index)) {
      return;
    }

    setLevel(index);
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
    setShowSuccess(false);
    setSuccessType("level");
    setPendingAction(null);
    setScreen("game");
  }

  function openLevels() {
    setActivePath(null);
    setDragging(false);
    setShowSuccess(false);
    setPendingAction(null);
    setScreen("levels");
  }

  function nextLevel() {
    setShowSuccess(false);

    if (
      level + 1 <
      LEVELS.length
    ) {
      setLevel(level + 1);
      setConnections([]);
      setActivePath(null);
      setDragging(false);
      setHintCells([]);
      setSuccessType("level");
    } else {
      setScreen("levels");
    }
  }

  function completeCurrentLevel() {
    const alreadyCompleted =
      completedLevels.includes(level);

    if (!alreadyCompleted) {
      setCompletedLevels(
        (previous) =>
          [
            ...previous,
            level,
          ].sort(
            (a, b) => a - b
          )
      );

      setCoins(
        (previous) =>
          previous + 1
      );

      showCoinMessage(
        "+1 монета"
      );
    }

    const finishingStage =
      level + 1 ===
      currentStage.to;

    setSuccessType(
      finishingStage
        ? "stage"
        : "level"
    );

    setShowSuccess(true);
  }

  useEffect(() => {
    if (!completed) {
      return;
    }

    completeCurrentLevel();
  }, [completed, level]);

  function renderStage(stage) {
    const count =
      getStageProgress(stage);

    const total =
      stage.to -
      stage.from +
      1;

    const percent =
      Math.round(
        (count / total) * 100
      );

    return (
      <section
        key={stage.name}
        className="level-stage"
      >
        <div className="stage-header">
          <div className="stage-title">
            <span
              className="stage-dot"
              style={{
                color: stage.color,
                backgroundColor:
                  stage.color,
              }}
            />

            <strong>
              {stage.name}
            </strong>

            <span>
              {stage.description}
            </span>
          </div>

          <div className="stage-progress">
            {count} / {total}
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{
              width: `${percent}%`,
              background:
                stage.color,
              boxShadow:
                `0 0 16px ${stage.color}55`,
            }}
          />
        </div>

        <div
          className="level-grid"
          style={{
            marginTop: 12,
          }}
        >
          {LEVELS.slice(
            stage.from - 1,
            stage.to
          ).map(
            (_, localIndex) => {
              const index =
                stage.from -
                1 +
                localIndex;

              const unlocked =
                isLevelUnlocked(
                  index
                );

              const completed =
                isLevelCompleted(
                  index
                );

              const next =
                unlocked &&
                !completed &&
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
                    completed
                      ? "completed"
                      : "",
                    next
                      ? "next-level"
                      : "",
                  ].join(" ")}
                  onClick={() =>
                    openLevel(index)
                  }
                  disabled={
                    !unlocked
                  }
                >
                  <span className="level-number">
                    {index + 1}
                  </span>

                  {completed ? (
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
                    {completed
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
      </section>
    );
  }

  function renderLevelsScreen() {
    const completedCount =
      completedLevels.length;

    return (
      <div className="app levels-screen">
        <main className="levels-page">

          <header className="levels-header">
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
              Соединяйте одинаковые
              точки и заполните всё
              поле.
            </p>

            <div className="coin-display">
              <span className="coin-icon">
                ●
              </span>

              <span>
                {coins}
              </span>

              <span>
                МОНЕТ
              </span>
            </div>
          </header>

          <div className="levels-progress">
            <div className="progress-meta">
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
                    (completedCount /
                      LEVELS.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {STAGES.map(renderStage)}

          <div className="levels-footer">
            За каждый новый пройденный
            уровень — +1 монета
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
              {currentStage.name}
              {" · "}
              УРОВЕНЬ{" "}
              <strong>
                {level + 1}
              </strong>
            </div>

            <div className="game-progress">
              <div
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          <div className="coin-display">
            <span className="coin-icon">
              ●
            </span>

            <span>
              {coins}
            </span>
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
                ← Назад ·{" "}
                {UNDO_COST}{" "}
                <span
                  style={{
                    color: "#ffd34d",
                  }}
                >
                  ●
                </span>
              </button>

              <button
                onClick={addHint}
                disabled={dragging}
              >
                Подсказка ·{" "}
                {HINT_COST}{" "}
                <span
                  style={{
                    color: "#ffd34d",
                  }}
                >
                  ●
                </span>
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
            }).map(
              (_, index) => {
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

                const color =
                  endpoint
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
                    className={[
                      "cell",
                      endpoint
                        ? "endpoint"
                        : "",
                      connected
                        ? "connected"
                        : "",
                      active
                        ? "active"
                        : "",
                    ].join(" ")}
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
              }
            )}

          </div>

          {!showSuccess && (
            <div className="hint">
              Зажми цветную точку
              и веди по клеткам
            </div>
          )}

        </main>

        {coinMessage && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 28,
              zIndex: 300,
              transform:
                "translateX(-50%)",
              padding:
                "11px 18px",
              border:
                "1px solid #3a404c",
              borderRadius: 999,
              background:
                "#191d26",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              boxShadow:
                "0 12px 40px rgba(0,0,0,.45)",
              whiteSpace:
                "nowrap",
            }}
          >
            {coinMessage}
          </div>
        )}

        {pendingAction && (
          <div
            className="success-overlay"
            style={{
              zIndex: 250,
            }}
          >
            <div className="success-modal">

              <div
                style={{
                  fontSize: 38,
                  color: "#ffd34d",
                  marginBottom: 10,
                }}
              >
                ●
              </div>

              <h2>
                Потратить{" "}
                {pendingAction.cost}{" "}
                {pendingAction.cost === 1
                  ? "монету"
                  : "монеты"}
                ?
              </h2>

              <p>
                {pendingAction.type ===
                "hint"
                  ? "Откроется следующая клетка правильного пути."
                  : "Последняя соединённая линия будет отменена."}
              </p>

              <div className="success-actions">

                <button
                  className="success-next"
                  onClick={
                    confirmPaidAction
                  }
                >
                  Потратить{" "}
                  {pendingAction.cost}{" "}
                  <span
                    style={{
                      color: "#ffd34d",
                    }}
                  >
                    ●
                  </span>
                </button>

                <button
                  className="success-levels"
                  onClick={() =>
                    setPendingAction(
                      null
                    )
                  }
                >
                  Отмена
                </button>

              </div>

            </div>
          </div>
        )}

        {showSuccess && (
          <div className="success-overlay">

            <div className="confetti">
              {Array.from({
                length: 32,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                    style={{
                      "--i": index,
                      "--delay": `${
                        (index % 8) *
                        0.08
                      }s`,
                    }}
                  />
                )
              )}
            </div>

            <div className="success-modal">

              <div className="success-icon">
                ✓
              </div>

              {successType ===
              "stage" ? (
                <>
                  <div
                    className="success-kicker"
                    style={{
                      color:
                        currentStage.color,
                    }}
                  >
                    ЭТАП ЗАВЕРШЁН
                  </div>

                  <h2>
                    {currentStage.name}
                    <br />
                    пройден!
                  </h2>

                  <p>
                    Вы прошли уровни{" "}
                    {currentStage.from}
                    –
                    {currentStage.to}.
                    <br />
                    <strong
                      style={{
                        color:
                          "#ffd34d",
                      }}
                    >
                      +1 монета
                    </strong>
                    <br />
                    Впереди новый этап.
                  </p>
                </>
              ) : (
                <>
                  <div className="success-kicker">
                    УРОВЕНЬ{" "}
                    {level + 1}
                  </div>

                  <h2>
                    Ура!
                    <br />
                    Вы прошли
                    <br />
                    уровень!
                  </h2>

                  <p>
                    Поле заполнено.
                    Все пары
                    соединены.
                    <br />
                    <strong
                      style={{
                        color:
                          "#ffd34d",
                      }}
                    >
                      +1 монета
                    </strong>
                  </p>
                </>
              )}

              <div className="success-actions">

                {level + 1 <
                  LEVELS.length && (
                  <button
                    className="success-next"
                    onClick={
                      nextLevel
                    }
                  >
                    {successType ===
                    "stage"
                      ? "Начать новый этап"
                      : "Следующий уровень"}

                    <span>
                      →
                    </span>
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
