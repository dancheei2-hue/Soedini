import { LEVELS } from "./levels.js";

const MAX_SOLUTIONS = 2;
const TIME_LIMIT_MS = 4000;

function getNeighbors(cell, size) {
  const row = Math.floor(cell / size);
  const col = cell % size;

  const result = [];

  if (row > 0) result.push(cell - size);
  if (row < size - 1) result.push(cell + size);
  if (col > 0) result.push(cell - 1);
  if (col < size - 1) result.push(cell + 1);

  return result;
}

function manhattan(a, b, size) {
  const ar = Math.floor(a / size);
  const ac = a % size;

  const br = Math.floor(b / size);
  const bc = b % size;

  return Math.abs(ar - br) + Math.abs(ac - bc);
}

function buildEndpointMap(paths) {
  const map = new Map();

  paths.forEach((path, pairIndex) => {
    map.set(path[0], pairIndex);
    map.set(
      path[path.length - 1],
      pairIndex
    );
  });

  return map;
}

function validateKnownSolution(level) {
  const { size, paths } = level;
  const totalCells = size * size;

  const used = new Set();

  for (let pairIndex = 0; pairIndex < paths.length; pairIndex++) {
    const path = paths[pairIndex];

    if (!Array.isArray(path) || path.length < 2) {
      return false;
    }

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];

      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= totalCells
      ) {
        return false;
      }

      if (used.has(cell)) {
        return false;
      }

      used.add(cell);

      if (i > 0) {
        if (
          !getNeighbors(
            path[i - 1],
            size
          ).includes(cell)
        ) {
          return false;
        }
      }
    }
  }

  return used.size === totalCells;
}

function getPairOrder(paths, size) {
  return paths
    .map((path, index) => ({
      index,
      start: path[0],
      end: path[path.length - 1],
      distance: manhattan(
        path[0],
        path[path.length - 1],
        size
      ),
    }))
    .sort(
      (a, b) =>
        b.distance - a.distance
    );
}

function canReach(
  start,
  target,
  size,
  occupied,
  blockedEndpoints
) {
  const queue = [start];
  const visited = new Set([start]);

  while (queue.length > 0) {
    const cell = queue.shift();

    if (cell === target) {
      return true;
    }

    for (const next of getNeighbors(
      cell,
      size
    )) {
      if (visited.has(next)) continue;

      if (
        occupied.has(next) &&
        next !== target
      ) {
        continue;
      }

      if (
        blockedEndpoints.has(next) &&
        next !== target
      ) {
        continue;
      }

      visited.add(next);
      queue.push(next);
    }
  }

  return false;
}

function getCandidatePaths(
  start,
  target,
  size,
  occupied,
  blockedEndpoints,
  deadline
) {
  const result = [];
  const visited = new Set([start]);
  const path = [start];

  const availableCells =
    size * size -
    occupied.size;

  function dfs(cell) {
    if (
      Date.now() > deadline
    ) {
      return;
    }

    if (
      result.length >= 300
    ) {
      return;
    }

    if (cell === target) {
      result.push([...path]);
      return;
    }

    const distance = manhattan(
      cell,
      target,
      size
    );

    const remaining =
      availableCells -
      path.length +
      1;

    if (distance > remaining) {
      return;
    }

    const neighbors =
      getNeighbors(cell, size);

    neighbors.sort(
      (a, b) =>
        manhattan(a, target, size) -
        manhattan(b, target, size)
    );

    for (const next of neighbors) {
      if (visited.has(next)) {
        continue;
      }

      if (
        occupied.has(next) &&
        next !== target
      ) {
        continue;
      }

      if (
        blockedEndpoints.has(next) &&
        next !== target
      ) {
        continue;
      }

      visited.add(next);
      path.push(next);

      dfs(next);

      path.pop();
      visited.delete(next);

      if (
        Date.now() > deadline ||
        result.length >= 300
      ) {
        return;
      }
    }
  }

  dfs(start);

  return result;
}

