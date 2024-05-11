import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarDefinitionHelper from "./GrammarDefinitionHelper.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);

Deno.test("Grammar definition helper", async (t) => {

  await t.step("Simple string", () => {
    const foo = g("Foo", { id: "foo" });
    assertEquals(foo, { type: "string", value: "Foo", id: "foo" });
  });

  await t.step("Template string", () => {
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
});
