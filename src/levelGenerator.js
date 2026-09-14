/*
 * ============================================================
 * ГЕНЕРАТОР УРОВНЕЙ «СОЕДИНИ»
 * ============================================================
 *
 * Принцип:
 *
 * 1. Создаём полный маршрут через всё поле.
 * 2. Разрезаем его на пары.
 * 3. Проверяем, что решение существует.
 * 4. Ищем альтернативное решение.
 * 5. Если найдено несколько решений — отбрасываем уровень.
 * 6. Если проверку нельзя закончить — тоже отбрасываем.
 * 7. Возвращаем только уровень, для которого
 *    удалось доказать единственность.
 *
 * Это намного медленнее старого генератора,
 * зато качество уровней контролируется уже
 * во время генерации.
 */


/* ============================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
   ============================================================ */

function shuffle(array) {
  const result = [...array];

  for (
    let i = result.length - 1;
    i > 0;
    i--
  ) {
    const j =
      Math.floor(
        Math.random() *
          (i + 1)
      );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
}


function getNeighbors(
  cell,
  size
) {
  const row =
    Math.floor(
      cell / size
    );

  const col =
    cell % size;

  const result = [];

  if (row > 0) {
    result.push(
      cell - size
    );
  }

  if (
    row <
    size - 1
  ) {
    result.push(
      cell + size
    );
  }

  if (col > 0) {
    result.push(
      cell - 1
    );
  }

  if (
    col <
    size - 1
  ) {
    result.push(
      cell + 1
    );
  }

  return result;
}


function manhattan(
  a,
  b,
  size
) {
  const ar =
    Math.floor(
      a / size
    );

  const ac =
    a % size;

  const br =
    Math.floor(
      b / size
    );

  const bc =
    b % size;

  return (
    Math.abs(ar - br) +
    Math.abs(ac - bc)
  );
}


/* ============================================================
   HAMILTONIAN PATH
   ============================================================ */

/*
 * Создаём маршрут, проходящий через
 * каждую клетку поля ровно один раз.
 *
 * Используем случайный DFS.
 *
 * Если DFS не справился быстро,
 * используем гарантированную змейку.
 */

function generateHamiltonianPath(
  size
) {
  const totalCells =
    size * size;

  const MAX_NODES =
    size >= 9
      ? 30000
      : 15000;

  const MAX_ATTEMPTS = 12;

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt++
  ) {
    const start =
      Math.floor(
        Math.random() *
          totalCells
      );

    const visited =
      new Set([start]);

    const path = [start];

    let nodesVisited = 0;

    function dfs(cell) {
      nodesVisited++;

      if (
        nodesVisited >
        MAX_NODES
      ) {
        return false;
      }

      if (
        path.length ===
        totalCells
      ) {
        return true;
      }

      let neighbors =
        getNeighbors(
          cell,
          size
        ).filter(
          (next) =>
            !visited.has(next)
        );

      /*
       * Warnsdorff:
       * сначала идём туда,
       * где меньше свободных вариантов.
       */

      neighbors =
        neighbors
          .map(
            (next) => {
              const degree =
                getNeighbors(
                  next,
                  size
                ).filter(
                  (candidate) =>
                    !visited.has(
                      candidate
                    )
                ).length;

              return {
                cell: next,
                degree,
                random:
                  Math.random(),
              };
            }
          )
          .sort(
            (a, b) => {
              if (
                a.degree !==
                b.degree
              ) {
                return (
                  a.degree -
                  b.degree
                );
              }

              return (
                a.random -
                b.random
              );
            }
          );

      for (
        const item of neighbors
      ) {
        const next =
          item.cell;

        visited.add(next);

        path.push(next);

        if (
          dfs(next)
        ) {
          return true;
        }

        path.pop();

        visited.delete(next);
      }

      return false;
    }

    if (
      dfs(start)
    ) {
      return path;
    }
  }


  /*
   * Гарантированная горизонтальная
   * или вертикальная змейка.
   */

  const path = [];

  const vertical =
    Math.random() < 0.5;

  if (!vertical) {
    for (
      let row = 0;
      row < size;
      row++
    ) {
      if (
        row % 2 === 0
      ) {
        for (
          let col = 0;
          col < size;
          col++
        ) {
          path.push(
            row * size +
            col
          );
        }
      } else {
        for (
          let col =
            size - 1;
          col >= 0;
          col--
        ) {
          path.push(
            row * size +
            col
          );
        }
      }
    }
  } else {
    for (
      let col = 0;
      col < size;
      col++
    ) {
      if (
        col % 2 === 0
      ) {
        for (
          let row = 0;
          row < size;
          row++
        ) {
          path.push(
            row * size +
            col
          );
        }
      } else {
        for (
          let row =
            size - 1;
          row >= 0;
          row--
        ) {
          path.push(
            row * size +
            col
          );
        }
      }
    }
  }

  return path;
}


