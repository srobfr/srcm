import { Grammar, isChoiceGrammar, isNonTerminalGrammar, isOptionalGrammar, isRegExpGrammar, isRepeatGrammar, isSequenceGrammar, isStringGrammar, isTerminalGrammar, SequenceGrammar, TerminalGrammar, TerminalOrOptionalGrammar } from "../grammar/GrammarTypes.ts";
import { RuntimeAdapter } from "../runtimes/types.ts";
import { stableInspect } from "../utils/inspect.ts";
import { mapSetAddBy } from "../utils/mapSetAddBy.ts";
import { memoize } from "../utils/memoize.ts";
import { Action, ActionType } from "./types.ts";

type AnalysisContext = {
  action: (type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean) => Action;
  firstPossibleTerminalsByGrammar: Map<Grammar | null, Set<Grammar>>;
  nextPossibleActionsByLastGrammar: Map<Grammar | null, Set<Action>>;
};

type WalkParams = {
  alreadyWalked: Set<Grammar>,
  grammar: Grammar,
  indexInParent: number,
  parent: Grammar | null,
  parentPrecedence?: number,
  parentRightToLeft?: boolean,
  process: (walkParams: WalkParams) => void,
  action: (type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean) => Action,
};

export class GrammarAnalyzer {
  constructor(private readonly runtime: RuntimeAdapter) { }

  /** Analyzes the root grammar to extract the required data for bottom-up parsing */
  public analyzeGrammar(grammar: Grammar): AnalysisContext["nextPossibleActionsByLastGrammar"] {
    // Find first terminals for each grammar
    const firstPossibleTerminalsByGrammar = this.extractFirstPossibleTerminalsByGrammar(grammar);
    const nextPossibleActionsByLastGrammar = this.extractNextPossibleActionsByLastGrammar(grammar, firstPossibleTerminalsByGrammar);

    return nextPossibleActionsByLastGrammar;
  }

  /** Walks the grammar in a breadth-first walk, handling infinite recursion loops */
  private walkFullGrammar(grammar: Grammar, process: WalkParams["process"]) {
    const toWalk: Array<WalkParams> = [
      {
        grammar, alreadyWalked: new Set(), indexInParent: 0, parent: null, process,
        action: memoize((type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean): Action => ({
          type, grammar,
          ...precedence ? { precedence } : null,
          ...rightToLeft ? { rightToLeft } : null,
        })),
      }
    ];

    while (toWalk.length > 0) {
      const walkParams = toWalk.shift()!;
      const { grammar, alreadyWalked, parentPrecedence, parentRightToLeft, process } = walkParams;

      process?.(walkParams);

      if (
        isNonTerminalGrammar(grammar) // Only non terminal grammars need to be walked
        && !alreadyWalked.has(grammar) // Handles infinite recursion
      ) {
        const precedence = (grammar.precedence ?? parentPrecedence);
        const rightToLeft = (grammar.rightToLeft ?? parentRightToLeft);
        const nextParams = {
          ...walkParams,
          alreadyWalked: new Set(alreadyWalked),
          parent: grammar,
          indexInParent: 0,
          ...(precedence !== undefined && { parentPrecedence: precedence }),
          ...(rightToLeft !== undefined && { parentRightToLeft: rightToLeft }),
        };
        nextParams.alreadyWalked.add(grammar);

        if (isSequenceGrammar(grammar)) {
          for (let i = 0; i < grammar.value.length; i++) {
            toWalk.push({ ...nextParams, grammar: grammar.value[i], indexInParent: i });
          }
        }
        else if (isChoiceGrammar(grammar)) {
          for (const subGrammar of grammar.value) {
            toWalk.push({ ...nextParams, grammar: subGrammar });
          }
        }
        else { // Optional, repetitions, etc.
          toWalk.push({ ...nextParams, grammar: grammar.value });
        }
      }
    }
  }

  private checkTerminal(grammar: TerminalGrammar) {
    if (isStringGrammar(grammar) && grammar.value === "") throw new Error("Empty string grammar is not allowed. Use optional instead.");
    if (isRegExpGrammar(grammar)) {
      if (!grammar.value.toString().startsWith("/^")) throw new Error(`Regexp grammar should start with "/^" : ${grammar.value.toString()}`);
      if ("".match(grammar.value)) throw new Error(`Regexp grammar should not match an empty string : ${grammar.value.toString()}. Use optional instead.`);
    }
  }

