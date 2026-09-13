import { GENERATED_LEVELS } from "./generatedLevels.js";

function areAdjacent(a, b, size) {
  const ar = Math.floor(a / size);
  const ac = a % size;

  const br = Math.floor(b / size);
  const bc = b % size;

  return (
    Math.abs(ar - br) +
      Math.abs(ac - bc) ===
    1
  );
}

function validateLevel(level, levelIndex) {
  const errors = [];

  const { size, paths } = level;

  if (!Number.isInteger(size) || size < 2) {
    errors.push(
      `Неверный размер поля: ${size}`
    );

    return errors;
  }

  if (
    !Array.isArray(paths) ||
    paths.length < 2
  ) {
    errors.push(
      "Нет пар точек или paths имеет неверный формат."
    );

    return errors;
  }

  const totalCells = size * size;

  /*
   * Здесь храним, какая пара
   * использует каждую клетку.
   */
  const usedCells = new Map();

  /*
   * Здесь храним конечные точки.
   */
  const endpointCells = new Set();

  paths.forEach((path, pairIndex) => {
    if (
      !Array.isArray(path) ||
      path.length < 2
    ) {
      errors.push(
        `Пара ${pairIndex + 1}: маршрут должен содержать минимум 2 клетки.`
      );

      return;
    }

    const first = path[0];
    const last =
      path[path.length - 1];

    /*
     * Проверяем начало и конец маршрута.
     */
    if (
      !Number.isInteger(first) ||
      first < 0 ||
      first >= totalCells
    ) {
      errors.push(
        `Пара ${pairIndex + 1}: начальная точка находится за пределами поля.`
      );
    }

    if (
      !Number.isInteger(last) ||
      last < 0 ||
      last >= totalCells
    ) {
      errors.push(
        `Пара ${pairIndex + 1}: конечная точка находится за пределами поля.`
      );
    }

    /*
     * Начало и конец должны быть разными.
     */
    if (first === last) {
      errors.push(
        `Пара ${pairIndex + 1}: начало и конец совпадают.`
      );
    }

    /*
     * Проверяем, что конечные точки
     * всех пар уникальны.
     */
    if (
      Number.isInteger(first) &&
      first >= 0 &&
      first < totalCells
    ) {
      if (endpointCells.has(first)) {
        errors.push(
          `Пара ${
            pairIndex + 1
          }: начальная точка ${first} уже используется другой парой.`
        );
      }

      endpointCells.add(first);
    }

    if (
      Number.isInteger(last) &&
      last >= 0 &&
      last < totalCells
    ) {
      if (endpointCells.has(last)) {
        errors.push(
          `Пара ${
            pairIndex + 1
          }: конечная точка ${last} уже используется другой парой.`
        );
      }

      endpointCells.add(last);
    }

    /*
     * Проверяем каждую клетку маршрута.
     */
    path.forEach((cell, index) => {
      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= totalCells
      ) {
        errors.push(
          `Пара ${
            pairIndex + 1
          }: клетка ${cell} недопустима.`
        );

        return;
      }

      /*
       * Клетка не должна использоваться
       * двумя разными маршрутами.
       */
      if (usedCells.has(cell)) {
        const previousPair =
          usedCells.get(cell);

        errors.push(
          `Клетка ${cell} используется и в паре ${
            previousPair + 1
          }, и в паре ${pairIndex + 1}.`
        );
      } else {
        usedCells.set(
          cell,
          pairIndex
        );
      }

      /*
       * Проверяем переход между
       * соседними клетками.
       */
      if (index > 0) {
        const previous =
          path[index - 1];

        if (
          Number.isInteger(previous) &&
          Number.isInteger(cell) &&
          !areAdjacent(
            previous,
            cell,
            size
          )
        ) {
          errors.push(
            `Пара ${
              pairIndex + 1
            }: невозможный переход ${previous} → ${cell}.`
          );
        }
      }
    });
  });

  /*
   * Проверяем полное заполнение поля.
   */
  if (
    usedCells.size !== totalCells
  ) {
    const missing = [];

    for (
      let cell = 0;
      cell < totalCells;
      cell++
    ) {
      if (!usedCells.has(cell)) {
        missing.push(cell);
      }
    }

    errors.push(
      `Поле заполнено не полностью: используется ${usedCells.size} из ${totalCells} клеток.`
    );

    if (missing.length <= 20) {
      errors.push(
        `Неиспользованные клетки: ${missing.join(
          ", "
        )}.`
      );
    }
  }

  /*
   * Должно быть ровно по две
   * конечные точки на каждую пару.
   */
  if (
    endpointCells.size !==
    paths.length * 2
  ) {
    errors.push(
      `Неверное количество конечных точек: найдено ${endpointCells.size}, ожидалось ${
        paths.length * 2
      }.`
    );
  }

  return errors;
}

/*
 * ========================================
 * ЗАПУСК ПРОВЕРКИ
 * ========================================
 */

let totalErrors = 0;

console.log("");
console.log(
  "=== ПРОВЕРКА СГЕНЕРИРОВАННЫХ УРОВНЕЙ СОЕДИНИ ==="
);
console.log("");

console.log(
  `Всего уровней: ${GENERATED_LEVELS.length}`
);
console.log("");

GENERATED_LEVELS.forEach(
  (level, index) => {
    const errors =
      validateLevel(
        level,
        index
      );

    if (
      errors.length === 0
    ) {
      console.log(
        `✓ Уровень ${
          index + 1
        }: OK`
      );
    } else {
      console.log(
        `✗ Уровень ${
          index + 1
        }: ОШИБКА`
      );

      errors.forEach(
        (error) => {
          console.log(
            `  • ${error}`
          );
        }
      );

      totalErrors +=
        errors.length;
    }
  }
);

console.log("");

if (
  totalErrors === 0
) {
  console.log(
    `✓ Все ${GENERATED_LEVELS.length} сгенерированных уровней прошли проверку.`
  );
} else {
  console.log(
    `✗ Найдено ошибок: ${totalErrors}`
  );

  process.exitCode = 1;
}