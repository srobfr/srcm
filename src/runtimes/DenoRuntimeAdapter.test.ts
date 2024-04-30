import DenoRuntimeAdapter from "./DenoRuntimeAdapter.ts";
import { assertEquals } from "https://deno.land/std@0.223.0/assert/mod.ts";

Deno.test("DenoRuntimeAdapter", async t => {
  const runtime = new DenoRuntimeAdapter();

  await t.step("inspect", () => {
    const r = runtime.inspect({ s: "bar", b: true, n: 12.5, a: ["foo", 1, true] });
    assertEquals(r, `{ s: [32m"bar"[39m, b: [33mtrue[39m, n: [33m12.5[39m, a: [ [32m"foo"[39m, [33m1[39m, [33mtrue[39m ] }`);
  });

  await t.step("inspect (no colors)", () => {
    const r = runtime.inspect({ s: "bar", b: true, n: 12.5, a: ["foo", 1, true] }, false);
    assertEquals(r, `{ s: "bar", b: true, n: 12.5, a: [ "foo", 1, true ] }`);
  });

  await t.step("inspect (recursive)", () => {
    const a: any = ["foo"];
    a.push(a);
    const r = runtime.inspect(a, false);
    assertEquals(r, `<ref *1> [ "foo", [Circular *1] ]`);
  });
});
