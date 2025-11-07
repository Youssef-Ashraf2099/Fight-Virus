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

    this.timeRemaining = 60;
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
      default:
        return this._buildLogicGatePuzzle(context);
    }
  }

  _buildLogicGatePuzzle({ waveNumber, reward, failPenalty, skipPenalty }) {
    const gates = ["AND", "OR", "XOR"];
    let config = null;

    for (let attempts = 0; attempts < 40 && !config; attempts++) {
      const inputCount = Math.random() < 0.55 ? 3 : 2;
      const inputs = Array.from({ length: inputCount }, () =>
        Math.random() < 0.5 ? 0 : 1
      );
      if (this._logicHasSolution(inputs, gates)) {
        config = { inputs, inputCount };
      }
    }

    if (!config) {
      config = { inputs: [0, 1, 0], inputCount: 3 };
    }

    const labels = ["A", "B", "C"];

    const puzzle = {
      id: "logic-gate",
      title: "Logic Circuit Synthesizer",
      subtitle: "Tune the gates to output a 1-bit high signal.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: true,
      submitLabel: "Validate Output",
      instructions:
        "Flip any inputs you need, then choose gate combos so the final output reads 1.",
      state: {
        inputs: config.inputs,
        inputCount: config.inputCount,
        invertCheckboxes: [],
        primaryGate: null,
        secondaryGate: null,
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-register",
        "puzzle-password",
        "puzzle-maze"
      );
      container.classList.add("puzzle-logic");

      const grid = document.createElement("div");
      grid.className = "logic-inputs";

      puzzle.state.invertCheckboxes = [];

      puzzle.state.inputs.forEach((value, index) => {
        const row = document.createElement("div");
        row.className = "logic-input-row";

        const label = document.createElement("div");
        label.className = "logic-input-label";
        label.textContent = `Input ${labels[index]}: ${value}`;

        const invertWrap = document.createElement("label");
        invertWrap.className = "logic-invert";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.dataset.index = index.toString();
        invertWrap.appendChild(checkbox);
        invertWrap.appendChild(document.createTextNode(" Invert"));

        puzzle.state.invertCheckboxes.push(checkbox);

        row.appendChild(label);
        row.appendChild(invertWrap);
        grid.appendChild(row);
      });

      container.appendChild(grid);

      const gateWrapper = document.createElement("div");
      gateWrapper.className = "logic-gates";

      const selectPrimary = document.createElement("select");
      selectPrimary.className = "logic-gate-select";
      gates.forEach((gate) => {
        const option = document.createElement("option");
        option.value = gate;
        option.textContent = gate;
        selectPrimary.appendChild(option);
      });
      puzzle.state.primaryGate = selectPrimary;

      const primaryLabel = document.createElement("label");
      primaryLabel.className = "logic-gate-label";
      primaryLabel.textContent = "Gate 1 (combine first inputs)";
      primaryLabel.appendChild(selectPrimary);
      gateWrapper.appendChild(primaryLabel);

      if (puzzle.state.inputCount === 3) {
        const selectSecondary = document.createElement("select");
        selectSecondary.className = "logic-gate-select";
        gates.forEach((gate) => {
          const option = document.createElement("option");
          option.value = gate;
          option.textContent = gate;
          selectSecondary.appendChild(option);
        });
        puzzle.state.secondaryGate = selectSecondary;

        const secondaryLabel = document.createElement("label");
        secondaryLabel.className = "logic-gate-label";
        secondaryLabel.textContent = "Gate 2 (combine with final input)";
        secondaryLabel.appendChild(selectSecondary);
        gateWrapper.appendChild(secondaryLabel);
      }

      container.appendChild(gateWrapper);

      const preview = () => {
        const evalResult = this._evaluateLogicSelection(puzzle.state);
        helpers.setFeedback?.(`Current output: ${evalResult}`);
      };

      puzzle.state.invertCheckboxes.forEach((checkbox) =>
        checkbox.addEventListener("change", preview)
      );
      selectPrimary.addEventListener("change", preview);
      puzzle.state.secondaryGate?.addEventListener("change", preview);

      preview();
    };

    puzzle.validate = () => {
      const result = this._evaluateLogicSelection(puzzle.state);
      if (result === 1) {
        return { success: true, message: "Signal stabilized!" };
      }
      return {
        success: false,
        message: `Output is ${result}. Adjust the configuration.`,
      };
    };

    return puzzle;
  }

  _logicHasSolution(inputs, gates) {
    const invertOptions = inputs.map(() => [false, true]);
    const getValue = (value, invert) => (invert ? 1 - value : value);

    if (inputs.length === 2) {
      for (const invertA of invertOptions[0]) {
        for (const invertB of invertOptions[1]) {
          for (const gate of gates) {
            const a = getValue(inputs[0], invertA);
            const b = getValue(inputs[1], invertB);
            if (this._applyGate(gate, a, b) === 1) {
              return true;
            }
          }
        }
      }
      return false;
    }

    for (const invertA of invertOptions[0]) {
      for (const invertB of invertOptions[1]) {
        for (const invertC of invertOptions[2]) {
          for (const gate1 of gates) {
            for (const gate2 of gates) {
              const a = getValue(inputs[0], invertA);
              const b = getValue(inputs[1], invertB);
              const c = getValue(inputs[2], invertC);
              const first = this._applyGate(gate1, a, b);
              const result = this._applyGate(gate2, first, c);
              if (result === 1) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  _evaluateLogicSelection(state) {
    const invert = (value, checkbox) => (checkbox?.checked ? 1 - value : value);

    const a = invert(state.inputs[0], state.invertCheckboxes[0]);
    const b = invert(state.inputs[1], state.invertCheckboxes[1]);
    const gate1 = state.primaryGate?.value || "OR";
    const first = this._applyGate(gate1, a, b);

    if (state.inputCount === 2) {
      return first;
    }

    const c = invert(state.inputs[2], state.invertCheckboxes[2]);
    const gate2 = state.secondaryGate?.value || "OR";
    return this._applyGate(gate2, first, c);
  }

  _applyGate(gate, a, b) {
    switch (gate) {
      case "AND":
        return a & b;
      case "XOR":
        return a ^ b;
      case "OR":
      default:
        return a | b;
    }
  }

  _buildPasswordCrackerPuzzle({ reward, failPenalty, skipPenalty }) {
    const maxAttempts = 6;
    const secretDigits = Array.from({ length: 4 }, () => this._randomInt(0, 9));
    const secret = secretDigits.join("");

    const puzzle = {
      id: "password-cracker",
      title: "Password Cracker",
      subtitle:
        "Reconstruct the 4-digit access key before the trace completes.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions:
        "Use the keypad or keyboard digits to enter a 4-digit code. Digits may repeat. Submit guesses to learn how many digits are correct and in the right slot before lockout.",
      state: {
        secret,
        attemptsLeft: maxAttempts,
        history: [],
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-logic",
        "puzzle-register",
        "puzzle-maze"
      );
      container.classList.add("puzzle-password");

      const display = document.createElement("div");
      display.className = "password-display";

      const attemptsEl = document.createElement("div");
      attemptsEl.className = "password-attempts";

      const historyTitle = document.createElement("div");
      historyTitle.className = "password-history-title";
      historyTitle.textContent = "Attempt Log";

      const historyList = document.createElement("ul");
      historyList.className = "password-history";

      const keypad = document.createElement("div");
      keypad.className = "password-keypad";

      const keypadButtons = [];
      let currentInput = "";
      let resolved = false;
      let disposed = false;

      const updateDisplay = () => {
        const padded = currentInput.padEnd(4, "_");
        display.textContent = padded
          .split("")
          .map((digit) => digit)
          .join(" ");
      };

      const updateAttempts = () => {
        attemptsEl.textContent = `Attempts remaining: ${puzzle.state.attemptsLeft}`;
      };

      const logAttempt = (guess, resultText) => {
        const item = document.createElement("li");
        item.textContent = `${guess} → ${resultText}`;
        historyList.prepend(item);
        puzzle.state.history.unshift({ guess, result: resultText });
      };

      const setDisabledState = (disabled) => {
        keypadButtons.forEach((button) => {
          button.disabled = disabled;
        });
      };

      const cleanup = () => {
        if (disposed) return;
        disposed = true;
        window.removeEventListener("keydown", handleKeyDown);
      };

      const evaluateGuess = () => {
        if (resolved) {
          return;
        }
        if (currentInput.length !== 4) {
          helpers.setFeedback?.("Enter four digits before submitting.");
          return;
        }

        const guess = currentInput;
        currentInput = "";
        updateDisplay();

        if (guess === puzzle.state.secret) {
          resolved = true;
          setDisabledState(true);
          cleanup();
          logAttempt(guess, "Exact match");
          helpers.completeSuccess?.("Cipher accepted! Access granted.");
          return;
        }

        puzzle.state.attemptsLeft -= 1;

        const { correctPosition, correctDigit } = this._comparePasswordGuess(
          puzzle.state.secret,
          guess
        );

        const resultText = `${correctPosition} in place, ${correctDigit} misplaced`;
        logAttempt(guess, resultText);
        updateAttempts();

        if (puzzle.state.attemptsLeft <= 0) {
          resolved = true;
          setDisabledState(true);
          cleanup();
          helpers.completeFailure?.("Lockout triggered — trace inbound!", {
            reason: "password-lockout",
          });
          return;
        }

        helpers.setFeedback?.(
          `${correctPosition} digit(s) are perfect, ${correctDigit} are correct but misplaced.`
        );
      };

      const appendDigit = (digit) => {
        if (resolved) return;
        if (currentInput.length >= 4) return;
        currentInput += digit;
        updateDisplay();
      };

      const handleBackspace = () => {
        if (resolved) return;
        currentInput = currentInput.slice(0, -1);
        updateDisplay();
      };

      const handleClear = () => {
        if (resolved) return;
        currentInput = "";
        updateDisplay();
      };

      const handleKeyDown = (event) => {
        if (resolved) return;
        const key = event.key;
        if (/^[0-9]$/.test(key)) {
          appendDigit(key);
          event.preventDefault();
        } else if (key === "Backspace") {
          handleBackspace();
          event.preventDefault();
        } else if (key === "Enter") {
          evaluateGuess();
          event.preventDefault();
        }
      };

      const digitOrder = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
      digitOrder.forEach((digit) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "password-key";
        button.textContent = digit;
        button.addEventListener("click", () => appendDigit(digit));
        keypad.appendChild(button);
        keypadButtons.push(button);
      });

      const backButton = document.createElement("button");
      backButton.type = "button";
      backButton.className = "password-key secondary";
      backButton.textContent = "Back";
      backButton.addEventListener("click", handleBackspace);
      keypad.appendChild(backButton);
      keypadButtons.push(backButton);

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "password-key secondary";
      clearButton.textContent = "Clear";
      clearButton.addEventListener("click", handleClear);
      keypad.appendChild(clearButton);
      keypadButtons.push(clearButton);

      const submitButton = document.createElement("button");
      submitButton.type = "button";
      submitButton.className = "password-key primary";
      submitButton.textContent = "Submit";
      submitButton.addEventListener("click", evaluateGuess);
      keypad.appendChild(submitButton);
      keypadButtons.push(submitButton);

      container.appendChild(display);
      container.appendChild(attemptsEl);
      container.appendChild(keypad);
      container.appendChild(historyTitle);
      container.appendChild(historyList);

      const actions = document.createElement("div");
      actions.className = "password-inline-actions";
      const inlineSkip = document.createElement("button");
      inlineSkip.type = "button";
      inlineSkip.className = "password-inline-skip";
      inlineSkip.textContent =
        helpers.getSkipLabel?.() ||
        `Skip (-${this._formatScore(puzzle.skipPenalty)} SCORE)`;
      inlineSkip.addEventListener("click", () => helpers.triggerSkip?.());
      actions.appendChild(inlineSkip);
      container.appendChild(actions);

      puzzle.state.attemptsLeft = maxAttempts;
      puzzle.state.history = [];
      historyList.innerHTML = "";
      updateDisplay();
      updateAttempts();
      helpers.setFeedback?.(
        "Crack the code before the firewall locks you out."
      );

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        cleanup();
      };
    };

    return puzzle;
  }

  _buildMazePuzzle({ reward, failPenalty, skipPenalty }) {
    const layout = ["S..#.", ".#.#.", ".#T#.", ".#...", "...#."];

    const maxMoves = 16;

    const puzzle = {
      id: "maze-navigation",
      title: "Pathfinding Simulator",
      subtitle: "Route the maintenance bot to the target node.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions:
        "Use the arrow keys or on-screen controls to guide the bot to the magenta target. Avoid walls and reach the goal within 16 moves.",
      state: {
        layout,
        maxMoves,
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-logic",
        "puzzle-register",
        "puzzle-password"
      );
      container.classList.add("puzzle-maze");

      const rows = layout.length;
      const cols = layout[0]?.length || 0;
      const cells = Array.from({ length: rows }, () => Array(cols));

      let robot = { row: 0, col: 0 };
      let target = { row: rows - 1, col: cols - 1 };
      let movesLeft = maxMoves;
      let resolved = false;
      let disposed = false;

      const grid = document.createElement("div");
      grid.className = "maze-grid";
      grid.style.setProperty("--maze-cols", cols.toString());

      const status = document.createElement("div");
      status.className = "maze-status";

      const controls = document.createElement("div");
      controls.className = "maze-controls";

      const updateStatus = () => {
        status.textContent = `Moves remaining: ${movesLeft}`;
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

      const attemptMove = (deltaRow, deltaCol) => {
        if (resolved) return;

        const nextRow = robot.row + deltaRow;
        const nextCol = robot.col + deltaCol;

        if (nextRow < 0 || nextRow >= rows || nextCol < 0 || nextCol >= cols) {
          helpers.setFeedback?.("Boundary reached — choose another route.");
          return;
        }

        if (layout[nextRow][nextCol] === "#") {
          helpers.setFeedback?.("Obstacle detected — rerouting required.");
          return;
        }

        robot = { row: nextRow, col: nextCol };
        movesLeft -= 1;
        puzzle.state.robot = { ...robot };
        puzzle.state.movesLeft = movesLeft;
        applyRobotPosition();
        updateStatus();

        if (robot.row === target.row && robot.col === target.col) {
          resolved = true;
          cleanup();
          helpers.completeSuccess?.("Target reached. Pathfinding successful!");
          return;
        }

        if (movesLeft <= 0) {
          resolved = true;
          cleanup();
          helpers.completeFailure?.(
            "Move budget exhausted — simulation aborted.",
            {
              reason: "maze-out-of-moves",
            }
          );
          return;
        }

        helpers.setFeedback?.("Continue routing toward the target node.");
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
        "Plot a path to the goal within the allotted moves."
      );

      window.addEventListener("keydown", handleKeyDown, true);

      return () => {
        cleanup();
      };
    };

    return puzzle;
  }

  _buildRegisterPuzzle({ reward, failPenalty, skipPenalty }) {
    const startValue = this._randomInt(0, 255);
    let currentValue = startValue;
    let targetValue = startValue;

    const operations = ["rotate", "shift", "not"];
    const applyOperation = (value, op) => {
      switch (op) {
        case "rotate":
          return ((value >> 1) | ((value & 1) << 7)) & 0xff;
        case "shift":
          return ((value << 1) & 0xfe) >>> 0;
        case "not":
          return value ^ 0xff;
        default:
          return value;
      }
    };

    const sequenceLength = this._randomInt(2, 5);
    for (let i = 0; i < sequenceLength; i++) {
      const op = operations[this._randomInt(0, operations.length - 1)];
      targetValue = applyOperation(targetValue, op);
    }

    if (targetValue === startValue) {
      targetValue = applyOperation(targetValue, "not");
    }

    const puzzle = {
      id: "register-reconfig",
      title: "Sub-Register Reconfigurator",
      subtitle: "Use bitwise operations to match the target register.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions:
        "Use Rotate, Shift, and NOT to transform the current register into the target pattern. Reset if you need a fresh start.",
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-logic",
        "puzzle-password",
        "puzzle-maze"
      );
      container.classList.add("puzzle-register");

      let current = startValue;
      const history = [];

      const binary = (value) => value.toString(2).padStart(8, "0");

      const header = document.createElement("div");
      header.className = "register-header";
      header.innerHTML = `
        <div class="register-value">Current: <strong id="registerCurrent">${binary(
          current
        )}</strong></div>
        <div class="register-value">Target: <strong>${binary(
          targetValue
        )}</strong></div>
      `;

      const buttonRow = document.createElement("div");
      buttonRow.className = "register-buttons";

      const historyList = document.createElement("ol");
      historyList.className = "register-history";

      const updateDisplay = (message) => {
        const currentLabel = header.querySelector("#registerCurrent");
        if (currentLabel) {
          currentLabel.textContent = binary(current);
        }
        helpers.setFeedback?.(message || `Current value: ${binary(current)}`);
        if (current === targetValue) {
          helpers.completeSuccess?.("Register synchronized!");
        }
      };

      const logOperation = (label, value) => {
        history.push(label);
        const item = document.createElement("li");
        item.textContent = `${label} → ${binary(value)}`;
        historyList.appendChild(item);
      };

      const perform = (operation) => {
        if (current === targetValue) {
          return;
        }
        let label = "";
        switch (operation) {
          case "rotate":
            current = ((current >> 1) | ((current & 1) << 7)) & 0xff;
            label = "Rotate Right";
            break;
          case "shift":
            current = ((current << 1) & 0xfe) >>> 0;
            label = "Shift Left";
            break;
          case "not":
            current = current ^ 0xff;
            label = "NOT";
            break;
          case "reset":
            current = startValue;
            history.length = 0;
            historyList.innerHTML = "";
            helpers.setFeedback?.("Register reset to original value.");
            updateDisplay();
            return;
          default:
            return;
        }
        logOperation(label, current);
        updateDisplay();
      };

      const createButton = (text, operation) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "register-button";
        btn.textContent = text;
        btn.addEventListener("click", () => perform(operation));
        buttonRow.appendChild(btn);
      };

      createButton("Rotate Right", "rotate");
      createButton("Shift Left", "shift");
      createButton("NOT", "not");
      createButton("Reset", "reset");

      container.appendChild(header);
      container.appendChild(buttonRow);
      container.appendChild(historyList);

      updateDisplay("Apply operations to reach the target pattern.");
    };

    return puzzle;
  }

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
}
