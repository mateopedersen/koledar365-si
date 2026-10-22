// PDF.js uses the newer Map.getOrInsertComputed API. Keep its PDF-to-image
// export working in browsers that have not implemented that method yet.
export function ensureMapGetOrInsertComputed(MapConstructor = Map) {
  if (typeof MapConstructor.prototype.getOrInsertComputed === 'function') return;

  Object.defineProperty(MapConstructor.prototype, 'getOrInsertComputed', {
    configurable: true,
    writable: true,
    value(key, callback) {
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      if (this.has(key)) return this.get(key);
      const value = callback(key);
      this.set(key, value);
      return value;
    },
  });
}
