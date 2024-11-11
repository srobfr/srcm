
/**
 * Provides a stable runtime-independant way to serialize a JS object, including Map & Set
 */
export function stableInspect(value: any, space: number = 0): any {
  let i = 0;
  const refsMap = new WeakMap();

  function replacer(_key: string, value: any) {
    let r: any = value;

    if (refsMap.has(value)) {
      if (refsMap.get(value) === null) refsMap.set(value, `#ref${i++}`);
      r = refsMap.get(value);
    }

    else if (value instanceof Map) {
      r = {};
      for (const [k, v] of value.entries()) {
        r[`<${JSON.stringify(k, replacer)}>`] = v;
      }
    }

    else if (value instanceof Set) r = Array.from(value);
    else if (value instanceof RegExp) r = value.toString();

    if (value !== null && typeof value === "object") {
      refsMap.set(value, `#ref${i++}`);
    }

    return r;
  }

  return JSON.stringify(value, replacer, space);
}
