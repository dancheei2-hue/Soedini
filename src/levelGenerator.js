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

/*
 * Гарантированный Hamiltonian-маршрут.
 *
 * Для квадратного поля используем змейку.
 * Затем случайно выбираем горизонтальный
 * или вертикальный вариант.
 *
 * Такой маршрут всегда:
 * - проходит через все клетки;
 * - не повторяет клетки;
 * - состоит только из соседних клеток.
 */
function generateHamiltonianPath(size) {
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
 * Разрезаем полный маршрут на заданное
 * количество пар.
 *
 * Каждая пара получает минимум 2 клетки.
 */
function splitPath(fullPath, pairCount) {
  const total = fullPath.length;

  if (!Number.isInteger(pairCount)) {
    return null;
  }

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

  if (!Number.isInteger(size) || size < 2) {
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
 * Оценка сложности.
 */
function calculateDifficulty(level) {
  const {
    size,
    paths,
  } = level;

  const pairCount = paths.length;
  const totalCells = size * size;

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

  /*
   * Учитываем:
   * - размер поля;
   * - количество пар;
   * - неравномерность длин маршрутов.
   */
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
 * Создание одного уровня.
 *
 * ВАЖНО:
 * Здесь нет случайного DFS, который может
 * закончиться неудачей.
 *
 * Поэтому функция должна гарантированно
 * вернуть уровень при корректных параметрах.
 */
export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  if (!Number.isInteger(size) || size < 2) {
    return null;
  }

  if (
    !Number.isInteger(pairCount) ||
    pairCount < 2
  ) {
    return null;
  }

  if (pairCount * 2 > size * size) {
    return null;
  }

  const fullPath =
    generateHamiltonianPath(size);

  const paths =
    splitPath(
      fullPath,
      pairCount
    );

  if (!paths) {
    return null;
  }

  const level = {
    size,
    paths: shuffle(paths),
  };

  if (!validateLevel(level)) {
    return null;
  }

  return {
    ...level,
    difficulty:
      calculateDifficulty(level),
  };
}


/*
 * Генерация нескольких уровней.
 */
export function generateLevels({
  count = 10,
  size = 7,
  pairCount = 5,
} = {}) {
  const result = [];

  for (let i = 0; i < count; i++) {
    const level =
      generateLevel({
        size,
        pairCount,
      });

    if (!level) {
      throw new Error(
        `Не удалось создать уровень ${i + 1}: ` +
        `${size}×${size}, ${pairCount} пар`
      );
    }

    result.push(level);
  }

  return result;
}