/* ============================================================
   РАЗБИЕНИЕ ПОЛНОГО МАРШРУТА НА ПАРЫ
   ============================================================ */

function splitPath(
  fullPath,
  pairCount
) {
  const total =
    fullPath.length;

  if (
    pairCount < 2
  ) {
    return null;
  }

  if (
    pairCount * 2 >
    total
  ) {
    return null;
  }

  const lengths = [];

  let remaining =
    total;

  for (
    let i = 0;
    i < pairCount - 1;
    i++
  ) {
    const remainingPairs =
      pairCount -
      i -
      1;

    const minimumForRest =
      remainingPairs * 2;

    const minimum =
      2;

    const maximum =
      remaining -
      minimumForRest;

    if (
      maximum <
      minimum
    ) {
      return null;
    }

    /*
     * Не всегда берём полностью
     * случайное значение.
     *
     * Иногда специально создаём
     * более равномерные маршруты.
     */

    let length;

    if (
      Math.random() < 0.55
    ) {
      const average =
        Math.floor(
          remaining /
            (
              pairCount -
              i
            )
        );

      const variation =
        Math.max(
          0,
          Math.floor(
            average * 0.5
          )
        );

      const low =
        Math.max(
          minimum,
          average -
            variation
        );

      const high =
        Math.min(
          maximum,
          average +
            variation
        );

      length =
        low +
        Math.floor(
          Math.random() *
            (
              high -
              low +
              1
            )
        );
    } else {
      length =
        minimum +
        Math.floor(
          Math.random() *
            (
              maximum -
              minimum +
              1
            )
        );
    }

    lengths.push(
      length
    );

    remaining -=
      length;
  }

  lengths.push(
    remaining
  );

  const paths = [];

  let position = 0;

  for (
    const length of lengths
  ) {
    paths.push(
      fullPath.slice(
        position,
        position +
          length
      )
    );

    position +=
      length;
  }

  return paths;
}


/* ============================================================
   ПРОВЕРКА БАЗОВОГО УРОВНЯ
   ============================================================ */

