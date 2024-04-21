import { Grammar, isChoiceGrammar, isNonTerminalGrammar, isSequenceGrammar, isTerminalGrammar } from "../grammar/GrammarTypes.ts";
import { RuntimeAdapter } from "../runtimes/types.ts";
import mapSetAddBy from "../utils/mapSetAddBy.ts";
import memoize from "../utils/memoize.ts";
import { Action, ActionType } from "./types.ts";

type AnalysisContext = {
  action: (type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean) => Action;
  firstPossibleTerminalsByGrammar: Map<Grammar | null, Set<Grammar>>;
  nextPossibleActionsByLastGrammar: Map<Grammar | null, Set<Action>>;
};

export default class GrammarAnalyzer {
  constructor(private readonly runtime: RuntimeAdapter) { }

  /** Analyzes the root grammar to extract the required data for bottom-up parsing */
  public analyzeGrammar(grammar: Grammar): AnalysisContext["nextPossibleActionsByLastGrammar"] {
    const context: AnalysisContext = {
      /** Memoized action factory prevents doubles */
      action: memoize((type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean): Action => ({
        type, grammar, precedence, rightToLeft,
      })),

      /**
       * Contains the list of first possible terminals for each non-terminal grammar.
       * Useful to compute the shift actions during the parsing phase.
       */
      firstPossibleTerminalsByGrammar: new Map<Grammar | null, Set<Grammar>>(),

      /** Contains the list of possible next actions, indexed by the last matched or reduced grammar */
      nextPossibleActionsByLastGrammar: new Map<Grammar | null, Set<Action>>(),
    };

    this.recursiveGrammarAnalysis(context, grammar, new Set(), null, 0);

    return context.nextPossibleActionsByLastGrammar;
  }

  /**
   * Walks recursively the given grammar to extract information
   */
  private recursiveGrammarAnalysis(
    context: AnalysisContext,
    grammar: Grammar,
    alreadyWalked: Set<Grammar>,
    parent: Grammar | null,
    indexInParent: number,
    parentPrecedence?: number,
    parentRightToLeft?: boolean,
  ): void {
    const { action } = context;
    const { inspect } = this.runtime;

    // Recursive walk
    if (
      isNonTerminalGrammar(grammar) // Only non terminal grammars need to be walked
      && !alreadyWalked.has(grammar) // Handles infinite recursion
    ) {
      const nextAlreadyWalked = new Set(alreadyWalked);
      nextAlreadyWalked.add(grammar);

      const precedence = (grammar.precedence ?? parentPrecedence);
      const rightToLeft = (grammar.rightToLeft ?? parentRightToLeft);

      if (isSequenceGrammar(grammar)) {
        for (let i = 0; i < grammar.value.length; i++) {
          this.recursiveGrammarAnalysis(context, grammar.value[i], nextAlreadyWalked, grammar, i, precedence, rightToLeft);
        }
      }
      else if (isChoiceGrammar(grammar)) {
        for (const subGrammar of grammar.value) {
          this.recursiveGrammarAnalysis(context, subGrammar, nextAlreadyWalked, grammar, 0, precedence, rightToLeft);
        }
      }
      else if (isNonTerminalGrammar(grammar)) { // Optional, repetitions, etc.
        this.recursiveGrammarAnalysis(context, grammar.value, nextAlreadyWalked, grammar, 0, precedence, rightToLeft);
      }
    }

    // Post-walk grammar processing
    { // Record the first terminals
      if (isTerminalGrammar(grammar)) {
        // The first terminal of a terminal grammar is itself.
        mapSetAddBy(context.firstPossibleTerminalsByGrammar, grammar, [grammar]);
      }

      if (indexInParent === 0) {
        mapSetAddBy(context.firstPossibleTerminalsByGrammar, parent, context.firstPossibleTerminalsByGrammar.get(grammar) ?? []);
      }
    }

    { // Hydrating the possible next actions
      if (parent === null) { // Root grammar
        mapSetAddBy(
          context.nextPossibleActionsByLastGrammar, parent,
          Array.from(context.firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
            subGrammar => action(ActionType.SHIFT, subGrammar)
          )
        );

        mapSetAddBy(context.nextPossibleActionsByLastGrammar, grammar, [action(ActionType.ACCEPT, null)]);
      }

      else if (isChoiceGrammar(parent)) {
        mapSetAddBy(context.nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
      }

      else if (isSequenceGrammar(parent)) {
        if (indexInParent === parent.value.length - 1) {
          // Last item of a sequence : reduce parent
          mapSetAddBy(context.nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
        }

        if (indexInParent > 0) {
          // Shift from previous grammar to the first possible non-terminals of this one
          mapSetAddBy(
            context.nextPossibleActionsByLastGrammar, parent.value[indexInParent - 1],
            Array.from(context.firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
              subGrammar => action(ActionType.SHIFT, subGrammar, parentPrecedence, parentRightToLeft)
            )
          );
        }
      }

      else {
        console.trace(`TODO handle next actions for parent : ${inspect(parent)}`); // SROB Gérer les autres actions
      }
    }
  }
}
