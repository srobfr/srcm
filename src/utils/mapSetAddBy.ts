  /** Utility that builds a Map of Sets, creating sets as needed */
  export function mapSetAddBy<T, U>(map: Map<T, Set<U>>, key: T, values: Iterable<U>) {
    let set = map.get(key);
    if (!set) { set = new Set(); map.set(key, set); }
    for (const v of values) set.add(v);
  }
