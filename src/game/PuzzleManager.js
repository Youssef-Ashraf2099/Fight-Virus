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
      "checksum-balancer",
      "math-equation",
      "computer-riddle",
      "caesar-cipher",
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
      case "math-equation":
        return this._buildMathPuzzle(context);
      case "computer-riddle":
        return this._buildComputerRiddlePuzzle(context);
      case "caesar-cipher":
        return this._buildCaesarCipherPuzzle(context);
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

  _buildMazePuzzle({ reward, failPenalty, skipPenalty, waveNumber }) {
    const layoutInfo = this._generateMazeLayout({ waveNumber });
    const layout = layoutInfo.layout;
    const maxMoves = layoutInfo.maxMoves;

    const puzzle = {
      id: "maze-navigation",
      title: "Pathfinding Simulator",
      subtitle: "Route the maintenance bot to the target node.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions: `Use arrow keys or on-screen controls to reach the magenta node. Walls block movement. Clear the maze within ${maxMoves} moves.`,
      state: {
        layout,
        maxMoves,
        pathLength: layoutInfo.pathLength,
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
          helpers.setFeedback?.("Boundary reached — choose another route.");
          return;
        }

        if (!isTraversable(nextRow, nextCol)) {
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
        `Plot a path to the goal. Optimal route length: ${layoutInfo.pathLength} steps.`
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

  _generateMazeLayout({ waveNumber }) {
    const difficulty = Math.max(1, waveNumber || 1);
    let size = 5 + Math.min(4, Math.floor(difficulty / 2)) * 2;
    if (size % 2 === 0) {
      size += 1;
    }

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

    const extraCuts = Math.min(12, Math.floor(difficulty * 0.8));
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

    const start = { row: 1, col: 1 };
    const distances = this._mazeDistances(grid, start);
    let furthestKey = `${start.row}:${start.col}`;
    Object.keys(distances).forEach((key) => {
      if (distances[key] > distances[furthestKey]) {
        furthestKey = key;
      }
    });

    if (furthestKey === `${start.row}:${start.col}`) {
      const keys = Object.keys(distances).filter(
        (key) => key !== `${start.row}:${start.col}`
      );
      if (keys.length) {
        furthestKey = keys[0];
      } else {
        furthestKey = `${size - 2}:${size - 2}`;
        grid[size - 2][size - 2] = ".";
      }
    }

    const [targetRow, targetCol] = furthestKey
      .split(":")
      .map((value) => parseInt(value, 10));
    const pathLength = Math.max(1, distances[furthestKey] || size);

    grid[start.row][start.col] = "S";
    grid[targetRow][targetCol] = "T";

    const layout = grid.map((row) => row.join(""));
    const allowance = 1.55 + Math.min(0.5, difficulty * 0.02);
    const maxMoves = Math.ceil(pathLength * allowance) + 2;

    return {
      layout,
      maxMoves,
      pathLength,
      start,
      target: { row: targetRow, col: targetCol },
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

  _buildMathPuzzle({ waveNumber, reward, failPenalty, skipPenalty }) {
    // Determine difficulty based on wave number
    let difficulty = "easy";
    if (waveNumber >= 15) {
      difficulty = "hard";
    } else if (waveNumber >= 8) {
      difficulty = "medium";
    }

    // Select a random puzzle from the difficulty pool
    const puzzleData = this._selectMathPuzzle(difficulty);

    const puzzle = {
      id: "math-equation",
      title: "Mathematical Challenge",
      subtitle: `Difficulty: ${difficulty.toUpperCase()}`,
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: true,
      submitLabel: "Submit Answer",
      instructions: puzzleData.instructions,
      state: {
        userAnswer: "",
        correctAnswer: puzzleData.answer,
        puzzleType: puzzleData.type,
        attempts: 0,
        maxAttempts: 1,
        hint: puzzleData.hint,
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove(
        "puzzle-logic",
        "puzzle-register",
        "puzzle-password",
        "puzzle-maze",
        "puzzle-checksum"
      );
      container.classList.add("puzzle-math");

      // Problem display
      const problemDiv = document.createElement("div");
      problemDiv.className = "math-problem-display";
      problemDiv.innerHTML = `<div class="math-equation">${puzzleData.display}</div>`;
      container.appendChild(problemDiv);

      // Hint display
      const hintDiv = document.createElement("div");
      hintDiv.className = "math-hint";
      hintDiv.innerHTML = `<strong>💡 Hint:</strong> ${puzzle.state.hint}`;
      container.appendChild(hintDiv);

      // Input field
      const inputWrapper = document.createElement("div");
      inputWrapper.className = "math-input-wrapper";

      const inputLabel = document.createElement("label");
      inputLabel.textContent = "Your Answer: ";
      inputLabel.className = "math-input-label";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "math-answer-input";
      input.placeholder = puzzleData.placeholder || "Enter answer...";
      input.maxLength = 50;
      input.autocomplete = "off";

      input.addEventListener("input", (e) => {
        puzzle.state.userAnswer = e.target.value.trim();
      });

      // Auto-submit on Enter key
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          helpers.triggerSubmit?.();
        }
      });

      inputLabel.appendChild(input);
      inputWrapper.appendChild(inputLabel);
      container.appendChild(inputWrapper);

      // Attempts counter
      const attemptsDiv = document.createElement("div");
      attemptsDiv.className = "math-attempts";
      attemptsDiv.textContent = `Attempts remaining: ${
        puzzle.state.maxAttempts - puzzle.state.attempts
      }`;
      container.appendChild(attemptsDiv);

      // Focus input
      setTimeout(() => input.focus(), 100);

      // Store reference for validation
      puzzle.state.inputElement = input;
      puzzle.state.attemptsElement = attemptsDiv;

      return () => {
        // Cleanup
        puzzle.state.inputElement = null;
        puzzle.state.attemptsElement = null;
      };
    };

    puzzle.validate = () => {
      const userAnswer = puzzle.state.userAnswer.toLowerCase().trim();
      const correctAnswer = puzzle.state.correctAnswer.toLowerCase().trim();

      // Increment attempts
      puzzle.state.attempts++;

      // Update attempts display
      if (puzzle.state.attemptsElement) {
        puzzle.state.attemptsElement.textContent = `Attempts remaining: ${
          puzzle.state.maxAttempts - puzzle.state.attempts
        }`;
      }

      // Check if answer is correct
      if (this._compareMathAnswers(userAnswer, correctAnswer)) {
        return {
          success: true,
          message: "🎉 Correct! Mathematical prowess confirmed!",
        };
      } else {
        // Check if attempts exhausted
        if (puzzle.state.attempts >= puzzle.state.maxAttempts) {
          // Auto-fail after max attempts
          setTimeout(() => {
            if (this.active && !this.active.resolved) {
              this._complete("failure", {
                message: `❌ Incorrect! The answer was: ${puzzle.state.correctAnswer}`,
                scoreDelta: -failPenalty,
                reason: "max-attempts",
              });
            }
          }, 100);

          return {
            success: false,
            message: `❌ Incorrect! Out of attempts. Answer: ${puzzle.state.correctAnswer}`,
          };
        } else {
          return {
            success: false,
            message: `❌ Incorrect! Try again. (${
              puzzle.state.maxAttempts - puzzle.state.attempts
            } attempt${
              puzzle.state.maxAttempts - puzzle.state.attempts > 1 ? "s" : ""
            } left)`,
          };
        }
      }
    };

    return puzzle;
  }

  _selectMathPuzzle(difficulty) {
    const puzzles = {
      easy: [
        {
          type: "simple-calculation",
          display: "12 × 4 − 15 + 3 = ?",
          answer: "36",
          hint: "PEMDAS is your friend! (Or BODMAS, depending on your style.)",
          instructions: "Calculate the value of the expression.",
          placeholder: "e.g., 36",
        },
        {
          type: "find-x-addition",
          display: "x + 17 = 42",
          answer: "x=25",
          hint: "Think about what you need to add to 17 to get 42.",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=25",
        },
        {
          type: "simple-calculation",
          display: "8 + 6 × 3 − 4 = ?",
          answer: "22",
          hint: "Remember: multiplication before addition!",
          instructions: "Calculate the value of the expression.",
          placeholder: "e.g., 22",
        },
        {
          type: "find-x-division",
          display: "x ÷ 3 = 9",
          answer: "x=27",
          hint: "The opposite of division is multiplication!",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=27",
        },
        {
          type: "missing-operator",
          display:
            "5 __ 3 + 2 = 17<br><small>Find the missing operator (+ − × ÷)</small>",
          answer: "×",
          hint: "Try all four basic operators. Which one works?",
          instructions:
            "Find the missing operator that makes the equation true.",
          placeholder: "e.g., ×",
        },
        {
          type: "simple-calculation",
          display: "20 ÷ 4 + 7 × 2 = ?",
          answer: "19",
          hint: "Division and multiplication come before addition.",
          instructions: "Calculate the value of the expression.",
          placeholder: "e.g., 19",
        },
        {
          type: "find-x-subtraction",
          display: "x − 12 = 30",
          answer: "x=42",
          hint: "Add 12 to both sides to isolate x.",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=42",
        },
        {
          type: "find-x-multiplication",
          display: "4x = 28",
          answer: "x=7",
          hint: "Divide both sides by 4.",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=7",
        },
      ],
      medium: [
        {
          type: "two-step-equation",
          display: "5x − 8 = 32",
          answer: "x=8",
          hint: "First, isolate the term with x. Then, divide.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=8",
        },
        {
          type: "equation-with-powers",
          display: "3³ + 4² = ?",
          answer: "43",
          hint: "Remember aᵇ means a multiplied by itself b times.",
          instructions: "Calculate the value.",
          placeholder: "e.g., 43",
        },
        {
          type: "distributive-property",
          display: "4(x + 2) = 28",
          answer: "x=5",
          hint: "You can either distribute the 4, or divide both sides by 4 first.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=5",
        },
        {
          type: "equation-with-decimals",
          display: "2.5x = 10",
          answer: "x=4",
          hint: "Multiplying by 2.5 is the same as dividing by 0.4.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=4",
        },
        {
          type: "two-step-equation",
          display: "3x + 7 = 22",
          answer: "x=5",
          hint: "Subtract 7 first, then divide by 3.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=5",
        },
        {
          type: "equation-with-powers",
          display: "2⁴ − 5² + 3 = ?",
          answer: "-6",
          hint: "2⁴ = 16, 5² = 25, then do the arithmetic.",
          instructions: "Calculate the value.",
          placeholder: "e.g., -6",
        },
        {
          type: "fractions",
          display: "(x ÷ 2) + 5 = 12",
          answer: "x=14",
          hint: "First subtract 5, then multiply by 2.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=14",
        },
      ],
      hard: [
        {
          type: "variables-both-sides",
          display: "3x + 1 = 5x − 7",
          answer: "x=4",
          hint: "Get the x terms on one side and the numbers on the other.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=4",
        },
        {
          type: "system-of-equations",
          display: "If x + y = 10 and x − y = 4, find x.",
          answer: "x=7",
          hint: "Try adding the two equations together. What happens to y?",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=7",
        },
        {
          type: "square-root",
          display: "If x² = 81, what is the positive value of x?",
          answer: "x=9",
          hint: "What number multiplied by itself gives 81?",
          instructions: "Find the positive value of x.",
          placeholder: "e.g., x=9",
        },
        {
          type: "sequence",
          display: "The next number in the sequence: 2, 5, 11, 23, __",
          answer: "47",
          hint: "Rule: n × 2 + 1",
          instructions: "Find the missing number.",
          placeholder: "e.g., 47",
        },
        {
          type: "variables-both-sides",
          display: "7x − 4 = 2x + 11",
          answer: "x=3",
          hint: "Move all x terms to one side, all numbers to the other.",
          instructions: "Solve for x.",
          placeholder: "e.g., x=3",
        },
        {
          type: "quadratic",
          display: "If x² − 5x + 6 = 0, find the smaller value of x.",
          answer: "x=2",
          hint: "Factor: (x-2)(x-3) = 0. So x = 2 or x = 3.",
          instructions: "Find the smaller solution.",
          placeholder: "e.g., x=2",
        },
        {
          type: "system-of-equations",
          display: "If 2x + y = 15 and x + y = 9, find x.",
          answer: "x=6",
          hint: "Subtract the second equation from the first to eliminate y.",
          instructions: "Find the value of x.",
          placeholder: "e.g., x=6",
        },
        {
          type: "sequence",
          display: "The next number in the sequence: 1, 4, 9, 16, 25, __",
          answer: "36",
          hint: "These are perfect squares: 1², 2², 3², 4², 5², ...",
          instructions: "Find the missing number.",
          placeholder: "e.g., 36",
        },
      ],
    };

    const pool = puzzles[difficulty] || puzzles.easy;
    return pool[this._randomInt(0, pool.length - 1)];
  }

  _compareMathAnswers(userAnswer, correctAnswer) {
    // Normalize both answers for comparison
    const normalize = (str) => {
      return str
        .replace(/\s+/g, "") // Remove all spaces
        .replace(/[×*]/g, "*") // Normalize multiplication
        .replace(/[÷/]/g, "/") // Normalize division
        .replace(/\+/g, "+")
        .replace(/-/g, "-")
        .toLowerCase();
    };

    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswer);

    // Direct comparison
    if (normalizedUser === normalizedCorrect) {
      return true;
    }

    // For equations with x=value, also accept just the value
    if (normalizedCorrect.startsWith("x=")) {
      const justValue = normalizedCorrect.substring(2);
      if (normalizedUser === justValue) {
        return true;
      }
    }

    // For numeric answers, try parsing and comparing
    const userNum = parseFloat(normalizedUser);
    const correctNum = parseFloat(normalizedCorrect);
    if (!isNaN(userNum) && !isNaN(correctNum)) {
      return Math.abs(userNum - correctNum) < 0.001;
    }

    return false;
  }

  /**
   * Build a computer riddle puzzle
   */
  _buildComputerRiddlePuzzle(context) {
    const riddle = this._selectComputerRiddle();

    return {
      type: "computer-riddle",
      title: "💻 COMPUTER COMPONENT RIDDLE",
      description: "Identify the computer component based on the clue.",
      data: {
        riddle: riddle.question,
        hint: riddle.hint,
        acceptedAnswers: riddle.answers, // Array of valid answers
      },
      timeout: 60,
      maxAttempts: 1,
      checkAnswer: (input) => this._compareRiddleAnswer(input, riddle.answers),
      getHtml: () => this._getRiddleHtml(riddle),
    };
  }

  /**
   * Select a random computer riddle
   */
  _selectComputerRiddle() {
    const riddles = [
      {
        question:
          "I am the Grand Architect of the system. Every command must pass through my mind before it can become reality.",
        hint: "Think about what does the thinking... The true core of intelligence.",
        answers: [
          "cpu",
          "processor",
          "central processing unit",
          "microprocessor",
          "the brain",
        ],
      },
      {
        question:
          "I am the Scribe of the Present. My pages fill and empty constantly, but if the lights go out, my entire temporary history is wiped clean.",
        hint: "The amount of space you have for multitasking right now.",
        answers: ["ram", "memory", "random access memory", "system memory"],
      },
      {
        question:
          "I am the Eye of the Machine. I take complex mathematics and translate them into the vibrant world you see. Without me, the world is dark and dull and AI will not raise.",
        hint: "I render the visuals... Graphics is key.",
        answers: [
          "gpu",
          "graphics card",
          "video card",
          "graphics processing unit",
        ],
      },
      {
        question:
          "I am the Ancient Archive. I hold the secrets, stories, and histories long after the power has failed. I am the long-term memory.",
        hint: "Where do all the permanent files live? Spin or flash.",
        answers: [
          "hard drive",
          "hdd",
          "hard disk",
          "storage drive",
          "ssd",
          "solid state drive",
        ],
      },
      {
        question:
          "I am the Unifying Continent. Every single vital organ must be directly plugged into my surface to communicate and operate.",
        hint: "The main foundation that ties all the pieces together.",
        answers: ["motherboard", "mainboard", "mobo", "system board"],
      },
      {
        question:
          "I am the Great Alchemist. I take wild, dangerous power from the wall and turn it into the stable, gentle current that the machine can sip safely.",
        hint: "What supplies the power to everything?",
        answers: ["psu", "power supply", "power supply unit"],
      },

      {
        question:
          "I am the Digital Bridge to the outside world. I speak the languages of networks and bring messages back and forth across the wire.",
        hint: "How does the machine connect to the internet?",
        answers: [
          "nic",
          "network card",
          "network interface card",
          "ethernet card",
        ],
      },
      {
        question:
          "I am the Waking Ritual. I am the very first code executed, ensuring every limb is ready before the true King (the OS) takes the throne.",
        hint: "Basic Input/Output checks before boot.",
        answers: ["bios", "basic input output system", "firmware"],
      },
      {
        question:
          "I am the Looking Glass. I have no thoughts of my own, but I am the only way for the machine to show you its truth.",
        hint: "The display that lets you see.",
        answers: ["monitor", "display", "screen"],
      },
      {
        question: "I'm connector of the digital world and physical world.",

        hint: "I am the core of the computer without me it is useless.",

        answers: ["kernel", "os kernel", "system kernel"],
      },
      {
        question:
          "I'm the speed at which the  brain executes instructions, measured in GHz.",

        hint: "Think about the ticking of the clock...",

        answers: ["clock speed", "frequency", "clock rate", "processor speed"],
      },
    ];

    return riddles[Math.floor(Math.random() * riddles.length)];
  }

  /**
   * Compare riddle answer with accepted answers (case-insensitive)
   */
  _compareRiddleAnswer(userInput, acceptedAnswers) {
    if (!userInput || !acceptedAnswers || acceptedAnswers.length === 0) {
      return false;
    }

    // Normalize user input
    const normalized = userInput.trim().toLowerCase();

    // Check if the normalized input matches any accepted answer
    return acceptedAnswers.some((answer) => {
      const normalizedAnswer = answer.toLowerCase();
      return normalized === normalizedAnswer;
    });
  }

  /**
   * Generate HTML for riddle puzzle
   */
  _getRiddleHtml(riddle) {
    return `
      <div class="riddle-display">
        <div class="riddle-question">${riddle.question}</div>
        ${
          riddle.hint
            ? `<div class="riddle-hint">💡 Hint: ${riddle.hint}</div>`
            : ""
        }
      </div>
      <div class="riddle-input-wrapper">
        <label for="riddleAnswer" class="riddle-label">Your Answer:</label>
        <input
          type="text"
          id="riddleAnswer"
          class="riddle-answer-input"
          placeholder="Type your answer..."
          autocomplete="off"
        />
      </div>
      <div class="riddle-attempts">Attempts remaining: <span class="attempts-count">1</span></div>
    `;
  }

  /**
   * Build a Caesar cipher puzzle
   */
  _buildCaesarCipherPuzzle(context) {
    const cipher = this._selectCaesarCipher();

    return {
      type: "caesar-cipher",
      title: "🔐 CAESAR CIPHER DECRYPTION",
      description: "Decrypt the message by shifting the letters.",
      data: {
        encryptedMessage: cipher.encrypted,
        shift: cipher.shift,
        operation: cipher.operation, // "add" or "subtract"
        correctAnswer: cipher.decrypted,
        hint: cipher.hint,
      },
      timeout: 60,
      maxAttempts: 1,
      checkAnswer: (input) =>
        this._compareCipherAnswer(input, cipher.decrypted),
      getHtml: () => this._getCaesarCipherHtml(cipher),
    };
  }

  /**
   * Select a random Caesar cipher puzzle
   */
  _selectCaesarCipher() {
    const ciphers = [
      {
        encrypted: "KVSU",
        decrypted: "DOOR",
        shift: 7,
        operation: "subtract",
        hint: "Each letter moves 7 positions back in the alphabet",
      },
      {
        encrypted: "KHOOR",
        decrypted: "HELLO",
        shift: 3,
        operation: "subtract",
        hint: "Classic Caesar cipher with shift of 3",
      },
      {
        encrypted: "FRPSXWHU",
        decrypted: "COMPUTER",
        shift: 3,
        operation: "subtract",
        hint: "Think about the device you're using",
      },
      {
        encrypted: "YLUXV",
        decrypted: "VIRUS",
        shift: 3,
        operation: "subtract",
        hint: "What are you fighting in this game?",
      },
      {
        encrypted: "JRRG",
        decrypted: "GOOD",
        shift: 3,
        operation: "subtract",
        hint: "A positive word",
      },
      {
        encrypted: "CVZA",
        decrypted: "HACK",
        shift: 5,
        operation: "subtract",
        hint: "What cybersecurity experts prevent",
      },
      {
        encrypted: "HQFUBSW",
        decrypted: "ENCRYPT",
        shift: 1,
        operation: "subtract",
        hint: "The opposite of decrypt",
      },
      {
        encrypted: "UHJLVWHU",
        decrypted: "REGISTER",
        shift: 3,
        operation: "subtract",
        hint: "A CPU component that stores data",
      },
      {
        encrypted: "GCV",
        decrypted: "CPU",
        shift: 4,
        operation: "subtract",
        hint: "The brain of the computer",
      },
      {
        encrypted: "NHUQHO",
        decrypted: "KERNEL",
        shift: 3,
        operation: "subtract",
        hint: "The core of an operating system",
      },
      {
        encrypted: "ELMW",
        decrypted: "BYTE",
        shift: 7,
        operation: "subtract",
        hint: "8 bits make one of these",
      },
      {
        encrypted: "QHWZRUN",
        decrypted: "NETWORK",
        shift: 3,
        operation: "subtract",
        hint: "Connected computers form this",
      },
      {
        encrypted: "KDUGGULWH",
        decrypted: "HARDDRIVE",
        shift: 1,
        operation: "subtract",
        hint: "Permanent storage device",
      },
      {
        encrypted: "PHPSBZ",
        decrypted: "MEMORY",
        shift: 3,
        operation: "subtract",
        hint: "RAM is this type of component",
      },
      {
        encrypted: "ILUHZDOO",
        decrypted: "FIREWALL",
        shift: 3,
        operation: "subtract",
        hint: "Network security barrier",
      },
      // Addition ciphers (forward shifts)
      {
        encrypted: "EBNF",
        decrypted: "CODE",
        shift: 1,
        operation: "add",
        hint: "What programmers write",
      },
      {
        encrypted: "GDWD",
        decrypted: "DATA",
        shift: 3,
        operation: "add",
        hint: "Information stored in computers",
      },
      {
        encrypted: "JOTZ",
        decrypted: "FILE",
        shift: 4,
        operation: "add",
        hint: "A document or program stored on disk",
      },
      {
        encrypted: "VTGR",
        decrypted: "SAVE",
        shift: 2,
        operation: "add",
        hint: "What you do to keep your work",
      },
      {
        encrypted: "NQCF",
        decrypted: "LOAD",
        shift: 2,
        operation: "add",
        hint: "Opening a saved file",
      },
      {
        encrypted: "UHTW",
        decrypted: "SCAN",
        shift: 2,
        operation: "add",
        hint: "What antivirus software does",
      },
      {
        encrypted: "TQTVK",
        decrypted: "POKER",
        shift: 10,
        operation: "add",
        hint: "A card game, but also a debugging tool",
      },
      {
        encrypted: "NKPI",
        decrypted: "MICE",
        shift: 1,
        operation: "add",
        hint: "Plural of a pointing device",
      },
      {
        encrypted: "SRUWV",
        decrypted: "PORTS",
        shift: 1,
        operation: "add",
        hint: "Connection points on a computer",
      },
      {
        encrypted: "EJWH",
        decrypted: "BITS",
        shift: 5,
        operation: "add",
        hint: "The smallest unit of data (plural)",
      },
      {
        encrypted: "FQFNG",
        decrypted: "CYCLE",
        shift: 3,
        operation: "add",
        hint: "One complete operation of the CPU",
      },
      {
        encrypted: "VWDFN",
        decrypted: "STACK",
        shift: 2,
        operation: "add",
        hint: "A memory structure that is LIFO",
      },
      {
        encrypted: "SWGXK",
        decrypted: "PATCH",
        shift: 3,
        operation: "add",
        hint: "A software update to fix bugs",
      },
      {
        encrypted: "XGVGT",
        decrypted: "USER",
        shift: 3,
        operation: "add",
        hint: "The person operating the computer",
      },
      {
        encrypted: "FQORJGT",
        decrypted: "DEBUGGER",
        shift: 2,
        operation: "add",
        hint: "A tool for finding and fixing code errors",
      },
    ];

    return ciphers[Math.floor(Math.random() * ciphers.length)];
  }

  /**
   * Encode/decode Caesar cipher
   */
  _applyCaesarShift(text, shift, isDecoding = false) {
    const actualShift = isDecoding ? -shift : shift;
    return text
      .split("")
      .map((char) => {
        if (char >= "A" && char <= "Z") {
          const code = char.charCodeAt(0) - 65;
          const shifted = (code + actualShift + 26) % 26;
          return String.fromCharCode(shifted + 65);
        } else if (char >= "a" && char <= "z") {
          const code = char.charCodeAt(0) - 97;
          const shifted = (code + actualShift + 26) % 26;
          return String.fromCharCode(shifted + 97);
        }
        return char; // Non-alphabetic characters remain unchanged
      })
      .join("");
  }

  /**
   * Compare Caesar cipher answer
   */
  _compareCipherAnswer(userInput, correctAnswer) {
    if (!userInput || !correctAnswer) {
      return false;
    }

    // Normalize both strings: trim, convert to uppercase
    const normalized = userInput.trim().toUpperCase();
    const normalizedCorrect = correctAnswer.trim().toUpperCase();

    return normalized === normalizedCorrect;
  }

  /**
   * Generate HTML for Caesar cipher puzzle
   */
  _getCaesarCipherHtml(cipher) {
    const operationText =
      cipher.operation === "subtract"
        ? `Subtract ${cipher.shift}`
        : `Add ${cipher.shift}`;

    return `
      <div class="cipher-display">
        <div class="cipher-encrypted-message">${cipher.encrypted}</div>
        <div class="cipher-instruction">
          <span class="cipher-operation">${operationText}</span>
          <span class="cipher-arrow">→</span>
          <span class="cipher-question">?</span>
        </div>
        ${
          cipher.hint
            ? `<div class="cipher-hint">💡 Hint: ${cipher.hint}</div>`
            : ""
        }
      </div>
      <div class="cipher-input-wrapper">
        <label for="cipherAnswer" class="cipher-label">Decrypted Message:</label>
        <input
          type="text"
          id="cipherAnswer"
          class="cipher-answer-input"
          placeholder="Type the decoded message..."
          autocomplete="off"
        />
      </div>
      <div class="cipher-attempts">Attempts remaining: <span class="attempts-count">1</span></div>
      <div class="cipher-explanation">
        <small>Each letter shifts ${cipher.shift} position(s) ${
      cipher.operation === "subtract" ? "backward" : "forward"
    } in the alphabet</small>
      </div>
    `;
  }
}

export default PuzzleManager;
