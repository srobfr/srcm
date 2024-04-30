
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { g, parse } from "../index.ts";
import Node from "./Node.ts";


Deno.test("Node", async (t) => {
  const $ = new Node(g("Foo", { id: "foo" }), null, null, null, [], "Foo", parse);

  await t.step("xml", () => {
    assertEquals($.xml(), `<foo>Foo</foo>`);
  });

  await t.step("text", () => {
    assertEquals($.text(), `Foo`);
  });

  // SROB Autres méthodes
});