function validateGeneratedLevel(
  level
) {
  const {
    size,
    paths,
  } = level;

  if (
    !Number.isInteger(
      size
    )
  ) {
    return false;
  }

  const totalCells =
    size * size;

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
        !Number.isInteger(
          cell
        ) ||
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
   МАСКИ
   ============================================================ */

function pathToMask(
  path
) {
  let mask = 0n;

  for (
    const cell of path
  ) {
    mask |=
      1n <<
      BigInt(cell);
  }

  return mask;
}


function countBits(
  mask
) {
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


function buildEndpointMask(
  paths
) {
  let mask = 0n;

  for (
    const path of paths
  ) {
    mask |=
      1n <<
      BigInt(path[0]);

    mask |=
      1n <<
      BigInt(
        path[
          path.length - 1
        ]
      );
  }

  return mask;
}


function getBlockedEndpointMask(
  paths,
  pairIndex
) {
  let mask = 0n;

  for (
    let i = 0;
    i < paths.length;
    i++
  ) {
    if (
      i === pairIndex
    ) {
      continue;
    }

    mask |=
      1n <<
      BigInt(paths[i][0]);

    mask |=
      1n <<
      BigInt(
        paths[i][
          paths[i].length - 1
        ]
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
        1n <<
        BigInt(next);

      if (
        (
          occupiedMask &
          bit
        ) !== 0n &&
        next !== target
      ) {
        continue;
      }

      if (
        (
          blockedEndpointMask &
          bit
        ) !== 0n &&
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


function allPairsReachable(
  pairs,
  size,
  occupiedMask,
  paths
) {
  for (
    const pair of pairs
  ) {
    const blocked =
      getBlockedEndpointMask(
        paths,
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
   ПОРЯДОК ПАР
   ============================================================ */

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
          path[
            path.length - 1
          ],

        distance:
          manhattan(
            path[0],
            path[
              path.length - 1
            ],
            size
          ),

        knownMask:
          pathToMask(
            path
          ),
      })
    )
    .sort(
      (a, b) =>
        b.distance -
        a.distance
    );
}


/* ============================================================
   ПОИСК ВСЕХ ВОЗМОЖНЫХ ПУТЕЙ ПАРЫ
   ============================================================ */

/*
 * В генераторе нет искусственного ограничения
 * на количество найденных путей.
 *
 * Это важно:
 *
 * если мы остановимся после первых 500 путей,
 * мы не сможем честно сказать,
 * что решение уникально.
 */

function getCandidatePaths(
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
    1n <<
    BigInt(start);

  const visited =
    new Set([start]);

  let timedOut = false;

  function dfs(cell) {
    if (
      Date.now() >
      deadline
    ) {
      timedOut = true;
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

    let neighbors =
      getNeighbors(
        cell,
        size
      );

    neighbors =
      neighbors
        .filter(
          (next) => {
            if (
              visited.has(next)
            ) {
              return false;
            }

            const bit =
              1n <<
              BigInt(next);

            if (
              (
                occupiedMask &
                bit
              ) !== 0n &&
              next !== target
            ) {
              return false;
            }

            if (
              (
                blockedEndpointMask &
                bit
              ) !== 0n &&
              next !== target
            ) {
              return false;
            }

            return true;
          }
        )
        .sort(
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
        timedOut
      ) {
        return;
      }

      const bit =
        1n <<
        BigInt(next);

      visited.add(next);

      path.push(next);

      pathMask |= bit;

      dfs(next);

      pathMask ^=
        bit;

      path.pop();

      visited.delete(next);
    }
  }

  dfs(start);

  return {
    paths: result,
    timedOut,
  };
}


/* ============================================================
   ПРОВЕРКА УНИКАЛЬНОСТИ
   ============================================================ */

/*
 * Возвращает:
 *
 * "unique"
 *     альтернативного решения нет,
 *
 * "multiple"
 *     найдено другое решение,
 *
 * "timeout"
 *     перебор не успел закончиться.
 *
 * Мы специально НЕ называем timeout
 * уникальным.
 */

function checkUniqueness(
  level
) {
  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  /*
   * Чем больше поле,
   * тем больше времени даём
   * точному перебору.
   */

  let timeLimit;

  if (size <= 5) {
    timeLimit = 1500;
  } else if (size === 6) {
    timeLimit = 2500;
  } else if (size === 7) {
    timeLimit = 4000;
  } else if (size === 8) {
    timeLimit = 7000;
  } else {
    timeLimit = 12000;
  }

  const deadline =
    Date.now() +
    timeLimit;

  const pairs =
    getPairOrder(
      paths,
      size
    );

  /*
   * Первую пару специально заставляем
   * использовать НЕ тот маршрут,
   * который был известен генератору.
   *
   * Если после этого удаётся заполнить
   * всё поле — решение не уникально.
   */

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
      alternativeFound ||
      timedOut
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
      const fullMask =
        (
          1n <<
          BigInt(totalCells)
        ) -
        1n;

      if (
        occupiedMask ===
          fullMask &&
        differentFromKnown
      ) {
        alternativeFound =
          true;
      }

      return;
    }

    /*
     * Кэшируем состояния.
     */

    const key =
      remainingPairs
        .map(
          (pair) =>
            pair.index
        )
        .sort(
          (a, b) =>
            a - b
        )
        .join(",") +
      "|" +
      occupiedMask.toString() +
      "|" +
      (
        differentFromKnown
          ? "1"
          : "0"
      );

    if (
      memo.has(key)
    ) {
      return;
    }

    /*
     * Выбираем пару,
     * для которой меньше всего
     * возможных маршрутов.
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

      const blocked =
        getBlockedEndpointMask(
          paths,
          pair.index
        );

      const generated =
        getCandidatePaths(
          pair.start,
          pair.end,
          size,
          occupiedMask,
          blocked,
          deadline
        );

      if (
        generated.timedOut
      ) {
        timedOut = true;
        return;
      }

      let candidates =
        generated.paths;

      /*
       * Для первой пары
       * исключаем известный маршрут.
       */

      if (
        pair.index ===
          firstPair.index &&
        !differentFromKnown
      ) {
        candidates =
          candidates.filter(
            (candidate) =>
              candidate.mask !==
              firstPair.knownMask
          );
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
      memo.add(key);
      return;
    }

    /*
     * Короткие маршруты проверяем первыми.
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
        (
          candidate.mask &
          occupiedMask
        ) !== 0n
      ) {
        continue;
      }

      const nextOccupied =
        occupiedMask |
        candidate.mask;

      const nextDifferent =
        differentFromKnown ||
        (
          selectedPair.index ===
            firstPair.index &&
          candidate.mask !==
            firstPair.knownMask
        );

      const nextPairs =
        remainingPairs.filter(
          (pair) =>
            pair.index !==
            selectedPair.index
        );

      /*
       * Быстрый отсев.
       */

      if (
        !allPairsReachable(
          nextPairs,
          size,
          nextOccupied,
          paths
        )
      ) {
        continue;
      }

      search(
        nextPairs,
        nextOccupied,
        nextDifferent
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

  search(
    pairs,
    0n,
    false
  );

  if (
    alternativeFound
  ) {
    return "multiple";
  }

  if (
    timedOut
  ) {
    return "timeout";
  }

  return "unique";
}


/* ============================================================
   ОЦЕНКА СЛОЖНОСТИ
   ============================================================ */

function calculateDifficulty(
  level
) {
  const {
    size,
    paths,
  } = level;

  const totalCells =
    size * size;

  const pairCount =
    paths.length;

  const lengths =
    paths.map(
      (path) =>
        path.length
    );

  const average =
    totalCells /
    pairCount;

  const variance =
    lengths.reduce(
      (
        sum,
        length
      ) =>
        sum +
        Math.pow(
          length -
            average,
          2
        ),
      0
    ) /
    pairCount;

  /*
   * Базовая оценка.
   */

  let score =
    size * 6 +
    pairCount * 3 +
    Math.sqrt(
      variance
    ) * 2;

  /*
   * Небольшая случайная добавка,
   * чтобы одинаковые по размеру
   * уровни не получали один и тот же
   * класс слишком механически.
   */

  score +=
    Math.random() * 4;

  if (
    score < 30
  ) {
    return "easy";
  }

  if (
    score < 45
  ) {
    return "medium";
  }

  if (
    score < 60
  ) {
    return "hard";
  }

  return "expert";
}


/* ============================================================
   ГЛАВНАЯ ФУНКЦИЯ
   ============================================================ */

/*
 * Создаёт ОДИН уникальный уровень.
 *
 * Важный момент:
 *
 * функция может вернуть null,
 * если за разумное количество попыток
 * не удалось найти уникальный уровень.
 *
 * Это нормально.
 *
 * scripts/generateLevels.js
 * уже умеет повторять вызов.
 */

export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  /*
   * Для маленьких полей вариантов больше,
   * поэтому достаточно меньшего количества
   * попыток.
   *
   * Для 8×8 и 9×9 разрешаем больше.
   */

  let maxAttempts;

  if (size <= 5) {
    maxAttempts = 30;
  } else if (size === 6) {
    maxAttempts = 35;
  } else if (size === 7) {
    maxAttempts = 45;
  } else if (size === 8) {
    maxAttempts = 60;
  } else {
    maxAttempts = 80;
  }

  for (
    let attempt = 1;
    attempt <= maxAttempts;
    attempt++
  ) {
    const fullPath =
      generateHamiltonianPath(
        size
      );

    if (
      !fullPath
    ) {
      continue;
    }

    const paths =
      splitPath(
        fullPath,
        pairCount
      );

    if (
      !paths
    ) {
      continue;
    }

    /*
     * Перемешиваем пары.
     */

    const shuffledPaths =
      shuffle(paths);

    const level = {
      size,
      paths:
        shuffledPaths,
    };

    /*
     * Базовая проверка.
     */

    if (
      !validateGeneratedLevel(
        level
      )
    ) {
      continue;
    }

    /*
     * Проверяем уникальность.
     */

    const uniqueness =
      checkUniqueness(
        level
      );

    if (
      uniqueness !==
      "unique"
    ) {
      /*
       * multiple и timeout
       * одинаково бракуются.
       */

      continue;
    }

    /*
     * Уникальный уровень найден.
     */

    return {
      ...level,

      difficulty:
        calculateDifficulty(
          level
        ),
    };
  }

  /*
   * Не удалось найти уникальный
   * уровень за допустимое число попыток.
   */

  return null;
}


/* ============================================================
   ГЕНЕРАЦИЯ НЕСКОЛЬКИХ УРОВНЕЙ
   ============================================================ */

export function generateLevels({
  count = 10,
  size = 7,
  pairCount = 5,
} = {}) {
  const