function solveLevel(level) {
  const startTime = Date.now();
  const deadline =
    startTime + TIME_LIMIT_MS;

  const { size, paths } = level;
  const totalCells = size * size;

  /*
   * Сначала проверяем записанное решение.
   *
   * Это гарантирует, что если сам LEVELS
   * содержит корректный маршрут, мы никогда
   * не получим ложное "решения нет".
   */
  const knownSolutionValid =
    validateKnownSolution(level);

  if (!knownSolutionValid) {
    return {
      status: "invalid",
      solutions: 0,
      knownSolutionValid: false,
    };
  }

  const endpointMap =
    buildEndpointMap(paths);

  const allEndpoints =
    new Set(endpointMap.keys());

  const pairOrder =
    getPairOrder(paths, size);

  let solutions = 0;
  let timedOut = false;

  /*
   * Мы уже знаем одно корректное решение —
   * то, которое записано в LEVELS.
   *
   * Поэтому задача решателя:
   * найти другое решение.
   *
   * Если второе решение найдено:
   * уровень имеет несколько решений.
   *
   * Если второе решение не найдено до
   * истечения времени:
   * мы НЕ называем уровень уникальным.
   */

  function search(
    remainingPairs,
    occupied,
    usedPaths
  ) {
    if (solutions >= MAX_SOLUTIONS) {
      return;
    }

    if (Date.now() > deadline) {
      timedOut = true;
      return;
    }

    if (
      remainingPairs.length === 0
    ) {
      if (
        occupied.size === totalCells
      ) {
        solutions += 1;
      }

      return;
    }

    let selected = null;
    let candidates = null;

    for (const pair of remainingPairs) {
      const blockedEndpoints =
        new Set(
          [...allEndpoints].filter(
            (cell) =>
              cell !== pair.start &&
              cell !== pair.end
          )
        );

      const pairCandidates =
        getCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupied,
          blockedEndpoints,
          deadline
        );

      if (
        pairCandidates.length === 0
      ) {
        return;
      }

      if (
        candidates === null ||
        pairCandidates.length <
          candidates.length
      ) {
        selected = pair;
        candidates =
          pairCandidates;
      }

      if (
        candidates.length === 1
      ) {
        break;
      }
    }

    if (
      !selected ||
      !candidates
    ) {
      return;
    }

    for (const candidate of candidates) {
      if (
        Date.now() > deadline
      ) {
        timedOut = true;
        return;
      }

      /*
       * Не допускаем пересечения.
       */
      let valid = true;

      for (const cell of candidate) {
        if (occupied.has(cell)) {
          valid = false;
          break;
        }
      }

      if (!valid) {
        continue;
      }

      const newOccupied =
        new Set(occupied);

      for (const cell of candidate) {
        newOccupied.add(cell);
      }

      /*
       * После добавления пути каждая
       * оставшаяся пара должна хотя бы
       * теоретически иметь соединение.
       */
      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !== selected.index
        );

      let possible = true;

      for (const pair of nextPairs) {
        const blockedEndpoints =
          new Set(
            [...allEndpoints].filter(
              (cell) =>
                cell !== pair.start &&
                cell !== pair.end
            )
          );

        if (
          !canReach(
            pair.start,
            pair.end,
            size,
            newOccupied,
            blockedEndpoints
          )
        ) {
          possible = false;
          break;
        }
      }

      if (!possible) {
        continue;
      }

      search(
        nextPairs,
        newOccupied,
        [
          ...usedPaths,
          candidate,
        ]
      );

      if (
        solutions >= MAX_SOLUTIONS ||
        timedOut
      ) {
        return;
      }
    }
  }

  /*
   * Сначала считаем известное решение.
   */
  solutions = 1;

  /*
   * Чтобы искать именно другое решение,
   * запрещаем использовать первый путь
   * из записанного решения для первой пары.
   *
   * Само наличие корректного решения уже
   * подтверждено validateKnownSolution().
   */

  const knownPaths =
    paths.map((path) => [...path]);

  function searchAlternative(
    remainingPairs,
    occupied,
    usedPaths
  ) {
    if (
      solutions >= MAX_SOLUTIONS
    ) {
      return;
    }

    if (Date.now() > deadline) {
      timedOut = true;
      return;
    }

    if (
      remainingPairs.length === 0
    ) {
      if (
        occupied.size === totalCells
      ) {
        solutions += 1;
      }

      return;
    }

    let selected = null;
    let candidates = null;

    for (const pair of remainingPairs) {
      const blockedEndpoints =
        new Set(
          [...allEndpoints].filter(
            (cell) =>
              cell !== pair.start &&
              cell !== pair.end
          )
        );

      let pairCandidates =
        getCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupied,
          blockedEndpoints,
          deadline
        );

      /*
       * На первом шаге специально удаляем
       * записанный маршрут этой пары.
       *
       * Поэтому найденное решение будет
       * отличаться от исходного.
       */
      if (
        remainingPairs.length ===
          paths.length &&
        pair.index === 0
      ) {
        const known =
          knownPaths[0];

        pairCandidates =
          pairCandidates.filter(
            (candidate) =>
              JSON.stringify(
                candidate
              ) !==
              JSON.stringify(known)
          );
      }

      if (
        pairCandidates.length === 0
      ) {
        continue;
      }

      if (
        candidates === null ||
        pairCandidates.length <
          candidates.length
      ) {
        selected = pair;
        candidates =
          pairCandidates;
      }
    }

    if (
      !selected ||
      !candidates
    ) {
      return;
    }

    for (const candidate of candidates) {
      if (
        Date.now() > deadline
      ) {
        timedOut = true;
        return;
      }

      let valid = true;

      for (const cell of candidate) {
        if (occupied.has(cell)) {
          valid = false;
          break;
        }
      }

      if (!valid) {
        continue;
      }

      const newOccupied =
        new Set(occupied);

      candidate.forEach((cell) =>
        newOccupied.add(cell)
      );

      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !== selected.index
        );

      let possible = true;

      for (const pair of nextPairs) {
        const blockedEndpoints =
          new Set(
            [...allEndpoints].filter(
              (cell) =>
                cell !== pair.start &&
                cell !== pair.end
            )
          );

        if (
          !canReach(
            pair.start,
            pair.end,
            size,
            newOccupied,
            blockedEndpoints
          )
        ) {
          possible = false;
          break;
        }
      }

      if (!possible) {
        continue;
      }

      searchAlternative(
        nextPairs,
        newOccupied,
        [
          ...usedPaths,
          candidate,
        ]
      );

      if (
        solutions >= MAX_SOLUTIONS ||
        timedOut
      ) {
        return;
      }
    }
  }

  searchAlternative(
    pairOrder,
    new Set(),
    []
  );

  if (solutions >= 2) {
    return {
      status: "multiple",
      solutions: 2,
      knownSolutionValid: true,
    };
  }

  if (timedOut) {
    return {
      status: "timeout",
      solutions: 1,
      knownSolutionValid: true,
    };
  }

  return {
    status: "unique",
    solutions: 1,
    knownSolutionValid: true,
  };
}

