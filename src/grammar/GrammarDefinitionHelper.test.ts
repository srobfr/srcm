import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarDefinitionHelper from "./GrammarDefinitionHelper.ts";
import stableInspect from "../utils/inspect.ts";
import { parse } from "../deno-mod.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);

Deno.test("GrammarDefinitionHelper / String", () => {
  const foo = g("Foo", { id: "foo" });
  assertEquals(stableInspect(foo), `{"type":"string","value":"Foo","id":"foo"}`);
});

Deno.test("GrammarDefinitionHelper / Template string", () => {
  const foo = g`F${"o"}o`;
  assertEquals(stableInspect(foo), `{"type":"sequence","value":[{"type":"string","value":"F"},{"type":"string","value":"o"},"#ref3"]}`);
});

Deno.test("GrammarDefinitionHelper / Sequence", () => {
  const foo = g(["F", "o", "o"]);
  assertEquals(stableInspect(foo), `{"type":"sequence","value":[{"type":"string","value":"F"},{"type":"string","value":"o"},"#ref3"]}`);
});

Deno.test("GrammarDefinitionHelper / Recursion", () => {
  const foo = g(["F", g("o", { id: "o" }), "o"]);
  assertEquals(stableInspect(foo), `{"type":"sequence","value":[{"type":"string","value":"F"},{"type":"string","value":"o","id":"o"},{"type":"string","value":"o"}]}`);
});

Deno.test({
  name: "GrammarDefinitionHelper / Or", fn() {
    const foobar = g.or(["foo", "bar"], { id: "foobar" });
    assertEquals(stableInspect(foobar), `{"type":"choice","value":[{"type":"string","value":"foo"},{"type":"string","value":"bar"}],"id":"foobar"}`);
  }
});

Deno.test({
  name: "GrammarDefinitionHelper / Optional", fn() {
    const foo = g.optional("Foo", { id: "foo" });
    assertEquals(stableInspect(foo), `{"type":"optional","value":{"type":"string","value":"Foo"},"id":"foo"}`);
  }
});

Deno.test({
  name: "GrammarDefinitionHelper / Repetition", fn() {
    const foo = g.repeat("Foo", { id: "foo" });
    assertEquals(stableInspect(foo), `{"type":"repeat","value":{"type":"string","value":"Foo"},"id":"foo"}`);
  }
});

Deno.test({
  name: "GrammarDefinitionHelper / default", fn() {
    const bar = g(/^bar/i, { default: () => "BAR" });
    const opt = g.optional("Optional");
    const opt2 = g.optional("Optional2", { default: () => "Optional2" });
    const or = g.or(["a", "b", "c"]);
    const repeat = g.repeat("Repeat");
    const grammar = g`Foo${bar}${opt}${opt2}${or}plop${repeat}`;

    const $ = parse(grammar.default!(), grammar);

    assertEquals($.text(), `FooBAROptional2aplopRepeat`);
  }
});
