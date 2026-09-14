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

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function manhattan(a, b, size) {
  const ar = Math.floor(a / size);
  const ac = a % size;
  const br = Math.floor(b / size);
  const bc = b % size;

  return Math.abs(ar - br) + Math.abs(ac - bc);
}


/*
 * Создаём Hamiltonian path:
 * маршрут через все клетки ровно один раз.
 */
function generateHamiltonianPath(size) {
  const total = size * size;

  /*
   * Сначала пробуем несколько случайных DFS.
   */
  for (let attempt = 0; attempt < 20; attempt++) {
    const start = Math.floor(Math.random() * total);

    const visited = new Set([start]);
    const path = [start];

    let nodes = 0;
    const maxNodes = 20000;

    function dfs(cell) {
      nodes++;

      if (nodes > maxNodes) {
        return false;
      }

      if (path.length === total) {
        return true;
      }

      const neighbors = shuffle(
        getNeighbors(cell, size)
      )
        .filter((next) => !visited.has(next))
        .sort((a, b) => {
          const da = getNeighbors(a, size)
            .filter((x) => !visited.has(x))
            .length;

          const db = getNeighbors(b, size)
            .filter((x) => !visited.has(x))
            .length;

          return da - db;
        });

      for (const next of neighbors) {
        visited.add(next);
        path.push(next);

        if (dfs(next)) {
          return true;
        }

        path.pop();
        visited.delete(next);
      }

      return false;
    }

    if (dfs(start)) {
      return path;
    }
  }

  /*
   * Гарантированная змейка.
   */
  const path = [];

  if (Math.random() < 0.5) {
    for (let row = 0; row < size; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < size; col++) {
          path.push(row * size + col);
        }
      } else {
        for (let col = size - 1; col >= 0; col--) {
          path.push(row * size + col);
        }
      }
    }
  } else {
    for (let col = 0; col < size; col++) {
      if (col % 2 === 0) {
        for (let row = 0; row < size; row++) {
          path.push(row * size + col);
        }
      } else {
        for (let row = size - 1; row >= 0; row--) {
          path.push(row * size + col);
        }
      }
    }
  }

  return path;
}


/*
 * Разрезаем полный маршрут на пары.
 */
function splitPath(fullPath, pairCount) {
  const total = fullPath.length;

  if (pairCount < 2) {
    return null;
  }

  if (pairCount * 2 > total) {
    return null;
  }

  const lengths = [];

  let remaining = total;

  for (let i = 0; i < pairCount - 1; i++) {
    const pairsLeft = pairCount - i - 1;

    const minLength = 2;
    const maxLength =
      remaining - pairsLeft * 2;

    if (maxLength < minLength) {
      return null;
    }

    /*
     * Предпочитаем более равномерное
     * распределение клеток.
     */
    const average = Math.floor(
      remaining / (pairCount - i)
    );

    const low = Math.max(
      minLength,
      average - 2
    );

    const high = Math.min(
      maxLength,
      average + 2
    );

    const length =
      low +
      Math.floor(
        Math.random() * (high - low + 1)
      );

    lengths.push(length);
    remaining -= length;
  }

  lengths.push(remaining);

  const paths = [];

  let position = 0;

  for (const length of lengths) {
    paths.push(
      fullPath.slice(
        position,
        position + length
      )
    );

    position += length;
  }

  return paths;
}


/*
 * Проверка корректности известного решения.
 */
function validateLevel(level) {
  const { size, paths } = level;

  if (!Number.isInteger(size)) {
    return false;
  }

  if (!Array.isArray(paths) || paths.length < 2) {
    return false;
  }

  const total = size * size;
  const used = new Set();

  for (const path of paths) {
    if (!Array.isArray(path) || path.length < 2) {
      return false;
    }

    for (let i = 0; i < path.length; i++) {
      const cell = path[i];

      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= total
      ) {
        return false;
      }

      if (used.has(cell)) {
        return false;
      }

      if (i > 0) {
        const previous = path[i - 1];

        if (
          !getNeighbors(previous, size).includes(cell)
        ) {
          return false;
        }
      }

      used.add(cell);
    }
  }

  return used.size === total;
}


/*
 * Маска клеток.
 */
function pathMask(path) {
  let mask = 0n;

  for (const cell of path) {
    mask |= 1n << BigInt(cell);
  }

  return mask;
}


/*
 * Проверяем, существует ли альтернативный
 * путь между двумя точками при занятых клетках.
 */
