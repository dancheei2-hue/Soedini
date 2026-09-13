import { LEVELS } from "./levels.js";

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

function findPathsForPair(
  start,
  target,
  size,
  occupied,
  limit = 2000
) {
  const paths = [];

  const visited = new Set([start]);
  const path = [start];

  function dfs(cell) {
    if (paths.length >= limit) return;

    if (cell === target) {
      paths.push([...path]);
      return;
    }

    const remainingDistance =
      manhattan(cell, target, size);

    const maxUsefulLength =
      size * size -
      occupied.size +
      1;

    if (path.length + remainingDistance > maxUsefulLength) {
      return;
    }

    const neighbors = getNeighbors(
      cell,
      size
    );

    neighbors.sort(
      (a, b) =>
        manhattan(a, target, size) -
        manhattan(b, target, size)
    );

    for (const next of neighbors) {
      if (visited.has(next)) continue;

      if (
        occupied.has(next) &&
        next !== target
      ) {
        continue;
      }

      visited.add(next);
      path.push(next);

      dfs(next);

      path.pop();
      visited.delete(next);

      if (paths.length >= limit) return;
    }
  }

  dfs(start);

  return paths;
}

function solveLevel(level, maxSolutions = 2) {
  const { size, paths } = level;
  const totalCells = size * size;

  const pairs = paths.map(
    (path, index) => ({
      index,
      start: path[0],
      target:
        path[path.length - 1],
    })
  );

  let solutions = 0;
  let firstSolution = null;

  function isReachable(
    start,
    target,
    occupied
  ) {
    const queue = [start];
    const visited = new Set([start]);

    while (queue.length) {
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

        visited.add(next);
        queue.push(next);
      }
    }

    return false;
  }

  function canReachAllRemaining(
    remainingPairs,
    occupied
  ) {
    for (const pair of remainingPairs) {
      if (
        !isReachable(
          pair.start,
          pair.target,
          occupied
        )
      ) {
        return false;
      }
    }

    return true;
  }

  function search(
    remainingPairs,
    occupied,
    solution
  ) {
    if (solutions >= maxSolutions) {
      return;
    }

    if (remainingPairs.length === 0) {
      if (occupied.size === totalCells) {
        solutions += 1;

        if (!firstSolution) {
          firstSolution = solution.map(
            (path) => [...path]
          );
        }
      }

      return;
    }

    let selectedPair = null;
    let selectedCandidates = null;

    for (const pair of remainingPairs) {
      const candidates =
        findPathsForPair(
          pair.start,
          pair.target,
          size,
          occupied,
          500
        );

      if (candidates.length === 0) {
        return;
      }

      if (
        selectedCandidates === null ||
        candidates.length <
          selectedCandidates.length
      ) {
        selectedPair = pair;
        selectedCandidates =
          candidates;
      }

      if (candidates.length === 1) {
        break;
      }
    }

    for (const candidate of selectedCandidates) {
      const newOccupied =
        new Set(occupied);

      let valid = true;

      for (const cell of candidate) {
        if (
          newOccupied.has(cell) &&
          cell !== selectedPair.start &&
          cell !== selectedPair.target
        ) {
          valid = false;
          break;
        }

        newOccupied.add(cell);
      }

      if (!valid) continue;

      const nextRemaining =
        remainingPairs.filter(
          (pair) =>
            pair.index !==
            selectedPair.index
        );

      if (
        !canReachAllRemaining(
          nextRemaining,
          newOccupied
        )
      ) {
        continue;
      }

      search(
        nextRemaining,
        newOccupied,
        [
          ...solution,
          candidate,
        ]
      );

      if (solutions >= maxSolutions) {
        return;
      }
    }
  }

  search(pairs, new Set(), []);

  return {
    solutions,
    firstSolution,
  };
}

console.log("");
console.log(
  "=== ПОИСК РЕШЕНИЙ СОЕДИНИ ==="
);
console.log("");

let failed = 0;

LEVELS.forEach((level, index) => {
  console.log(
    `Проверяем уровень ${index + 1}...`
  );

  const result = solveLevel(
    level,
    2
  );

  if (result.solutions === 0) {
    console.log(
      `✗ Уровень ${index + 1}: решения не найдено`
    );
    failed += 1;
  } else if (result.solutions === 1) {
    console.log(
      `✓ Уровень ${index + 1}: найдено ровно 1 решение`
    );
  } else {
    console.log(
      `⚠ Уровень ${index + 1}: найдено 2+ решения`
    );
  }

  console.log("");
});

if (failed === 0) {
  console.log(
    "Проверка решателем завершена."
  );
} else {
  console.log(
    `Проверка завершена. Уровней без решения: ${failed}.`
  );
}