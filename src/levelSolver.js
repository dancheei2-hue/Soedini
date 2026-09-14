/*
 * БЫСТРЫЙ ПРОВЕРЯЮЩИЙ РЕШАТЕЛЬ СОЕДИНИ
 *
 * Задача:
 *
 *   Уровень уже содержит одно корректное решение
 *   в level.paths.
 *
 *   Нужно определить, существует ли ДРУГОЕ
 *   корректное решение.
 *
 * Статусы:
 *
 *   unique
 *     Альтернативное решение не найдено
 *     за время поиска.
 *
 *   multiple
 *     Найдено другое корректное решение.
 *
 *   invalid
 *     Записанное решение некорректно.
 *
 *   timeout
 *     Поиск не завершён за установленный лимит.
 *
 * ВАЖНО:
 *
 *   timeout никогда не считается unique.
 */

const DEFAULT_TIME_LIMIT_MS = 12000;

/*
 * Максимальная длина одного исследуемого
 * альтернативного пути относительно известного.
 *
 * Сначала проверяем небольшие отклонения.
 * Это позволяет очень быстро находить
 * типичные альтернативные решения.
 */
const SHORT_DETOUR_EXTRA = 8;

/*
 * Ограничение количества узлов.
 *
 * Это дополнительная страховка от взрыва
 * пространства поиска.
 */
const MAX_NODES = 1500000;

/*
 * -----------------------------
 * БАЗОВЫЕ ФУНКЦИИ ПОЛЯ
 * -----------------------------
 */

