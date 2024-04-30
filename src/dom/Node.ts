import { Grammar } from "../grammar/GrammarTypes.ts";
import Parser from "../parser/Parser.ts";

const xmlEscapeMap = { '<': '&lt;', '>': '&gt;', '&': '&amp;' };

/** Base class for pseudo-DOM nodes produced by the parser */
export default class Node {

  constructor(
    public readonly grammar: Grammar,
    public parent: Node | null,
    public prev: Node | null,
    public next: Node | null,
    public children: Array<Node>,
    public textContent: string | null,
    private readonly parse: Parser["parse"],
  ) {
  }

  /** Removes the node from the DOM */
  public remove(): Node {
    if (this.next) this.next.prev = this.prev;
    if (this.prev) this.prev.next = this.next;
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i >= 0) this.parent.children.splice(i, 1);
    }
    return this;
  }


  /** Appends the node into this one */
  public append(node: Node): Node {
    node.remove();
    if (this.children.length > 0) {
      const prevNode = this.children[this.children.length - 1];
      prevNode.next = node;
      node.prev = prevNode;
    }
    node.parent = this;
    this.children.push(node);
    return this;
  }

  /** Prepends the node into this one */
  public prepend(node: Node): Node {
    node.remove();
    if (this.children.length > 0) {
      const nextNode = this.children[0];
      nextNode.prev = node;
      node.next = nextNode;
    }
    node.parent = this;
    this.children.unshift(node);
    return this;
  }

  /** Inserts the given node before this one */
  public before(node: Node): Node {
    node.remove();
    node.prev = this.prev;
    node.next = this;
    node.parent = this.parent;
    if (this.prev) this.prev.next = node;
    this.prev = node;
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i >= 0) this.parent.children.splice(i, 0, node);
    }
    return this;
  }


  /** Inserts the given node after this one */
  public after(node: Node): Node {
    node.remove();
    node.prev = this;
    node.next = this.next;
    if (node.next) node.next.prev = node;
    node.parent = this.parent;
    this.next = node;
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i >= 0) this.parent.children.splice(i + 1, 0, node);
    }
    return this;
  }

  /**  Replaces this node by the given one */
  public replaceWith(node: Node): Node {
    node.remove();
    node.prev = this.prev;
    node.next = this.next;
    node.parent = this.parent;
    if (node.next) node.next.prev = node;
    if (node.prev) node.prev.next = node;
    if (this.parent) {
      const i = this.parent.children.indexOf(this);
      if (i >= 0) this.parent.children[i] = node;
    }
    return this;
  }

  /** Empties this node */
  public empty(): Node {
    this.children = [];
    return this;
  }

  public text(): string;
  public text(text: string): Node;
  public text(text?: string): Node | string {
    if (text === undefined) return this.textContent ?? this.children.map(c => c.text()).join('');
    if (typeof text !== 'string') throw new Error(`Non-string argument given to text()`);
    const $newNode = this.parse(text, this.grammar);
    this.children = $newNode.children;
    this.textContent = $newNode.textContent;
    for (const c of this.children) c.parent = this;
    return this;
  }

  private escapeXml(s: string): string {
    return s.replaceAll(/[<>&]/g, (c: string) => xmlEscapeMap[c as keyof typeof xmlEscapeMap]);
  }

  public xml(): string {
    const childXml = this.textContent ? this.escapeXml(this.textContent) : this.children.map(c => c.xml()).join('');
    const id = this.grammar.id;
    if (id === undefined) return childXml;
    if (childXml === '') return `<${id}/>`;
    return `<${id}>${childXml}</${id}>`;
  }
}
