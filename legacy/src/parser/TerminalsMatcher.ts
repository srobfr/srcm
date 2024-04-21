import {FunctionGrammarDefinition, isFunctionGrammarDefinition, isRegExpGrammarDefinition, isStringGrammarDefinition, RegExpGrammarDefinition, StringGrammarDefinition} from "../grammar/GrammarDefinitions";
import Context from "./Context";

export default class TerminalsMatcher {
    private static alreadyCheckedRegExps = new WeakSet();

    public match(context: Context): number | null {
        const {grammar} = context;
        if (isStringGrammarDefinition(grammar)) return TerminalsMatcher.matchString(context);
        if (isRegExpGrammarDefinition(grammar)) return TerminalsMatcher.matchRegExp(context);
        if (isFunctionGrammarDefinition(grammar)) return TerminalsMatcher.matchFunction(context);
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
        if (!TerminalsMatcher.alreadyCheckedRegExps.has(grammar)) {
            const grammarStr = grammar.toString();
            if (!grammarStr.startsWith('/^')) throw new Error(`RegExp grammar definitions should start with "/^" : ${grammarStr}`);
            if (''.match(grammar)) throw new Error(`RegExp grammar definitions should not match an empty string, please use optional() instead : ${grammarStr}`);
            TerminalsMatcher.alreadyCheckedRegExps.add(grammar);
        }

        const m = code.slice(offset).match(grammar);
        return m && m[0].length;
    }

    private static matchFunction(context: Context): number | null {
        const {code, offset} = context;
        const grammar = context.grammar as FunctionGrammarDefinition;
        return grammar(code.slice(offset), context);
    }
}
