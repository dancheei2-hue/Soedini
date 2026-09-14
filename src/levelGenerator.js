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
 * Создаём маршрут через все клетки поля.
 * Каждая клетка используется ровно один раз.
 */
function generateHamiltonianPath(size) {
  const total = size * size;

  /*
   * Сначала несколько попыток случайного DFS.
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
          const degreeA = getNeighbors(a, size)
            .filter((x) => !visited.has(x))
            .length;

          const degreeB = getNeighbors(b, size)
            .filter((x) => !visited.has(x))
            .length;

          return degreeA - degreeB;
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
 * Разрезаем полный маршрут на несколько пар.
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
     * Стараемся распределять клетки
     * между парами относительно равномерно.
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
 * Проверка корректности уровня.
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
 * Превращаем маршрут в битовую маску.
 */
function pathMask(path) {
  let mask = 0n;

  for (const cell of path) {
    mask |= 1n << BigInt(cell);
  }

  return mask;
}


/*
 * Проверяем, может ли пара пройти
 * из одной точки в другую.
 */
function canReach(
  start,
  target,
  size,
  occupied,
  blocked
) {
  const queue = [start];
  const visited = new Set([start]);

  let head = 0;

  while (head < queue.length) {
    const cell = queue[head++];

    if (cell === target) {
      return true;
    }

    for (const next of getNeighbors(cell, size)) {
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
      queue.push(next);
    }
  }

  return false;
}


/*
 * Проверяем, что все остальные пары
 * хотя бы теоретически ещё могут соединиться.
 */
function allPairsReachable(
  paths,
  currentPairIndex,
  size,
  occupied
) {
  const blocked = new Set();

  for (let i = 0; i < paths.length; i++) {
    if (i === currentPairIndex) {
      continue;
    }

    blocked.add(paths[i][0]);

    blocked.add(
      paths[i][paths[i].length - 1]
    );
  }

  for (let i = 0; i < paths.length; i++) {
    if (i === currentPairIndex) {
      continue;
    }

    const start = paths[i][0];

    const end =
      paths[i][paths[i].length - 1];

    if (
      !canReach(
        start,
        end,
        size,
        occupied,
        blocked
      )
    ) {
      return false;
    }
  }

  return true;
}


/*
 * Ищем альтернативный путь для конкретной пары.
 */
function findAlternativePath(
  path,
  paths,
  pairIndex,
  size,
  deadline
) {
  const start = path[0];

  const target =
    path[path.length - 1];

  const knownMask =
    pathMask(path);

  const occupied = new Set();

  /*
   * Все клетки остальных пар считаются занятыми.
   */
  for (let i = 0; i < paths.length; i++) {
    if (i === pairIndex) {
      continue;
    }

    for (const cell of paths[i]) {
      occupied.add(cell);
    }
  }

  /*
   * Конечные точки остальных пар нельзя занимать.
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

  const visited = new Set([start]);
  const currentPath = [start];

  let alternative = null;
  let timedOut = false;

  function dfs(cell) {
    if (Date.now() > deadline) {
      timedOut = true;
      return;
    }

    if (alternative) {
      return;
    }

    if (cell === target) {
      const mask =
        pathMask(currentPath);

      if (mask !== knownMask) {
        alternative = [...currentPath];
      }

      return;
    }

    let neighbors = getNeighbors(
      cell,
      size
    );

    neighbors = shuffle(neighbors);

    /*
     * Сначала рассматриваем клетки,
     * которые ближе к цели.
     */
    neighbors.sort(
      (a, b) =>
        manhattan(a, target, size) -
        manhattan(b, target, size)
    );

    for (const next of neighbors) {
      if (alternative || timedOut) {
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
      currentPath.push(next);

      dfs(next);

      currentPath.pop();
      visited.delete(next);
    }
  }

  dfs(start);

  return {
    alternative,
    timedOut,
  };
}


/*
 * Проверяем, не имеет ли уровень
 * очевидного второго решения.
 *
 * Это только быстрый фильтр.
 * Полная проверка выполняется отдельно
 * через npm run solve.
 */
function hasObviousAlternative(level) {
  const {
    size,
    paths,
  } = level;

  const deadline =
    Date.now() +
    (size <= 6 ? 400 : 700);

  /*
   * Проверяем пары по очереди.
   */
  for (
    let pairIndex = 0;
    pairIndex < paths.length;
    pairIndex++
  ) {
    if (
      Date.now() > deadline
    ) {
      return false;
    }

    const result =
      findAlternativePath(
        paths[pairIndex],
        paths,
        pairIndex,
        size,
        deadline
      );

    if (
      result.timedOut
    ) {
      return false;
    }

    if (
      result.alternative
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
  const {
    size,
    paths,
  } = level;

  const pairCount =
    paths.length;

  const totalCells =
    size * size;

  const average =
    totalCells / pairCount;

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
 * ============================================================
 * ГЛАВНАЯ ФУНКЦИЯ
 * ============================================================
 *
 * scripts/generateLevels.js вызывает:
 *
 * generateLevel({
 *   size,
 *   pairCount
 * })
 *
 * Функция должна вернуть:
 *
 * {
 *   size,
 *   paths,
 *   difficulty
 * }
 *
 * либо null, если подходящий вариант
 * не удалось создать.
 */

export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  let attempts;

  if (size <= 5) {
    attempts = 30;
  } else if (size === 6) {
    attempts = 35;
  } else if (size === 7) {
    attempts = 45;
  } else if (size === 8) {
    attempts = 60;
  } else {
    attempts = 80;
  }

  for (
    let attempt = 0;
    attempt < attempts;
    attempt++
  ) {
    /*
     * Создаём полный маршрут.
     */
    const fullPath =
      generateHamiltonianPath(size);

    if (!fullPath) {
      continue;
    }

    /*
     * Разрезаем его на пары.
     */
    const paths =
      splitPath(
        fullPath,
        pairCount
      );

    if (!paths) {
      continue;
    }

    /*
     * Перемешиваем порядок пар.
     */
    const level = {
      size,
      paths: shuffle(paths),
    };

    /*
     * Проверяем базовую корректность.
     */
    if (
      !validateLevel(level)
    ) {
      continue;
    }

    /*
     * ВАЖНО:
     *
     * Здесь пока НЕ отбраковываем уровень
     * по полной проверке уникальности.
     *
     * Иначе на больших полях генератор
     * может практически остановиться.
     *
     * Уникальность проверяется отдельным
     * solveLevels.js.
     */

    return {
      ...level,
      difficulty:
        calculateDifficulty(level),
    };
  }

  return null;
}


/*
 * Дополнительная функция для генерации
 * нескольких уровней.
 */
export function generateLevels({
  count = 10,
  size = 7,
  pairCount = 5,
} = {}) {
  const result = [];

  let attempts = 0;

  const maxAttempts =
    count * 100;

  while (
    result.length < count &&
    attempts < maxAttempts
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