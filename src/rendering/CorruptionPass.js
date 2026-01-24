export default class CorruptionPass {
  constructor() {
    this.domElement = document.createElement("div");
    this.domElement.id = "corruption-pass";
    Object.assign(this.domElement.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: "800",
        mixBlendMode: "overlay",
        opacity: "1",
        background: "url('../Assets/textures/noise.png')", // Placeholder or generated
        filter: "contrast(1.5) sepia(0.3)"
    });
    document.body.appendChild(this.domElement);
    
    // Scanlines
    this.scanline = document.createElement("div");
    Object.assign(this.scanline.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
        backgroundSize: "100% 2px, 3px 100%",
        pointerEvents: "none"
    });
    this.domElement.appendChild(this.scanline);
    
    this.intensity = 1.0;
  }
  
  update(deltaTime, intensity) {
      this.intensity = intensity; // 0.0 to 1.0 (1.0 = fully corrupt)
      
      const opacity = 0.2 + this.intensity * 0.5;
      this.domElement.style.opacity = opacity;
      
      // Flickering
      if (Math.random() < 0.1 * this.intensity) {
          this.domElement.style.filter = `contrast(${1.5 + Math.random()}) sepia(${0.3 + Math.random()*0.5}) hue-rotate(${Math.random()*20}deg)`;
          this.domElement.style.transform = `translateX(${Math.random()*2 - 1}px)`;
      } else {
          this.domElement.style.filter = `contrast(1.2) sepia(0.2)`;
          this.domElement.style.transform = "none";
      }
  }
}
