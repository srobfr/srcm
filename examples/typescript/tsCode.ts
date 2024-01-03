import {optmul} from "../../src";
import { defaultsMap } from "../../src/codemod/maps";
import {comment} from "./tsBasic";

export const tsCode = optmul(comment);
defaultsMap.set(tsCode, '');
