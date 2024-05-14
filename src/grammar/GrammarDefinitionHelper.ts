import { RuntimeAdapter } from "../runtimes/types.ts";
import { OptionalGrammar, RegExpGrammar, StringGrammar } from "./GrammarTypes.ts";
import { SequenceGrammar } from "./GrammarTypes.ts";
import { RepeatGrammar } from "./GrammarTypes.ts";
import { ChoiceGrammar } from "./GrammarTypes.ts";
import { isGrammar } from "./GrammarTypes.ts";
import { Grammar } from "./GrammarTypes.ts";

export type OrGrammarDef = { or: Array<GrammarDef> };
export const isOrGrammarDef = (value: any): value is OrGrammarDef => value?.or && Array.isArray(value.or);

export type GrammarDef = Grammar | RegExp | string | Array<GrammarDef> | OrGrammarDef;
export const isGrammarDef = (value: any): value is GrammarDef => (
  isGrammar(value) ||
  value instanceof RegExp ||
  typeof value === "string" ||
  Array.isArray(value) ||
  isOrGrammarDef(value)
);

type EmptyObject = Record<string | number | symbol, never>;

export default class GrammarDefinitionHelper {
  /** Allows to reuse previous results + handles infinite recursions */
  private gCache: Map<any, Grammar | EmptyObject> | null = null;

  constructor(private readonly runtimeAdapter: RuntimeAdapter) {
  }

  /** Helper to converts shorthand grammar formats into full grammar objects */
  #g<TGrammar extends Grammar>(value: TGrammar, props?: Partial<Grammar>): TGrammar;
  #g(value: TemplateStringsArray, ...args: Array<GrammarDef>): SequenceGrammar; // Typically called like this : g`Foo${"bar"}plop`
  #g(value: OrGrammarDef, props?: Partial<Grammar>): ChoiceGrammar;
  #g(value: Array<GrammarDef>, props?: Partial<Grammar>): SequenceGrammar;
  #g(value: string, props?: Partial<Grammar>): StringGrammar;
  #g(value: RegExp, props?: Partial<Grammar>): RegExpGrammar;
  #g(value: GrammarDef, props?: Partial<Grammar>): Grammar;
  #g(value: string | TemplateStringsArray | GrammarDef, props?: GrammarDef | { [key: string]: any }, ...args: Array<GrammarDef>): Grammar {
    const r = this.gCache?.get(value);
    if (r) return r as Grammar;

    if (Array.isArray(value) && isGrammarDef(props)) {
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

  #or(value: Array<GrammarDef>, props?: Partial<Grammar>): ChoiceGrammar {
    return { ...props, type: "choice", value: value.map(v => this.#g(v)) };
  }

  #optional(value: GrammarDef, props?: Partial<Grammar>): OptionalGrammar {
    return { ...props, type: "optional", value: this.#g(value) };
  }

  #repeat(value: GrammarDef, props?: Partial<Grammar>): RepeatGrammar {
    return { ...props, type: "repeat", value: this.#g(value) };
  }

  /** Helper to converts shorthand grammar formats into full grammar objects */
  public g = Object.assign(this.#g.bind(this), {
    or: this.#or.bind(this),
    optional: this.#optional.bind(this),
    repeat: this.#repeat.bind(this),
  });
}
