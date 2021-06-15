/**
 * Represents a DOM node
 */
import {applyMap, GrammarDefinition, TaggableGrammarDefinition} from "..";
import {isObjectGrammarDefinition} from "../grammar/GrammarDefinitions";
import Parser from "../parser/Parser";

const xmlEscapeMap = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
};

export interface NodeContructorArgs {
    grammar: GrammarDefinition,
    parent?: Node | null,
    prev?: Node | null,
    next?: Node | null,
    children?: Array<Node>,
    textContent?: string | null,
    parser: Parser,
}

export class Node {
    public readonly grammar: GrammarDefinition;
    public parent: Node | null = null;
    public prev: Node | null = null;
    public next: Node | null = null;
    public children: Array<Node> = [];
    public textContent: string | null = null;
    public parser: Parser;

    constructor(args: NodeContructorArgs) {
        Object.assign(this, args);
    }

    /**
     * Removes the node from the DOM
     */
    public remove(): Node {
        if (this.next) this.next.prev = this.prev;
        if (this.prev) this.prev.next = this.next;
        if (this.parent) {
            let i = this.parent.children.indexOf(this);
            if (i >= 0) this.parent.children.splice(i, 1);
        }
        return this;
    }

    /**
     * Appends the node into this one
     */
    public append(node: Node): Node {
        node.remove();
        if (this.children.length > 0) {
            let prevNode = this.children[this.children.length - 1];
            prevNode.next = node;
            node.prev = prevNode;
        }
        node.parent = this;
        this.children.push(node);
        return this;
    }

    /**
     * Prepends the node into this one
     */
    public prepend(node: Node): Node {
        node.remove();
        if (this.children.length > 0) {
            let nextNode = this.children[0];
            nextNode.prev = node;
            node.next = nextNode;
        }
        node.parent = this;
        this.children.unshift(node);
        return this;
    }

    /**
     * Inserts the given node before this one
     */
    public before(node: Node): Node {
        node.remove();
        node.prev = this.prev;
        node.next = this;
        node.parent = this.parent;
        if (this.prev) this.prev.next = node;
        this.prev = node;
        if (this.parent) {
            let i = this.parent.children.indexOf(this);
            if (i >= 0) this.parent.children.splice(i, 0, node);
        }
        return this;
    }

    /**
     * Inserts the given node after this one
     */
    public after(node: Node): Node {
        node.remove();
        node.prev = this;
        node.next = this.next;
        if (node.next) node.next.prev = node;
        node.parent = this.parent;
        this.next = node;
        if (this.parent) {
            let i = this.parent.children.indexOf(this);
            if (i >= 0) this.parent.children.splice(i + 1, 0, node);
        }
        return this;
    }

    /**
     * Replaces this node by the given one
     */
    public replaceWith(node: Node): Node {
        node.remove();
        node.prev = this.prev;
        node.next = this.next;
        node.parent = this.parent;
        if (node.next) node.next.prev = node;
        if (node.prev) node.prev.next = node;
        if (this.parent) {
            let i = this.parent.children.indexOf(this);
            if (i >= 0) this.parent.children[i] = node;
        }
        return this;
    }

    /**
     * Empties this node
     */
    public empty(node: Node): Node {
        this.children = [];
        return this;
    }

    public text(text?: string) {
        if (text === undefined) return this.textContent || this.children.map(c => c.text()).join('');
        const $newNode = this.parser.parse(this.grammar, text);
        this.children = $newNode.children;
        this.textContent = $newNode.textContent;
        for (const c of this.children) c.parent = this;
        return this;
    }

    private escapeXml(s: string): string {
        return s.replace(/[<>&]/g, c => xmlEscapeMap[c]);
    }

    public xml(): string {
        const childXml = this.textContent ? this.escapeXml(this.textContent) : this.children.map(c => c.xml()).join('');
        const tag = (this.grammar as TaggableGrammarDefinition).tag;
        if (tag === undefined) return childXml;
        if (childXml === '') return `<${tag}/>`;
        return `<${tag}>${childXml}</${tag}>`;
    }

    public apply(def:any) {
        if(isObjectGrammarDefinition(this.grammar)) applyMap.get(this.grammar)(this, def);
    }
}
