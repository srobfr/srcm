import { RuntimeAdapter } from "./types.ts";

export class DenoRuntimeAdapter implements RuntimeAdapter {
  inspect(value: any, colors: boolean = true): string {
    return globalThis.Deno.inspect(value, { colors, depth: 10 });
  }
}
