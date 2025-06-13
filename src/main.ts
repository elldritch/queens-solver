import { parseArgs } from "node:util";

import { levels } from "../vendor/queens-game-linkedin/src/utils/levels";
import chalk from "chalk";
import { Level } from "../vendor/queens-game-linkedin/src/utils/types";

function main() {
  // Parse arguments.
  const args = parseArgs({
    options: {
      level: { type: "string" },
    },
  });
  if (!args.values.level) {
    console.error("--level must be set");
    process.exit(1);
  }

  // Load level.
  const level = levels["level" + args.values.level];
  if (!level) {
    console.error("Invalid level");
    process.exit(1);
  }

  // Solve for queen positions.
  const queenPositions = solve(level);
  console.log("Solved", { queenPositions });

  // Print board.
  let y = 0;
  for (const row of level.colorRegions) {
    let x = 0;
    let rowS = "";
    for (const region of row) {
      const color = level.regionColors[region];
      rowS += chalk
        .bgHex(color)
        .black(
          queenPositions.find((p) => p[0] === x && p[1] === y) ? "Q" : " "
        );
      x++;
    }
    console.log(rowS);
    y++;
  }
}

main();

type Position = [number, number];

// Solve for queen positions.
//
// For each region, attempt to place a queen. If the region has no valid queen
// placements, backtrack on the placement of the last region.
function solve(level: Level): Position[] {
  // Create a list of positions per region.
  const regionPositions: { [region: string]: Array<[number, number]> } = {};
  let y = 0;
  for (const row of level.colorRegions) {
    let x = 0;
    for (const cell of row) {
      if (!regionPositions[cell]) {
        regionPositions[cell] = [];
      }
      regionPositions[cell].push([x, y]);
      x++;
    }
    y++;
  }

  let queenPositions = {};
  const result = solveRecurse(
    level.size,
    regionPositions,
    queenPositions,
    Object.keys(regionPositions)
  );
  if (!result) {
    throw new Error("Failed to solve");
  }
  console.log("Solved with regions", { queenPositions });
  return Object.values(queenPositions);
}

function solveRecurse(
  size: number,
  regionPositions: { [region: string]: Array<[number, number]> },
  queenPositions: { [region: string]: [number, number] },
  remainingRegions: string[]
): boolean {
  console.log("Trying board", { queenPositions, remainingRegions });
  if (!checkBoard(size, queenPositions)) {
    return false;
  }
  if (remainingRegions.length === 0) {
    return true;
  }

  const region = remainingRegions[0];
  const positions = regionPositions[region];
  for (const position of positions) {
    // Place the queen.
    queenPositions[region] = position;
    // Try to solve for the remaining regions given this placement.
    const result = solveRecurse(
      size,
      regionPositions,
      queenPositions,
      remainingRegions.slice(1)
    );
    // If this placement is valid, stop searching. Otherwise, try the next
    // placement.
    if (result) {
      return true;
    }
  }

  // If all placements have been tried, then nothing can be done from this board
  // position, and we must backtrack. Remove the placement of the last region.
  delete queenPositions[region];
  return false;
}

// Check whether the board contains a valid partial placement of queens. A board
// is valid if:
//
// 1. No two queens are in the same row.
// 2. No two queens are in the same column.
// 3. No two queens are in the same region.
// 4. No two queens are adjacent to each other, even diagonally.
function checkBoard(
  size: number,
  queenPositions: { [region: string]: [number, number] }
): boolean {
  console.log("Checking board", { queenPositions });
  // By construction, no two queens can be in the same region, so we don't need
  // to test for that.

  // Construct a list of queens per row and column. No two queens can be in the
  // same row or column, so each row/column can have either zero or one queen.
  const queensByRow: Array<number | null> = Array(size).fill(null);
  const queensByColumn: Array<number | null> = Array(size).fill(null);
  for (const [x, y] of Object.values(queenPositions)) {
    // If a queen position has been set in the current row or column, then this
    // board must be invalid.
    if (queensByRow[y] !== null) {
      console.log(
        `Queen at (${x}, ${y}) is in the same row as existing queen at (${queensByRow[y]}, ${y})`
      );
      return false;
    }
    if (queensByColumn[x] !== null) {
      console.log(
        `Queen at (${x}, ${y}) is in the same column as existing queen at (${x}, ${queensByColumn[x]})`
      );
      return false;
    }
    queensByRow[y] = x;
    queensByColumn[x] = y;
  }

  // Check that no two queens are adjacent to each other, even diagonally. We
  // only ever need to check for diagonal adjacency, because two queens cannot
  // be axis-aligned adjacent if they cannot be in the same row or column.
  //
  // To check for diagonal adjacency, we go through each row, and check that its
  // queen has no diagonally adjacent queens in the rows above and below it.
  for (let y = 0; y < size; y++) {
    const x = queensByRow[y];
    // If there is no queen in this row, then there can be no diagonal
    // adjacency.
    if (x === null) {
      continue;
    }
    // Check for diagonal adjacency in the row above.
    if (y > 0) {
      const queenAbove = queensByRow[y - 1];
      if (queenAbove === x + 1) {
        console.log(
          `Queen at (${x}, ${y}) is diagonally adjacent to queen at (${queenAbove}, ${
            y - 1
          })`
        );
        return false;
      }
      if (queenAbove === x - 1) {
        console.log(
          `Queen at (${x}, ${y}) is diagonally adjacent to queen at (${queenAbove}, ${
            y - 1
          })`
        );
        return false;
      }
    }
    // Check for diagonal adjacency in the row below.
    if (y < size - 1) {
      const queenBelow = queensByRow[y + 1];
      if (queenBelow === x + 1) {
        console.log(
          `Queen at (${x}, ${y}) is diagonally adjacent to queen at (${queenBelow}, ${
            y + 1
          })`
        );
        return false;
      }
      if (queenBelow === x - 1) {
        console.log(
          `Queen at (${x}, ${y}) is diagonally adjacent to queen at (${queenBelow}, ${
            y + 1
          })`
        );
        return false;
      }
    }
  }

  console.log("Board is valid");
  return true;
}
