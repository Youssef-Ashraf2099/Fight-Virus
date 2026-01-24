export default class GoCoreClient {
  constructor(baseUrl = "http://localhost:9000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.latestState = null;
    this.pendingSwitchWeapon = -1;
    this.pendingEMP = false;
  }

  setSwitchWeapon(index) {
    if (typeof index === "number" && index >= 0) {
      this.pendingSwitchWeapon = index;
    }
  }

  requestEMP() {
    this.pendingEMP = true;
  }

  consumeSwitchWeapon() {
    const value = this.pendingSwitchWeapon;
    this.pendingSwitchWeapon = -1;
    return value;
  }

  consumeEMP() {
    const value = this.pendingEMP;
    this.pendingEMP = false;
    return value;
  }

  async sendInput(payload) {
    try {
      const body = {
        moveDirection: payload?.moveDirection || [0, 0, 0],
        fireWeapon: Boolean(payload?.fireWeapon),
        switchWeapon:
          typeof payload?.switchWeapon === "number"
            ? payload.switchWeapon
            : -1,
        useSprint: Boolean(payload?.useSprint),
        useEMP: Boolean(payload?.useEMP),
      };

      const res = await fetch(`${this.baseUrl}/input`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        this.latestState = await res.json();
        return this.latestState;
      }
    } catch (err) {
      console.warn("GoCoreClient: input request failed", err);
    }
    return null;
  }

  async fetchState() {
    try {
      const res = await fetch(`${this.baseUrl}/state`);
      if (res.ok) {
        this.latestState = await res.json();
        return this.latestState;
      }
    } catch (err) {
      console.warn("GoCoreClient: state request failed", err);
    }
    return null;
  }

  getLatestState() {
    return this.latestState;
  }
}
