import { assert } from "https://deno.land/std@0.223.0/assert/assert.ts";
import { assertEquals } from "https://deno.land/std@0.223.0/assert/assert_equals.ts";
import { g, parse } from "../deno-mod.ts";
import RepeatNode from "./RepeatNode.ts";


Deno.test({
  name: "RepeatNode / insert", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const list = g.repeat(item, { nodeClass: RepeatNode });

    const $ = parse(`bd`, list);
    $.insert(parse(`c`, item));
    $.insert(parse(`a`, item));
    $.insert(parse(`e`, item));

    assertEquals($.xml(), `abcde`);
  }
});

Deno.test({
  name: "RepeatNode / insert / list is somewhere in a child", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const list = g.optional([g.repeat(item)], { nodeClass: RepeatNode });

    const $ = parse(`bd`, list);
    $.insert(parse(`c`, item));
    $.insert(parse(`a`, item));
    $.insert(parse(`e`, item));

    assertEquals($.xml(), `abcde`);
  }
});

Deno.test({
  name: "RepeatNode / insert / list with separators", fn() {
    const item = g.or(["a", "b", "c", "d", "e"]);
    const separator = g(/^, */, {default: () => ","});
    const list = g.optional([
      item,
      g.optional(g.repeat([separator, item]))
    ], {
      nodeClass: class extends RepeatNode {
        separator = separator;
      }
    });

    const $ = parse(`b,d`, list);
    const $c = parse(`c`, item);

    $.insert($c, ",");
    $.insert(parse(`a`, item), () => ",");
    $.insert(parse(`e`, item), ",");
    assertEquals($.xml(), `a,b,c,d,e`);

    const $insertedC = $.findFirst($ => $.text() === "c");
    assert($insertedC !== $c); // ⚠️ Please note
  }
});
