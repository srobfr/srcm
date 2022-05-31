import {applyMap, multiple} from "../../src";
import {w} from "../typescript/tsBasic";

/** Test */
export const test = 'test';
applyMap.set(test, ($: Node, def: any) => {
    // TODO
    // Test test test
});

/** A list of srcm definitions */
export const srcmDefs = multiple(test, w);
applyMap.set(srcmDefs, ($: Node, def: any) => {
    // TODO
});
