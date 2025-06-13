import { parseArgs } from "node:util";

import { levels } from "../vendor/queens-game-linkedin/src/utils/levels";
import chalk from "chalk";

const args = parseArgs({
  options: {
    level: { type: "string" },
  },
});
if (!args.values.level) {
  console.error("--level must be set");
  process.exit(1);
}

const level = levels["level" + args.values.level];
if (!level) {
  console.error("Invalid level");
  process.exit(1);
}

for (const row of level.colorRegions) {
  let rowS = "";
  for (const cell of row) {
    const color = level.regionColors[cell];
    rowS += chalk.bgHex(color)(" ");
  }
  console.log(rowS);
}
