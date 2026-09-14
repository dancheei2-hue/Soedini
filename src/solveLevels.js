import { GENERATED_LEVELS } from "./generatedLevels.js";

const MAX_SOLUTIONS = 2;
const TIME_LIMIT_MS = 12000;
const MAX_CANDIDATE_PATHS = 1000;

function getNeighbors(cell, size) {
  const row = Math.floor(cell / size);
  const col = cell % size;

  const result = [];

  if (row > 0) {
    result.push(cell - size);
  }

  if (row < size - 1) {
    result.push(cell + size);
  }

  if (col > 0) {
    result.push(cell - 1);
  }

  if (col < size - 1) {
    result.push(cell + 1);
  }

  return result;
}

function manhattan(a, b, size) {
  const ar = Math.floor(a / size);
  const ac = a % size;

  const br = Math.floor(b / size);
  const bc = b % size;

  return (
    Math.abs(ar - br) +
    Math.abs(ac - bc)
  );
}

function validateKnownSolution(level) {
  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  if (
    !Number.isInteger(size) ||
    size < 2
  ) {
    return false;
  }

  if (
    !Array.isArray(paths) ||
    paths.length < 2
  ) {
    return false;
  }

  const used =
    new Set();

  for (
    const path of paths
  ) {
    if (
      !Array.isArray(path) ||
      path.length < 2
    ) {
      return false;
    }

    for (
      let i = 0;
      i < path.length;
      i++
    ) {
      const cell =
        path[i];

      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= totalCells
      ) {
        return false;
      }

      if (
        used.has(cell)
      ) {
        return false;
      }

      if (i > 0) {
        const previous =
          path[i - 1];

        if (
          !getNeighbors(
            previous,
            size
          ).includes(cell)
        ) {
          return false;
        }
      }

      used.add(cell);
    }
  }

  return (
    used.size ===
    totalCells
  );
}

function pathToMask(path) {
  let mask = 0n;

  for (
    const cell of path
  ) {
    mask |=
      1n << BigInt(cell);
  }

  return mask;
}

function getEndpointBlockMask(
  paths,
  allowedPairIndex
) {
  let mask = 0n;

  for (
    let i = 0;
    i < paths.length;
    i++
  ) {
    if (
      i === allowedPairIndex
    ) {
      continue;
    }

    mask |=
      1n << BigInt(
        paths[i][0]
      );

    mask |=
      1n << BigInt(
        paths[i][
          paths[i].length - 1
        ]
      );
  }

  return mask;
}

