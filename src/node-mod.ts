import ioc from "./ioc.ts";
import NodeRuntimeAdapter from "./runtimes/NodeRuntimeAdapter.ts";
import NodeClass from "./dom/Node.ts";

export const Node = NodeClass;
export const { g, parse } = ioc(new NodeRuntimeAdapter());
