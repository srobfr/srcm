import { isTerminalGrammar } from "../grammar/GrammarTypes.ts";
import { Grammar, isChoiceGrammar, isNonTerminalGrammar, isSequenceGrammar, TerminalGrammar } from "../grammar/GrammarTypes.ts";
import { RuntimeAdapter } from "../runtimes/types.ts";
import mapSetAddBy from "../utils/mapSetAddBy.ts";
import memoize from "../utils/memoize.ts";
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

export default class GrammarAnalyzer {
  constructor(private readonly runtime: RuntimeAdapter) { }

  /** Analyzes the root grammar to extract the required data for bottom-up parsing */
  public analyzeGrammar(grammar: Grammar): AnalysisContext["nextPossibleActionsByLastGrammar"] {

    // const context: AnalysisContext = {
    //   /** Memoized action factory prevents doubles */
    //   action: memoize((type: ActionType, grammar: Grammar | null, precedence?: number, rightToLeft?: boolean): Action => ({
    //     type, grammar,
    //     ...precedence ? { precedence } : null,
    //     ...rightToLeft ? { rightToLeft } : null,
    //   })),

    //   /**
    //    * Contains the list of first possible terminals for each non-terminal grammar.
    //    * Useful to compute the shift actions during the parsing phase.
    //    */
    //   firstPossibleTerminalsByGrammar: new Map<Grammar | null, Set<Grammar>>(),

    //   /** Contains the list of possible next actions, indexed by the last matched or reduced grammar */
    //   nextPossibleActionsByLastGrammar: new Map<Grammar | null, Set<Action>>(),
    // };

    // Find first terminals for each grammar
    const firstPossibleTerminalsByGrammar = this.extractFirstPossibleTerminalsByGrammar(grammar);
    const nextPossibleActionsByLastGrammar = this.extractNextPossibleActionsByLastGrammar(grammar, firstPossibleTerminalsByGrammar);
    // console.log(this.runtime.inspect({ nextPossibleActionsByLastGrammar })) // SROB
    // throw new Error("SROB");

    // this.walkFullGrammar({
    //   context,
    //   grammar,
    //   alreadyWalked: new Set(),
    //   indexInParent: 0,
    //   parent: null,
    //   process: this.hydrateFirstPossibleTerminalsByGrammar.bind(this),
    // });

    // console.log("SROB", this.runtime.inspect(context.firstPossibleTerminalsByGrammar)) // SROB

    // this.walkFullGrammar({
    //   context,
    //   grammar,
    //   alreadyWalked: new Set(),
    //   indexInParent: 0,
    //   parent: null,
    //   process: this.hydrateNextPossibleActionsByLastGrammar.bind(this),
    // });

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

  private extractFirstPossibleTerminalsByGrammar(grammar: Grammar): Map<Grammar | null, Set<Grammar>> {
    const walkParamsByGrammar = new Map<Grammar | null, Set<WalkParams>>();
    const terminals = new Set<TerminalGrammar>();

    this.walkFullGrammar(grammar, (walkParams: WalkParams) => {
      const { grammar } = walkParams;
      mapSetAddBy(walkParamsByGrammar, grammar, [walkParams]);
      if (isTerminalGrammar(grammar)) terminals.add(grammar);
    });

    const firstPossibleTerminalsByGrammar = new Map<Grammar | null, Set<Grammar>>();
    for (const terminal of terminals) mapSetAddBy(firstPossibleTerminalsByGrammar, terminal, [terminal]);

    const recursiveProcessGrammar = (grammar: Grammar | null) => {
      const firstTerminals = firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<TerminalGrammar>();
      if (!firstTerminals.size) return;

      for (const walkParams of (walkParamsByGrammar.get(grammar) ?? new Set())) {
        const { parent, indexInParent } = walkParams;
        if (indexInParent > 0) continue;

        const sizeBefore = (firstPossibleTerminalsByGrammar.get(parent) ?? new Set<TerminalGrammar>()).size;
        mapSetAddBy(firstPossibleTerminalsByGrammar, parent, firstTerminals);
        const sizeAfter = (firstPossibleTerminalsByGrammar.get(parent) ?? new Set<TerminalGrammar>()).size;
        if (sizeBefore < sizeAfter) recursiveProcessGrammar(parent);
      }
    };

    for (const terminal of terminals) recursiveProcessGrammar(terminal);

    return firstPossibleTerminalsByGrammar;
  }

  private extractNextPossibleActionsByLastGrammar(grammar: Grammar, firstPossibleTerminalsByGrammar: Map<Grammar | null, Set<Grammar>>): Map<Grammar | null, Set<Action>> {
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

      else if (isSequenceGrammar(parent)) {
        if (indexInParent === parent.value.length - 1) {
          // Last item of a sequence : reduce parent
          mapSetAddBy(nextPossibleActionsByLastGrammar, grammar, [action(ActionType.REDUCE, parent)]);
        }

        if (indexInParent > 0) {
          // Shift from previous grammar to the first possible non-terminals of this one
          mapSetAddBy(
            nextPossibleActionsByLastGrammar, parent.value[indexInParent - 1],
            Array.from(firstPossibleTerminalsByGrammar.get(grammar) ?? new Set<Grammar>()).map(
              subGrammar => action(ActionType.SHIFT, subGrammar, parentPrecedence, parentRightToLeft)
            )
          );
        }
      }

      else {
        console.trace(`TODO handle next actions for parent : ${inspect(parent)}`); // SROB Gérer les autres actions
      }
    });

    return nextPossibleActionsByLastGrammar;
  }
}