  private extractFirstPossibleTerminalsByGrammar(grammar: Grammar): Map<Grammar | null, Set<TerminalOrOptionalGrammar>> {
    const walkParamsByGrammar = new Map<Grammar | null, Set<WalkParams>>();
    const terminals = new Set<TerminalOrOptionalGrammar>();

    this.walkFullGrammar(grammar, (walkParams: WalkParams) => {
      const { grammar } = walkParams;
      mapSetAddBy(walkParamsByGrammar, grammar, [walkParams]);
      if (isTerminalGrammar(grammar) || isOptionalGrammar(grammar)) terminals.add(grammar);
    });

    const firstPossibleTerminalsByGrammar = new Map<Grammar | null, Set<TerminalOrOptionalGrammar>>();
    for (const terminal of terminals) {
      mapSetAddBy(firstPossibleTerminalsByGrammar, terminal, [terminal]);

      // While we are scanning the terminals, check them
      if (isTerminalGrammar(terminal)) this.checkTerminal(terminal);
    }

    const recursiveProcessGrammar = (grammar: Grammar | null) => {
      const firstTerminals = firstPossibleTerminalsByGrammar.get(grammar) ?? new Set();
      if (!firstTerminals.size) return;

      for (const walkParams of (walkParamsByGrammar.get(grammar) ?? new Set())) {
        const { parent, indexInParent } = walkParams;

        // If we are not processing the first item of a sequence and a previous item is not optional => skip
        if (indexInParent > 0 &&
          (parent as SequenceGrammar)?.value.find((siblingGrammar, siblingIndex) => {
            if (!(siblingIndex < indexInParent)) return false; // Previous
            const firstPossibleTerminals = Array.from(firstPossibleTerminalsByGrammar.get(siblingGrammar) ?? new Set<TerminalOrOptionalGrammar>());
            const hasOptionalFirstTerminal = firstPossibleTerminals.find(terminal => isOptionalGrammar(terminal));
            return !hasOptionalFirstTerminal; // Not optional
          })) {
          continue;
        }

        const sizeBefore = (firstPossibleTerminalsByGrammar.get(parent) ?? new Set()).size;
        mapSetAddBy(firstPossibleTerminalsByGrammar, parent, firstTerminals);
        const sizeAfter = (firstPossibleTerminalsByGrammar.get(parent) ?? new Set()).size;
        if (sizeBefore < sizeAfter) recursiveProcessGrammar(parent);
      }
    };

    for (const terminal of terminals) recursiveProcessGrammar(terminal);

    return firstPossibleTerminalsByGrammar;
  }

  private extractNextPossibleActionsByLastGrammar(
    grammar: Grammar,
    firstPossibleTerminalsByGrammar: Map<Grammar | null, Set<TerminalOrOptionalGrammar>>
  ): Map<Grammar | null, Set<Action>> {
    const nextPossibleActionsByLastGrammar = new Map<Grammar | null, Set<Action>>();

    this.walkFullGrammar(grammar, (walkParams: WalkParams) => {
      const { grammar, action, indexInParent, parent, parentPrecedence, parentRightToLeft } = walkParams;
      const { inspect } = this.runtime;

      if (parent === null) { // Root grammar
        mapSetAddBy(
          nextPossibleActionsByLastGrammar, parent,
          Array.from(firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
            subGrammar => action(ActionType.SHIFT, subGrammar)
          )
        );

        mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.ACCEPT, null)]);
      }

      else if (isChoiceGrammar(parent)) {
        mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
      }

      else if (isOptionalGrammar(parent)) {
        mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
      }

      else if (isRepeatGrammar(parent)) {
        mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]); // Stop here
        mapSetAddBy( // Or shift again
          nextPossibleActionsByLastGrammar, grammar,
          Array.from(firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
            subGrammar => action(ActionType.SHIFT, subGrammar, parentPrecedence, parentRightToLeft)
          )
        );
      }

      else if (isSequenceGrammar(parent)) {
        if (indexInParent === parent.value.length - 1) {
          // Last item of a sequence : reduce parent
          mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
        }

        if (indexInParent > 0) {
          // Shift from previous grammar to the first possible terminals of this one
          mapSetAddBy(
            nextPossibleActionsByLastGrammar, parent.value[indexInParent - 1],
            Array.from(firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
              subGrammar => action(ActionType.SHIFT, subGrammar, parentPrecedence, parentRightToLeft)
            )
          );
        }
      }

      else {
        console.trace(`Unhandled next actions for parent : ${inspect(parent)}`);
      }
    });

    // Look for grammar errors
    for (const [grammar, actions] of nextPossibleActionsByLastGrammar.entries()) {
      if (actions.size > 0) continue;
      throw new Error(`No next action found for grammar : ${stableInspect(grammar?.id ?? grammar)}`);
    }

    return nextPossibleActionsByLastGrammar;
  }
}
