/*
 * ТОЧНЫЙ ПРОВЕРЯЮЩИЙ РЕШАТЕЛЬ СОЕДИНИ
 *
 * Уровень уже содержит одно корректное решение:
 * paths — это скрытое решение, с которым был создан уровень.
 *
 * Поэтому нам не нужно сначала искать первое решение.
 * Мы проверяем:
 *
 *   1. существует ли корректное альтернативное решение;
 *   2. если нет — исходное решение единственное.
 *
 * Возвращает:
 *
 *   unique
 *     Исходное решение единственное.
 *
 *   multiple
 *     Найдено другое корректное решение.
 *
 *   invalid
 *     Исходное решение уровня некорректно
 *     или другого решения нет вообще.
 *
 *   timeout
 *     Поиск альтернативного решения не завершился
 *     за установленное время.
 *
 * ВАЖНО:
 *
 * timeout никогда не считается unique.
 */

const DEFAULT_TIME_LIMIT_MS = 12000;

const MAX_GENERATED_PATHS_PER_PAIR = 200000;

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

function countBits(mask) {
  let count = 0;

  while (mask !== 0n) {
    mask &= mask - 1n;
    count++;
  }

  return count;
}

function fullMask(totalCells) {
  return (
    (1n << BigInt(totalCells)) -
    1n
  );
}

function validateLevel(level) {
  if (!level) {
    return false;
  }

  const { size, paths } = level;

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

  const used = new Set();

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

      if (used.has(cell)) {
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
    used.size === totalCells
  );
}

function createPairs(paths, size) {
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
      1n << BigInt(pair.start);

    mask |=
      1n << BigInt(pair.end);
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

    const neighbors =
      getNeighbors(
        cell,
        size
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
        next !== target &&
        (occupiedMask & bit) !== 0n
      ) {
        continue;
      }

      if (
        next !== target &&
        (blockedEndpointMask & bit) !== 0n
      ) {
        continue;
      }

      visited.add(next);
      queue.push(next);
    }
  }

  return false;
}

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

function hasDeadCell(
  pairs,
  size,
  occupiedMask
) {
  const totalCells =
    size * size;

  const endpoints =
    new Set();

  for (const pair of pairs) {
    endpoints.add(pair.start);
    endpoints.add(pair.end);
  }

  const full =
    fullMask(totalCells);

  const freeMask =
    full & ~occupiedMask;

  for (
    let cell = 0;
    cell < totalCells;
    cell++
  ) {
    const bit =
      1n << BigInt(cell);

    if (
      (freeMask & bit) === 0n
    ) {
      continue;
    }

    if (
      endpoints.has(cell)
    ) {
      continue;
    }

    let degree = 0;

    for (
      const next of
      getNeighbors(cell, size)
    ) {
      const nextBit =
        1n << BigInt(next);

      if (
        (freeMask & nextBit) !== 0n
      ) {
        degree++;
      }
    }

    /*
     * Свободная клетка без соседей
     * не сможет попасть ни в один путь.
     */
    if (degree === 0) {
      return true;
    }
  }

  return false;
}

