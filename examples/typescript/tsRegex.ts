import { defaultsMap } from "../../src/codemod/maps";

/** Javascript Regex syntax */
export const tsRegex = /^\/((?![*+?])(?:[^\r\n\[/\\]|\\.|\[(?:[^\r\n\]\\]|\\.)*\])+)\/((?:g(?:im?|mi?)?|i(?:gm?|mg?)?|m(?:gi?|ig?)?)?)/;
defaultsMap.set(tsRegex, '/TODO/');
