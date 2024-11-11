import { ioc } from "./ioc.ts";
import { NodeRuntimeAdapter } from "./runtimes/NodeRuntimeAdapter.ts";

export * from "./dom/Node.ts";
export * from "./dom/RepeatNode.ts";
export * from "./dom/SearchableNode.ts";

export * from "./grammar/GrammarTypes.ts";

export const { g, parse } = ioc(new NodeRuntimeAdapter());
