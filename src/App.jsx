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

const HINT_COST = 2;
const UNDO_COST = 1;

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

    return Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
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
  const [boardFeedback, setBoardFeedback] = useState(null);
  const [lastConnectedPair, setLastConnectedPair] = useState(null);

  const [completedLevels, setCompletedLevels] = useState(() => {
    const saved = readStoredArray(
      COMPLETED_STORAGE_KEY
    );

    return saved
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= 0 &&
          value < LEVELS.length
      )
      .sort((a, b) => a - b);
  });

  const [coins, setCoins] = useState(
    readStoredCoins
  );

  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState("level");

  const [coinMessage, setCoinMessage] = useState(null);

  const [pendingAction, setPendingAction] =
    useState(null);

  const boardRef = useRef(null);
  const cellRefs = useRef({});

  const current = LEVELS[level];

  if (!current) {
    return null;
  }

  const totalPairs = current.paths.length;
  const totalCells =
    current.size * current.size;

  const usedCells = connections.reduce(
    (sum, path) => sum + path.length,
    0
  );

  const endpointToPair = new Map();

  current.paths.forEach(
    (path, pairIndex) => {
      endpointToPair.set(
        path[0],
        pairIndex
      );

      endpointToPair.set(
        path[path.length - 1],
        pairIndex
      );
    }
  );

  const completed =
    connections.length === totalPairs &&
    usedCells === totalCells;

  const progress = Math.min(
    100,
    Math.round(
      (usedCells / totalCells) * 100
    )
  );

  const currentStage =
    getStageForLevel(level);

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
    return (
      index <= getHighestUnlockedLevel()
    );
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

  function isStageCompleted(stage) {
    return (
      getStageProgress(stage) ===
      stage.to - stage.from + 1
    );
  }

  function isEndpoint(cell) {
    return endpointToPair.has(cell);
  }

  function getColor(cell) {
    const pairIndex =
      endpointToPair.get(cell);

    return COLORS[
      pairIndex % COLORS.length
    ];
  }

  function isOccupied(cell) {
    return connections.some((path) =>
      path.includes(cell)
    );
  }

  function areAdjacent(a, b) {
    const ar = Math.floor(
      a / current.size
    );
    const ac = a % current.size;

    const br = Math.floor(
      b / current.size
    );
    const bc = b % current.size;

    return (
      Math.abs(ar - br) +
        Math.abs(ac - bc) ===
      1
    );
  }

  function pointForCell(cell) {
    const board = boardRef.current;
    const element =
      cellRefs.current[cell];

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
      activePath[
        activePath.length - 1
      ];

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

  function triggerBoardFeedback(type) {
    setBoardFeedback(type);

    window.setTimeout(() => {
      setBoardFeedback(null);
    }, 360);
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
            current.paths[pairIndex]
              .length - 1
          ]
        : current.paths[pairIndex][0];

    if (
      cell === target &&
      activePath.length >= 2
    ) {
      setConnections(
        (previous) => [
          ...previous,
          activePath,
        ]
      );

      setLastConnectedPair(pairIndex);
      triggerBoardFeedback("success");

      window.setTimeout(() => {
        setLastConnectedPair(null);
      }, 260);
    } else if (activePath.length > 1) {
      triggerBoardFeedback("error");
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

  useEffect(() => {
    try {
      localStorage.setItem(
        COMPLETED_STORAGE_KEY,
        JSON.stringify(completedLevels)
      );
    } catch {
      // Прогресс останется в памяти.
    }
  }, [completedLevels]);

  useEffect(() => {
    try {
      localStorage.setItem(
        COINS_STORAGE_KEY,
        String(coins)
      );
    } catch {
      // Монеты останутся в памяти.
    }
  }, [coins]);

  function showCoinMessage(text) {
    setCoinMessage(text);

    window.setTimeout(() => {
      setCoinMessage(null);
    }, 1800);
  }

  function spendCoins(amount, action) {
    if (coins < amount) {
      showCoinMessage(
        "Недостаточно монет"
      );

      return false;
    }

    setPendingAction({
      type: action,
      cost: amount,
    });

    return true;
  }

  function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    const {
      type,
      cost,
    } = pendingAction;

    if (coins < cost) {
      setPendingAction(null);
      showCoinMessage(
        "Недостаточно монет"
      );
      return;
    }

    setCoins(
      (previous) =>
        previous - cost
    );

    setPendingAction(null);

    if (type === "hint") {
      revealHint();
    }

    if (type === "undo") {
      performUndo();
    }
  }

  function revealHint() {
    const availablePaths =
      current.paths
        .map(
          (path, pairIndex) => ({
            path,
            pairIndex,
          })
        )
        .filter(
          ({ pairIndex }) =>
            !connections.some(
              (connection) =>
                endpointToPair.get(
                  connection[0]
                ) === pairIndex
            )
        );

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

    const hasAvailableHint =
      current.paths.some(
        (path, pairIndex) => {
          const connected =
            connections.some(
              (connection) =>
                endpointToPair.get(
                  connection[0]
                ) === pairIndex
            );

          if (connected) {
            return false;
          }

          const middleCells =
            path.slice(1, -1);

          const revealed =
            hintCells.filter(
              (hint) =>
                hint.pairIndex ===
                pairIndex
            );

          return (
            revealed.length <
            middleCells.length
          );
        }
      );

    if (!hasAvailableHint) {
      showCoinMessage(
        "Больше подсказок нет"
      );

      return;
    }

    spendCoins(
      HINT_COST,
      "hint"
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

    spendCoins(
      UNDO_COST,
      "undo"
    );
  }

  function resetLevel() {
    setConnections([]);
    setActivePath(null);
    setDragging(false);
    setHintCells([]);
    setBoardFeedback(null);
    setLastConnectedPair(null);
    setShowSuccess(false);
    setSuccessType("level");
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
    setBoardFeedback(null);
    setLastConnectedPair(null);
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
      setScreen("game");
    } else {
      setScreen("levels");
    }
  }

  function completeCurrentLevel() {
    const alreadyCompleted =
      completedLevels.includes(level);

    if (!alreadyCompleted) {
      setCompletedLevels(
        (previous) => [
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

    const stage =
      getStageForLevel(level);

    const finishingStage =
      level + 1 === stage.to;

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

  function renderStageHeader(stage) {
    const stageCount =
      getStageProgress(stage);

    const stageTotal =
      stage.to - stage.from + 1;

    const stagePercent =
      Math.round(
        (stageCount /
          stageTotal) *
          100
      );

    return (
      <div
        style={{
          marginBottom: 22,
          padding: 20,
          borderRadius: 20,
          border: `1px solid ${stage.color}33`,
          background:
            "rgba(20, 23, 31, 0.85)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                color: stage.color,
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: 3,
              }}
            >
              ЭТАП
            </div>

            <div
              style={{
                marginTop: 5,
                fontSize: 25,
                fontWeight: 900,
              }}
            >
              {stage.name}
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#7c8392",
                fontSize: 13,
              }}
            >
              {stage.description}
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {stageCount} /{" "}
              {stageTotal}
            </div>

            <div
              style={{
                marginTop: 4,
                color: "#737987",
                fontSize: 11,
              }}
            >
              уровней
            </div>
          </div>
        </div>

        <div
          style={{
            height: 6,
            marginTop: 16,
            overflow: "hidden",
            borderRadius: 999,
            background: "#292e39",
          }}
        >
          <div
            style={{
              width: `${stagePercent}%`,
              height: "100%",
              borderRadius: 999,
              background:
                stage.color,
              transition:
                "width .4s ease",
            }}
          />
        </div>
      </div>
    );
  }

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
              Соединяйте одинаковые
              точки и заполните всё
              поле.
            </p>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 18,
                padding:
                  "9px 15px",
                border:
                  "1px solid #3a3f4b",
                borderRadius: 999,
                background:
                  "#151820",
                fontWeight: 900,
              }}
            >
              <span
                style={{
                  color: "#ffd34d",
                  fontSize: 17,
                }}
              >
                ●
              </span>

              <span>
                {coins}
              </span>

              <span
                style={{
                  color: "#777e8e",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                МОНЕТ
              </span>
            </div>
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
                    (completedCount /
                      LEVELS.length) *
                    100
                  }%`,
                }}
              />
            </div>
          </div>

          {STAGES.map(
            (stage) => (
              <section
                key={stage.name}
                style={{
                  marginBottom: 34,
                }}
              >
                {renderStageHeader(
                  stage
                )}

                <div className="level-grid">
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
                          ].join(
                            " "
                          )}
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
              </section>
            )
          )}

          <div className="levels-footer">
            <span>
              За каждый новый
              пройденный уровень —
              +1 монета
            </span>
          </div>
        </main>
      </div>
    );
  }

  function renderGameScreen() {
    return (
      <div className="app game-screen">
        <style>{`
          @keyframes soediniBoardShake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-6px); }
            40% { transform: translateX(5px); }
            60% { transform: translateX(-4px); }
            80% { transform: translateX(3px); }
          }

          @keyframes soediniBoardSuccess {
            0% { transform: scale(1); }
            45% { transform: scale(1.018); }
            100% { transform: scale(1); }
          }

          @keyframes soediniLineComplete {
            0% { opacity: .55; filter: drop-shadow(0 0 3px currentColor); }
            50% { opacity: 1; filter: drop-shadow(0 0 7px currentColor) drop-shadow(0 0 17px currentColor); }
            100% { opacity: .94; filter: drop-shadow(0 0 4px rgba(255,255,255,.15)) drop-shadow(0 0 8px currentColor); }
          }

          @keyframes soediniDotPulse {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -50%) scale(1.18); }
          }

          .board-error {
            animation: soediniBoardShake .36s ease;
            border-color: rgba(255, 92, 92, .32) !important;
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,.055),
              0 25px 70px rgba(0,0,0,.38),
              0 0 35px rgba(255,92,92,.14) !important;
          }

          .board-success {
            animation: soediniBoardSuccess .26s ease;
          }

          .connection-complete {
            animation: soediniLineComplete .26s ease;
          }

          .drawing-line {
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .board-success .dot {
            animation:
              dotAppear .25s cubic-bezier(.2,.8,.2,1) both,
              soediniDotPulse .26s ease .02s;
          }
        `}</style>

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
          </div>

          <div
            className="game-progress"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                color: "#ffd34d",
              }}
            >
              ●
            </span>
            {coins}
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
                {UNDO_COST}
                {" "}
                <span
                  style={{
                    color:
                      "#ffd34d",
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
                {HINT_COST}
                {" "}
                <span
                  style={{
                    color:
                      "#ffd34d",
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
            className={`board ${
              boardFeedback === "error"
                ? "board-error"
                : boardFeedback === "success"
                ? "board-success"
                : ""
            }`}
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
                      className={`connection-line ${
                        pairIndex === lastConnectedPair
                          ? "connection-complete"
                          : ""
                      }`}
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
                  className="connection-line active-line drawing-line"
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
                    ? getColor(
                        index
                      )
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
                    ref={(
                      element
                    ) => {
                      if (element) {
                        cellRefs.current[
                          index
                        ] =
                          element;
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
              boxShadow:
                "0 12px 40px rgba(0,0,0,.45)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              animation:
                "modalIn .25s ease",
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
            <div
              className="success-modal"
              style={{
                maxWidth: 390,
              }}
            >
              <div
                style={{
                  fontSize: 38,
                  color: "#ffd34d",
                  marginBottom: 10,
                }}
              >
                ●
              </div>

              <h2
                style={{
                  fontSize: 28,
                }}
              >
                Потратить{" "}
                {pendingAction.cost}{" "}
                {pendingAction.cost ===
                1
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

              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 10,
                  marginTop: 20,
                }}
              >
                <button
                  className="success-next"
                  onClick={
                    confirmPendingAction
                  }
                >
                  Потратить{" "}
                  {pendingAction.cost}{" "}
                  <span
                    style={{
                      color:
                        "#ffd34d",
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
                      "--i":
                        index,
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
                    Впереди новый
                    этап.
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
