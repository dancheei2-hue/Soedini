import fs from "node:fs";
import path from "node:path";
import {
  generateLevel,
} from "../src/levelGenerator.js";

const TOTAL_LEVELS = 100;

/*
 * Распределение сложности.
 *
 * 1–10   — 5×5
 * 11–25  — 6×6
 * 26–45  — 7×7
 * 46–70  — 8×8
 * 71–100 — 9×9
 */

const LEVEL_CONFIG = [];

for (let i = 1; i <= TOTAL_LEVELS; i++) {
  let size;
  let pairCount;

  if (i <= 10) {
    size = 5;

    pairCount =
      i <= 3 ? 3 :
      i <= 7 ? 4 :
      5;
  } else if (i <= 25) {
    size = 6;

    pairCount =
      i <= 15 ? 4 :
      i <= 20 ? 5 :
      6;
  } else if (i <= 45) {
    size = 7;

    pairCount =
      i <= 32 ? 5 :
      i <= 39 ? 6 :
      7;
  } else if (i <= 70) {
    size = 8;

    pairCount =
      i <= 55 ? 6 :
      i <= 63 ? 7 :
      8;
  } else {
    size = 9;

    pairCount =
      i <= 82 ? 7 :
      i <= 91 ? 8 :
      9;
  }

  LEVEL_CONFIG.push({
    number: i,
    size,
    pairCount,
  });
}

console.log("");
console.log(
  "================================"
);
console.log(
  "  ГЕНЕРАЦИЯ УРОВНЕЙ СОЕДИНИ"
);
console.log(
  "================================"
);
console.log("");

const generated = [];

for (const config of LEVEL_CONFIG) {
  const {
    number,
    size,
    pairCount,
  } = config;

  process.stdout.write(
    `Уровень ${number}/100 — ${size}×${size}, ${pairCount} пар... `
  );

  let level = null;

  /*
   * Несколько попыток.
   *
   * Иногда случайный генератор
   * не может быстро построить
   * полный маршрут.
   */
  for (let attempt = 1; attempt <= 20; attempt++) {
    level = generateLevel({
      size,
      pairCount,
    });

    if (level) {
      break;
    }
  }

  if (!level) {
    console.log("ОШИБКА");

    throw new Error(
      `Не удалось создать уровень ${number}`
    );
  }

  generated.push({
    size: level.size,
    paths: level.paths,
  });

  console.log(
    `OK (${level.difficulty})`
  );
}

/*
 * Формируем содержимое generatedLevels.js.
 */

const output = `// ЭТОТ ФАЙЛ СОЗДАН АВТОМАТИЧЕСКИ.
//
// Не редактируй уровни вручную.
// Для повторной генерации используй:
//
// npm run generate
//
// Всего уровней: ${generated.length}

export const GENERATED_LEVELS = ${JSON.stringify(
  generated,
  null,
  2
)};
`;

/*
 * Путь к src/generatedLevels.js
 */

const outputPath = path.resolve(
  process.cwd(),
  "src",
  "generatedLevels.js"
);

fs.writeFileSync(
  outputPath,
  output,
  "utf8"
);

console.log("");
console.log(
  "================================"
);
console.log(
  `Готово: создано ${generated.length} уровней`
);
console.log(
  `Файл: ${outputPath}`
);
console.log(
  "================================"
);
console.log("");