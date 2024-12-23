
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { GrammarDefinitionHelper } from "../grammar/GrammarDefinitionHelper.ts";
import { DenoRuntimeAdapter } from "../runtimes/DenoRuntimeAdapter.ts";
import { GrammarAnalyzer } from "./GrammarAnalyzer.ts";
import { stableInspect } from "../utils/inspect.ts";
import type { SequenceGrammar } from "../grammar/GrammarTypes.ts";
import { assertThrows } from "https://deno.land/std@0.223.0/assert/assert_throws.ts";

const runtime = new DenoRuntimeAdapter();
const { g } = new GrammarDefinitionHelper(runtime);
const analyzer = new GrammarAnalyzer(runtime);

Deno.test("GrammarAnalyzer / Simple Grammar", () => {
  const foo = g("Foo");
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(foo);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref0"}],"<{\\"type\\":\\"string\\",\\"value\\":\\"Foo\\"}>":[{"type":"accept","grammar":null}]}`);
});

Deno.test("GrammarAnalyzer / Sequence", () => {
  const grammar = g(["a", "b"]);
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref5"}],"<{\\"type\\":\\"sequence\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"a\\"},{\\"type\\":\\"string\\",\\"value\\":\\"b\\"}]}>":[{"type":"accept","grammar":null}],"<\\"#ref3\\">":[{"type":"reduce","grammar":"#ref0"}],"<\\"#ref2\\">":[{"type":"shift","grammar":"#ref4"}]}`);
});

Deno.test("GrammarAnalyzer / Operator", () => {
  const expr = g.or(["foo"], { id: "expr" });
  const number = g(/^\d+/, { id: "number" });
  const addition = g([expr, "+", expr], { id: "add", precedence: 1 });
  const multiplication = g([expr, "*", expr], { id: "mul", precedence: 2 });
  expr.value.push(multiplication, addition, number);

  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(expr);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref15"},{"type":"shift","grammar":"#ref18"}],"<{\\"type\\":\\"choice\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"},{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref0\\",{\\"type\\":\\"string\\",\\"value\\":\\"*\\"},\\"#ref5\\"],\\"id\\":\\"mul\\",\\"precedence\\":2},{\\"type\\":\\"sequence\\",\\"value\\":[\\"#ref7\\",{\\"type\\":\\"string\\",\\"value\\":\\"+\\"},\\"#ref10\\"],\\"id\\":\\"add\\",\\"precedence\\":1},{\\"type\\":\\"regexp\\",\\"value\\":\\"/^\\\\\\\\d+/\\",\\"id\\":\\"number\\"}],\\"id\\":\\"expr\\"}>":[{"type":"accept","grammar":null},{"type":"shift","grammar":"#ref19","precedence":2},{"type":"reduce","grammar":"#ref16"},{"type":"shift","grammar":"#ref20","precedence":1},{"type":"reduce","grammar":"#ref17"}],"<\\"#ref2\\">":[{"type":"reduce","grammar":"#ref12"}],"<\\"#ref3\\">":["#ref38"],"<\\"#ref8\\">":["#ref41"],"<\\"#ref13\\">":["#ref43"],"<\\"#ref6\\">":[{"type":"shift","grammar":"#ref24","precedence":2},{"type":"shift","grammar":"#ref26","precedence":2}],"<\\"#ref11\\">":[{"type":"shift","grammar":"#ref48","precedence":1},{"type":"shift","grammar":"#ref50","precedence":1}]}`);
});

Deno.test("GrammarAnalyzer / Infinite recursion", () => {
  const grammar = g([]);
  grammar.value.push(grammar);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `No next action found for grammar : null`);
});

Deno.test("GrammarAnalyzer / Infinite prefix recursion", () => {
  const grammar = g(["foo"]) as SequenceGrammar;
  grammar.value.unshift(grammar);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `No next action found for grammar : null`);
});

Deno.test("GrammarAnalyzer / Infinite postfix recursion", () => {
  const grammar = g(["foo"]) as SequenceGrammar;
  grammar.value.push(grammar);
  const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
  assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref4"}],"<{\\"type\\":\\"sequence\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"},\\"#ref0\\"]}>":[{"type":"accept","grammar":null},{"type":"reduce","grammar":"#ref3"}],"<\\"#ref2\\">":[{"type":"shift","grammar":"#ref8"}]}`);
});

Deno.test({
  name: "GrammarAnalyzer / Choice", fn() {
    const grammar = g.or(["foo", "bar"]);
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref4"},{"type":"shift","grammar":"#ref5"}],"<{\\"type\\":\\"choice\\",\\"value\\":[{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"},{\\"type\\":\\"string\\",\\"value\\":\\"bar\\"}]}>":[{"type":"accept","grammar":null}],"<\\"#ref2\\">":[{"type":"reduce","grammar":"#ref0"}],"<\\"#ref3\\">":["#ref15"]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Optional", fn() {
    const grammar = g.optional("foo");
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref0"},{"type":"shift","grammar":"#ref2"}],"<{\\"type\\":\\"optional\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref6"}]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Repetition", fn() {
    const grammar = g.repeat("foo");
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref2"}],"<{\\"type\\":\\"repeat\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref0"},{"type":"shift","grammar":"#ref6"}]}`);
  }
});

Deno.test({
  name: "GrammarAnalyzer / Repetition with separator", fn() {
    const grammar = g.repeat("foo", {sep: g(",")});
    const nextPossibleActionsByLastGrammar = analyzer.analyzeGrammar(grammar);
    assertEquals(stableInspect(nextPossibleActionsByLastGrammar), `{"<null>":[{"type":"shift","grammar":"#ref3"}],"<{\\"type\\":\\"repeat\\",\\"value\\":{\\"type\\":\\"string\\",\\"value\\":\\"foo\\"},\\"sep\\":{\\"type\\":\\"string\\",\\"value\\":\\",\\"}}>":[{"type":"accept","grammar":null}],"<\\"#ref1\\">":[{"type":"reduce","grammar":"#ref0"},{"type":"shift","grammar":"#ref4"}],"<\\"#ref2\\">":[{"type":"shift","grammar":"#ref8"}]}`);
  }
});

Deno.test("GrammarAnalyzer / Empty string", () => {
  const grammar = g("");
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Empty string grammar is not allowed. Use optional instead.`);
});

Deno.test("GrammarAnalyzer / Regex matching empty string", () => {
  const grammar = g(/^.*/);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Regexp grammar should not match an empty string : /^.*/. Use optional instead.`);
});

Deno.test("GrammarAnalyzer / Regex start", () => {
  const grammar = g(/.*/);
  assertThrows(() => { analyzer.analyzeGrammar(grammar); }, Error, `Regexp grammar should start with "/^" : /.*/`);
});
