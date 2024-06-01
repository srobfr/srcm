import ioc from "./ioc.ts";
import NodeRuntimeAdapter from "./runtimes/NodeRuntimeAdapter.ts";

export const { g, parse } = ioc(new NodeRuntimeAdapter());
