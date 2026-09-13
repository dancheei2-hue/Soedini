function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(
      Math.random() * (i + 1)
    );

    [result[i], result[j]] = [
      result[j],
      result[i],
    ];
  }

  return result;
}

function getNeighbors(cell, size) {
  const row = Math.floor(cell / size);
  const col = cell % size;

  const neighbors = [];

  if (row > 0) {
    neighbors.push(cell - size);
  }

  if (row < size - 1) {
    neighbors.push(cell + size);
  }

  if (col > 0) {
    neighbors.push(cell - 1);
  }

  if (col < size - 1) {
    neighbors.push(cell + 1);
  }

  return neighbors;
}

/*
 * Создаём случайный Hamiltonian path:
 *
 * маршрут проходит через КАЖДУЮ клетку
 * поля ровно один раз.
 *
 * Это гарантирует, что после разрезания
 * маршрута на пары у головоломки будет
 * как минимум одно решение.
 */
function generateHamiltonianPath(size) {
  const totalCells = size * size;

  /*
   * Для больших полей несколько попыток.
   * Если случайный DFS застрял, начинаем
   * заново с другой стартовой клетки.
   */
  for (let attempt = 0; attempt < 100; attempt++) {
    const start =
      Math.floor(
        Math.random() * totalCells
      );

    const visited = new Set([start]);
    const path = [start];

    function dfs(cell) {
      if (
        path.length === totalCells
      ) {
        return true;
      }

      let neighbors =
        getNeighbors(cell, size)
          .filter(
            (next) =>
              !visited.has(next)
          );

      /*
       * Правило Warnsdorff:
       * сначала пробуем клетки,
       * у которых меньше свободных
       * соседей.
       *
       * Это значительно уменьшает
       * вероятность тупика.
       */
      neighbors = neighbors
        .map((next) => {
          const degree =
            getNeighbors(
              next,
              size
            ).filter(
              (cell) =>
                !visited.has(cell)
            ).length;

          return {
            cell: next,
            degree,
            random:
              Math.random(),
          };
        })
        .sort((a, b) => {
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
        });

      for (const item of neighbors) {
        const next = item.cell;

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

  return null;
}

/*
 * Разрезаем полный маршрут
 * на несколько отдельных пар.
 *
 * Например:
 *
 * 64 клетки
 * ↓
 * 7 маршрутов
 *
 * Каждый маршрут имеет минимум
 * две клетки.
 */
function splitPath(fullPath, pairCount) {
  if (
    pairCount < 2 ||
    pairCount * 2 >
      fullPath.length
  ) {
    return null;
  }

  const total = fullPath.length;

  /*
   * Минимально оставляем по две
   * клетки на каждый маршрут.
   */
  const cuts = [];

  let remaining = total;

  for (
    let i = 0;
    i < pairCount - 1;
    i++
  ) {
    const minimumForRest =
      (pairCount - i - 1) * 2;

    const minimumLength = 2;

    const maximumLength =
      remaining -
      minimumForRest;

    /*
     * Иногда специально делаем
     * длинные и короткие маршруты,
     * чтобы структура была менее
     * очевидной.
     */
    const length =
      Math.floor(
        Math.random() *
          (maximumLength -
            minimumLength +
            1)
      ) +
      minimumLength;

    cuts.push(length);
    remaining -= length;
  }

  cuts.push(remaining);

  const paths = [];

  let position = 0;

  for (const length of cuts) {
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
 * Проверка кандидата.
 *
 * Здесь мы не ищем решение —
 * мы проверяем гарантированное
 * решение, из которого уровень
 * был создан.
 */
function validateGeneratedLevel(
  level
) {
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

      used.add(cell);

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
    }
  }

  return (
    used.size === totalCells
  );
}

/*
 * Небольшая оценка сложности.
 *
 * Чем больше пар и чем сильнее
 * различаются длины маршрутов,
 * тем выше базовая сложность.
 *
 * Позже сюда добавим настоящую
 * оценку решателем.
 */
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
      (path) => path.length
    );

  const average =
    totalCells / pairCount;

  const variance =
    lengths.reduce(
      (sum, length) =>
        sum +
        Math.pow(
          length - average,
          2
        ),
      0
    ) / pairCount;

  let difficulty =
    size * 10 +
    pairCount * 4 +
    Math.sqrt(variance) * 3;

  if (difficulty < 30) {
    return "easy";
  }

  if (difficulty < 45) {
    return "medium";
  }

  if (difficulty < 60) {
    return "hard";
  }

  return "expert";
}

/*
 * Главная функция генерации.
 */
export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  for (
    let attempt = 0;
    attempt < 200;
    attempt++
  ) {
    const fullPath =
      generateHamiltonianPath(
        size
      );

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

    /*
     * Перемешиваем порядок пар.
     *
     * Это важно: цвета на поле
     * больше не идут в том же порядке,
     * что и физическое расположение
     * маршрутов.
     */
    const shuffledPaths =
      shuffle(paths);

    const level = {
      size,
      paths: shuffledPaths,
    };

    if (
      !validateGeneratedLevel(
        level
      )
    ) {
      continue;
    }

    return {
      ...level,
      difficulty:
        calculateDifficulty(
          level
        ),
    };
  }

  return null;
}

/*
 * Генерируем сразу несколько
 * кандидатов.
 */
export function generateLevels({
  count = 10,
  size = 7,
  pairCount = 5,
} = {}) {
  const levels = [];

  let attempts = 0;

  while (
    levels.length < count &&
    attempts < count * 20
  ) {
    attempts++;

    const level =
      generateLevel({
        size,
        pairCount,
      });

    if (level) {
      levels.push(level);
    }
  }

  return levels;
}