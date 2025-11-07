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

    const contentEl = this.uiManager?.getPuzzleContentElement?.();
    if (contentEl) {
      const helpers = {
        setFeedback: (text) => this.uiManager?.setPuzzleFeedback?.(text),
        completeSuccess: (message) =>
          this._complete("success", {
            message: message || "Puzzle complete!",
            scoreDelta: reward,
          }),
        updateSubmitLabel: (label) =>
          this.uiManager?.setPuzzleSubmitVisibility?.(
            puzzle.showSubmit !== false,
            label
          ),
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
    const allTypes = ["logic-gate", "rotational-router", "register-reconfig"];
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
      case "rotational-router":
        return this._buildRouterPuzzle(context);
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
      container.classList.remove("puzzle-router", "puzzle-register");
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

  _buildRouterPuzzle({ reward, failPenalty, skipPenalty }) {
    const rows = 3;
    const cols = 3;
    const layout = [
      { type: "corner", targetRotation: 1 },
      { type: "straight", targetRotation: 1 },
      { type: "corner", targetRotation: 2 },
      { type: "corner", targetRotation: 0 },
      { type: "cross", targetRotation: 0 },
      { type: "tee", targetRotation: 3 },
      { type: "corner", targetRotation: 0 },
      { type: "straight", targetRotation: 1 },
      { type: "corner", targetRotation: 3 },
    ];

    const puzzle = {
      id: "rotational-router",
      title: "Data Stream Router",
      subtitle: "Rotate each conduit until the network is synchronized.",
      reward,
      failPenalty,
      skipPenalty,
      showSubmit: false,
      instructions:
        "Rotate every conduit so each glowing port links to a neighbour—no loose ends.",
      state: {
        rows,
        cols,
        tiles: [],
      },
    };

    puzzle.render = (container, helpers) => {
      container.classList.remove("puzzle-logic", "puzzle-register");
      container.classList.add("puzzle-router");
      container.style.setProperty("--router-cols", cols.toString());

      const grid = document.createElement("div");
      grid.className = "wire-grid";
      grid.style.setProperty("--router-cols", cols.toString());

      puzzle.state.tiles = layout.map((tileConfig, index) => {
        const tile = document.createElement("div");
        tile.className = "wire-tile";
        tile.dataset.index = index.toString();
        tile.innerHTML = this._buildWireSVG(tileConfig.type);

        let rotation = this._randomInt(0, 3);
        if (rotation === tileConfig.targetRotation) {
          rotation = (rotation + this._randomInt(1, 3)) % 4;
        }
        tile.style.transform = `rotate(${rotation * 90}deg)`;

        const row = Math.floor(index / cols);
        const col = index % cols;
        const tileState = {
          element: tile,
          type: tileConfig.type,
          targetRotation: tileConfig.targetRotation,
          rotation,
          row,
          col,
        };

        tile.addEventListener("click", () => {
          tileState.rotation = (tileState.rotation + 1) % 4;
          tile.style.transform = `rotate(${tileState.rotation * 90}deg)`;
          this._checkRouterSolved(puzzle, helpers);
        });

        grid.appendChild(tile);
        return tileState;
      });

      container.appendChild(grid);
      helpers.setFeedback?.(
        "Trace the flow. Every connector must plug into an adjacent conduit."
      );
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
      container.classList.remove("puzzle-logic", "puzzle-router");
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

  _checkRouterSolved(puzzle, helpers) {
    const state = puzzle?.state;
    if (!state || !state.tiles || !state.tiles.length) {
      return false;
    }

    const rows = state.rows || 0;
    const cols = state.cols || 0;
    if (!rows || !cols) {
      return false;
    }

    const opposite = [2, 3, 0, 1];
    const indexFor = (row, col) => row * cols + col;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tile = state.tiles[indexFor(row, col)];
        const connections = this._getConnections(tile.type, tile.rotation);

        for (const direction of connections) {
          const neighbourRow =
            row + (direction === 2 ? 1 : direction === 0 ? -1 : 0);
          const neighbourCol =
            col + (direction === 1 ? 1 : direction === 3 ? -1 : 0);

          if (
            neighbourRow < 0 ||
            neighbourRow >= rows ||
            neighbourCol < 0 ||
            neighbourCol >= cols
          ) {
            helpers.setFeedback?.(
              "Open link detected on the edge — reroute that conduit."
            );
            return false;
          }

          const neighbour = state.tiles[indexFor(neighbourRow, neighbourCol)];
          const neighbourConnections = this._getConnections(
            neighbour.type,
            neighbour.rotation
          );

          if (!neighbourConnections.includes(opposite[direction])) {
            helpers.setFeedback?.(
              "Conduits misaligned — each connector must pair with its neighbour."
            );
            return false;
          }
        }
      }
    }

    helpers.completeSuccess?.("Signal routed successfully!");
    return true;
  }

  _getConnections(type, rotation) {
    const baseMap = {
      straight: [0, 2],
      corner: [0, 1],
      tee: [0, 1, 3],
      cross: [0, 1, 2, 3],
    };

    const base = baseMap[type] || [];
    return base.map((dir) => (dir + rotation) % 4);
  }

  _buildWireSVG(type) {
    switch (type) {
      case "straight":
        return `
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L50 100" stroke="#00ff88" stroke-width="16" stroke-linecap="round" />
          </svg>
        `;
      case "corner":
        return `
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L50 50 L100 50" stroke="#00ff88" stroke-width="16" stroke-linecap="round" fill="none" />
          </svg>
        `;
      case "tee":
        return `
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L50 100" stroke="#00ff88" stroke-width="16" stroke-linecap="round" />
            <path d="M0 50 L100 50" stroke="#00ff88" stroke-width="16" stroke-linecap="round" />
          </svg>
        `;
      case "cross":
      default:
        return `
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 0 L50 100" stroke="#00ff88" stroke-width="16" stroke-linecap="round" />
            <path d="M0 50 L100 50" stroke="#00ff88" stroke-width="16" stroke-linecap="round" />
          </svg>
        `;
    }
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
