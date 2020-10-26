import {
    isMultipleGrammarDefinition,
    isOptionalGrammarDefinition,
    isOptMulGrammarDefinition,
    isOrGrammarDefinition,
    isSequenceGrammarDefinition,
    isTerminalGrammarDefinition
} from "../grammar/GrammarDefinitions";
import Context from "./Context";

export const enum ActionTypeEnum {
    START = 'start',
    SHIFT = 'shift',
    REDUCE = 'reduce',
    FINISH = 'finish',
}

export default class ActionsGraphAnalyzer {

    public getPossibleNextContexts(context: Context): Set<Context> {
        const {actionType, grammar, code, offset, parent, indexInParent, matchedLength} = context;
        const possibleNextContexts = new Set<Context>([]);

        if (actionType === ActionTypeEnum.START) {
            // Initial context
            possibleNextContexts.add({
                actionType: ActionTypeEnum.SHIFT, code, offset, grammar, previous: context, parent: context
            });

        } else if (actionType === ActionTypeEnum.SHIFT) {
            if (isTerminalGrammarDefinition(grammar)) {
                possibleNextContexts.add({actionType: ActionTypeEnum.REDUCE, code, offset, grammar, previous: context, parent: parent, indexInParent});

            } else if (isSequenceGrammarDefinition(grammar)) {
                if (grammar.length === 0) {
                    // Empty sequence
                    possibleNextContexts.add({actionType: ActionTypeEnum.REDUCE, code, offset, grammar, previous: context, parent: parent, indexInParent, matchedLength: 0});

                } else {
                    // First item of the sequence
                    possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset, grammar: grammar[0], previous: context, parent: context, indexInParent: 0});
                }

            } else if (isOrGrammarDefinition(grammar)) {
                for (const g of grammar.or) {
                    possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset, grammar: g, previous: context, parent: context});
                }

            } else if (isOptionalGrammarDefinition(grammar)) {
                possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset, grammar: grammar.optional, previous: context, parent: context});
                possibleNextContexts.add({actionType: ActionTypeEnum.REDUCE, code, offset, grammar, previous: context, parent: parent, indexInParent, matchedLength: 0});

            } else if (isMultipleGrammarDefinition(grammar)) {
                possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset, grammar: grammar.multiple, previous: context, parent: context});
            } else if (isOptMulGrammarDefinition(grammar)) {
                possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset, grammar: grammar.optmul, previous: context, parent: context});
                possibleNextContexts.add({actionType: ActionTypeEnum.REDUCE, code, offset, grammar, previous: context, parent: parent, indexInParent, matchedLength: 0});

            } else {
                throw new Error(`Unsupported case C`);
            }

        } else if (actionType === ActionTypeEnum.REDUCE) {
            if (parent.actionType === ActionTypeEnum.START) {
                // Reducing the root grammar => finish
                possibleNextContexts.add({
                    actionType: ActionTypeEnum.FINISH, code, offset: parent.offset, grammar, previous: context, parent: parent.parent, matchedLength: offset + matchedLength,
                    indexInParent: parent.indexInParent
                });

            } else {
                if (isSequenceGrammarDefinition(parent.grammar) && indexInParent < parent.grammar.length - 1) {
                    // Reducing an item in the middle of a sequence => chain the next item
                    possibleNextContexts.add({
                        actionType: ActionTypeEnum.SHIFT, code, offset: offset + matchedLength, grammar: parent.grammar[indexInParent + 1], previous: context, parent: parent,
                        indexInParent: indexInParent + 1
                    });

                } else if (isMultipleGrammarDefinition(parent.grammar) || isOptMulGrammarDefinition(parent.grammar)) {
                    if (parent.grammar.sep) {
                        const parentGrammar: any = parent.grammar;
                        if (context.grammar === parent.grammar.sep) {
                            possibleNextContexts.add({
                                actionType: ActionTypeEnum.SHIFT, code, offset: offset + matchedLength, grammar: (parentGrammar.multiple || parentGrammar.optmul),
                                previous: context, parent: parent
                            }); // Next item
                        } else {
                            possibleNextContexts.add({
                                actionType: ActionTypeEnum.SHIFT, code, offset: offset + matchedLength, grammar: parent.grammar.sep, previous: context, parent: parent
                            }); // Separator
                            possibleNextContexts.add({
                                actionType: ActionTypeEnum.REDUCE, code, offset: parent.offset, grammar: parent.grammar, previous: context, parent: parent.parent,
                                indexInParent: parent.indexInParent, matchedLength: offset - parent.offset + matchedLength
                            });
                        }
                    } else {
                        possibleNextContexts.add({actionType: ActionTypeEnum.SHIFT, code, offset: offset + matchedLength, grammar: grammar, previous: context, parent: parent}); // Repeat
                        possibleNextContexts.add({
                            actionType: ActionTypeEnum.REDUCE, code, offset: parent.offset, grammar: parent.grammar, previous: context, parent: parent.parent,
                            indexInParent: parent.indexInParent, matchedLength: offset - parent.offset + matchedLength
                        });
                    }
                } else {
                    // Reducing the last item of a compound grammar
                    possibleNextContexts.add({
                        actionType: ActionTypeEnum.REDUCE, code, offset: parent.offset, grammar: parent.grammar, previous: context, parent: parent.parent,
                        indexInParent: parent.indexInParent, matchedLength: offset - parent.offset + matchedLength
                    });
                }
            }

        } else {
            throw new Error(`Unsupported case A`);
        }

        return possibleNextContexts;
    }
}