console.log("");
console.log(
  "=== ПРОВЕРКА РЕШЕНИЙ СОЕДИНИ ==="
);
console.log("");

let invalid = 0;
let multiple = 0;
let unique = 0;
let timeout = 0;

LEVELS.forEach((level, index) => {
  console.log(
    `Проверяем уровень ${index + 1}...`
  );

  const result =
    solveLevel(level);

  if (
    result.status === "invalid"
  ) {
    console.log(
      `✗ Уровень ${index + 1}: записанное решение некорректно`
    );

    invalid++;
  } else if (
    result.status === "multiple"
  ) {
    console.log(
      `⚠ Уровень ${index + 1}: найдено 2+ решения`
    );

    multiple++;
  } else if (
    result.status === "unique"
  ) {
    console.log(
      `✓ Уровень ${index + 1}: найдено только одно решение`
    );

    unique++;
  } else if (
    result.status === "timeout"
  ) {
    console.log(
      `⏱ Уровень ${index + 1}: решение существует, но проверка уникальности заняла слишком много времени`
    );

    timeout++;
  }

  console.log("");
});

console.log(
  "=== ИТОГ ==="
);

console.log(
  `Уникальных: ${unique}`
);

console.log(
  `С несколькими решениями: ${multiple}`
);

console.log(
  `Неисправных: ${invalid}`
);

console.log(
  `Не удалось проверить за лимит времени: ${timeout}`
);

if (invalid > 0) {
  process.exitCode = 1;
}