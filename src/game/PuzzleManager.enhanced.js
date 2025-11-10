class PuzzleManager {
  constructor(uiManager) {
    this.uiManager = uiManager;
    this.active = null;
    this.timerId = null;
    this.timeRemaining = 0;
    this.lastPuzzleType = null;
  }

  startRandomPuzzle({ waveNumber = 1, onSuccess, onFailure, onSkip } = {}) {
    this.abortActivePuzzle();

    const type = this._pickPuzzleType();
    const reward = this._computeReward(waveNumber);
    const failPenalty = this._computeFailurePenalty(waveNumber);
    const skipPenalty = this._computeSkipPenalty(waveNumber);

    const puzzle = this._createPuzzle(type, {
      waveNumber,
      reward,
      failPenalty,
      skipPenalty,
    });

    if (!puzzle) {
      return;
    }

    this.active = {
      puzzle,
      puzzleId: puzzle.id,
      reward,
      failPenalty,
      skipPenalty,
      waveNumber,
      callbacks: { onSuccess, onFailure, onSkip },
      resolved: false,
    };

    this._prepareOverlay(puzzle, skipPenalty);

    const skipLabel = `Skip (-${this._formatScore(skipPenalty)} SCORE)`;
    const contentEl = this.uiManager?.getPuzzleContentElement?.();
    if (contentEl) {
      const helpers = {
        setFeedback: (text) => this.uiManager?.setPuzzleFeedback?.(text),
        completeSuccess: (message) =>
          this._complete("success", {
            message: message || "Puzzle complete!",
            scoreDelta: reward,
          }),
        completeFailure: (message, options = {}) =>
          this._complete("failure", {
            message: message || "System lockout!",
            scoreDelta:
              typeof options.scoreDelta === "number"
                ? options.scoreDelta
                : -failPenalty,
            reason: options.reason || "puzzle-failure",
          }),
        updateSubmitLabel: (label) =>
          this.uiManager?.setPuzzleSubmitVisibility?.(
            puzzle.showSubmit !== false,
            label
          ),
        getSkipLabel: () => skipLabel,
        triggerSkip: () => this._handleSkip(),
      };

      const teardown = puzzle.render?.(contentEl, helpers);
      if (typeof teardown === "function") {
        this.active.teardown = teardown;
      }
    }

    if (puzzle.showSubmit !== false) {
      this.uiManager?.setPuzzleSubmitHandler?.(() => this._handleSubmit());
    } else {
      this.uiManager?.setPuzzleSubmitHandler?.(null);
    }
    this.uiManager?.setPuzzleSkipHandler?.(() => this._handleSkip());

    // Enhanced timer - more time for harder puzzles
    this.timeRemaining = 60 + Math.min(30, Math.floor(waveNumber * 2));
    this.uiManager?.setPuzzleTimer?.(this.timeRemaining);
    this._startTimer();
  }

  abortActivePuzzle() {
    this._clearTimer();
    if (this.uiManager) {
      this.uiManager.setPuzzleSubmitHandler?.(null);
      this.uiManager.setPuzzleSkipHandler?.(null);
      this.uiManager.hidePuzzleOverlay?.();
      this.uiManager.clearPuzzleContent?.();
      this.uiManager.setPuzzleFeedback?.("");
      this.uiManager.setPuzzleTimer?.(0);
      this.uiManager.setPuzzleInstructions?.("");
    }
    if (this.active?.teardown) {
      try {
        this.active.teardown();
      } catch (error) {
        console.warn("Failed to teardown puzzle:", error);
      }
    }
    this.active = null;
  }

  _prepareOverlay(puzzle, skipPenalty) {
    this.uiManager?.clearPuzzleContent?.();
    this.uiManager?.setPuzzleTitle?.(puzzle.title || "Digital Challenge");
    this.uiManager?.setPuzzleSubtitle?.(puzzle.subtitle || "");
    this.uiManager?.setPuzzleInstructions?.(puzzle.instructions || "");
    this.uiManager?.setPuzzleFeedback?.("");
    const submitVisible = puzzle.showSubmit !== false;
    this.uiManager?.setPuzzleSubmitVisibility?.(
      submitVisible,
      puzzle.submitLabel || "Validate"
    );
    const skipLabel = `Skip (-${this._formatScore(skipPenalty)} SCORE)`;
    this.uiManager?.setPuzzleSkipLabel?.(skipLabel);
    this.uiManager?.showPuzzleOverlay?.();
  }

  _startTimer() {
    this._clearTimer();
    this.timerId = setInterval(() => {
      if (!this.active || this.active.resolved) {
        this._clearTimer();
        return;
      }
      this.timeRemaining = Math.max(0, this.timeRemaining - 1);
      this.uiManager?.setPuzzleTimer?.(this.timeRemaining);
      if (this.timeRemaining <= 0) {
        this._handleTimeout();
      }
    }, 1000);
  }

  _clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  _handleTimeout() {
    if (!this.active || this.active.resolved) {
      return;
    }
    this._complete("failure", {
      message: "Time expired!",
      scoreDelta: -this.active.failPenalty,
      reason: "timeout",
    });
  }

  _handleSubmit() {
    if (!this.active || this.active.resolved) {
      return;
    }
    const result = this.active.puzzle.validate?.();
    if (!result) {
      return;
    }

    if (result.success) {
      this._complete("success", {
        message: result.message || "Puzzle solved!",
        scoreDelta: this.active.reward,
      });
    } else {
      this.uiManager?.setPuzzleFeedback?.(
        result.message || "Keep working on the puzzle."
      );
    }
  }

  _handleSkip() {
    if (!this.active || this.active.resolved) {
      return;
    }
    this._complete("skip", {
      message: "Puzzle skipped.",
      scoreDelta: -this.active.skipPenalty,
      reason: "skip",
    });
  }

  _complete(outcome, payload = {}) {
    if (!this.active || this.active.resolved) {
      return;
    }

    this.active.resolved = true;
    this._clearTimer();

    if (this.uiManager) {
      this.uiManager.setPuzzleSubmitHandler?.(null);
      this.uiManager.setPuzzleSkipHandler?.(null);
      this.uiManager.hidePuzzleOverlay?.();
      this.uiManager.clearPuzzleContent?.();
      this.uiManager.setPuzzleFeedback?.(payload.message || "");
      this.uiManager.setPuzzleTimer?.(0);
    }

    if (this.active.teardown) {
      try {
        this.active.teardown();
      } catch (error) {
        console.warn("Puzzle teardown failed:", error);
      }
    }

    const callbacks = this.active.callbacks || {};
    const result = {
      type: outcome,
      puzzleId: this.active.puzzleId,
      scoreDelta: payload.scoreDelta || 0,
      message: payload.message || "",
      reason: payload.reason || null,
    };

    if (outcome === "success") {
      callbacks.onSuccess?.(result);
    } else if (outcome === "failure") {
      callbacks.onFailure?.(result);
    } else if (outcome === "skip") {
      callbacks.onSkip?.(result);
    }

    this.active = null;
  }

  _pickPuzzleType() {
    const allTypes = [
      "logic-gate",
      "password-cracker",
      "maze-navigation",
      "register-reconfig",
      "checksum-balancer",
      "memory-pattern", // NEW
      "sequence-decoder", // NEW
    ];
    if (!this.lastPuzzleType) {
      const choice = allTypes[Math.floor(Math.random() * allTypes.length)];
      this.lastPuzzleType = choice;
      return choice;
    }

    const filtered = allTypes.filter((type) => type !== this.lastPuzzleType);
    const pool = filtered.length ? filtered : allTypes;
    const choice = pool[Math.floor(Math.random() * pool.length)];
    this.lastPuzzleType = choice;
    return choice;
  }

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
      case "checksum-balancer":
        return this._buildChecksumPuzzle(context);
      case "memory-pattern":
        return this._buildMemoryPatternPuzzle(context);
      case "sequence-decoder":
        return this._buildSequenceDecoderPuzzle(context);
      default:
        return this._buildLogicGatePuzzle(context);
    }
  }

  // ... [Keep all existing puzzle builders: _buildLogicGatePuzzle, _buildPasswordCrackerPuzzle, _buildRegisterPuzzle]
  // I'll add the enhanced maze and new puzzles below

  _buildMazePuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
    const layoutInfo = this._generateMazeLayout({ waveNumber });
    const layout = layoutInfo.layout;
    const maxMoves = layoutInfo.maxMoves;

    const puzzle = {
      id: "maze-navigation",
      title: "🔷 Pathfinding Simulator",
      subtitle: "Route the maintenance bot to the target node.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions: `Use arrow keys (↑↓←→) or WASD to reach the magenta target. Complete within ${maxMoves} moves. Optimal path: ${layoutInfo.pathLength} steps.`,
      state: {
        layout,
        maxMoves,
        pathLength: layoutInfo.pathLength,
        moveHistory: [],
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-logic",
        "puzzle-register",
        "puzzle-password",
        "puzzle-checksum"
      );
      container.classList.add("puzzle-maze");

      const rows = layout.length;
      const cols = layout[0]?.length || 0;
      const cells = Array.from({ length: rows }, () => Array(cols));

      let robot = { row: 0, col: 0 };
      let target = { row: rows - 1, col: cols - 1 };
      let movesLeft = maxMoves;
      let moveCount = 0;
      let resolved = false;
      let disposed = false;

      const grid = document.createElement("div");
      grid.className = "maze-grid maze-grid-enhanced";
      grid.style.setProperty("--maze-cols", cols.toString());
      grid.style.setProperty("--maze-rows", rows.toString());

      const status = document.createElement("div");
      status.className = "maze-status-enhanced";

      const controls = document.createElement("div");
      controls.className = "maze-controls";

      const updateStatus = () => {
        const efficiency =
          moveCount > 0
            ? Math.round((layoutInfo.pathLength / moveCount) * 100)
            : 100;
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

      const applyRobotPosition = () => {
        cells.forEach((rowCells) => {
          rowCells.forEach((cell) => {
            cell?.classList.remove("robot");
          });
        });
        const currentCell = cells[robot.row]?.[robot.col];
        if (currentCell) {
          currentCell.classList.add("robot");
        }
      };

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const char = layout[row][col];
          const cell = document.createElement("div");
          cell.className = "maze-cell";
          cell.dataset.row = row;
          cell.dataset.col = col;

          if (char === "#") {
            cell.classList.add("wall");
          } else {
            cell.classList.add("floor");
            if (char === "S") {
              robot = { row, col };
              cell.classList.add("start");
            } else if (char === "T") {
              target = { row, col };
              cell.classList.add("target");
            }
          }

          cells[row][col] = cell;
          grid.appendChild(cell);
        }
      }

      applyRobotPosition();
      puzzle.state.robot = { ...robot };
      puzzle.state.target = { ...target };
      puzzle.state.movesLeft = movesLeft;

      const cleanup = () => {
        if (disposed) return;
        disposed = true;
        window.removeEventListener("keydown", handleKeyDown, true);
      };

      const isTraversable = (row, col) => {
        const cell = layout[row]?.[col];
        if (!cell) return false;
        return cell !== "#";
      };

      const attemptMove = (deltaRow, deltaCol) => {
        if (resolved) return;

        const nextRow = robot.row + deltaRow;
        const nextCol = robot.col + deltaCol;

        if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
          helpers.setFeedback?.("⚠️ Boundary reached — choose another route.");
          return;
        }

        if (!isTraversable(nextRow, nextCol)) {
          helpers.setFeedback?.("🚫 Obstacle detected — rerouting required.");
          return;
        }

        // Mark path
        const prevCell = cells[robot.row][robot.col];
        if (prevCell && !prevCell.classList.contains("start")) {
          prevCell.classList.add("visited");
        }

        robot = { row: nextRow, col: nextCol };
        movesLeft -= 1;
        moveCount += 1;
        puzzle.state.robot = { ...robot };
        puzzle.state.movesLeft = movesLeft;
        puzzle.state.moveHistory.push({ row: nextRow, col: nextCol });
        applyRobotPosition();
        updateStatus();

        if (robot.row === target.row && robot.col === target.col) {
          resolved = true;
          cleanup();
          const efficiency = Math.round(
            (layoutInfo.pathLength / moveCount) * 100
          );
          const bonus = efficiency >= 100 ? " (Perfect route! 🏆)" : "";
          helpers.completeSuccess?.(
            `✅ Target reached in ${moveCount} moves!${bonus}`
          );
          return;
        }

        if (movesLeft <= 0) {
          resolved = true;
          cleanup();
          helpers.completeFailure?.(
            `❌ Move budget exhausted after ${moveCount} moves.`,
            { reason: "maze-out-of-moves" }
          );
          return;
        }

        const distance =
          Math.abs(robot.row - target.row) + Math.abs(robot.col - target.col);
        helpers.setFeedback?.(
          `➡️ Moving... ${distance} steps from target (${movesLeft} moves left)`
        );
      };

      const createControlButton = (label, deltaRow, deltaCol) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "maze-control";
        button.textContent = label;
        button.addEventListener("click", () => attemptMove(deltaRow, deltaCol));
        controls.appendChild(button);
        return button;
      };

      const handleKeyDown = (event) => {
        if (resolved) return;
        let handled = true;
        switch (event.key) {
          case "ArrowUp":
          case "w":
          case "W":
            attemptMove(-1, 0);
            break;
          case "ArrowDown":
          case "s":
          case "S":
            attemptMove(1, 0);
            break;
          case "ArrowLeft":
          case "a":
          case "A":
            attemptMove(0, -1);
            break;
          case "ArrowRight":
          case "d":
          case "D":
            attemptMove(0, 1);
            break;
          default:
            handled = false;
        }

        if (handled) {
          event.preventDefault();
        }
      };

      createControlButton("▲", -1, 0);
      const middleRow = document.createElement("div");
      middleRow.className = "maze-control-row";
      const leftButton = document.createElement("button");
      leftButton.type = "button";
      leftButton.className = "maze-control";
      leftButton.textContent = "◀";
      leftButton.addEventListener("click", () => attemptMove(0, -1));
      const staySpacer = document.createElement("span");
      staySpacer.className = "maze-control-spacer";
      const rightButton = document.createElement("button");
      rightButton.type = "button";
      rightButton.className = "maze-control";
      rightButton.textContent = "▶";
      rightButton.addEventListener("click", () => attemptMove(0, 1));
      middleRow.appendChild(leftButton);
      middleRow.appendChild(staySpacer);
      middleRow.appendChild(rightButton);

      const downButton = document.createElement("button");
      downButton.type = "button";
      downButton.className = "maze-control";
      downButton.textContent = "▼";
      downButton.addEventListener("click", () => attemptMove(1, 0));

      controls.appendChild(middleRow);
      controls.appendChild(downButton);

      container.appendChild(grid);
      container.appendChild(status);
      container.appendChild(controls);

      const actions = document.createElement("div");
      actions.className = "maze-inline-actions";
      const inlineSkip = document.createElement("button");
      inlineSkip.type = "button";
      inlineSkip.className = "maze-inline-skip";
      inlineSkip.textContent =
        helpers.getSkipLabel?.() ||
        `Skip (-${this._formatScore(puzzle.skipPenalty)} SCORE)`;
      inlineSkip.addEventListener("click", () => helpers.triggerSkip?.());
      actions.appendChild(inlineSkip);
      container.appendChild(actions);

      updateStatus();
      helpers.setFeedback?.(
        `🎯 Navigate to the magenta target. Optimal: ${layoutInfo.pathLength} steps.`
      );

      window.addEventListener("keydown", handleKeyDown, true);

      return () => {
        cleanup();
      };
    };

    return puzzle;
  }

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
    const extraCuts = Math.min(
      20,
      Math.floor(difficulty * 1.2) + Math.floor(size / 3)
    );
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

  _mazeDistances(grid, start) {
    const queue = [{ row: start.row, col: start.col, distance: 0 }];
    const distances = { [`${start.row}:${start.col}`]: 0 };
    const visited = new Set([`${start.row}:${start.col}`]);

    while (queue.length) {
      const { row, col, distance } = queue.shift();
      const neighbors = [
        [row + 1, col],
        [row - 1, col],
        [row, col + 1],
        [row, col - 1],
      ];

      neighbors.forEach(([nRow, nCol]) => {
        if (grid[nRow]?.[nCol] !== undefined && grid[nRow][nCol] !== "#") {
          const key = `${nRow}:${nCol}`;
          if (!visited.has(key)) {
            visited.add(key);
            distances[key] = distance + 1;
            queue.push({ row: nRow, col: nCol, distance: distance + 1 });
          }
        }
      });
    }

    return distances;
  }

  _shuffleDirections(directions) {
    for (let i = directions.length - 1; i > 0; i--) {
      const j = this._randomInt(0, i);
      const temp = directions[i];
      directions[i] = directions[j];
      directions[j] = temp;
    }
    return directions;
  }

  // NEW PUZZLE: Checksum Balancer
  _buildChecksumPuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
    const targetSum =
      this._randomInt(15, 35) + Math.floor((waveNumber || 1) * 2);
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
            : `Current: ${sum} | Need: ${targetSum > sum ? "+" : ""}${
                targetSum - sum
              }`
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
        return {
          success: true,
          message: "✅ Checksum validated — memory stable!",
        };
      }
      return {
        success: false,
        message: `Sum mismatch: ${sum} ≠ ${puzzle.state.targetSum}`,
      };
    };

    return puzzle;
  }

  // NEW PUZZLE: Memory Pattern
  _buildMemoryPatternPuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
    const difficulty = Math.min(8, 3 + Math.floor((waveNumber || 1) / 2));
    const sequence = Array.from({ length: difficulty }, () =>
      this._randomInt(0, 3)
    );

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

  // NEW PUZZLE: Sequence Decoder
  _buildSequenceDecoderPuzzle({
    reward,
    failPenalty,
    skipPenalty,
    waveNumber,
  }) {
    const patterns = [
      {
        name: "Fibonacci",
        gen: (n) => {
          const fib = [0, 1];
          for (let i = 2; i < n; i++) fib.push(fib[i - 1] + fib[i - 2]);
          return fib.slice(0, n);
        },
      },
      {
        name: "Powers of 2",
        gen: (n) => Array.from({ length: n }, (_, i) => Math.pow(2, i)),
      },
      {
        name: "Squares",
        gen: (n) => Array.from({ length: n }, (_, i) => i * i),
      },
      {
        name: "Primes",
        gen: (n) => {
          const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
          return primes.slice(0, n);
        },
      },
      {
        name: "Arithmetic +3",
        gen: (n) => Array.from({ length: n }, (_, i) => 2 + i * 3),
      },
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

  // Keep existing helper methods
  _comparePasswordGuess(secret, guess) {
    const length = Math.min(secret.length, guess.length);
    let correctPosition = 0;
    const secretCounts = new Array(10).fill(0);
    const guessCounts = new Array(10).fill(0);

    for (let index = 0; index < length; index++) {
      const secretDigit = secret.charCodeAt(index) - 48;
      const guessDigit = guess.charCodeAt(index) - 48;

      if (secretDigit === guessDigit) {
        correctPosition += 1;
      } else {
        if (secretDigit >= 0 && secretDigit <= 9) {
          secretCounts[secretDigit] += 1;
        }
        if (guessDigit >= 0 && guessDigit <= 9) {
          guessCounts[guessDigit] += 1;
        }
      }
    }

    let correctDigit = 0;
    for (let digit = 0; digit < 10; digit++) {
      correctDigit += Math.min(secretCounts[digit], guessCounts[digit]);
    }

    return { correctPosition, correctDigit };
  }

  _computeReward(waveNumber) {
    return Math.max(800, Math.round(1500 + waveNumber * 140));
  }

  _computeFailurePenalty(waveNumber) {
    return Math.max(400, Math.round(700 + waveNumber * 110));
  }

  _computeSkipPenalty(waveNumber) {
    return Math.max(600, Math.round(1000 + waveNumber * 130));
  }

  _formatScore(amount) {
    return Math.abs(Math.round(amount)).toLocaleString();
  }

  _randomInt(min, max) {
    if (max === undefined) {
      return Math.floor(Math.random() * (min + 1));
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Note: The other puzzle builders (_buildLogicGatePuzzle, _buildPasswordCrackerPuzzle, _buildRegisterPuzzle)
  // should be copied from the original file - they remain unchanged
}

export default PuzzleManager;