function getNeighbors(cell, size) {
  const row =
    Math.floor(cell / size);

  const col =
    cell % size;

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

function manhattan(
  a,
  b,
  size
) {
  const ar =
    Math.floor(a / size);

  const ac =
    a % size;

  const br =
    Math.floor(b / size);

  const bc =
    b % size;

  return (
    Math.abs(ar - br) +
    Math.abs(ac - bc)
  );
}

function pathToMask(path) {
  let mask = 0n;

  for (const cell of path) {
    mask |=
      1n << BigInt(cell);
  }

  return mask;
}

function fullMask(totalCells) {
  return (
    (1n << BigInt(totalCells)) -
    1n
  );
}

function countBits(mask) {
  let count = 0;

  while (mask !== 0n) {
    mask &=
      mask - 1n;

    count++;
  }

  return count;
}

/*
 * -----------------------------
 * ПРОВЕРКА ИСХОДНОГО УРОВНЯ
 * -----------------------------
 */

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

/*
 * -----------------------------
 * ПАРЫ
 * -----------------------------
 */

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

function createEndpointSet(
  pairs
) {
  const endpoints =
    new Set();

  for (const pair of pairs) {
    endpoints.add(
      pair.start
    );

    endpoints.add(
      pair.end
    );
  }

  return endpoints;
}

/*
 * Маска концов всех остальных пар.
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
      1n << BigInt(pair.start);

    mask |=
      1n << BigInt(pair.end);
  }

  return mask;
}

/*
 * -----------------------------
 * BFS ДОСТИЖИМОСТИ
 * -----------------------------
 */

function canReach(
  start,
  target,
  size,
  occupiedMask,
  blockedEndpointMask
) {
  if (
    start === target
  ) {
    return true;
  }

  const queue =
    [start];

  const visited =
    new Set([start]);

  let head = 0;

  while (
    head < queue.length
  ) {
    const cell =
      queue[head++];

    const neighbors =
      getNeighbors(
        cell,
        size
      );

    for (const next of neighbors) {
      if (
        visited.has(next)
      ) {
        continue;
      }

      if (
        next !== target
      ) {
        const bit =
          1n << BigInt(next);

        if (
          (occupiedMask & bit) !==
          0n
        ) {
          continue;
        }

        if (
          (blockedEndpointMask & bit) !==
          0n
        ) {
          continue;
        }
      }

      if (
        next === target
      ) {
        return true;
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

/*
 * -----------------------------
 * АНАЛИЗ СВОБОДНЫХ КЛЕТОК
 * -----------------------------
 *
 * Если обычная клетка остаётся полностью
 * изолированной или имеет невозможную степень,
 * состояние можно сразу отбросить.
 */

function analyzeFreeCells(
  pairs,
  size,
  occupiedMask
) {
  const totalCells =
    size * size;

  const full =
    fullMask(totalCells);

  const freeMask =
    full & ~occupiedMask;

  const endpoints =
    createEndpointSet(
      pairs
    );

  for (
    let cell = 0;
    cell < totalCells;
    cell++
  ) {
    const bit =
      1n << BigInt(cell);

    if (
      (freeMask & bit) ===
      0n
    ) {
      continue;
    }

    /*
     * Концы пар могут иметь степень 1.
     * Обычные клетки должны иметь возможность
     * получить степень 2.
     */
    const isEndpoint =
      endpoints.has(cell);

    let degree = 0;

    for (
      const next of
      getNeighbors(
        cell,
        size
      )
    ) {
      const nextBit =
        1n << BigInt(next);

      if (
        (freeMask &
          nextBit) !==
        0n
      ) {
        degree++;
      }
    }

    if (
      isEndpoint
    ) {
      if (
        degree === 0
      ) {
        return false;
      }
    } else {
      if (
        degree < 2
      ) {
        return false;
      }
    }
  }

  return true;
}

/*
 * -----------------------------
 * ПОИСК КАНДИДАТОВ ПУТИ
 * -----------------------------
 *
 * Это ключевая часть нового solver.
 *
 * Мы не перебираем бессмысленные маршруты.
 *
 * Приоритет:
 *
 *   1. ближе к концу;
 *   2. меньше доступных вариантов;
 *   3. сначала клетки, которые сильнее
 *      ограничивают пространство.
 */

function generateAlternativePaths(
  pair,
  pairs,
  size,
  occupiedMask,
  knownMask,
  deadline,
  counters,
  lengthLimit
) {
  const blockedEndpointMask =
    getBlockedEndpointMask(
      pairs,
      pair.index
    );

  const result = [];

  const visited =
    new Set([
      pair.start,
    ]);

  const currentPath =
    [pair.start];

  let currentMask =
    1n << BigInt(pair.start);

  const totalCells =
    size * size;

  const maxLength =
    Math.min(
      totalCells,
      pair.knownLength +
        lengthLimit
    );

  /*
   * Сколько свободных клеток потенциально
   * осталось для этого пути.
   */
  function canStillReachTarget(
    cell,
    currentLength
  ) {
    const distance =
      manhattan(
        cell,
        pair.end,
        size
      );

    const remaining =
      maxLength -
      currentLength;

    return (
      distance <=
      remaining
    );
  }

  function getCandidateNeighbors(
    cell
  ) {
    const candidates = [];

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
        next !== pair.end &&
        (occupiedMask & bit) !==
        0n
      ) {
        continue;
      }

      if (
        next !== pair.end &&
        (blockedEndpointMask & bit) !==
        0n
      ) {
        continue;
      }

      candidates.push(next);
    }

    return candidates;
  }

  function scoreCandidate(
    cell
  ) {
    const neighbors =
      getCandidateNeighbors(
        cell
      );

    /*
     * Меньшая степень = более ограниченная
     * клетка = исследуем раньше.
     */
    const degree =
      neighbors.length;

    const distance =
      manhattan(
        cell,
        pair.end,
        size
      );

    /*
     * Чем меньше score,
     * тем раньше рассматриваем.
     */
    return (
      degree * 100 +
      distance
    );
  }

  function dfs(cell) {
    counters.nodes++;

    if (
      counters.nodes >=
      MAX_NODES
    ) {
      counters.stopped =
        true;

      return;
    }

    if (
      Date.now() >
      deadline
    ) {
      counters.stopped =
        true;

      return;
    }

    /*
     * Дошли до конца пары.
     */
    if (
      cell === pair.end
    ) {
      /*
       * Если путь полностью совпадает
       * с известным, он нам не интересен.
       */
      if (
        currentMask !==
        knownMask
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

    /*
     * Ограничение длины.
     */
    if (
      currentPath.length >=
      maxLength
    ) {
      return;
    }

    const candidates =
      getCandidateNeighbors(
        cell
      );

    candidates.sort(
      (a, b) => {
        const sa =
          scoreCandidate(a);

        const sb =
          scoreCandidate(b);

        if (
          sa !== sb
        ) {
          return sa - sb;
        }

        return (
          manhattan(
            a,
            pair.end,
            size
          ) -
          manhattan(
            b,
            pair.end,
            size
          )
        );
      }
    );

    for (
      const next of candidates
    ) {
      if (
        counters.stopped
      ) {
        return;
      }

      /*
       * Если расстояние до конца уже больше
       * оставшейся допустимой длины,
       * продолжать бессмысленно.
       */
      if (
        !canStillReachTarget(
          next,
          currentPath.length + 1
        )
      ) {
        continue;
      }

      const bit =
        1n << BigInt(next);

      visited.add(next);

      currentPath.push(
        next
      );

      currentMask |=
        bit;

      /*
       * Быстрая проверка достижимости
       * конца пары после добавления клетки.
       */
      if (
        canReach(
          next,
          pair.end,
          size,
          occupiedMask |
            currentMask,
          blockedEndpointMask
        )
      ) {
        dfs(next);
      }

      currentMask ^=
        bit;

      currentPath.pop();

      visited.delete(
        next
      );

      /*
       * Нам достаточно найти одну
       * альтернативу.
       */
      if (
        result.length > 0
      ) {
        return;
      }
    }
  }

  dfs(
    pair.start
  );

  return {
    paths: result,
    stopped:
      counters.stopped,
  };
}

/*
 * -----------------------------
 * ПРЕДВАРИТЕЛЬНЫЙ ФИЛЬТР
 * -----------------------------
 *
 * Проверяем, можно ли вообще разместить
 * оставшиеся пары в оставшемся пространстве.
 */

function minimumRequiredCells(
  pairs
) {
  let total = 0;

  for (const pair of pairs) {
    total +=
      pair.distance + 1;
  }

  return total;
}

function stateIsPossible(
  remainingPairs,
  size,
  occupiedMask
) {
  const totalCells =
    size * size;

  const occupied =
    countBits(
      occupiedMask
    );

  const available =
    totalCells -
    occupied;

  if (
    minimumRequiredCells(
      remainingPairs
    ) > available
  ) {
    return false;
  }

  if (
    !analyzeFreeCells(
      remainingPairs,
      size,
      occupiedMask
    )
  ) {
    return false;
  }

  return allPairsReachable(
    remainingPairs,
    size,
    occupiedMask
  );
}

/*
 * -----------------------------
 * ОСНОВНОЙ SOLVER
 * -----------------------------
 */

export function solveLevel(
  level,
  options = {}
) {
  const startedAt =
    Date.now();

  const timeLimit =
    Number.isInteger(
      options.timeLimitMs
    )
      ? options.timeLimitMs
      : DEFAULT_TIME_LIMIT_MS;

  const deadline =
    startedAt +
    timeLimit;

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
   * Проверяем исходное решение.
   */
  let knownMask = 0n;

  for (const pair of pairs) {
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
   * Сначала проверяем очевидные локальные
   * альтернативы.
   *
   * Пары с коротким известным маршрутом
   * особенно важны: у них часто находятся
   * альтернативы очень быстро.
   */
  const quickOrder =
    [...pairs].sort(
      (a, b) => {
        if (
          a.knownLength !==
          b.knownLength
        ) {
          return (
            a.knownLength -
            b.knownLength
          );
        }

        return (
          b.distance -
          a.distance
        );
      }
    );

  const counters = {
    nodes: 0,

    stopped:
      false,
  };

  /*
   * Быстрый поиск небольших обходов.
   */
  for (
    const pair of quickOrder
  ) {
    if (
      Date.now() >
      deadline
    ) {
      return {
        status:
          "timeout",

        solutions:
          1,

        elapsedMs:
          Date.now() -
          startedAt,

        nodes:
          counters.nodes,
      };
    }

    const generated =
      generateAlternativePaths(
        pair,
        pairs,
        size,
        0n,
        pair.knownMask,
        deadline,
        counters,
        SHORT_DETOUR_EXTRA
      );

    if (
      generated.paths.length >
      0
    ) {
      return {
        status:
          "multiple",

        solutions:
          2,

        elapsedMs:
          Date.now() -
          startedAt,

        nodes:
          counters.nodes,
      };
    }

    if (
      counters.stopped
    ) {
      return {
        status:
          "timeout",

        solutions:
          1,

        elapsedMs:
          Date.now() -
          startedAt,

        nodes:
          counters.nodes,
      };
    }
  }

  /*
   * -----------------------------
   * ПОЛНЫЙ ПОИСК
   * -----------------------------
   *
   * Теперь рассматриваем комбинации
   * маршрутов нескольких пар.
   */

  const orderedPairs =
    [...pairs].sort(
      (a, b) => {
        /*
         * Сначала пары с наиболее
         * ограниченной геометрией.
         */
        if (
          a.distance !==
          b.distance
        ) {
          return (
            b.distance -
            a.distance
          );
        }

        return (
          a.knownLength -
          b.knownLength
        );
      }
    );

  const memo =
    new Set();

  let alternativeFound =
    false;

  function createStateKey(
    remainingPairs,
    occupiedMask,
    differs
  ) {
    const indexes =
      remainingPairs
        .map(
          pair =>
            pair.index
        )
        .sort(
          (a, b) =>
            a - b
        )
        .join(",");

    return (
      indexes +
      "|" +
      occupiedMask.toString() +
      "|" +
      (differs ? "1" : "0")
    );
  }

  function search(
    remainingPairs,
    occupiedMask,
    differs
  ) {
    counters.nodes++;

    if (
      counters.nodes >=
      MAX_NODES
    ) {
      counters.stopped =
        true;

      return;
    }

    if (
      Date.now() >
      deadline
    ) {
      counters.stopped =
        true;

      return;
    }

    if (
      remainingPairs.length ===
      0
    ) {
      if (
        occupiedMask ===
          fullMask(totalCells) &&
        differs
      ) {
        alternativeFound =
          true;
      }

      return;
    }

    if (
      !stateIsPossible(
        remainingPairs,
        size,
        occupiedMask
      )
    ) {
      return;
    }

    const key =
      createStateKey(
        remainingPairs,
        occupiedMask,
        differs
      );

    if (
      memo.has(key)
    ) {
      return;
    }

    /*
     * Выбираем пару с минимальным
     * количеством возможных вариантов.
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
        counters.stopped =
          true;

        return;
      }

      /*
       * Чем больше уже занято поле,
       * тем меньше нужен допустимый
       * диапазон отклонения.
       */
      const generated =
        generateAlternativePaths(
          pair,
          remainingPairs,
          size,
          occupiedMask,
          pair.knownMask,
          deadline,
          counters,
          Math.max(
            SHORT_DETOUR_EXTRA,
            12
          )
        );

      /*
       * В полном поиске нам необходимо
       * учитывать и известный путь.
       *
       * Поэтому добавляем его отдельно.
       */
      const candidates =
        [...generated.paths];

      if (
        !generated.stopped &&
        (
          pair.knownMask &
          occupiedMask
        ) ===
          0n
      ) {
        candidates.push({
          cells:
            null,

          mask:
            pair.knownMask,

          isKnown:
            true,
        });
      }

      if (
        generated.stopped
      ) {
        counters.stopped =
          true;

        return;
      }

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
       * Пара с одним вариантом —
       * лучший кандидат.
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
     * Сначала проверяем отличающиеся
     * варианты. Это позволяет быстро
     * обнаруживать multiple.
     */
    selectedCandidates.sort(
      (a, b) => {
        const ad =
          a.isKnown
            ? 1
            : 0;

        const bd =
          b.isKnown
            ? 1
            : 0;

        return ad - bd;
      }
    );

    for (
      const candidate of
      selectedCandidates
    ) {
      if (
        counters.stopped ||
        alternativeFound
      ) {
        return;
      }

      const candidateMask =
        candidate.mask;

      if (
        (candidateMask &
          occupiedMask) !==
        0n
      ) {
        continue;
      }

      const nextOccupied =
        occupiedMask |
        candidateMask;

      const nextPairs =
        remainingPairs.filter(
          pair =>
            pair.index !==
            selectedPair.index
        );

      const nextDiffers =
        differs ||
        !candidate.isKnown;

      /*
       * После добавления маршрута
       * проверяем оставшиеся пары.
       */
      if (
        !stateIsPossible(
          nextPairs,
          size,
          nextOccupied
        )
      ) {
        continue;
      }

      search(
        nextPairs,
        nextOccupied,
        nextDiffers
      );
    }

    memo.add(key);
  }

  search(
    orderedPairs,
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

      nodes:
        counters.nodes,
    };
  }

  if (
    counters.stopped
  ) {
    return {
      status:
        "timeout",

      solutions:
        1,

      elapsedMs,

      nodes:
        counters.nodes,
    };
  }

  return {
    status:
      "unique",

    solutions:
      1,

    elapsedMs,

    nodes:
      counters.nodes,
  };
}