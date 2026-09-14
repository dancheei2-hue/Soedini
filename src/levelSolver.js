/*
 * ТОЧНЫЙ РЕШАТЕЛЬ УРОВНЕЙ
 *
 * Возвращает:
 *   unique   — найдено ровно одно решение
 *   multiple — найдено минимум два решения
 *   invalid  — уровень некорректен
 *   timeout  — за отведённое время нельзя доказать результат
 *
 * Важно:
 * timeout НЕ означает unique.
 */

const DEFAULT_TIME_LIMIT_MS = 12000;
const MAX_SOLUTIONS = 2;


/* ============================================================
   БАЗОВЫЕ ФУНКЦИИ
   ============================================================ */

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


function pathToMask(path) {
  let mask = 0n;

  for (const cell of path) {
    mask |= 1n << BigInt(cell);
  }

  return mask;
}


function fullMask(totalCells) {
  return (
    (1n << BigInt(totalCells)) -
    1n
  );
}


/* ============================================================
   ПРОВЕРКА ИСХОДНОГО УРОВНЯ
   ============================================================ */

function validateLevel(level) {
  if (!level) {
    return false;
  }

  const {
    size,
    paths,
  } = level;

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

  const totalCells =
    size * size;

  const used =
    new Set();

  for (const path of paths) {
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
      const cell = path[i];

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


/* ============================================================
   ПАРЫ
   ============================================================ */

function createPairs(
  paths,
  size
) {
  return paths.map(
    (path, index) => ({
      index,

      start:
        path[0],

      end:
        path[path.length - 1],

      knownMask:
        pathToMask(path),

      knownLength:
        path.length,

      distance:
        manhattan(
          path[0],
          path[path.length - 1],
          size
        ),
    })
  );
}


/*
 * Проверяем, что клетка является концом
 * другой пары.
 */
function getBlockedEndpointMask(
  pairs,
  allowedPairIndex
) {
  let mask = 0n;

  for (const pair of pairs) {
    if (
      pair.index ===
      allowedPairIndex
    ) {
      continue;
    }

    mask |=
      1n << BigInt(
        pair.start
      );

    mask |=
      1n << BigInt(
        pair.end
      );
  }

  return mask;
}


/* ============================================================
   ДОСТИЖИМОСТЬ
   ============================================================ */

function canReach(
  start,
  target,
  size,
  occupiedMask,
  blockedEndpointMask
) {
  const queue = [start];

  const visited =
    new Set([start]);

  let head = 0;

  while (
    head < queue.length
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


/*
 * Быстрая проверка всех оставшихся пар.
 */
function allPairsReachable(
  pairs,
  size,
  occupiedMask
) {
  for (const pair of pairs) {
    const blocked =
      getBlockedEndpointMask(
        pairs,
        pair.index
      );

    if (
      !canReach(
        pair.start,
        pair.end,
        size,
        occupiedMask,
        blocked
      )
    ) {
      return false;
    }
  }

  return true;
}


/* ============================================================
   ГЕНЕРАЦИЯ ВОЗМОЖНЫХ ПУТЕЙ
   ============================================================ */

function generatePaths(
  pair,
  pairs,
  size,
  occupiedMask,
  deadline,
  excludeKnown
) {
  const result = [];

  const blockedEndpointMask =
    getBlockedEndpointMask(
      pairs,
      pair.index
    );

  const visited =
    new Set([pair.start]);

  const currentPath =
    [pair.start];

  let currentMask =
    1n << BigInt(pair.start);


  function dfs(cell) {
    if (
      Date.now() >
      deadline
    ) {
      return;
    }

    if (
      result.length >= 5000
    ) {
      return;
    }

    if (
      cell === pair.end
    ) {
      if (
        !excludeKnown ||
        currentMask !==
          pair.knownMask
      ) {
        result.push({
          cells:
            [...currentPath],

          mask:
            currentMask,
        });
      }

      return;
    }

    let neighbors =
      getNeighbors(
        cell,
        size
      );


    /*
     * Сначала пробуем клетки,
     * которые ближе к концу пары.
     */
    neighbors.sort(
      (a, b) => {
        const da =
          manhattan(
            a,
            pair.end,
            size
          );

        const db =
          manhattan(
            b,
            pair.end,
            size
          );

        return da - db;
      }
    );


    for (const next of neighbors) {
      if (
        Date.now() >
        deadline
      ) {
        return;
      }

      if (
        visited.has(next)
      ) {
        continue;
      }

      const bit =
        1n << BigInt(next);


      /*
       * Клетки других уже выбранных
       * путей использовать нельзя.
       */
      if (
        (occupiedMask & bit) !==
          0n &&
        next !== pair.end
      ) {
        continue;
      }


      /*
       * Концы других пар нельзя
       * использовать как промежуточные клетки.
       */
      if (
        (blockedEndpointMask & bit) !==
          0n &&
        next !== pair.end
      ) {
        continue;
      }


      /*
       * Нельзя идти к цели, если текущая
       * клетка ещё не позволяет получить
       * минимально необходимое расстояние.
       */
      const distance =
        manhattan(
          next,
          pair.end,
          size
        );

      const remainingCells =
        size * size -
        visited.size;

      if (
        distance >
        remainingCells
      ) {
        continue;
      }


      visited.add(next);
      currentPath.push(next);
      currentMask |= bit;

      dfs(next);

      currentMask ^= bit;
      currentPath.pop();
      visited.delete(next);


      if (
        result.length >= 5000
      ) {
        return;
      }
    }
  }


  dfs(pair.start);

  return result;
}


/* ============================================================
   КЛЮЧ МЕМОИЗАЦИИ
   ============================================================ */

function createStateKey(
  remainingPairs,
  occupiedMask
) {
  const indexes =
    remainingPairs
      .map(
        pair => pair.index
      )
      .sort(
        (a, b) => a - b
      )
      .join(",");

  return (
    indexes +
    "|" +
    occupiedMask.toString()
  );
}


/* ============================================================
   ТОЧНЫЙ SOLVER
   ============================================================ */

export function solveLevel(
  level,
  options = {}
) {
  const timeLimit =
    Number.isInteger(
      options.timeLimitMs
    )
      ? options.timeLimitMs
      : DEFAULT_TIME_LIMIT_MS;


  const startedAt =
    Date.now();

  const deadline =
    startedAt +
    timeLimit;


  if (
    !validateLevel(level)
  ) {
    return {
      status: "invalid",
      solutions: 0,
      elapsedMs:
        Date.now() -
        startedAt,
    };
  }


  const {
    size,
    paths,
  } = level;


  const totalCells =
    size * size;


  const pairs =
    createPairs(
      paths,
      size
    );


  /*
   * Сначала пары с самым маленьким
   * количеством потенциальных вариантов.
   *
   * Длинные расстояния обычно сильнее
   * ограничивают пространство поиска.
   */
  pairs.sort(
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
        b.knownLength -
        a.knownLength
      );
    }
  );


  let solutionCount = 0;

  let timedOut = false;

  let nodes = 0;

  const memo =
    new Set();


  function search(
    remainingPairs,
    occupiedMask
  ) {
    nodes++;


    if (
      solutionCount >=
      MAX_SOLUTIONS
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


    /*
     * Все пары соединены.
     */
    if (
      remainingPairs.length ===
      0
    ) {
      if (
        occupiedMask ===
        fullMask(totalCells)
      ) {
        solutionCount++;
      }

      return;
    }


    /*
     * В Numberlink поле должно быть
     * полностью занято.
     *
     * Если осталось меньше клеток,
     * чем необходимо для минимальных
     * путей, ветка невозможна.
     */
    let minimumCells = 0;

    for (
      const pair of
      remainingPairs
    ) {
      minimumCells +=
        pair.distance + 1;
    }

    const occupiedCount =
      countBits(
        occupiedMask
      );

    const available =
      totalCells -
      occupiedCount;

    if (
      minimumCells >
      available
    ) {
      return;
    }


    const key =
      createStateKey(
        remainingPairs,
        occupiedMask
      );

    if (
      memo.has(key)
    ) {
      return;
    }


    /*
     * Выбираем пару, для которой
     * меньше всего вариантов.
     */
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


      const candidates =
        generatePaths(
          pair,
          remainingPairs,
          size,
          occupiedMask,
          deadline,
          false
        );


      if (
        candidates.length ===
        0
      ) {
        memo.add(key);
        return;
      }


      if (
        selectedCandidates ===
          null ||
        candidates.length <
          selectedCandidates.length
      ) {
        selectedPair =
          pair;

        selectedCandidates =
          candidates;
      }


      /*
       * Уже найдено минимальное
       * количество вариантов.
       */
      if (
        candidates.length ===
        1
      ) {
        break;
      }
    }


    if (
      !selectedPair ||
      !selectedCandidates
    ) {
      memo.add(key);
      return;
    }


    /*
     * Более короткие пути рассматриваем
     * раньше.
     */
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
          pair =>
            pair.index !==
            selectedPair.index
        );


      /*
       * Очень важный pruning:
       * каждая оставшаяся пара должна
       * хотя бы теоретически иметь путь.
       */
      if (
        !allPairsReachable(
          nextPairs,
          size,
          newOccupied
        )
      ) {
        continue;
      }


      search(
        nextPairs,
        newOccupied
      );


      if (
        solutionCount >=
        MAX_SOLUTIONS
      ) {
        return;
      }


      if (
        timedOut
      ) {
        return;
      }
    }


    memo.add(key);
  }


  search(
    pairs,
    0n
  );


  const elapsedMs =
    Date.now() -
    startedAt;


  if (
    solutionCount >=
    MAX_SOLUTIONS
  ) {
    return {
      status: "multiple",
      solutions:
        MAX_SOLUTIONS,
      elapsedMs,
      nodes,
    };
  }


  if (
    timedOut
  ) {
    return {
      status: "timeout",
      solutions:
        solutionCount,
      elapsedMs,
      nodes,
    };
  }


  if (
    solutionCount === 1
  ) {
    return {
      status: "unique",
      solutions: 1,
      elapsedMs,
      nodes,
    };
  }


  return {
    status: "invalid",
    solutions: 0,
    elapsedMs,
    nodes,
  };
}


/* ============================================================
   ПОДСЧЁТ БИТОВ
   ============================================================ */

function countBits(mask) {
  let count = 0;

  while (
    mask !== 0n
  ) {
    mask &=
      mask - 1n;

    count++;
  }

  return count;
}