function findPath(
  start,
  target,
  size,
  occupied,
  blocked,
  deadline
) {
  const path = [start];
  const visited = new Set([start]);

  let found = null;
  let timedOut = false;

  function dfs(cell) {
    if (Date.now() > deadline) {
      timedOut = true;
      return;
    }

    if (cell === target) {
      found = [...path];
      return;
    }

    const neighbors = shuffle(
      getNeighbors(cell, size)
    ).sort(
      (a, b) =>
        manhattan(a, target, size) -
        manhattan(b, target, size)
    );

    for (const next of neighbors) {
      if (found || timedOut) {
        return;
      }

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
        blocked.has(next) &&
        next !== target
      ) {
        continue;
      }

      visited.add(next);
      path.push(next);

      dfs(next);

      path.pop();
      visited.delete(next);
    }
  }

  dfs(start);

  return {
    path: found,
    timedOut,
  };
}


/*
 * Проверяем, что у уровня есть хотя бы
 * один другой способ соединить одну из пар.
 *
 * Это не полный математический доказатель
 * уникальности, но хороший быстрый фильтр.
 */
function hasObviousAlternative(level) {
  const { size, paths } = level;

  const deadline =
    Date.now() +
    (size <= 6 ? 800 : 1800);

  /*
   * Проверяем каждую пару.
   */
  for (let pairIndex = 0; pairIndex < paths.length; pairIndex++) {
    const known = paths[pairIndex];

    const occupied = new Set();

    for (let i = 0; i < paths.length; i++) {
      if (i === pairIndex) {
        continue;
      }

      for (const cell of paths[i]) {
        occupied.add(cell);
      }
    }

    /*
     * Запрещаем остальные конечные точки.
     */
    const blocked = new Set();

    for (let i = 0; i < paths.length; i++) {
      if (i === pairIndex) {
        continue;
      }

      blocked.add(paths[i][0]);
      blocked.add(
        paths[i][paths[i].length - 1]
      );
    }

    const alternative = findPath(
      known[0],
      known[known.length - 1],
      size,
      occupied,
      blocked,
      deadline
    );

    if (alternative.timedOut) {
      /*
       * Если не успели проверить,
       * не бракуем уровень автоматически.
       */
      continue;
    }

    if (!alternative.path) {
      continue;
    }

    const alternativeMask =
      pathMask(alternative.path);

    const knownMask =
      pathMask(known);

    if (
      alternativeMask !== knownMask
    ) {
      return true;
    }
  }

  return false;
}


/*
 * Оценка сложности.
 */
function calculateDifficulty(level) {
  const { size, paths } = level;

  const pairCount = paths.length;

  const average =
    (size * size) / pairCount;

  const variance =
    paths.reduce(
      (sum, path) =>
        sum +
        Math.pow(
          path.length - average,
          2
        ),
      0
    ) / pairCount;

  const score =
    size * 5 +
    pairCount * 3 +
    Math.sqrt(variance) * 2;

  if (score < 30) {
    return "easy";
  }

  if (score < 42) {
    return "medium";
  }

  if (score < 56) {
    return "hard";
  }

  return "expert";
}


/*
 * Главная функция.
 *
 * scripts/generateLevels.js ожидает именно
 * generateLevel({ size, pairCount }).
 */
export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  /*
   * Для каждого вызова пробуем несколько
   * разных вариантов.
   */
  const attempts =
    size <= 5
      ? 30
      : size === 6
        ? 35
        : size === 7
          ? 45
          : size === 8
            ? 60
            : 80;

  for (
    let attempt = 0;
    attempt < attempts;
    attempt++
  ) {
    const fullPath =
      generateHamiltonianPath(size);

    if (!fullPath) {
      continue;
    }

    const paths =
      splitPath(
        fullPath,
        pairCount
      );

    if (!paths) {
      continue;
    }

    const level = {
      size,
      paths: shuffle(paths),
    };

    if (!validateLevel(level)) {
      continue;
    }

    /*
     * Быстрый фильтр альтернатив.
     *
     * Если найден очевидный второй путь,
     * уровень отбрасываем.
     */
    if (
      hasObviousAlternative(level)
    ) {
      continue;
    }

    return {
      ...level,
      difficulty:
        calculateDifficulty(level),
    };
  }

  /*
   * Если не удалось получить подходящий
   * вариант — возвращаем null.
   *
   * scripts/generateLevels.js умеет
   * повторять попытку.
   */
  return null;
}


/*
 * Дополнительный экспорт.
 */
export function generateLevels({
  count = 10,
  size = 7,
  pairCount = 5,
} = {}) {
  const result = [];

  let attempts = 0;

  while (
    result.length < count &&
    attempts < count * 100
  ) {
    attempts++;

    const level =
      generateLevel({
        size,
        pairCount,
      });

    if (level) {
      result.push(level);
    }
  }

  return result;
}