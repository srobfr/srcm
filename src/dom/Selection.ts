import Node from "./Node";
import {TaggableGrammarDefinition} from "../grammar/GrammarDefinitions";

export default class Selection implements Iterable<Node> {
    private counter = 0;
    public readonly nodes: Array<Node>;

    constructor(nodes: Array<Node> | Node | null) {
        this.nodes = !nodes ? []
            : Array.isArray(nodes) ? nodes
                : [nodes];
    }

    public [Symbol.iterator]() {
        const that = this;
        return {
            next: function () {
                return {done: that.counter >= that.nodes.length, value: that.nodes[that.counter]};
            }.bind(this)
        }
    }

    public get(index: number): Node {
        return this.nodes[index];
    }

    public get length(): number {
        return this.nodes.length;
    }

    public xml() {
        return this.nodes.map(node => node.xml()).join('');
    }

    public text(text?: string): string | Selection {
        const r = this.nodes.map(node => node.text(text));
        return (text === undefined ? r.join('') : this);
    }

    public findByTag(tag: string): Selection {
        const nodes = [];
        for (const c of this.nodes) nodes.push(...c.findByTag(tag).nodes);
        return new Selection(nodes);
    }
}
