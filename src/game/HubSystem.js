export default class HubSystem {
  constructor(player, uiManager) {
    this.player = player;
    this.uiManager = uiManager;
    
    this.unlocks = {
      minimap: false,
      damageIndicators: false,
      healthBars: false,
      compass: false
    };
    
    this.costs = {
      minimap: 500,
      damageIndicators: 300,
      healthBars: 800,
      compass: 200
    };
    
    // Initialize Fragments if not present
    if (this.player.fragments === undefined) {
        this.player.fragments = 0;
    }
  }
  
  isUnlocked(feature) {
    return this.unlocks[feature] === true;
  }
  
  purchase(feature) {
    if (this.unlocks[feature]) return { success: false, message: "ALREADY INSTALLED" };
    
    const cost = this.costs[feature];
    if (this.player.fragments >= cost) {
      this.player.fragments -= cost;
      this.unlocks[feature] = true;
      
      // Notify UI
      this.uiManager.showMessage(`INSTALLED: ${feature.toUpperCase()}`, 2000);
      
      return { success: true, message: "INSTALLATION COMPLETE" };
    }
    
    return { success: false, message: "INSUFFICIENT DATA" };
  }
  
  showShop() {
    // Logic to render Shop UI (HTML overlay)
    // For now, simple console/alert or hooking into UIManager upgrade menu
    console.log("Opening Safe Mode Hub...");
  }
}