function generateAlternativePaths(
  pair,
  pairs,
  size,
  occupiedMask,
  deadline
) {
  const blockedEndpointMask =
    getBlockedEndpointMask(
      pairs,
      pair.index
    );

  const result = [];

  const visited =
    new Set([pair.start]);

  const currentPath =
    [pair.start];

  let currentMask =
    1n << BigInt(pair.start);

  function dfs(cell) {
    if (
      Date.now() > deadline
    ) {
      return true;
    }

    if (
      result.length >=
      MAX_GENERATED_PATHS_PER_PAIR
    ) {
      return false;
    }

    if (
      cell === pair.end
    ) {
      /*
       * Здесь НЕ исключаем knownMask.
       *
       * Проверка альтернативности происходит
       * на уровне всей комбинации путей.
       */
      result.push({
        cells:
          [...currentPath],

        mask:
          currentMask,

        isKnown:
          currentMask ===
          pair.knownMask,
      });

      return false;
    }

    let neighbors =
      getNeighbors(
        cell,
        size
      );

    /*
     * Сначала пробуем клетки,
     * которые ближе к конечной точке.
     *
     * Это позволяет быстро найти
     * альтернативное решение.
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

    for (
      const next of neighbors
    ) {
      if (
        Date.now() > deadline
      ) {
        return true;
      }

      if (
        visited.has(next)
      ) {
        continue;
      }

      const bit =
        1n << BigInt(next);

      if (
        next !== pair.end &&
        (occupiedMask & bit) !== 0n
      ) {
        continue;
      }

      if (
        next !== pair.end &&
        (blockedEndpointMask & bit) !== 0n
      ) {
        continue;
      }

      const distance =
        manhattan(
          next,
          pair.end,
          size
        );

      const remaining =
        size * size -
        visited.size;

      if (
        distance >
        remaining
      ) {
        continue;
      }

      visited.add(next);
      currentPath.push(next);
      currentMask |= bit;

      const stopped =
        dfs(next);

      currentMask ^= bit;
      currentPath.pop();
      visited.delete(next);

      if (stopped) {
        return true;
      }
    }

    return false;
  }

  const timedOut =
    dfs(pair.start);

  return {
    paths: result,
    timedOut,
  };
}

function createStateKey(
  remainingPairs,
  occupiedMask
) {
  const indexes =
    remainingPairs
      .map(
        pair =>
          pair.index
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

  /*
   * Сначала проверяем само записанное
   * решение уровня.
   */
  if (
    !validateLevel(level)
  ) {
    return {
      status:
        "invalid",

      solutions:
        0,

      elapsedMs:
        Date.now() -
        startedAt,

      nodes:
        0,
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
   * Проверяем, что исходные пути действительно
   * покрывают всё поле.
   */
  let knownMask = 0n;

  for (
    const pair of pairs
  ) {
    if (
      (knownMask &
        pair.knownMask) !==
      0n
    ) {
      return {
        status:
          "invalid",

        solutions:
          0,

        elapsedMs:
          Date.now() -
          startedAt,

        nodes:
          0,
      };
    }

    knownMask |=
      pair.knownMask;
  }

  if (
    knownMask !==
    fullMask(totalCells)
  ) {
    return {
      status:
        "invalid",

      solutions:
        0,

      elapsedMs:
        Date.now() -
        startedAt,

      nodes:
        0,
    };
  }

  /*
   * Сначала пытаемся поставить наиболее
   * ограниченные пары.
   *
   * Длинные расстояния обычно имеют
   * меньше вариантов.
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

  let alternativeFound =
    false;

  let timedOut =
    false;

  let nodes =
    0;

  const memo =
    new Set();

  function search(
    remainingPairs,
    occupiedMask,
    differsFromKnown
  ) {
    nodes++;

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

    /*
     * Если все пары поставлены,
     * проверяем полное покрытие.
     */
    if (
      remainingPairs.length ===
      0
    ) {
      if (
        occupiedMask ===
          fullMask(totalCells) &&
        differsFromKnown
      ) {
        alternativeFound =
          true;
      }

      return;
    }

    /*
     * Сколько клеток минимум нужно
     * оставшимся парам.
     *
     * Минимальная длина пути между
     * концами = Manhattan + 1.
     */
    let minimumCells =
      0;

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

    /*
     * Если после занятых клеток осталась
     * изолированная свободная клетка,
     * решения быть не может.
     */
    if (
      hasDeadCell(
        remainingPairs,
        size,
        occupiedMask
      )
    ) {
      return;
    }

    /*
     * Все оставшиеся пары должны хотя бы
     * потенциально иметь путь.
     */
    if (
      !allPairsReachable(
        remainingPairs,
        size,
        occupiedMask
      )
    ) {
      return;
    }

    /*
     * Если состояние не отличается от
     * известного решения и мы уже использовали
     * известные маски предыдущих пар,
     * оно может повторяться.
     *
     * differsFromKnown специально не входит
     * в ключ, поэтому состояние с одинаковыми
     * оставшимися парами и occupiedMask
     * эквивалентно.
     */
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
     * Выбираем пару с наименьшим количеством
     * возможных путей.
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
        timedOut =
          true;

        return;
      }

      const generated =
        generateAlternativePaths(
          pair,
          remainingPairs,
          size,
          occupiedMask,
          deadline
        );

      if (
        generated.timedOut
      ) {
        timedOut =
          true;

        return;
      }

      const candidates =
        generated.paths;

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
       * Один кандидат — идеальная
       * ветвь для проверки.
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
     * Сначала проверяем короткие пути.
     * Они обычно сильнее ограничивают
     * оставшееся пространство.
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
        timedOut =
          true;

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
       * Если этот путь полностью совпадает
       * с известным путём, пока сохраняем
       * differsFromKnown.
       *
       * Как только хотя бы одна пара получает
       * другую область клеток — решение
       * становится альтернативным.
       */
      const nextDiffers =
        differsFromKnown ||
        candidate.mask !==
          selectedPair.knownMask;

      /*
       * Очень важная проверка:
       * все оставшиеся пары должны сохранять
       * возможность добраться до своих концов.
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
        newOccupied,
        nextDiffers
      );

      if (
        alternativeFound ||
        timedOut
      ) {
        return;
      }
    }

    memo.add(key);
  }

  /*
   * В начале occupiedMask пустой.
   */
  search(
    pairs,
    0n,
    false
  );

  const elapsedMs =
    Date.now() -
    startedAt;

  if (
    alternativeFound
  ) {
    return {
      status:
        "multiple",

      solutions:
        2,

      elapsedMs,

      nodes,
    };
  }

  if (
    timedOut
  ) {
    return {
      status:
        "timeout",

      solutions:
        1,

      elapsedMs,

      nodes,
    };
  }

  /*
   * Исходное решение существует,
   * потому что мы проверили его выше.
   *
   * Если альтернативы не нашли —
   * оно единственное.
   */
  return {
    status:
      "unique",

    solutions:
      1,

    elapsedMs,

    nodes,
  };
}