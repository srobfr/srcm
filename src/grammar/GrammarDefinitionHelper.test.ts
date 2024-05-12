import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarDefinitionHelper from "./GrammarDefinitionHelper.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);

Deno.test("GrammarDefinitionHelper / String", () => {
  const foo = g("Foo", { id: "foo" });
  assertEquals(foo, { type: "string", value: "Foo", id: "foo" });
});

Deno.test("GrammarDefinitionHelper / Template string", () => {
  const foo = g`F${"o"}o`;
  assertEquals(foo, {
    type: "sequence",
    value: [
      {
        type: "string",
        value: "F",
      },
      {
        type: "string",
        value: "o",
      },
      {
        type: "string",
        value: "o",
      },
    ]
  });
});

Deno.test("GrammarDefinitionHelper / Sequence", () => {
  const foo = g(["F", "o", "o"]);
  assertEquals(foo, {
    type: "sequence",
    value: [
      {
        type: "string",
        value: "F",
      },
      {
        type: "string",
        value: "o",
      },
      {
        type: "string",
        value: "o",
      },
    ]
  });
});

Deno.test("GrammarDefinitionHelper / Recursion", () => {
  const foo = g(["F", g("o", { id: "o" }), "o"]);
  assertEquals(foo, {
    type: "sequence",
    value: [
      {
        type: "string",
        value: "F",
      },
      {
        id: "o",
        type: "string",
        value: "o",
      },
      {
        type: "string",
        value: "o",
      },
    ]
  });
});

Deno.test({ name: "GrammarDefinitionHelper / Or", ignore: true, fn: () => { /* TODO */ } });
Deno.test({ name: "GrammarDefinitionHelper / Optional", ignore: true, fn: () => { /* TODO */ } });
Deno.test({ name: "GrammarDefinitionHelper / Repetition", ignore: true, fn: () => { /* TODO */ } });
