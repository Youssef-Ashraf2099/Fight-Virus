# Puzzle System Enhancement - Implementation Guide

## 🎯 Overview

This guide will help you implement the enhanced puzzle system with bigger mazes, improved UI/UX, and 2 brand new puzzle types.

## ✅ What's Already Done

1. ✅ **CSS Styles Added** - Enhanced styles for all new features are now in `src/index.html`
2. ✅ **Documentation Created** - Full details in `docs/PUZZLE_ENHANCEMENTS.md`
3. ✅ **Enhanced Template Created** - Partial implementation in `src/game/PuzzleManager.enhanced.js`

## 📋 Step-by-Step Implementation

### Step 1: Backup Your Current File

```bash
cp src/game/PuzzleManager.js src/game/PuzzleManager.backup.js
```

### Step 2: Update the \_generateMazeLayout Method

Find this line in `src/game/PuzzleManager.js` (around line 956):

```javascript
let size = 5 + Math.min(4, Math.floor(difficulty / 2)) * 2;
```

Replace the entire `_generateMazeLayout` method with:

```javascript
_generateMazeLayout({ waveNumber }) {
  const difficulty = Math.max(1, waveNumber || 1);

  // ENHANCED: Much bigger mazes based on wave
  let size = 7 + Math.min(10, Math.floor(difficulty / 1.5)) * 2;
  if (size % 2 === 0) {
    size += 1;
  }
  size = Math.min(17, size); // Cap at 17x17 for performance

  const grid = Array.from({ length: size }, () => Array(size).fill("#"));

  const carve = (row, col) => {
    grid[row][col] = ".";
    const directions = this._shuffleDirections([
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
    ]);

    directions.forEach(([dr, dc]) => {
      const nextRow = row + dr * 2;
      const nextCol = col + dc * 2;
      if (
        nextRow > 0 &&
        nextRow < size - 1 &&
        nextCol > 0 &&
        nextCol < size - 1 &&
        grid[nextRow][nextCol] === "#"
      ) {
        grid[row + dr][col + dc] = ".";
        carve(nextRow, nextCol);
      }
    });
  };

  carve(1, 1);

  // ENHANCED: More extra cuts for larger, more open mazes
  const extraCuts = Math.min(20, Math.floor(difficulty * 1.2) + Math.floor(size / 3));
  for (let i = 0; i < extraCuts; i++) {
    const row = this._randomInt(1, size - 2);
    const col = this._randomInt(1, size - 2);
    if (grid[row][col] === "#") {
      const openNeighbors = [
        [row + 1, col],
        [row - 1, col],
        [row, col + 1],
        [row, col - 1],
      ].filter(([r, c]) => grid[r]?.[c] === ".");
      if (openNeighbors.length >= 2) {
        grid[row][col] = ".";
      }
    }
  }

  // ENHANCED: Better start/target placement - find furthest points
  const start = { row: 1, col: 1 };
  const distances = this._mazeDistances(grid, start);

  // Find the furthest reachable point from start
  let furthestKey = `${start.row}:${start.col}`;
  let maxDistance = 0;
  Object.keys(distances).forEach((key) => {
    if (distances[key] > maxDistance) {
      maxDistance = distances[key];
      furthestKey = key;
    }
  });

  if (furthestKey === `${start.row}:${start.col}`) {
    furthestKey = `${size - 2}:${size - 2}`;
    grid[size - 2][size - 2] = ".";
    maxDistance = Math.floor(size * 1.5);
  }

  const [targetRow, targetCol] = furthestKey
    .split(":")
    .map((value) => parseInt(value, 10));
  const pathLength = Math.max(1, distances[furthestKey] || size);

  grid[start.row][start.col] = "S";
  grid[targetRow][targetCol] = "T";

  const layout = grid.map((row) => row.join(""));

  // ENHANCED: Better move allowance calculation
  const baseAllowance = 1.8;
  const difficultyBonus = Math.min(0.4, difficulty * 0.015);
  const allowance = baseAllowance + difficultyBonus;
  const maxMoves = Math.ceil(pathLength * allowance) + 3;

  return {
    layout,
    maxMoves,
    pathLength,
    start,
    target: { row: targetRow, col: targetCol },
    size,
  };
}
```

### Step 3: Enhance the \_buildMazePuzzle Method

Find the `_buildMazePuzzle` method (around line 810) and update the instructions line:

```javascript
instructions: `Use arrow keys (↑↓←→) or WASD to reach the magenta target. Complete within ${maxMoves} moves. Optimal path: ${layoutInfo.pathLength} steps.`,
```

Add to the state object:

```javascript
state: {
  layout,
  maxMoves,
  pathLength: layoutInfo.pathLength,
  moveHistory: [], // NEW
},
```

In the `puzzle.render` function, add these variables after the grid initialization:

```javascript
let movesLeft = maxMoves;
let moveCount = 0; // NEW - track total moves taken
```

Update the `updateStatus` function to show enhanced stats:

```javascript
const updateStatus = () => {
  const efficiency =
    moveCount > 0 ? Math.round((layoutInfo.pathLength / moveCount) * 100) : 100;
  status.innerHTML = `
    <div class="maze-stat">
      <span class="maze-stat-label">Moves Left:</span>
      <span class="maze-stat-value ${
        movesLeft <= 5 ? "warning" : ""
      }">${movesLeft}</span>
    </div>
    <div class="maze-stat">
      <span class="maze-stat-label">Steps Taken:</span>
      <span class="maze-stat-value">${moveCount}</span>
    </div>
    <div class="maze-stat">
      <span class="maze-stat-label">Efficiency:</span>
      <span class="maze-stat-value ${
        efficiency >= 90 ? "optimal" : ""
      }">${efficiency}%</span>
    </div>
  `;
};
```

In the `attemptMove` function, after the traversability check, add:

```javascript
// Mark path - ADD THIS BLOCK
const prevCell = cells[robot.row][robot.col];
if (prevCell && !prevCell.classList.contains("start")) {
  prevCell.classList.add("visited");
}

robot = { row: nextRow, col: nextCol };
movesLeft -= 1;
moveCount += 1; // NEW
puzzle.state.robot = { ...robot };
puzzle.state.movesLeft = movesLeft;
puzzle.state.moveHistory.push({ row: nextRow, col: nextCol }); // NEW
```

Update the success message:

```javascript
if (robot.row === target.row && robot.col === target.col) {
  resolved = true;
  cleanup();
  const efficiency = Math.round((layoutInfo.pathLength / moveCount) * 100);
  const bonus = efficiency >= 100 ? " (Perfect route! 🏆)" : "";
  helpers.completeSuccess?.(`✅ Target reached in ${moveCount} moves!${bonus}`);
  return;
}
```

Update the failure message:

```javascript
if (movesLeft <= 0) {
  resolved = true;
  cleanup();
  helpers.completeFailure?.(
    `❌ Move budget exhausted after ${moveCount} moves.`,
    { reason: "maze-out-of-moves" }
  );
  return;
}
```

Add distance feedback:

```javascript
const distance =
  Math.abs(robot.row - target.row) + Math.abs(robot.col - target.col);
helpers.setFeedback?.(
  `➡️ Moving... ${distance} steps from target (${movesLeft} moves left)`
);
```

Update the grid container class:

```javascript
grid.className = "maze-grid maze-grid-enhanced"; // Add maze-grid-enhanced class
grid.style.setProperty("--maze-rows", rows.toString()); // NEW
```

Update the status container class:

```javascript
status.className = "maze-status-enhanced"; // Change from maze-status
```

### Step 4: Add New Puzzle Types to \_pickPuzzleType

Find the `_pickPuzzleType` method and update the allTypes array:

```javascript
const allTypes = [
  "logic-gate",
  "password-cracker",
  "maze-navigation",
  "register-reconfig",
  "checksum-balancer", // NEW
  "memory-pattern", // NEW
  "sequence-decoder", // NEW
];
```

### Step 5: Add New Cases to \_createPuzzle

Find the `_createPuzzle` method and add new cases:

```javascript
_createPuzzle(type, context) {
  switch (type) {
    case "logic-gate":
      return this._buildLogicGatePuzzle(context);
    case "password-cracker":
      return this._buildPasswordCrackerPuzzle(context);
    case "maze-navigation":
      return this._buildMazePuzzle(context);
    case "register-reconfig":
      return this._buildRegisterPuzzle(context);
    case "checksum-balancer":     // NEW
      return this._buildChecksumPuzzle(context);
    case "memory-pattern":         // NEW
      return this._buildMemoryPatternPuzzle(context);
    case "sequence-decoder":       // NEW
      return this._buildSequenceDecoderPuzzle(context);
    default:
      return this._buildLogicGatePuzzle(context);
  }
}
```

### Step 6: Add New Puzzle Builder Methods

Add these three new methods to the PuzzleManager class (after `_buildRegisterPuzzle`):

#### A) \_buildChecksumPuzzle

