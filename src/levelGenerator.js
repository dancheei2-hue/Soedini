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
 * Создаём Hamiltonian path.
 *
 * Маршрут проходит через КАЖДУЮ клетку
 * поля ровно один раз.
 *
 * Сначала пробуем случайный DFS.
 * Если поиск не справился за ограниченное
 * количество операций, используем
 * гарантированный змеиный маршрут.
 *
 * Поэтому генератор не может зависнуть
 * на одном уровне.
 */
function generateHamiltonianPath(size) {
  const totalCells = size * size;

  /*
   * Максимальное количество посещённых
   * узлов DFS за одну попытку.
   */
  const MAX_NODES = 12000;

  /*
   * Количество случайных попыток.
   */
  const MAX_ATTEMPTS = 8;

  for (
    let attempt = 0;
    attempt < MAX_ATTEMPTS;
    attempt++
  ) {
    const start =
      Math.floor(
        Math.random() * totalCells
      );

    const visited = new Set([start]);
    const path = [start];

    let nodesVisited = 0;
    let stopped = false;

    function dfs(cell) {
      nodesVisited++;

      /*
       * Жёсткий лимит.
       *
       * Старый генератор мог очень долго
       * перебирать варианты.
       */
      if (nodesVisited > MAX_NODES) {
        stopped = true;
        return false;
      }

      /*
       * Все клетки пройдены.
       */
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
       * Warnsdorff:
       * сначала пробуем клетки,
       * у которых меньше свободных соседей.
       */
      neighbors = neighbors
        .map((next) => {
          const degree =
            getNeighbors(
              next,
              size
            ).filter(
              (candidate) =>
                !visited.has(candidate)
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
        /*
         * Если достигли лимита,
         * прекращаем поиск.
         */
        if (stopped) {
          return false;
        }

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

  /*
   * ГАРАНТИРОВАННЫЙ запасной вариант.
   *
   * Идём по полю змейкой.
   *
   * Например, для 5×5:
   *
   *  → → → → →
   *  ← ← ← ← ←
   *  → → → → →
   *  ← ← ← ← ←
   *  → → → → →
   *
   * Каждая соседняя клетка маршрута
   * действительно соприкасается с предыдущей.
   *
   * В результате все клетки поля
   * посещаются ровно один раз.
   */

  const path = [];

  /*
   * Иногда используем горизонтальную змейку,
   * иногда вертикальную.
   */
  const vertical =
    Math.random() < 0.5;

  if (!vertical) {
    /*
     * Горизонтальная змейка.
     */
    for (
      let row = 0;
      row < size;
      row++
    ) {
      if (row % 2 === 0) {
        for (
          let col = 0;
          col < size;
          col++
        ) {
          path.push(
            row * size + col
          );
        }
      } else {
        for (
          let col = size - 1;
          col >= 0;
          col--
        ) {
          path.push(
            row * size + col
          );
        }
      }
    }
  } else {
    /*
     * Вертикальная змейка.
     */
    for (
      let col = 0;
      col < size;
      col++
    ) {
      if (col % 2 === 0) {
        for (
          let row = 0;
          row < size;
          row++
        ) {
          path.push(
            row * size + col
          );
        }
      } else {
        for (
          let row = size - 1;
          row >= 0;
          row--
        ) {
          path.push(
            row * size + col
          );
        }
      }
    }
  }

  return path;
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
     * Случайно выбираем длину
     * текущего маршрута.
     */
    const length =
      Math.floor(
        Math.random() *
          (
            maximumLength -
            minimumLength +
            1
          )
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
 * Проверка созданного уровня.
 *
 * Здесь мы НЕ ищем решение.
 * Мы проверяем решение,
 * из которого уровень был создан.
 */
function validateGeneratedLevel(level) {
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

      /*
       * Клетка должна существовать.
       */
      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= totalCells
      ) {
        return false;
      }

      /*
       * Клетка не должна повторяться
       * в другом маршруте.
       */
      if (used.has(cell)) {
        return false;
      }

      used.add(cell);

      /*
       * Соседние клетки маршрута
       * должны быть ортогонально соседними.
       */
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

  /*
   * Все клетки поля должны быть
   * использованы.
   */
  return (
    used.size === totalCells
  );
}

/*
 * Небольшая оценка сложности.
 *
 * Это пока НЕ оценка количества
 * решений.
 *
 * Настоящую сложность будем определять
 * отдельным решателем.
 */
function calculateDifficulty(level) {
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
 * Главная функция генерации
 * одного уровня.
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
     * Это важно, чтобы цвета не были
     * связаны с порядком расположения
     * маршрутов.
     */
    const shuffledPaths =
      shuffle(paths);

    const level = {
      size,
      paths: shuffledPaths,
    };

    /*
     * Проверяем уровень перед возвратом.
     */
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
 * Генерируем сразу несколько уровней.
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