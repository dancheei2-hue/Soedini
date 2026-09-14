import { LEVELS } from "./levels.js";
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

LEVELS.forEach((level, index) => {
  console.log(
    `Проверяем уровень ${index + 1}...`
  );

  const result =
    solveLevel(level);

  switch (result.status) {
    case "invalid":
      console.log(
        `✗ Уровень ${index + 1}: записанное решение некорректно`
      );
      invalid++;
      break;

    case "multiple":
      console.log(
        `⚠ Уровень ${index + 1}: найдено несколько решений`
      );
      multiple++;
      break;

    case "unique":
      console.log(
        `✓ Уровень ${index + 1}: уникальное решение`
      );
      unique++;
      break;

    case "timeout":
      console.log(
        `⏱ Уровень ${index + 1}: не удалось проверить уникальность за лимит времени`
      );
      timeout++;
      break;

    default:
      console.log(
        `? Уровень ${index + 1}: неизвестный статус`
      );
  }

  console.log("");
});

console.log(
  "=== ИТОГ ==="
);

console.log(
  `Уникальных: ${unique}`
);

console.log(
  `С несколькими решениями: ${multiple}`
);

console.log(
  `Неисправных: ${invalid}`
);

console.log(
  `Не проверено по времени: ${timeout}`
);

if (
  invalid > 0 ||
  multiple > 0
) {
  process.exitCode = 1;
}