import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { g, parse } from "../index.ts";


Deno.test({
  name: "SearchableNode / findFirstByGrammar", fn() {
    const foo = g("foo", { id: "foo" });
    const grammar = g(g`(${[foo]})`, { id: "root" });
    const $ = parse(`(foo)`, grammar);
    const $foo = $.findFirstByGrammar(foo);
    assertEquals($foo?.xml(), `<foo>foo</foo>`);
  }
});

Deno.test({
  name: "SearchableNode / findByGrammar", fn() {
    const foo = g("foo", { id: "foo" });
    const grammar = g`(${g.repeat(foo)}|${foo})`;
    const $ = parse(`(foofoo|foo)`, grammar);
    const $foos = $.findByGrammar(foo);
    assertEquals($foos.length, 3);
  }
});

Deno.test({
  name: "SearchableNode / findFirstByPath", fn() {
    const foo = g("foo", { id: "foo" });
    const grammar = g`(${[[foo]]})`;
    const $ = parse(`(foo)`, grammar);
    const $foo = $.findFirstByPath([grammar, foo]);
    assertEquals($foo?.text(), `foo`);
  }
});

Deno.test({
  name: "SearchableNode / findByPath", fn() {
    const foo = g("foo", { id: "foo" });
    const foos = g.repeat([foo]);
    const pipeFoo = g(g`|${foo}`, {id: "pipeFoo"});
    const grammar = g`(${foos}${pipeFoo})`;
    const $ = parse(`(foofoofoofoo|foo)`, grammar);
    const $foos = $.findByPath([pipeFoo, foo]);
    assertEquals($foos.length, 1);
    assertEquals($foos[0]?.xml(), `<foo>foo</foo>`);
    assertEquals($.findByPath([foos, foo]).length, 4);
  }
});
