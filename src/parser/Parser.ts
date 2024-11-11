import { DomBuilder } from "../dom/DomBuilder.ts";
import { INode } from "../dom/Node.ts";
import { Grammar, TerminalGrammar, inspectGrammar, isChoiceGrammar, isOptionalGrammar, isRegExpGrammar, isRepeatGrammar, isSequenceGrammar, isStringGrammar, isTerminalGrammar } from "../grammar/GrammarTypes.ts";
import { RuntimeAdapter } from "../runtimes/types.ts";
import { buildCache } from "../utils/cache.ts";
import { memoize } from "../utils/memoize.ts";
import { GrammarAnalyzer } from "./GrammarAnalyzer.ts";
import { Action, ActionType, Context, ParseError } from "./types.ts";

class SyntaxError extends Error { name = "SyntaxError"; }

export class Parser {
  constructor(
    private readonly runtime: RuntimeAdapter,
    private readonly grammarAnalyzer: GrammarAnalyzer,
    private readonly domBuilder: DomBuilder,
  ) { }

  /** Parses code against a given grammar */
  public parse = (code: string, grammar: Grammar): INode => {
    const { inspect } = this.runtime;

    /** Used to optimize contexts forest by keeping only the first context matching the (grammar, offset, matchedCharsCount) tuple */
    const firstContextByPreviousGrammarMatchedCharsCountCache = buildCache();

    // Analyze the root grammar to extract the required data for bottom-up parsing
    const nextPossibleActionsByLastGrammar = this.grammarAnalyzer.analyzeGrammar(grammar);

    // console.log(inspect({ nextPossibleActionsByLastGrammar }));

    const matchTerminal = memoize((offset: number, grammar: TerminalGrammar): number | null => {
      const remainingCode = code.substring(offset);
      let matchedCharsCount: number | null | undefined;

      if (isStringGrammar(grammar)) {
        matchedCharsCount = remainingCode.startsWith(grammar.value) ? grammar.value.length : null;
      }

      else if (isRegExpGrammar(grammar)) {
        matchedCharsCount = remainingCode.match(grammar.value)?.[0].length ?? null;
      }

      if (matchedCharsCount === undefined) {
        throw new Error(`Unhandled terminal grammar type : ${inspect(grammar)}`);
      }

      return matchedCharsCount;
    });

    { // Parsing
      const startContext: Context = { grammar: null, offset: 0, matchedCharsCount: 0, previous: null };
      let contexts: Array<Context> = [startContext];

      const success: Array<Context> = [];
      let lastErrors: Array<ParseError> = [];

      function recordError(context: Context, action: Action) {
        const matchedOffset = context.offset + context.matchedCharsCount;
        const maxMatchedOffset = lastErrors[0]?.context.offset + lastErrors[0]?.context.matchedCharsCount;
        if (maxMatchedOffset < matchedOffset) lastErrors = [];
        else if (maxMatchedOffset > matchedOffset) return; // Keep only the longest context
        lastErrors.push({ context, action });
      }

      do {
        const nextContexts: Array<Context> = [];
        for (const context of contexts) {
          const nextContextsForContext: Array<Context> = [];
          const lastActionByContext = new WeakMap(); // Used for conflicts resolution. Weak to prevent memory leak.

          const nextActions = nextPossibleActionsByLastGrammar.get(context.grammar) ?? new Set();
          for (const nextAction of nextActions) {
            // console.log(`Processing ${inspectContext(context, code)}`);

            const { type: actionType, grammar } = nextAction;

            if (actionType === ActionType.SHIFT) {
              if (isTerminalGrammar(grammar)) {
                // We'll try to match a terminal at the current offset.
                const nextOffset = context.offset + context.matchedCharsCount;
                const matchedCharsCount: number | null = matchTerminal(nextOffset, grammar!);
                if (matchedCharsCount !== null) {
                  const nextContext = { grammar, offset: nextOffset, matchedCharsCount, previous: context };
                  nextContextsForContext.push(nextContext);
                  lastActionByContext.set(nextContext, nextAction);
                } else {
                  // Syntax error
                  recordError(context, nextAction);
                }
              }

              else if (isOptionalGrammar(grammar)) {
                // "matching" an optional grammar
                const nextContext = { grammar, offset: context.offset + context.matchedCharsCount, matchedCharsCount: 0, previous: context };
                nextContextsForContext.push(nextContext);
                lastActionByContext.set(nextContext, nextAction);
              }

              else {
                throw new Error("Unhandled grammar type for Shift action");
              }
            }

            else if (actionType === ActionType.REDUCE) {
              // Reduce a non-terminal

              if (isChoiceGrammar(grammar) || isOptionalGrammar(grammar)) {
                nextContextsForContext.push({
                  grammar,
                  offset: context.offset,
                  matchedCharsCount: context.matchedCharsCount,
                  previous: context.previous,
                  children: [context],
                });
              }

              else if (isSequenceGrammar(grammar)) {
                // Try to find a node which is not part of the sequence, right-to-left
                let contextToCheck: Context | null = context;
                let matchedCharsCount = 0;
                let firstContext;
                const children: Array<Context> = [];
                for (let i = grammar.value.length - 1; i >= 0; i--) {
                  if (contextToCheck?.grammar !== grammar.value[i]) {
                    firstContext = null;
                    break;
                  }

                  matchedCharsCount += contextToCheck.matchedCharsCount;
                  firstContext = contextToCheck;
                  children.unshift(contextToCheck);
                  contextToCheck = contextToCheck.previous ?? null;
                }

                if (firstContext) {
                  // We can reduce
                  nextContextsForContext.push({ grammar, offset: firstContext.offset, matchedCharsCount, previous: firstContext.previous, children });
                } else {
                  // console.log("Reduce failed (sequence does not match previous contexts)");
                }
              }

              else if (isRepeatGrammar(grammar)) {
                // Try to find a node which is not part of the sequence, right-to-left
                let contextToCheck: Context | null = context;
                let matchedCharsCount = 0;
                let firstContext = null;

                const children: Array<Context> = [];
                while (contextToCheck?.grammar === grammar.value) {
                  matchedCharsCount += contextToCheck.matchedCharsCount;
                  firstContext = contextToCheck;
                  children.unshift(contextToCheck);
                  contextToCheck = contextToCheck.previous ?? null;
                }

                if (firstContext) {
                  // We can reduce
                  nextContextsForContext.push({ grammar, offset: firstContext.offset, matchedCharsCount, previous: firstContext.previous, children });
                } else {
                  // console.log("Reduce failed (sequence does not match previous contexts)");
                }
              }

              else {
                throw new Error(`Unhandled grammar type for reduce : ${inspect(grammar)}`);
              }
            }

            else if (actionType === ActionType.ACCEPT) {
              if (context.previous === startContext && context.offset === 0) {
                if (context.matchedCharsCount < code.length) {
                  recordError(context, nextAction);
                } else {
                  success.push(context);
                }
              } else {
                // console.log("Accept failed (not root grammar)");
              }
            }

            else {
              throw new Error(`Unhandled action type : ${inspect(nextAction)}`);
            }
          }

          // Order contexts by precedence
          nextContextsForContext.sort((a: Context, b: Context) => {
            const aPrec = a.grammar?.precedence ?? (lastActionByContext.get(a)?.precedence) ?? 0;
            const bPrec = b.grammar?.precedence ?? (lastActionByContext.get(b)?.precedence) ?? 0;
            const precDiff = bPrec - aPrec;
            if (precDiff) return precDiff; // First, handle precedence

            const reduceFirstDiff = (isTerminalGrammar(a.grammar) ? 1 : 0) - (isTerminalGrammar(b.grammar) ? 1 : 0);
            if (!a.grammar?.rightToLeft) return reduceFirstDiff; // Left-to-right
            return -reduceFirstDiff; // Right-to-left
          });

          // console.debug(
          //   nextContextsForContext.length > 0 ? nextContextsForContext.map(c => `${inspectContext(context, code)} => ${inspectContext(c, code)}\n`).join("")
          //     : `${inspectContext(context, code)} => ❌`
          // );

          nextContexts.push(...nextContextsForContext);
        }

        // Filter out conflicting contexts
        // This relies on the earlier context sorting based on precedence and keeps only the first context for
        // each given (previous context, grammar, matchedCharsCount) tuple.
        const filteredNextContexts = nextContexts.filter(context => {
          if (isTerminalGrammar(context.grammar)) return true;
          const cachedContext = firstContextByPreviousGrammarMatchedCharsCountCache(
            [context.previous, context.grammar, context.matchedCharsCount],
            () => context
          );

          // if (cachedContext !== context) console.log(`Filtering out ${inspectContext(context, code)} in favor of ${inspectContext(cachedContext, code)}`);

          return cachedContext === context;
        });

        contexts = filteredNextContexts;
      } while (contexts.length > 0);

      function throwSyntaxError(lastErrors: Array<ParseError>, code: string) {
        const expected = Array.from(new Set(lastErrors.map(({ action }) => {
          return action.type === ActionType.ACCEPT ? "<EOF>"
            : inspectGrammar(action.grammar);
        })));

        const offset = lastErrors[0].context.offset + lastErrors[0].context.matchedCharsCount;
        const m = code.match(new RegExp(`^([^]{${offset}})(.{0,10})`));
        const line = Array.from(m![1].matchAll(/\n/g)).length + 1;
        const lastMatchedRow = m![1].match(/.+$/)?.[0] ?? "";
        const remainingCode = m![2];
        const column = (lastMatchedRow.length ?? 0) + 1;
        throw new SyntaxError(`Syntax error on line ${line}, columns ${column}:\n${lastMatchedRow}${remainingCode}\n${" ".repeat(lastMatchedRow.length)}^Expected one of [${expected.join(", ")}]`);
      }

      if (!success.length) throwSyntaxError(lastErrors, code);
      // console.log(inspect(success.map(context => inspectContext(context, code))));

      // Hydrate & return pseudo-dom
      return this.domBuilder.build(success[0], this.parse, code);
    }
  }
}
