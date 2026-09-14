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

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j =
      Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] =
      [result[j], result[i]];
  }

  return result;
}

/*
 * Базовый Hamiltonian-маршрут.
 *
 * Используем змейку только как стартовую
 * конфигурацию. После этого она многократно
 * перестраивается алгоритмом backbite.
 *
 * Благодаря этому:
 *
 * - все клетки остаются покрыты;
 * - клетки не повторяются;
 * - соседство сохраняется;
 * - итоговый маршрут становится
 *   значительно более извилистым.
 */
function createSnakePath(size) {
  const path = [];

  if (Math.random() < 0.5) {
    for (let row = 0; row < size; row++) {
      if (row % 2 === 0) {
        for (let col = 0; col < size; col++) {
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
    for (let col = 0; col < size; col++) {
      if (col % 2 === 0) {
        for (let row = 0; row < size; row++) {
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
 * Одна операция backbite.
 *
 * Берём один из концов Hamiltonian-маршрута,
 * соединяем его с другой клеткой маршрута,
 * а затем разрываем старое ребро.
 *
 * В результате снова получается Hamiltonian-путь,
 * но его форма меняется.
 */
function backbite(path, size) {
  const length = path.length;

  if (length < 4) {
    return null;
  }

  const useStart =
    Math.random() < 0.5;

  const endpoint =
    useStart
      ? path[0]
      : path[length - 1];

  const neighbors =
    getNeighbors(
      endpoint,
      size
    );

  const positions = new Map();

  for (let i = 0; i < length; i++) {
    positions.set(
      path[i],
      i
    );
  }

  const candidates = [];

  for (const neighbor of neighbors) {
    const index =
      positions.get(neighbor);

    if (
      index === undefined
    ) {
      continue;
    }

    /*
     * Не соединяем конец с его непосредственным
     * соседом по текущему маршруту.
     *
     * Также не соединяем два конца между собой:
     * это создало бы цикл.
     */
    if (useStart) {
      if (
        index <= 1 ||
        index >= length - 1
      ) {
        continue;
      }
    } else {
      if (
        index <= 0 ||
        index >= length - 2
      ) {
        continue;
      }
    }

    candidates.push(index);
  }

  if (candidates.length === 0) {
    return null;
  }

  const index =
    candidates[
      Math.floor(
        Math.random() *
          candidates.length
      )
    ];

  if (useStart) {
    /*
     * Было:
     *
     * 0 - 1 - 2 - ... - index - ...
     *
     * Становится:
     *
     * index-1 ... 2 - 1 - 0 - index - ...
     */
    return [
      ...path
        .slice(0, index)
        .reverse(),

      ...path.slice(index),
    ];
  }

  /*
   * Аналогичная операция для второго конца.
   */
  return [
    ...path.slice(
      0,
      index + 1
    ),

    path[length - 1],

    ...path
      .slice(index + 1, length - 1)
      .reverse(),
  ];
}

/*
 * Создаём сложный Hamiltonian-маршрут.
 *
 * Чем больше поле, тем больше перестроений.
 */
function generateHamiltonianPath(size) {
  let path =
    createSnakePath(size);

  const totalCells =
    size * size;

  const iterations =
    Math.max(
      200,
      totalCells * 35
    );

  for (
    let i = 0;
    i < iterations;
    i++
  ) {
    const changed =
      backbite(
        path,
        size
      );

    if (changed) {
      path = changed;
    }
  }

  return path;
}

/*
 * Количество поворотов маршрута.
 *
 * Используется как один из критериев качества.
 */
function countTurns(path, size) {
  let turns = 0;

  for (
    let i = 1;
    i < path.length - 1;
    i++
  ) {
    const previous =
      path[i - 1];

    const current =
      path[i];

    const next =
      path[i + 1];

    const previousRow =
      Math.floor(
        previous / size
      );

    const previousCol =
      previous % size;

    const currentRow =
      Math.floor(
        current / size
      );

    const currentCol =
      current % size;

    const nextRow =
      Math.floor(
        next / size
      );

    const nextCol =
      next % size;

    const firstDirection =
      `${currentRow - previousRow},${currentCol - previousCol}`;

    const secondDirection =
      `${nextRow - currentRow},${nextCol - currentCol}`;

    if (
      firstDirection !==
      secondDirection
    ) {
      turns++;
    }
  }

  return turns;
}

/*
 * Манхэттенское расстояние.
 */
function manhattan(a, b, size) {
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

/*
 * Разрезаем Hamiltonian-маршрут
 * на заданное количество цветных путей.
 *
 * Каждый путь содержит минимум 2 клетки.
 */
function splitPath(
  fullPath,
  pairCount
) {
  const totalCells =
    fullPath.length;

  if (
    pairCount < 2 ||
    pairCount * 2 >
      totalCells
  ) {
    return null;
  }

  const lengths = [];

  let remainingCells =
    totalCells;

  let remainingPairs =
    pairCount;

  while (
    remainingPairs > 0
  ) {
    if (
      remainingPairs === 1
    ) {
      lengths.push(
        remainingCells
      );

      break;
    }

    const minimumForRest =
      (remainingPairs - 1) * 2;

    const maximumCurrent =
      remainingCells -
      minimumForRest;

    const average =
      remainingCells /
      remainingPairs;

    /*
     * Стараемся получать достаточно
     * разнообразные длины путей,
     * но не создаём экстремальных значений.
     */
    const variation =
      Math.max(
        1,
        Math.floor(
          average * 0.45
        )
      );

    let minimumCurrent =
      Math.max(
        2,
        Math.floor(
          average - variation
        )
      );

    let maximumPreferred =
      Math.min(
        maximumCurrent,
        Math.ceil(
          average + variation
        )
      );

    if (
      minimumCurrent >
      maximumPreferred
    ) {
      minimumCurrent = 2;
      maximumPreferred =
        maximumCurrent;
    }

    let length =
      minimumCurrent +
      Math.floor(
        Math.random() *
          (
            maximumPreferred -
            minimumCurrent +
            1
          )
      );

    /*
     * Иногда разрешаем более длинный
     * участок, чтобы структура не была
     * слишком равномерной.
     */
    if (
      Math.random() < 0.18 &&
      maximumCurrent >
        maximumPreferred
    ) {
      length =
        maximumPreferred +
        Math.floor(
          Math.random() *
            (
              maximumCurrent -
              maximumPreferred +
              1
            )
        );
    }

    length =
      Math.max(
        2,
        Math.min(
          length,
          maximumCurrent
        )
      );

    lengths.push(length);

    remainingCells -=
      length;

    remainingPairs--;
  }

  const paths = [];

  let offset = 0;

  for (
    const length of lengths
  ) {
    paths.push(
      fullPath.slice(
        offset,
        offset + length
      )
    );

    offset += length;
  }

  return paths;
}

/*
 * Проверка корректности уровня.
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
 * Дополнительная проверка:
 * хотим получить маршрут с большим
 * количеством поворотов.
 */
function calculateStructureScore(
  paths,
  size
) {
  let turns = 0;

  let distance = 0;

  for (
    const path of paths
  ) {
    turns +=
      countTurns(
        path,
        size
      );

    distance +=
      manhattan(
        path[0],
        path[path.length - 1],
        size
      );
  }

  return (
    turns * 3 +
    distance
  );
}

/*
 * Создание уровня.
 *
 * Вместо одного случайного маршрута
 * создаём несколько кандидатов и выбираем
 * наиболее извилистый.
 */
export function generateLevel({
  size = 7,
  pairCount = 5,
} = {}) {
  const candidates = [];

  const candidateCount =
    Math.max(
      12,
      Math.min(
        30,
        size * 3
      )
    );

  for (
    let attempt = 0;
    attempt < candidateCount;
    attempt++
  ) {
    const fullPath =
      generateHamiltonianPath(
        size
      );

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
      paths,
    };

    if (
      !validateLevel(level)
    ) {
      continue;
    }

    const score =
      calculateStructureScore(
        paths,
        size
      );

    candidates.push({
      level,
      score,
    });
  }

  if (
    candidates.length === 0
  ) {
    return null;
  }

  candidates.sort(
    (a, b) =>
      b.score - a.score
  );

  const selected =
    candidates[0].level;

  /*
   * Перемешиваем цвета.
   *
   * Само решение от этого не меняется,
   * но порядок пар не будет связан
   * с порядком их создания.
   */
  selected.paths =
    shuffle(
      selected.paths
    );

  return {
    ...selected,

    difficulty:
      calculateDifficulty(
        selected
      ),
  };
}

/*
 * Расчёт сложности.
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
    totalCells /
    pairCount;

  const variance =
    paths.reduce(
      (sum, path) =>
        sum +
        Math.pow(
          path.length -
            average,
          2
        ),
      0
    ) /
    pairCount;

  const turns =
    paths.reduce(
      (sum, path) =>
        sum +
        countTurns(
          path,
          size
        ),
      0
    );

  const turnRatio =
    turns /
    Math.max(
      1,
      totalCells - 2
    );

  const score =
    size * 5 +
    pairCount * 3 +
    Math.sqrt(
      variance
    ) * 2 +
    turnRatio * 12;

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

export function generateLevels(
  count,
  options = {}
) {
  const levels = [];

  for (
    let i = 0;
    i < count;
    i++
  ) {
    const level =
      generateLevel(
        options
      );

    if (!level) {
      throw new Error(
        `Не удалось создать уровень ${i + 1}`
      );
    }

    levels.push(level);
  }

  return levels;
}