import { useState } from "react";

const LEVELS = [
  {
    size: 5,
    pairs: [
      [0, 6],
      [2, 12],
      [4, 18],
      [10, 20],
      [14, 24],
    ],
  },
  {
    size: 6,
    pairs: [
      [0, 7],
      [2, 9],
      [5, 17],
      [12, 25],
      [14, 20],
      [18, 23],
    ],
  },
  {
    size: 6,
    pairs: [
      [0, 14],
      [2, 9],
      [4, 22],
      [6, 28],
      [11, 25],
      [15, 33],
    ],
  },
];

const COLORS = [
  "#ff5c5c",
  "#4d96ff",
  "#ffd93d",
  "#6bcB77",
  "#a66cff",
  "#ff8fab",
];

function App() {
  const [level, setLevel] = useState(0);
  const [selected, setSelected] = useState(null);
  const [connections, setConnections] = useState([]);

  const current = LEVELS[level];
  const totalPairs = current.pairs.length;

  function isEndpoint(cell) {
    return current.pairs.some(([a, b]) => a === cell || b === cell);
  }

  function getPair(cell) {
    return current.pairs.find(([a, b]) => a === cell || b === cell);
  }

  function getColor(cell) {
    const pairIndex = current.pairs.findIndex(
      ([a, b]) => a === cell || b === cell
    );

    return COLORS[pairIndex % COLORS.length];
  }

  function handleCellClick(cell) {
    if (!isEndpoint(cell)) return;

    if (selected === null) {
      setSelected(cell);
      return;
    }

    if (selected === cell) {
      setSelected(null);
      return;
    }

    const pair = getPair(selected);

    if (pair && pair.includes(cell)) {
      const alreadyConnected = connections.some(
        (connection) =>
          connection.includes(pair[0]) && connection.includes(pair[1])
      );

      if (!alreadyConnected) {
        setConnections([...connections, pair]);
      }

      setSelected(null);
    } else {
      setSelected(cell);
    }
  }

  function resetLevel() {
    setConnections([]);
    setSelected(null);
  }

  function nextLevel() {
    if (level < LEVELS.length - 1) {
      setLevel(level + 1);
      resetLevel();
    } else {
      setLevel(0);
      resetLevel();
    }
  }

  const completed = connections.length === totalPairs;

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="logo">СОЕДИНИ</div>
          <div className="subtitle">Соедини одинаковые точки</div>
        </div>

        <div className="level">
          УРОВЕНЬ <strong>{level + 1}</strong>
        </div>
      </header>

      <main className="game">
        <div className="info">
          <span>
            Соединено: <strong>{connections.length}</strong> / {totalPairs}
          </span>

          <button onClick={resetLevel}>Заново</button>
        </div>

        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${current.size}, 1fr)`,
            gridTemplateRows: `repeat(${current.size}, 1fr)`,
          }}
        >
          {Array.from({ length: current.size * current.size }).map(
            (_, index) => {
              const endpoint = isEndpoint(index);
              const connected = connections.some((pair) =>
                pair.includes(index)
              );
              const color = endpoint ? getColor(index) : null;
              const isSelected = selected === index;

              return (
                <button
                  key={index}
                  className={`cell ${
                    endpoint ? "endpoint" : ""
                  } ${connected ? "connected" : ""} ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => handleCellClick(index)}
                  style={
                    endpoint
                      ? {
                          "--dot-color": color,
                        }
                      : undefined
                  }
                  aria-label={`Клетка ${index + 1}`}
                >
                  {endpoint && (
                    <span
                      className="dot"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </button>
              );
            }
          )}
        </div>

        {completed && (
          <div className="success">
            <div className="success-title">Уровень пройден</div>
            <div className="success-text">
              Все пары соединены
            </div>

            <button className="next" onClick={nextLevel}>
              Следующий уровень
            </button>
          </div>
        )}

        {!completed && (
          <div className="hint">
            Нажми на две одинаковые точки
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
