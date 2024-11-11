import type { INode } from "./dom/Node.ts";
import type { G } from "./grammar/GrammarDefinitionHelper.ts";
import type { Grammar } from "./grammar/GrammarTypes.ts";
import { ioc } from "./ioc.ts";
import { DenoRuntimeAdapter } from "./runtimes/DenoRuntimeAdapter.ts";

export * from "./dom/Node.ts";
export * from "./dom/RepeatNode.ts";
export * from "./dom/SearchableNode.ts";

export * from "./grammar/GrammarTypes.ts";

const services: {
  g: G;
  parse: (code: string, grammar: Grammar) => INode;
} = ioc(new DenoRuntimeAdapter());

export const g = services.g;
export const parse = services.parse;
