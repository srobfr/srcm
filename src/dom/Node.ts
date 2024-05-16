import SearchableNode from "./SearchableNode.ts";

/** Pseudo-DOM nodes produced by the parser */
export default class Node extends SearchableNode {}

export type INode = Node & Record<string, any>;
