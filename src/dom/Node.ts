import { RepeatNode } from "./RepeatNode.ts";

/** Pseudo-DOM nodes produced by the parser */
export class Node extends RepeatNode {}

export type INode = Node & Record<string, any>;