```javascript
_buildChecksumPuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
  const targetSum = this._randomInt(15, 35) + Math.floor((waveNumber || 1) * 2);
  const slotCount = 5;
  const maxValue = 10;

  const puzzle = {
    id: "checksum-balancer",
    title: "⚖️ Checksum Balancer",
    subtitle: "Adjust memory slots to reach the target checksum.",
    reward,
    failPenalty,
    skipPenalty,
    showSubmit: true,
    submitLabel: "Validate Sum",
    instructions: `Adjust each memory slot's value (0-${maxValue}) so the total sum equals ${targetSum}. Use +/− buttons or direct input.`,
    state: {
      slots: Array(slotCount).fill(0),
      targetSum,
      maxValue,
    },
  };

  puzzle.render = (container, helpers) => {
    container.classList.remove(
      "puzzle-logic",
      "puzzle-password",
      "puzzle-maze",
      "puzzle-register"
    );
    container.classList.add("puzzle-checksum");

    const header = document.createElement("div");
    header.className = "checksum-header";
    header.innerHTML = `
      <div class="checksum-info">
        <div class="checksum-label">Current Sum</div>
        <div class="checksum-current" id="checksumCurrent">0</div>
      </div>
      <div class="checksum-info">
        <div class="checksum-label">Target Sum</div>
        <div class="checksum-target">${targetSum}</div>
      </div>
    `;

    const slotsContainer = document.createElement("div");
    slotsContainer.className = "checksum-slots";

    const updateSum = () => {
      const sum = puzzle.state.slots.reduce((a, b) => a + b, 0);
      const currentEl = header.querySelector("#checksumCurrent");
      if (currentEl) {
        currentEl.textContent = sum;
        if (sum === targetSum) {
          currentEl.style.color = "#4dffaa";
          currentEl.style.textShadow = "0 0 20px rgba(77, 255, 170, 0.8)";
        } else if (sum > targetSum) {
          currentEl.style.color = "#ff6b6b";
          currentEl.style.textShadow = "0 0 20px rgba(255, 107, 107, 0.8)";
        } else {
          currentEl.style.color = "#b7f9ff";
          currentEl.style.textShadow = "0 0 20px rgba(34, 209, 255, 0.6)";
        }
      }
      helpers.setFeedback?.(
        sum === targetSum
          ? "✅ Checksum matched! Click Validate."
          : `Current: ${sum} | Need: ${targetSum > sum ? "+" : ""}${targetSum - sum}`
      );
    };

    puzzle.state.slots.forEach((value, index) => {
      const slot = document.createElement("div");
      slot.className = "checksum-slot";

      const slotLabel = document.createElement("div");
      slotLabel.className = "checksum-slot-label";
      slotLabel.textContent = `Slot ${index + 1}`;

      const controls = document.createElement("div");
      controls.className = "checksum-slot-controls";

      const decButton = document.createElement("button");
      decButton.type = "button";
      decButton.className = "checksum-button";
      decButton.textContent = "−";
      decButton.addEventListener("click", () => {
        if (puzzle.state.slots[index] > 0) {
          puzzle.state.slots[index]--;
          valueInput.value = puzzle.state.slots[index];
          updateSum();
        }
      });

      const valueInput = document.createElement("input");
      valueInput.type = "number";
      valueInput.className = "checksum-input";
      valueInput.min = "0";
      valueInput.max = maxValue.toString();
      valueInput.value = value.toString();
      valueInput.addEventListener("input", () => {
        let val = parseInt(valueInput.value, 10) || 0;
        val = Math.max(0, Math.min(maxValue, val));
        puzzle.state.slots[index] = val;
        valueInput.value = val;
        updateSum();
      });

      const incButton = document.createElement("button");
      incButton.type = "button";
      incButton.className = "checksum-button";
      incButton.textContent = "+";
      incButton.addEventListener("click", () => {
        if (puzzle.state.slots[index] < maxValue) {
          puzzle.state.slots[index]++;
          valueInput.value = puzzle.state.slots[index];
          updateSum();
        }
      });

      controls.appendChild(decButton);
      controls.appendChild(valueInput);
      controls.appendChild(incButton);

      slot.appendChild(slotLabel);
      slot.appendChild(controls);
      slotsContainer.appendChild(slot);
    });

    container.appendChild(header);
    container.appendChild(slotsContainer);

    updateSum();
  };

  puzzle.validate = () => {
    const sum = puzzle.state.slots.reduce((a, b) => a + b, 0);
    if (sum === puzzle.state.targetSum) {
      return { success: true, message: "✅ Checksum validated — memory stable!" };
    }
    return {
      success: false,
      message: `Sum mismatch: ${sum} ≠ ${puzzle.state.targetSum}`,
    };
  };

  return puzzle;
}
```

#### B) \_buildMemoryPatternPuzzle

```javascript
_buildMemoryPatternPuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
  const difficulty = Math.min(8, 3 + Math.floor((waveNumber || 1) / 2));
  const sequence = Array.from({ length: difficulty }, () => this._randomInt(0, 3));

  const puzzle = {
    id: "memory-pattern",
    title: "🧠 Memory Pattern",
    subtitle: "Memorize and repeat the sequence.",
    reward,
    failPenalty,
    skipPenalty,
    showSubmit: false,
    instructions: `Watch the pattern flash, then repeat it exactly. ${difficulty} steps to memorize.`,
    state: {
      sequence,
      userInput: [],
      showing: false,
    },
  };

  puzzle.render = (container, helpers) => {
    container.classList.remove(
      "puzzle-logic",
      "puzzle-password",
      "puzzle-maze",
      "puzzle-register",
      "puzzle-checksum"
    );
    container.classList.add("puzzle-memory");

    const colors = ["#ff4d4d", "#4dff4d", "#4d4dff", "#ffff4d"];
    const names = ["Red", "Green", "Blue", "Yellow"];

    const display = document.createElement("div");
    display.className = "memory-display";
    display.textContent = "Watch the pattern...";

    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "memory-buttons";

    const progress = document.createElement("div");
    progress.className = "memory-progress";

    let sequenceTimeout;
    let disabled = true;

    const showSequence = async () => {
      disabled = true;
      puzzle.state.showing = true;
      for (let i = 0; i < sequence.length; i++) {
        const colorIndex = sequence[i];
        display.style.background = colors[colorIndex];
        display.textContent = names[colorIndex];
        await new Promise((resolve) => setTimeout(resolve, 600));
        display.style.background = "";
        display.textContent = "...";
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      display.textContent = "Your turn!";
      disabled = false;
      puzzle.state.showing = false;
      helpers.setFeedback?.("Repeat the pattern by clicking the buttons.");
    };

    colors.forEach((color, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "memory-button";
      button.style.background = color;
      button.textContent = names[index];
      button.addEventListener("click", () => {
        if (disabled || puzzle.state.showing) return;

        puzzle.state.userInput.push(index);
        progress.textContent = `Progress: ${puzzle.state.userInput.length}/${sequence.length}`;

        const currentIndex = puzzle.state.userInput.length - 1;
        if (puzzle.state.userInput[currentIndex] !== sequence[currentIndex]) {
          helpers.completeFailure?.("❌ Wrong pattern! Memory fault.", {
            reason: "memory-pattern-wrong",
          });
          return;
        }

        if (puzzle.state.userInput.length === sequence.length) {
          helpers.completeSuccess?.("✅ Perfect recall! Pattern matched!");
          return;
        }

        helpers.setFeedback?.(
          `✓ Correct (${puzzle.state.userInput.length}/${sequence.length})`
        );
      });
      buttonsContainer.appendChild(button);
    });

    const repeatButton = document.createElement("button");
    repeatButton.type = "button";
    repeatButton.className = "memory-repeat";
    repeatButton.textContent = "🔄 Show Pattern Again";
    repeatButton.addEventListener("click", () => {
      if (!disabled && !puzzle.state.showing) {
        puzzle.state.userInput = [];
        progress.textContent = `Progress: 0/${sequence.length}`;
        showSequence();
      }
    });

    container.appendChild(display);
    container.appendChild(progress);
    container.appendChild(buttonsContainer);
    container.appendChild(repeatButton);

    progress.textContent = `Progress: 0/${sequence.length}`;
    showSequence();

    return () => {
      clearTimeout(sequenceTimeout);
    };
  };

  return puzzle;
}
```

#### C) \_buildSequenceDecoderPuzzle

```javascript
_buildSequenceDecoderPuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
  const patterns = [
    { name: "Fibonacci", gen: (n) => {
      const fib = [0, 1];
      for (let i = 2; i < n; i++) fib.push(fib[i-1] + fib[i-2]);
      return fib.slice(0, n);
    }},
    { name: "Powers of 2", gen: (n) => Array.from({length: n}, (_, i) => Math.pow(2, i)) },
    { name: "Squares", gen: (n) => Array.from({length: n}, (_, i) => i * i) },
    { name: "Primes", gen: (n) => {
      const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
      return primes.slice(0, n);
    }},
    { name: "Arithmetic +3", gen: (n) => Array.from({length: n}, (_, i) => 2 + i * 3) },
  ];

  const pattern = patterns[this._randomInt(0, patterns.length - 1)];
  const seqLength = 5;
  const fullSeq = pattern.gen(seqLength + 1);
  const hiddenIndex = this._randomInt(2, seqLength - 1);
  const answer = fullSeq[hiddenIndex];
  const displaySeq = fullSeq.slice(0, seqLength);
  displaySeq[hiddenIndex] = "?";

  const puzzle = {
    id: "sequence-decoder",
    title: "🔢 Sequence Decoder",
    subtitle: "Decode the pattern and find the missing number.",
    reward,
    failPenalty,
    skipPenalty,
    showSubmit: true,
    submitLabel: "Submit Answer",
    instructions: `Analyze the sequence and determine the missing value.`,
    state: {
      sequence: displaySeq,
      answer,
      userAnswer: null,
    },
  };

  puzzle.render = (container, helpers) => {
    container.classList.remove(
      "puzzle-logic",
      "puzzle-password",
      "puzzle-maze",
      "puzzle-register",
      "puzzle-checksum",
      "puzzle-memory"
    );
    container.classList.add("puzzle-sequence");

    const sequenceDisplay = document.createElement("div");
    sequenceDisplay.className = "sequence-display";
    sequenceDisplay.textContent = displaySeq.join(" → ");

    const inputGroup = document.createElement("div");
    inputGroup.className = "sequence-input-group";

    const label = document.createElement("div");
    label.className = "sequence-label";
    label.textContent = "Missing value:";

    const input = document.createElement("input");
    input.type = "number";
    input.className = "sequence-input";
    input.placeholder = "Enter number";
    input.addEventListener("input", () => {
      puzzle.state.userAnswer = parseInt(input.value, 10) || null;
      if (puzzle.state.userAnswer !== null) {
        helpers.setFeedback?.("Click Submit Answer to validate.");
      }
    });

    inputGroup.appendChild(label);
    inputGroup.appendChild(input);

    container.appendChild(sequenceDisplay);
    container.appendChild(inputGroup);

    helpers.setFeedback?.(`Hint: This is a ${pattern.name} sequence.`);
  };

  puzzle.validate = () => {
    if (puzzle.state.userAnswer === null) {
      return { success: false, message: "Please enter a value." };
    }
    if (puzzle.state.userAnswer === answer) {
      return { success: true, message: "✅ Correct! Sequence decoded!" };
    }
    return {
      success: false,
      message: `❌ Incorrect. Expected ${answer}, got ${puzzle.state.userAnswer}.`,
    };
  };

  return puzzle;
}
```

### Step 7: Update the Timer (Optional Enhancement)

Find the `startRandomPuzzle` method and update the timer to give more time:

```javascript
// Enhanced timer - more time for harder puzzles
this.timeRemaining = 60 + Math.min(30, Math.floor(waveNumber * 2));
this.uiManager?.setPuzzleTimer?.(this.timeRemaining);
this._startTimer();
```

## 🧪 Testing

After implementation, test each enhancement:

1. **Maze Size Scaling**:

   - Wave 1: Should see 7x7 maze
   - Wave 5: Should see 11x11 maze
   - Wave 10+: Should see 15x15-17x17 maze

2. **Maze Features**:

   - Check visited cells show trail
   - Efficiency stat updates correctly
   - Warning color when low on moves
   - Optimal highlight at 90%+ efficiency

3. **Checksum Balancer**:

   - +/− buttons work
   - Direct number input works
   - Sum updates in real-time
   - Color changes correctly
   - Validation works

4. **Memory Pattern**:

   - Sequence displays correctly
   - Player can repeat pattern
   - Wrong input fails immediately
   - Repeat button works

5. **Sequence Decoder**:
   - All 5 patterns work
   - Hint shows pattern type
   - Answer validation works
   - Wrong answer feedback shows expected value

## 🎉 Completion Checklist

- [ ] Backup created
- [ ] `_generateMazeLayout` updated
- [ ] `_buildMazePuzzle` enhanced
- [ ] `_pickPuzzleType` updated with new types
- [ ] `_createPuzzle` has new cases
- [ ] `_buildChecksumPuzzle` added
- [ ] `_buildMemoryPatternPuzzle` added
- [ ] `_buildSequenceDecoderPuzzle` added
- [ ] Timer enhancement applied (optional)
- [ ] All tests passed
- [ ] CSS styles already added ✅
- [ ] Documentation reviewed ✅

## 📞 Support

If you encounter any issues during implementation, check:

1. Console for JavaScript errors
2. CSS class names match between JS and CSS
3. All method names are spelled correctly
4. No syntax errors in added code

Refer to `docs/PUZZLE_ENHANCEMENTS.md` for detailed feature descriptions.
