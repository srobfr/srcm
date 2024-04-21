import { RuntimeAdapter } from "../runtimes/types.ts";
import { isGrammar } from "./GrammarTypes.ts";
import { Grammar } from "./GrammarTypes.ts";

type OrGrammarDef = { or: Array<GrammarDef> };
const isOrGrammarDef = (value: any): value is OrGrammarDef => value?.or && Array.isArray(value.or);

type GrammarDef = Grammar | RegExp | string | Array<GrammarDef> | OrGrammarDef;

type EmptyObject = Record<string | number | symbol, never>;

export default class GrammarDefinitionHelper {
  /** Allows to reuse previous results + handles infinite recursions */
  private gCache: Map<any, Grammar | EmptyObject> | null = null;

  constructor(private readonly runtimeAdapter: RuntimeAdapter) {
  }

  /** Helper to converts shorthand grammar formats into full grammar objects */
  #g(
    value: string | TemplateStringsArray | GrammarDef,
    props?: Partial<Grammar> | { [key: string]: any },
    ...args: Array<GrammarDef>
  ): Grammar {
    const r = this.gCache?.get(value);
    if (r) return r as Grammar;

    if (args.length > 0) {
      args.unshift(props as GrammarDef);
      props = undefined;
    }

    const isFirstRecursionLevel = (this.gCache === null);
    this.gCache ??= new Map();

    try {
      const r: Grammar | EmptyObject = isGrammar(value) ? value : {};
      this.gCache.set(value, r);

      if (Array.isArray(value) && value.length === args.length + 1 && value.length > 1) {
        // Probably a template string. Build a sequence grammar from it.
        Object.assign(r, this.g(Array
          .from(
            { length: value.length },
            (_, i) => [value[i], args[i]]
          )
          .flat()
          .filter(v => !!v)
        ));
      }

      else if (typeof value === "string") Object.assign(r, { type: "string", value });
      else if (value instanceof RegExp) Object.assign(r, { type: "regexp", value });
      else if (typeof value === "function") Object.assign(r, { type: "function", value });
      else if (isOrGrammarDef(value)) Object.assign(r, { type: "choice", value: value.or.map(v => this.g(v)) });
      else if (Array.isArray(value)) Object.assign(r, { type: "sequence", value: value.map(v => this.g(v)) });

      if (!isGrammar(r)) {
        throw new Error(`Unable to build a grammar: ${this.runtimeAdapter.inspect({ value, templateArgs: args })}`);
      }

      Object.assign(r, props);
      return r as Grammar;
    } finally {
      if (isFirstRecursionLevel) this.gCache = null;
    }
  }

  /** Helper to converts shorthand grammar formats into full grammar objects */
  public g = this.#g.bind(this);
}
