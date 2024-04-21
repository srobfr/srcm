/**
 * A small memoize helper
 */
export default function memoize<T extends (...args: any) => any>(func: T): T {
  const valueKey = Symbol();
  const cache = new Map();
  return ((...args) => {
    let m = cache;
    for (const arg of args) {
      let mm = m.get(arg);
      if (mm === undefined) m.set(arg, mm = new Map());
      m = mm;
    }

    if (!m.has(valueKey)) m.set(valueKey, func(...args));
    return m.get(valueKey);
  }) as T;
}
