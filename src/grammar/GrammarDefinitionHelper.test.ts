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

Deno.test({
  name: "GrammarDefinitionHelper / Or", fn() {
    const foobar = g.or(["foo", "bar"], { id: "foobar" });
    assertEquals(foobar, {
      id: "foobar",
      type: "choice",
      value: [
        {
          type: "string",
          value: "foo",
        },
        {
          type: "string",
          value: "bar",
        },
      ]
    });
  }
});

Deno.test({
  name: "GrammarDefinitionHelper / Optional", fn() {
    const foo = g.optional("Foo", { id: "foo" });
    assertEquals(foo, {
      id: "foo",
      type: "choice",
      value: [{ type: "string", value: "Foo" }, { type: "string", value: "" }],
    });
  }
});

Deno.test({
  name: "GrammarDefinitionHelper / Repetition", fn() {
    const foo = g.repeat("Foo", { id: "foo" });
    assertEquals(foo, {
      id: "foo",
      type: "repeat",
      value: {
        type: "string",
        value: "Foo",
      }
    });
  }
});
