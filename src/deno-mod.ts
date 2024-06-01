import ioc from "./ioc.ts";
import DenoRuntimeAdapter from "./runtimes/DenoRuntimeAdapter.ts";

export const { g, parse } = ioc(new DenoRuntimeAdapter());
