export type Thing = {
    /** The main concept, in "lowerCamelCase" or "lowerCamelCase|lowerCamelCasePlural" */
    concept: string,

    /** A description */
    desc?: string,

    /** The concept business domain */
    domain?: string,

    /** Namespaces hierarchy */
    namespace?: string[],

    /** Specifies that the current thing comes from another thing (typically a foreign key) */
    from?: Thing,

    /** Indicates this thing is a join between two things (like a relation in DB) */
    join?: string[],

    /** The thing properties */
    properties?: Thing[],

    /** The thing type */
    type?: "string" | "number" | "boolean" | "DateTime" | "Date" | "Time" | "Duration" | "uuid",
    nullable?: boolean,
}

export type Join = Omit<Thing, "concept"> & {
    join: Thing["join"],
}

export const namespaced = (parent: Thing, concept: Thing): Thing => ({
    domain: parent.domain,
    namespace: [...(parent.namespace ?? []), parent.concept],
    ...concept,
});

export const join = (a: Thing, b: Thing): Join => ({
    domain: a.domain,
    namespace: a.namespace,
    join: [a.concept, b.concept],
});

export const propertyOf = (parent: Thing, thing: Thing): Thing => {
    const r = namespaced(parent, thing);
    (parent.properties ??= []).push(r);
    return r;
};

export function singular(concept: string): string {
    return concept.split("|")[0]
}

export function plural(concept: string): string {
    return concept.split("|")[1] ?? `${singular(concept)}s`
}

export function ucFirst(str: string): string {
    return str.replace(/^[a-z]/ig, (g) => g.toUpperCase());
}

export function longName(thing: Thing): Array<string> {
    return [
        ...(thing.domain ? [thing.domain] : []),
        ...(thing.namespace ?? []),
        singular(thing.concept),
    ]
}

export function shortName(thing: Thing): string {
    return singular(thing.concept)
}

/** Useful for db tables */
export function snakeCasePluralLongName(table: Thing): string {
    return [
        ...table.domain ? [table.domain] : [],
        ...[
            ...table.namespace ?? [],
            table.concept,
        ].map(plural)
    ].join('_');
}

export function dbForeignKeyName(thing: Thing): string {
    return [...thing.from ? [thing.from.concept] : [], thing.concept].map(singular).join("_");
}

