// Environment worker: bins bounding boxes into grid sectors off-thread
self.postMessage({ type: "READY" });

self.onmessage = (event) => {
  const msg = event.data;
  if (!msg || msg.type !== "BIN_SECTORS") return;

  try {
    const { requestId, sectorSize, boxes } = msg;
    const sectors = {};

    const addToSector = (key, id) => {
      if (!sectors[key]) sectors[key] = [];
      sectors[key].push(id);
    };

    const size = sectorSize || 40;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      const minX = Math.floor(box.min[0] / size);
      const maxX = Math.floor(box.max[0] / size);
      const minZ = Math.floor(box.min[2] / size);
      const maxZ = Math.floor(box.max[2] / size);

      for (let x = minX; x <= maxX; x++) {
        for (let z = minZ; z <= maxZ; z++) {
          addToSector(`${x},${z}`, box.id);
        }
      }
    }

    self.postMessage({ type: "SECTORS", requestId, sectors, sectorSize: size });
  } catch (err) {
    self.postMessage({
      type: "SECTORS_ERROR",
      error: err?.message || String(err),
    });
  }
};
