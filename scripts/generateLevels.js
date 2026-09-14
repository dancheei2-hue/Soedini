import fs from "node:fs";
import path from "node:path";
import {
  generateLevel,
} from "../src/levelGenerator.js";


const CONFIG = [];


/*
 * 1–10: поле 5×5
 */
for (let level = 1; level <= 10; level++) {
  let pairCount = 3;

  if (level >= 4 && level <= 7) {
    pairCount = 4;
  }

  if (level >= 8) {
    pairCount = 5;
  }

  CONFIG.push({
    size: 5,
    pairCount,
  });
}


/*
 * 11–25: поле 6×6
 */
for (let level = 11; level <= 25; level++) {
  let pairCount = 4;

  if (level >= 16 && level <= 20) {
    pairCount = 5;
  }

  if (level >= 21) {
    pairCount = 6;
  }

  CONFIG.push({
    size: 6,
    pairCount,
  });
}


/*
 * 26–45: поле 7×7
 */
for (let level = 26; level <= 45; level++) {
  let pairCount = 5;

  if (level >= 33 && level <= 39) {
    pairCount = 6;
  }

  if (level >= 40) {
    pairCount = 7;
  }

  CONFIG.push({
    size: 7,
    pairCount,
  });
}


/*
 * 46–70: поле 8×8
 */
for (let level = 46; level <= 70; level++) {
  let pairCount = 6;

  if (level >= 56 && level <= 63) {
    pairCount = 7;
  }

  if (level >= 64) {
    pairCount = 8;
  }

  CONFIG.push({
    size: 8,
    pairCount,
  });
}


/*
 * 71–100: поле 9×9
 */
for (let level = 71; level <= 100; level++) {
  let pairCount = 7;

  if (level >= 83 && level <= 91) {
    pairCount = 8;
  }

  if (level >= 92) {
    pairCount = 9;
  }

  CONFIG.push({
    size: 9,
    pairCount,
  });
}


if (CONFIG.length !== 100) {
  throw new Error(
    `Ошибка конфигурации: создано ${CONFIG.length} уровней вместо 100`
  );
}


console.log("");
console.log("===============================");
console.log("  ГЕНЕРАЦИЯ УРОВНЕЙ СОЕДИНИ");
console.log("===============================");
console.log("");


const levels = [];


for (let i = 0; i < CONFIG.length; i++) {
  const {
    size,
    pairCount,
  } = CONFIG[i];

  const levelNumber = i + 1;

  process.stdout.write(
    `Уровень ${levelNumber}/100 — ` +
    `${size}×${size}, ` +
    `${pairCount} пар... `
  );

  const level =
    generateLevel({
      size,
      pairCount,
    });

  if (!level) {
    console.log("ОШИБКА");

    throw new Error(
      `Не удалось создать уровень ${levelNumber}`
    );
  }

  levels.push(level);

  console.log(
    `OK (${level.difficulty})`
  );
}


/*
 * Формируем JavaScript-файл.
 */
const output = `/*
 * АВТОМАТИЧЕСКИ СГЕНЕРИРОВАННЫЕ УРОВНИ
 *
 * Не редактировать вручную.
 */

export const GENERATED_LEVELS = ${JSON.stringify(
  levels,
  null,
  2
)};
`;


const outputPath =
  path.resolve(
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
  `Готово. Сгенерировано уровней: ${levels.length}`
);
console.log(
  `Файл: ${outputPath}`
);
console.log("");