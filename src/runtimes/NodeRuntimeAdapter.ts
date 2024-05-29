import { RuntimeAdapter } from "./types.ts";
import { inspect } from "node:util";

export default class NodeRuntimeAdapter implements RuntimeAdapter {
  inspect(value: any, colors: boolean = true): string {
    return inspect(value, true, 5, colors);
  }
}
