import { GENERATED_LEVELS } from "./generatedLevels.js";
import { solveLevel } from "./levelSolver.js";

console.log("");
console.log(
  "=== ПРОВЕРКА РЕШЕНИЙ СОЕДИНИ ==="
);
console.log("");

let invalid = 0;
let multiple = 0;
let unique = 0;
let timeout = 0;

const multipleLevels = [];
const timeoutLevels = [];
const invalidLevels = [];

GENERATED_LEVELS.forEach((level, index) => {
  const levelNumber = index + 1;

  console.log(
    `Проверяем уровень ${levelNumber}...`
  );

  const result =
    solveLevel(level);

  switch (result.status) {
    case "invalid":
      console.log(
        `✗ Уровень ${levelNumber}: записанное решение некорректно`
      );

      invalid++;
      invalidLevels.push(levelNumber);
      break;

    case "multiple":
      console.log(
        `⚠ Уровень ${levelNumber}: найдено несколько решений`
      );

      multiple++;
      multipleLevels.push(levelNumber);
      break;

    case "unique":
      console.log(
        `✓ Уровень ${levelNumber}: уникальное решение`
      );

      unique++;
      break;

    case "timeout":
      console.log(
        `⏱ Уровень ${levelNumber}: не удалось проверить уникальность за лимит времени`
      );

      timeout++;
      timeoutLevels.push(levelNumber);
      break;

    default:
      console.log(
        `? Уровень ${levelNumber}: неизвестный статус "${result.status}"`
      );

      timeout++;
      timeoutLevels.push(levelNumber);
      break;
  }

  if (
    Number.isFinite(result.elapsedMs)
  ) {
    console.log(
      `   Время: ${result.elapsedMs} мс`
    );
  }

  if (
    Number.isFinite(result.nodes)
  ) {
    console.log(
      `   Узлов поиска: ${result.nodes}`
    );
  }

  console.log("");
});


console.log(
  "===================================="
);

console.log(
  "ИТОГ ПРОВЕРКИ"
);

console.log(
  "===================================="
);

console.log("");

console.log(
  `Всего уровней: ${GENERATED_LEVELS.length}`
);

console.log(
  `Уникальных решений: ${unique}`
);

console.log(
  `Несколько решений: ${multiple}`
);

console.log(
  `Некорректных уровней: ${invalid}`
);

console.log(
  `Timeout: ${timeout}`
);

console.log("");


if (
  multipleLevels.length > 0
) {
  console.log(
    "Уровни с несколькими решениями:"
  );

  console.log(
    multipleLevels.join(", ")
  );

  console.log("");
}


if (
  timeoutLevels.length > 0
) {
  console.log(
    "Уровни, которые не удалось доказать:"
  );

  console.log(
    timeoutLevels.join(", ")
  );

  console.log("");
}


if (
  invalidLevels.length > 0
) {
  console.log(
    "Некорректные уровни:"
  );

  console.log(
    invalidLevels.join(", ")
  );

  console.log("");
}


/*
 * Workflow должен считаться успешным
 * только если каждый уровень проверен
 * и имеет ровно одно решение.
 */
if (
  invalid > 0 ||
  multiple > 0 ||
  timeout > 0
) {
  console.log(
    "ПРОВЕРКА НЕ ПРОЙДЕНА."
  );

  process.exitCode = 1;
} else {
  console.log(
    "ПРОВЕРКА ПРОЙДЕНА."
  );

  console.log(
    "Все уровни имеют единственное решение."
  );
}