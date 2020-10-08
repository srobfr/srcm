import {GrammarDefinition, isTerminalGrammarDefinition, TaggableGrammarDefinition} from "../grammar/GrammarDefinitions";
import Context from "./Context";
import ActionsGraphAnalyzer, {ActionTypeEnum} from "./ActionsGraphAnalyzer";
import TerminalsMatcher from "./TerminalsMatcher";
import Node from "../dom/Node";

type ParseErrors = { expected: Set<GrammarDefinition>, offset: number };

/**
 * Generic parser
 */
export default class Parser {
    private readonly actionsGraphAnalyzer = new ActionsGraphAnalyzer();
    private readonly terminalsMatcher = new TerminalsMatcher();

    // Performances optimizations
    private readonly maxRecursionsCount = 3;

    /**
     * Parses the given code using the given grammar
     */
    public parse(grammar: GrammarDefinition, code: string): Node {
        const finalContext = this.processContexts({actionType: ActionTypeEnum.START, code, offset: 0, grammar: grammar, previous: null, parent: null});
        return this.createDomFromContext(finalContext);
    }

    private createDomFromContext(context: Context): Node {
        let c = context.previous;
        let node: Node = null;

        while (c !== null) {
            if (c.actionType === ActionTypeEnum.REDUCE) {
                const n = new Node({
                    grammar: c.grammar,
                    ...isTerminalGrammarDefinition(c.grammar) && {textContent: c.code.substr(c.offset, c.matchedLength)},
                    parser: this,
                });

                if (node) node.prepend(n);
                node = n;

            } else if (c.actionType === ActionTypeEnum.SHIFT) {
                node = node.parent || node;
            }

            c = c.previous;
        }

        return node;
    }

    private processContexts(initialContext: Context): Context {
        const contexts = new Set([initialContext]);
        const errors: ParseErrors = {
            expected: new Set(),
            offset: 0,
        };

        while (contexts.size > 0) {
            const context = contexts.values().next().value;
            contexts.delete(context);

            if (context.actionType === ActionTypeEnum.FINISH) return context;

            const nextContexts = this.getNextContexts(context, errors);
            for (const c of nextContexts) {
                // Filter out infinite recursions
                if (c.actionType !== ActionTypeEnum.SHIFT) continue;
                let p = c.parent;
                let recursionsCount = 0;
                for (; ;) {
                    if (p === null || p.offset !== c.offset) break;
                    if (p.actionType === ActionTypeEnum.SHIFT && p.grammar === c.grammar) {
                        if (++recursionsCount === this.maxRecursionsCount) {
                            nextContexts.delete(c);
                            break;
                        }
                    }
                    p = p.parent;
                }
            }

            // Add the new contexts
            for (const c of nextContexts) contexts.add(c);
        }

        this.throwError(initialContext.code, errors);
    }

    private static onParseError(context: Context, errors: ParseErrors, tooMuchCode = false) {
        const g = (tooMuchCode ? null : context.grammar);
        const offset = context.offset + (context.matchedLength || 0);
        if (errors.offset < offset) {
            errors.offset = offset;
            errors.expected = new Set([g]);
        } else if (errors.offset === offset) {
            errors.expected.add(g);
        }
    }

    private getNextContexts(context: Context, errors: ParseErrors): Set<Context> {
        // Get every possible next contexts
        const nextContexts = this.actionsGraphAnalyzer.getPossibleNextContexts(context);

        // Try to match each one
        for (const nextContext of nextContexts) {
            if (nextContext.actionType === ActionTypeEnum.REDUCE && isTerminalGrammarDefinition(nextContext.grammar)) {
                const matchedLength = this.terminalsMatcher.match(nextContext);
                if (matchedLength) nextContext.matchedLength = matchedLength;
                else {
                    // Syntax error
                    Parser.onParseError(nextContext, errors);
                    nextContexts.delete(nextContext);
                }

            } else if (nextContext.actionType === ActionTypeEnum.FINISH && nextContext.matchedLength < nextContext.code.length) {
                // There is still some code left.
                Parser.onParseError(nextContext, errors, true);
                nextContexts.delete(nextContext);
            }
        }

        return nextContexts;
    }

    private throwError(code, errors: ParseErrors) {
        const expected = Array.from(errors.expected).map(s => s && s.valueOf ? s.valueOf() : s) as Array<GrammarDefinition>;
        const expectedOffset: number = errors.offset;

        let lines = code.split("\n");
        let o = 0;
        lines.forEach((line, i) => {
            let l = line.length;
            if (o + i <= expectedOffset && expectedOffset <= o + i + l) {
                let lineOffset = expectedOffset - (o + i) + 1;
                let spaces = new Array(lineOffset).join(" ");

                let expectedStr = (
                    expected.length
                        ? "expected " + expected.map(function (expected) {
                        if (expected === null) return "EOF";
                        return (expected as TaggableGrammarDefinition)?.tag || expected;
                    }).join(" or ")
                        : "Grammar error."
                );

                let message = `Syntax error on line ${i + 1}, column ${lineOffset}:\n${line}\n${spaces}^ ${expectedStr}`;
                throw new Error(message);
            }
            o += l;
        });
    }
}
