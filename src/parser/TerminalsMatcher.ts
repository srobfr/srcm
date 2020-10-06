import {isRegExpGrammarDefinition, isStringGrammarDefinition, RegExpGrammarDefinition, StringGrammarDefinition} from "../grammar/GrammarDefinitions";
import Context from "./Context";

export default class TerminalsMatcher {
    public match(context: Context): number | null {
        const {grammar} = context;
        if (isStringGrammarDefinition(grammar)) return TerminalsMatcher.matchString(context);
        if (isRegExpGrammarDefinition(grammar)) return TerminalsMatcher.matchRegExp(context);
    }

    private static matchString(context: Context): number | null {
        const {code, offset} = context;
        const grammar = context.grammar as StringGrammarDefinition;
        if (code.substr(offset, grammar.length) !== grammar) return null;
        return grammar.length;
    }

    private static matchRegExp(context: Context): number | null {
        const {code, offset} = context;
        const grammar = context.grammar as RegExpGrammarDefinition;
        const grammarStr = grammar.toString();
        if (!grammarStr.startsWith('/^')) throw new Error(`RegExp grammar definitions should start with "/^" : ${grammarStr}`);
        const m = code.substr(offset).match(grammar);
        return m && m[0].length;
    }
}
