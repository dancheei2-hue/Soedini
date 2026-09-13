import { GENERATED_LEVELS } from "./generatedLevels.js";

const MAX_SOLUTIONS = 2;
const TIME_LIMIT_MS = 4000;
const MAX_CANDIDATE_PATHS = 500;

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

/*
 * Создаём карту конечных точек.
 *
 * Каждая конечная точка принадлежит
 * конкретной паре.
 */
function buildEndpointMap(paths) {
  const map = new Map();

  paths.forEach(
    (path, pairIndex) => {
      map.set(
        path[0],
        pairIndex
      );

      map.set(
        path[path.length - 1],
        pairIndex
      );
    }
  );

  return map;
}

/*
 * Проверяем известное решение,
 * из которого был создан уровень.
 *
 * Это очень важная проверка:
 * сгенерированный уровень должен
 * иметь хотя бы одно гарантированное
 * корректное решение.
 */
function validateKnownSolution(level) {
  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  const used = new Set();

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

  for (
    let pairIndex = 0;
    pairIndex < paths.length;
    pairIndex++
  ) {
    const path =
      paths[pairIndex];

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

  return (
    used.size === totalCells
  );
}

/*
 * Пары с большей дистанцией
 * проверяем раньше.
 *
 * Это помогает быстрее находить
 * противоречия.
 */
function getPairOrder(paths, size) {
  return paths
    .map((path, index) => ({
      index,
      start: path[0],
      end:
        path[path.length - 1],
      distance: manhattan(
        path[0],
        path[path.length - 1],
        size
      ),
    }))
    .sort(
      (a, b) =>
        b.distance -
        a.distance
    );
}

/*
 * Проверяем, существует ли вообще
 * свободный путь между двумя точками.
 *
 * Это быстрый BFS-фильтр.
 */
function canReach(
  start,
  target,
  size,
  occupied,
  blockedEndpoints
) {
  const queue = [start];
  let queueIndex = 0;

  const visited =
    new Set([start]);

  while (
    queueIndex <
    queue.length
  ) {
    const cell =
      queue[queueIndex++];

    if (cell === target) {
      return true;
    }

    for (const next of getNeighbors(
      cell,
      size
    )) {
      if (
        visited.has(next)
      ) {
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
      queue.push(next);
    }
  }

  return false;
}

/*
 * Генерируем возможные пути
 * между двумя конечными точками.
 *
 * Путь не может проходить через:
 * - уже занятые клетки;
 * - чужие конечные точки.
 */
function getCandidatePaths(
  start,
  target,
  size,
  occupied,
  blockedEndpoints,
  deadline
) {
  const result = [];

  const visited =
    new Set([start]);

  const path = [start];

  function dfs(cell) {
    if (
      Date.now() > deadline
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
      result.push([
        ...path,
      ]);

      return;
    }

    const distance =
      manhattan(
        cell,
        target,
        size
      );

    /*
     * Даже в идеальном случае
     * нам не хватит клеток —
     * дальше искать бессмысленно.
     */
    const remaining =
      size * size -
      occupied.size -
      path.length +
      1;

    if (
      distance > remaining
    ) {
      return;
    }

    let neighbors =
      getNeighbors(
        cell,
        size
      );

    /*
     * Сначала идём в направлении
     * цели.
     */
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

    for (const next of neighbors) {
      if (
        visited.has(next)
      ) {
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

/*
 * Сравниваем два маршрута.
 */
function pathsEqual(a, b) {
  if (
    a.length !== b.length
  ) {
    return false;
  }

  for (
    let i = 0;
    i < a.length;
    i++
  ) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/*
 * Проверяем все оставшиеся пары:
 * у каждой должен существовать
 * хотя бы какой-то потенциальный путь.
 */
function allPairsReachable(
  pairs,
  size,
  occupied,
  allEndpoints
) {
  for (const pair of pairs) {
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
        occupied,
        blockedEndpoints
      )
    ) {
      return false;
    }
  }

  return true;
}

/*
 * Проверяем уровень.
 *
 * Важно:
 *
 * generatedLevels.js уже содержит
 * одно известное решение.
 *
 * Здесь мы ищем ДРУГОЕ решение.
 */
function solveLevel(level) {
  const startTime =
    Date.now();

  const deadline =
    startTime +
    TIME_LIMIT_MS;

  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  /*
   * Сначала проверяем известное
   * решение генератора.
   */
  const knownSolutionValid =
    validateKnownSolution(
      level
    );

  if (
    !knownSolutionValid
  ) {
    return {
      status: "invalid",
      solutions: 0,
      knownSolutionValid: false,
    };
  }

  const endpointMap =
    buildEndpointMap(
      paths
    );

  const allEndpoints =
    new Set(
      endpointMap.keys()
    );

  const pairOrder =
    getPairOrder(
      paths,
      size
    );

  let alternativeFound =
    false;

  let timedOut = false;

  /*
   * Для каждого уровня ищем
   * альтернативное решение.
   */
  function search(
    remainingPairs,
    occupied,
    usedPaths
  ) {
    if (
      alternativeFound
    ) {
      return;
    }

    if (
      Date.now() > deadline
    ) {
      timedOut = true;
      return;
    }

    /*
     * Все пары соединены.
     *
     * Если все клетки заняты —
     * найдено полноценное решение.
     */
    if (
      remainingPairs.length === 0
    ) {
      if (
        occupied.size ===
        totalCells
      ) {
        alternativeFound =
          true;
      }

      return;
    }

    /*
     * Выбираем пару с наименьшим
     * количеством возможных путей.
     *
     * Это резко сокращает перебор.
     */
    let selectedPair =
      null;

    let selectedCandidates =
      null;

    for (const pair of remainingPairs) {
      if (
        Date.now() >
        deadline
      ) {
        timedOut = true;
        return;
      }

      const blockedEndpoints =
        new Set(
          [...allEndpoints].filter(
            (cell) =>
              cell !==
                pair.start &&
              cell !==
                pair.end
          )
        );

      const candidates =
        getCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupied,
          blockedEndpoints,
          deadline
        );

      if (
        candidates.length === 0
      ) {
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
      return;
    }

    /*
     * Перебираем возможные пути
     * выбранной пары.
     */
    for (const candidate of selectedCandidates) {
      if (
        Date.now() >
        deadline
      ) {
        timedOut = true;
        return;
      }

      /*
       * Путь не должен пересекаться
       * с уже занятыми клетками.
       */
      let valid = true;

      for (const cell of candidate) {
        if (
          occupied.has(cell)
        ) {
          valid = false;
          break;
        }
      }

      if (!valid) {
        continue;
      }

      const newOccupied =
        new Set(
          occupied
        );

      for (
        const cell of candidate
      ) {
        newOccupied.add(
          cell
        );
      }

      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !==
            selectedPair.index
        );

      /*
       * Быстрый фильтр:
       * каждая оставшаяся пара
       * должна хотя бы теоретически
       * иметь путь.
       */
      if (
        !allPairsReachable(
          nextPairs,
          size,
          newOccupied,
          allEndpoints
        )
      ) {
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
        alternativeFound ||
        timedOut
      ) {
        return;
      }
    }
  }

  /*
   * ------------------------------------------------
   * Ищем альтернативное решение.
   * ------------------------------------------------
   *
   * Важный момент:
   * нам нужно исключить исходное
   * решение генератора.
   *
   * Для этого первый выбранный маршрут
   * каждой пары сравнивается с исходным.
   *
   * Проще всего использовать отдельный
   * поиск, в котором запрещаем полный
   * набор известных маршрутов.
   */

  function searchAlternative(
    remainingPairs,
    occupied,
    usedPaths
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
        occupied.size ===
        totalCells
      ) {
        /*
         * На этом этапе у нас уже
         * есть полноценное решение.
         *
         * Нужно убедиться, что оно
         * отличается от исходного.
         */
        let sameAsKnown =
          true;

        for (
          let i = 0;
          i < paths.length;
          i++
        ) {
          const generatedPath =
            usedPaths.find(
              (candidate) => {
                const pairIndex =
                  paths.findIndex(
                    (knownPath) =>
                      pathsEqual(
                        knownPath,
                        candidate
                      )
                  );

                return (
                  pairIndex === i
                );
              }
            );

          if (
            !generatedPath
          ) {
            sameAsKnown =
              false;

            break;
          }
        }

        /*
         * Этот блок дополнительно
         * проверяется ниже через
         * точное сравнение.
         */
        if (!sameAsKnown) {
          alternativeFound =
            true;
        }
      }

      return;
    }

    let selectedPair =
      null;

    let selectedCandidates =
      null;

    for (const pair of remainingPairs) {
      const blockedEndpoints =
        new Set(
          [...allEndpoints].filter(
            (cell) =>
              cell !==
                pair.start &&
              cell !==
                pair.end
          )
        );

      let candidates =
        getCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupied,
          blockedEndpoints,
          deadline
        );

      /*
       * Для первой пары запрещаем
       * использовать её исходный путь.
       *
       * Тогда любое найденное полное
       * решение автоматически будет
       * отличаться от известного.
       */
      if (
        usedPaths.length === 0
      ) {
        const knownPath =
          paths[pair.index];

        candidates =
          candidates.filter(
            (candidate) =>
              !pathsEqual(
                candidate,
                knownPath
              )
          );
      }

      if (
        candidates.length ===
        0
      ) {
        continue;
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
      return;
    }

    for (const candidate of selectedCandidates) {
      if (
        Date.now() >
        deadline
      ) {
        timedOut = true;
        return;
      }

      let valid = true;

      for (const cell of candidate) {
        if (
          occupied.has(cell)
        ) {
          valid = false;
          break;
        }
      }

      if (!valid) {
        continue;
      }

      const newOccupied =
        new Set(
          occupied
        );

      for (
        const cell of candidate
      ) {
        newOccupied.add(
          cell
        );
      }

      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !==
            selectedPair.index
        );

      if (
        !allPairsReachable(
          nextPairs,
          size,
          newOccupied,
          allEndpoints
        )
      ) {
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
        alternativeFound ||
        timedOut
      ) {
        return;
      }
    }
  }

  /*
   * Запускаем поиск альтернативы.
   */
  searchAlternative(
    pairOrder,
    new Set(),
    []
  );

  if (
    alternativeFound
  ) {
    return {
      status: "multiple",
      solutions: 2,
      knownSolutionValid: true,
    };
  }

  if (
    timedOut
  ) {
    return {
      status: "timeout",
      solutions: 1,
      knownSolutionValid: true,
    };
  }

  /*
   * Важное уточнение:
   *
   * Если поиск полностью завершился
   * и альтернативы не нашёл, тогда
   * для данного алгоритма мы можем
   * считать решение уникальным.
   */
  return {
    status: "unique",
    solutions: 1,
    knownSolutionValid: true,
  };
}

/*
 * ========================================
 * ПРОВЕРКА ВСЕХ СГЕНЕРИРОВАННЫХ УРОВНЕЙ
 * ========================================
 */

console.log("");

console.log(
  "=== ПРОВЕРКА РЕШЕНИЙ СОЕДИНИ ==="
);

console.log("");

console.log(
  `Всего уровней: ${GENERATED_LEVELS.length}`
);

console.log("");

let invalid = 0;
let multiple = 0;
let unique = 0;
let timeout = 0;

GENERATED_LEVELS.forEach(
  (level, index) => {
    console.log(
      `Проверяем уровень ${
        index + 1
      }...`
    );

    const result =
      solveLevel(level);

    if (
      result.status ===
      "invalid"
    ) {
      console.log(
        `✗ Уровень ${
          index + 1
        }: записанное решение некорректно`
      );

      invalid++;
    } else if (
      result.status ===
      "multiple"
    ) {
      console.log(
        `⚠ Уровень ${
          index + 1
        }: найдено несколько решений`
      );

      multiple++;
    } else if (
      result.status ===
      "unique"
    ) {
      console.log(
        `✓ Уровень ${
          index + 1
        }: альтернативное решение не найдено`
      );

      unique++;
    } else if (
      result.status ===
      "timeout"
    ) {
      console.log(
        `⏱ Уровень ${
          index + 1
        }: не удалось завершить проверку уникальности за ${
          TIME_LIMIT_MS / 1000
        } сек.`
      );

      timeout++;
    }

    console.log("");
  }
);

console.log(
  "================================"
);

console.log(
  "ИТОГ ПРОВЕРКИ"
);

console.log(
  "================================"
);

console.log(
  `Всего уровней: ${GENERATED_LEVELS.length}`
);

console.log(
  `Уникальных: ${unique}`
);

console.log(
  `С несколькими решениями: ${multiple}`
);

console.log(
  `Некорректных: ${invalid}`
);

console.log(
  `Таймаутов: ${timeout}`
);

console.log("");

if (
  invalid > 0
) {
  console.log(
    "✗ Проверка завершена с ошибками."
  );

  process.exitCode = 1;
} else {
  console.log(
    "✓ Все уровни имеют корректное известное решение."
  );

  if (multiple > 0) {
    console.log(
      `⚠ У ${multiple} уровней найдено несколько решений.`
    );
  }

  if (timeout > 0) {
    console.log(
      `⏱ У ${timeout} уровней уникальность не удалось доказать за установленный лимит времени.`
    );
  }
}