function canReach(
  start,
  target,
  size,
  occupiedMask,
  blockedEndpointMask
) {
  const queue = [start];

  let head = 0;

  const visited =
    new Set([start]);

  while (
    head <
    queue.length
  ) {
    const cell =
      queue[head++];

    if (
      cell === target
    ) {
      return true;
    }

    for (
      const next of
      getNeighbors(
        cell,
        size
      )
    ) {
      if (
        visited.has(next)
      ) {
        continue;
      }

      const bit =
        1n << BigInt(next);

      if (
        (occupiedMask & bit) !==
          0n &&
        next !== target
      ) {
        continue;
      }

      if (
        (blockedEndpointMask & bit) !==
          0n &&
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

function remainingPairsReachable(
  pairs,
  size,
  occupiedMask,
  paths
) {
  for (
    const pair of pairs
  ) {
    const blockedEndpointMask =
      getEndpointBlockMask(
        paths,
        pair.index
      );

    if (
      !canReach(
        pair.start,
        pair.end,
        size,
        occupiedMask,
        blockedEndpointMask
      )
    ) {
      return false;
    }
  }

  return true;
}

function countBits(mask) {
  let count = 0;

  while (
    mask !== 0n
  ) {
    mask &= mask - 1n;
    count++;
  }

  return count;
}

function generateCandidatePaths(
  start,
  target,
  size,
  occupiedMask,
  blockedEndpointMask,
  deadline
) {
  const result = [];

  const path = [start];

  let pathMask =
    1n << BigInt(start);

  const visited =
    new Set([start]);

  function dfs(cell) {
    if (
      Date.now() >
      deadline
    ) {
      return;
    }

    if (
      result.length >=
      MAX_CANDIDATE_PATHS
    ) {
      return;
    }

    if (
      cell === target
    ) {
      result.push({
        cells: [...path],
        mask: pathMask,
      });

      return;
    }

    const distance =
      manhattan(
        cell,
        target,
        size
      );

    const totalCells =
      size * size;

    const occupiedCount =
      countBits(
        occupiedMask
      );

    const pathLength =
      path.length;

    const availableCells =
      totalCells -
      occupiedCount -
      pathLength +
      1;

    if (
      distance >
      availableCells
    ) {
      return;
    }

    let neighbors =
      getNeighbors(
        cell,
        size
      );

    neighbors.sort(
      (a, b) =>
        manhattan(
          a,
          target,
          size
        ) -
        manhattan(
          b,
          target,
          size
        )
    );

    for (
      const next of neighbors
    ) {
      if (
        visited.has(next)
      ) {
        continue;
      }

      const bit =
        1n << BigInt(next);

      if (
        (occupiedMask & bit) !==
          0n &&
        next !== target
      ) {
        continue;
      }

      if (
        (blockedEndpointMask & bit) !==
          0n &&
        next !== target
      ) {
        continue;
      }

      visited.add(next);

      path.push(next);

      pathMask |= bit;

      dfs(next);

      pathMask ^= bit;

      path.pop();

      visited.delete(next);

      if (
        Date.now() >
          deadline ||
        result.length >=
          MAX_CANDIDATE_PATHS
      ) {
        return;
      }
    }
  }

  dfs(start);

  return result;
}

function getPairOrder(
  paths,
  size
) {
  return paths
    .map(
      (path, index) => ({
        index,

        start:
          path[0],

        end:
          path[path.length - 1],

        distance:
          manhattan(
            path[0],
            path[path.length - 1],
            size
          ),

        knownMask:
          pathToMask(path),
      })
    )
    .sort(
      (a, b) => {
        if (
          b.distance !==
          a.distance
        ) {
          return (
            b.distance -
            a.distance
          );
        }

        return (
          a.knownMask <
          b.knownMask
            ? -1
            : 1
        );
      }
    );
}

function isComplete(
  occupiedMask,
  totalCells
) {
  const fullMask =
    (1n <<
      BigInt(totalCells)) -
    1n;

  return (
    occupiedMask ===
    fullMask
  );
}

function solveLevel(level) {
  const startedAt =
    Date.now();

  const deadline =
    startedAt +
    TIME_LIMIT_MS;

  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  if (
    !validateKnownSolution(
      level
    )
  ) {
    return {
      status: "invalid",
      solutions: 0,
    };
  }

  const pairs =
    getPairOrder(
      paths,
      size
    );

  const firstPair =
    pairs[0];

  const memo =
    new Set();

  let alternativeFound =
    false;

  let timedOut =
    false;

  function search(
    remainingPairs,
    occupiedMask,
    differentFromKnown
  ) {
    if (
      alternativeFound
    ) {
      return;
    }

    if (
      Date.now() >
      deadline
    ) {
      timedOut = true;
      return;
    }

    if (
      remainingPairs.length ===
      0
    ) {
      if (
        isComplete(
          occupiedMask,
          totalCells
        ) &&
        differentFromKnown
      ) {
        alternativeFound =
          true;
      }

      return;
    }

    const remainingKey =
      remainingPairs
        .map(
          (pair) =>
            pair.index
        )
        .sort(
          (a, b) =>
            a - b
        )
        .join(",");

    const memoKey =
      `${remainingKey}|${occupiedMask.toString()}|${
        differentFromKnown
          ? 1
          : 0
      }`;

    if (
      memo.has(memoKey)
    ) {
      return;
    }

    let selectedPair =
      null;

    let selectedCandidates =
      null;

    for (
      const pair of
      remainingPairs
    ) {
      if (
        Date.now() >
        deadline
      ) {
        timedOut = true;
        return;
      }

      const blockedEndpointMask =
        getEndpointBlockMask(
          paths,
          pair.index
        );

      const candidates =
        generateCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupiedMask,
          blockedEndpointMask,
          deadline
        );

      if (
        candidates.length ===
        0
      ) {
        memo.add(memoKey);
        return;
      }

      let filteredCandidates =
        candidates;

      if (
        pair.index ===
          firstPair.index &&
        !differentFromKnown
      ) {
        filteredCandidates =
          candidates.filter(
            (candidate) =>
              candidate.mask !==
              firstPair.knownMask
          );

        if (
          filteredCandidates.length ===
          0
        ) {
          memo.add(memoKey);
          return;
        }
      }

      if (
        selectedCandidates ===
          null ||
        filteredCandidates.length <
          selectedCandidates.length
      ) {
        selectedPair =
          pair;

        selectedCandidates =
          filteredCandidates;
      }

      if (
        selectedCandidates.length ===
        1
      ) {
        break;
      }
    }

    if (
      !selectedPair ||
      !selectedCandidates
    ) {
      memo.add(memoKey);
      return;
    }

    selectedCandidates.sort(
      (a, b) =>
        a.cells.length -
        b.cells.length
    );

    for (
      const candidate of
      selectedCandidates
    ) {
      if (
        Date.now() >
        deadline
      ) {
        timedOut = true;
        return;
      }

      const nextDifferent =
        differentFromKnown ||
        (
          selectedPair.index ===
            firstPair.index &&
          candidate.mask !==
            firstPair.knownMask
        );

      if (
        (candidate.mask &
          occupiedMask) !==
        0n
      ) {
        continue;
      }

      const newOccupied =
        occupiedMask |
        candidate.mask;

      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !==
            selectedPair.index
        );

      if (
        !remainingPairsReachable(
          nextPairs,
          size,
          newOccupied,
          paths
        )
      ) {
        continue;
      }

      search(
        nextPairs,
        newOccupied,
        nextDifferent
      );

      if (
        alternativeFound
      ) {
        return;
      }

      if (
        timedOut
      ) {
        return;
      }
    }

    memo.add(memoKey);
  }

  search(
    pairs,
    0n,
    false
  );

  if (
    alternativeFound
  ) {
    return {
      status: "multiple",
      solutions: MAX_SOLUTIONS,
    };
  }

  if (
    timedOut
  ) {
    return {
      status: "timeout",
      solutions: 1,
    };
  }

  return {
    status: "unique",
    solutions: 1,
  };
}


/* ==================================================
   ЗАПУСК ПРОВЕРКИ
   ================================================== */

console.log(
  "===================================="
);

console.log(
  "ПРОВЕРКА РЕШЕНИЙ УРОВНЕЙ"
);

console.log(
  "===================================="
);

console.log("");

let uniqueCount = 0;

let multipleCount = 0;

let invalidCount = 0;

let timeoutCount = 0;

const multipleLevels = [];

const timeoutLevels = [];

const invalidLevels = [];

for (
  let i = 0;
  i < GENERATED_LEVELS.length;
  i++
) {
  const level =
    GENERATED_LEVELS[i];

  const levelNumber =
    i + 1;

  console.log(
    `Проверяем уровень ${levelNumber}...`
  );

  const result =
    solveLevel(level);

  if (
    result.status ===
    "unique"
  ) {
    uniqueCount++;

    console.log(
      `✓ Уровень ${levelNumber}: уникальное решение`
    );
  }

  if (
    result.status ===
    "multiple"
  ) {
    multipleCount++;

    multipleLevels.push(
      levelNumber
    );

    console.log(
      `⚠ Уровень ${levelNumber}: найдено несколько решений`
    );
  }

  if (
    result.status ===
    "invalid"
  ) {
    invalidCount++;

    invalidLevels.push(
      levelNumber
    );

    console.log(
      `✗ Уровень ${levelNumber}: некорректный уровень`
    );
  }

  if (
    result.status ===
    "timeout"
  ) {
    timeoutCount++;

    timeoutLevels.push(
      levelNumber
    );

    console.log(
      `◷ Уровень ${levelNumber}: не удалось завершить проверку за ${TIME_LIMIT_MS / 1000} сек.`
    );
  }

  console.log("");
}

console.log(
  "===================================="
);

console.log(
  "ИТОГ ПРОВЕРКИ"
);

console.log(
  "===================================="
);

console.log(
  `Всего уровней: ${GENERATED_LEVELS.length}`
);

console.log(
  `Уникальных: ${uniqueCount}`
);

console.log(
  `С несколькими решениями: ${multipleCount}`
);

console.log(
  `Некорректных: ${invalidCount}`
);

console.log(
  `Таймаутов: ${timeoutCount}`
);

console.log("");

if (
  multipleLevels.length >
  0
) {
  console.log(
    `Уровни с несколькими решениями: ${multipleLevels.join(", ")}`
  );
}

if (
  timeoutLevels.length >
  0
) {
  console.log(
    `Уровни с таймаутом: ${timeoutLevels.join(", ")}`
  );
}

if (
  invalidLevels.length >
  0
) {
  console.log(
    `Некорректные уровни: ${invalidLevels.join(", ")}`
  );
}

console.log("");

if (
  invalidCount > 0
) {
  console.error(
    "✗ Обнаружены некорректные уровни."
  );

  process.exitCode = 1;
} else {
  console.log(
    "✓ Все уровни имеют корректное известное решение."
  );

  if (
    multipleCount > 0
  ) {
    console.log(
      `⚠ У ${multipleCount} уровней найдено несколько решений.`
    );
  }

  if (
    timeoutCount > 0
  ) {
    console.log(
      `◷ У ${timeoutCount} уровней уникальность не удалось доказать за установленное время.`
    );
  }
}