import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import DomBuilder from "../dom/DomBuilder.ts";
import GrammarDefinitionHelper from "../grammar/GrammarDefinitionHelper.ts";
import DenoRuntimeAdapter from "../runtimes/DenoRuntimeAdapter.ts";
import GrammarAnalyzer from "./GrammarAnalyzer.ts";
import Parser from "./Parser.ts";
import { assertThrows } from "https://deno.land/std@0.223.0/assert/assert_throws.ts";

const runtimeAdapter = new DenoRuntimeAdapter();
const grammarDefinitionHelper = new GrammarDefinitionHelper(runtimeAdapter);
const grammarAnalyzer = new GrammarAnalyzer(runtimeAdapter);
const domBuilder = new DomBuilder();
const parser = new Parser(runtimeAdapter, grammarAnalyzer, domBuilder);
const g = grammarDefinitionHelper.g
const parse = parser.parse;

Deno.test({
  name: "Parser / Simple grammar", fn() {
    const o = g("o", { id: "o" });
    const foo = g`F${o}${o}`;
    foo.id = "foo";

    const $ = parse(`Foo`, foo);
    assertEquals($.xml(), "<foo>F<o>o</o><o>o</o></foo>");
    assertEquals($.text(), "Foo");
  }
});

Deno.test({
  name: "Parser / Operators & precedence parsing", async fn(t) {
    const expr = g.or([]);
    const number = g(/^\d+/);
    const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
    const subtraction = g([expr, "-", expr], { id: "sub", precedence: 1 });
    const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
    const division = g([expr, "/", expr], { id: "div", precedence: 2 });
    const exponentiation = g([expr, "^", expr], { id: "exp", rightToLeft: true, precedence: 3 });
    expr.value.push(multiplication, division, addition, subtraction, exponentiation, number);

    for (const [code, xml] of [
      ["1+2*3", "<add>1+<mul>2*3</mul></add>"],
      ["1*2+3", "<add><mul>1*2</mul>+3</add>"],
      ["1+2+3", "<add><add>1+2</add>+3</add>"],
      ["1-2+3", "<add><sub>1-2</sub>+3</add>"],
      ["1^2^3", "<exp>1^<exp>2^3</exp></exp>"],
      ["1^2/3^4", "<div><exp>1^2</exp>/<exp>3^4</exp></div>"],
    ]) {
      await t.step(code, () => {
        const $ = parse(code, expr);
        assertEquals($.xml(), xml);
      });
    }
  }
});

Deno.test({
  name: "Parser / Optional", async fn(t) {
    const foo = g`(${g.optional("Foo", { id: "foo" })})`;
    await t.step("With content", () => {
      const $ = parse(`(Foo)`, foo);
      assertEquals($.xml(), "(<foo>Foo</foo>)");
      assertEquals($.text(), "(Foo)");
    });

    await t.step("Empty content", () => {
      const $ = parse(`()`, foo);
      assertEquals($.xml(), "(<foo/>)");
      assertEquals($.text(), "()");
    });

    await t.step("Repeated", () => {
      assertThrows(() => { parse(`(FooFoo)`, foo); }, Error, `\n    ^Expected one of [")"]`);
    });
  }
});

Deno.test({
  name: "Parser / Repetition", async fn(t) {
    const foos = g`(${g.repeat(g("Foo", { id: "foo" }), { id: "foos" })})`;
    await t.step("One repetition", () => {
      const $ = parse(`(Foo)`, foos);
      assertEquals($.xml(), "(<foos><foo>Foo</foo></foos>)");
      assertEquals($.text(), "(Foo)");
    });

    await t.step("Three repetitions", () => {
      const $ = parse(`(FooFooFoo)`, foos);
      assertEquals($.xml(), "(<foos><foo>Foo</foo><foo>Foo</foo><foo>Foo</foo></foos>)");
      assertEquals($.text(), "(FooFooFoo)");
    });

    await t.step("No repetition", () => {
      assertThrows(() => { parse(`()`, foos); }, Error, `\n ^Expected one of [<foo>]`);
    });
  }
});

Deno.test({
  name: "Parser / Infinite recursion", async fn(t) {
    await t.step("prefix", () => {
      const oo = g(["o"]);
      oo.value.unshift(oo);
      const foo = g`F${oo}`;
      assertThrows(() => { parse(`Foo`, foo); }, Error, `No next action found for grammar : {"type":"string","value":"F"}`);
    });

    await t.step("infix", () => {
      const grammar = g([]);
      grammar.value.push(grammar);
      assertThrows(() => { parse(`Foo`, grammar); }, Error, `No next action found for grammar : null`);
    });

    await t.step("Postfix", () => {
      const oo = g(["o"]);
      oo.value.push(oo);
      const foo = g`F${oo}`;
      assertThrows(() => { parse(`Foo`, foo); }, Error, `   ^Expected one of ["o"]`);
    });
  }
});
