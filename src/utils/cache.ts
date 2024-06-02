/**
 * A small cache helper
 */
export default function buildCache<T>(): (keys: Array<any>, getValue: () => T) => any {
  const valueKey = Symbol();
  const cache = new Map();
  return ((keys: Array<any>, getValue: () => T) => {
    let m = cache;
    for (const key of keys) {
      let mm = m.get(key);
      if (mm === undefined) m.set(key, mm = new Map());
      m = mm;
    }

    if (!m.has(valueKey)) m.set(valueKey, getValue());
    return m.get(valueKey);
  });
}
