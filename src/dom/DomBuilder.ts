import { Context } from "../parser/types.ts";
import Parser from "../parser/Parser.ts";
import Node from "./Node.ts";

export default class DomBuilder {
  public build(context: Context, parse: Parser["parse"]): Node {
    return new Node(context.grammar!, null, null, null, [], "Foo", parse); // SROB
  }
}
