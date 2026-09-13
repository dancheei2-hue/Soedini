import { LEVELS } from "./levels.js";

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
    errors.push(`Неверный размер поля: ${size}`);
    return errors;
  }

  if (!Array.isArray(paths) || paths.length < 2) {
    errors.push("Нет пар точек или paths имеет неверный формат.");
    return errors;
  }

  const totalCells = size * size;
  const usedCells = new Map();

  paths.forEach((path, pairIndex) => {
    if (!Array.isArray(path) || path.length < 2) {
      errors.push(
        `Пара ${pairIndex + 1}: маршрут должен содержать минимум 2 клетки.`
      );
      return;
    }

    const first = path[0];
    const last = path[path.length - 1];

    if (
      first < 0 ||
      first >= totalCells ||
      last < 0 ||
      last >= totalCells
    ) {
      errors.push(
        `Пара ${pairIndex + 1}: точка находится за пределами поля.`
      );
    }

    if (first === last) {
      errors.push(
        `Пара ${pairIndex + 1}: начало и конец совпадают.`
      );
    }

    path.forEach((cell, index) => {
      if (
        !Number.isInteger(cell) ||
        cell < 0 ||
        cell >= totalCells
      ) {
        errors.push(
          `Пара ${pairIndex + 1}: клетка ${cell} недопустима.`
        );
        return;
      }

      if (usedCells.has(cell)) {
        const previousPair =
          usedCells.get(cell);

        errors.push(
          `Клетка ${cell} используется и в паре ${
            previousPair + 1
          }, и в паре ${pairIndex + 1}.`
        );
      } else {
        usedCells.set(cell, pairIndex);
      }

      if (index > 0) {
        const previous = path[index - 1];

        if (
          !areAdjacent(
            previous,
            cell,
            size
          )
        ) {
          errors.push(
            `Пара ${pairIndex + 1}: невозможный переход ${previous} → ${cell}.`
          );
        }
      }
    });
  });

  if (usedCells.size !== totalCells) {
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
        `Неиспользованные клетки: ${missing.join(", ")}.`
      );
    }
  }

  if (usedCells.size === totalCells) {
    const endpointCells = new Set();

    paths.forEach((path) => {
      endpointCells.add(path[0]);
      endpointCells.add(
        path[path.length - 1]
      );
    });

    if (endpointCells.size !== paths.length * 2) {
      errors.push(
        "Некоторые пары используют одну и ту же конечную точку."
      );
    }
  }

  return errors;
}

let totalErrors = 0;

console.log("");
console.log("=== ПРОВЕРКА УРОВНЕЙ СОЕДИНИ ===");
console.log("");

LEVELS.forEach((level, index) => {
  const errors = validateLevel(
    level,
    index
  );

  if (errors.length === 0) {
    console.log(
      `✓ Уровень ${index + 1}: OK`
    );
  } else {
    console.log(
      `✗ Уровень ${index + 1}: ОШИБКА`
    );

    errors.forEach((error) => {
      console.log(`  • ${error}`);
    });

    totalErrors += errors.length;
  }
});

console.log("");

if (totalErrors === 0) {
  console.log(
    `✓ Все ${LEVELS.length} уровней прошли проверку.`
  );
} else {
  console.log(
    `✗ Найдено ошибок: ${totalErrors}`
  );

  process.exitCode = 1;
}