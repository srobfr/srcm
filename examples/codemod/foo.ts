import {applyMap, multiple} from "../../src";
import {w} from "../typescript/tsBasic";

/** A list of srcm definitions */
export const srcmDefs = multiple(srcmDef, w);
applyMap.set(srcmDefs, ($: Node, def: any) => {
    // TODO
});

/** Test */
export const test = multiple(foobar, w);
applyMap.set(test, ($: Node, def: any) => {
    // TODO
    // Test test test
});
