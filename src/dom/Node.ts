import { SearchableNode } from "./SearchableNode.ts";

/** Pseudo-DOM nodes produced by the parser */
export class Node extends SearchableNode {}

export type INode = Node & Record<string, any>;
