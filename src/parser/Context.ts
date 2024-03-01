import {GrammarDefinition} from "../grammar/GrammarDefinitions";
import {ActionTypeEnum} from "./ActionsGraphAnalyzer";

export default interface Context {
    grammar: GrammarDefinition,
    actionType: ActionTypeEnum,
    code: string,
    offset: number,
    matchedLength?: number | null,
    previous: Context | null,
    parent: Context | null,
    indexInParent?: number | null
}
