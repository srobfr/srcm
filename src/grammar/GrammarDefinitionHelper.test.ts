import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarDefinitionHelper from "./GrammarDefinitionHelper.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);

Deno.test("Grammar definition helper", () => {
  const foo = g("Foo", {id: "foo"});
  assertEquals(foo, { type: "string", value: "Foo", id: "foo" });
});
