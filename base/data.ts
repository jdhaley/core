import {Bundle} from "../api/model";

export type constant = string | number | boolean | null;
export type serial = constant | Bundle<serial> | serial[];
export type pure = constant | Function | Bundle<pure> | pure[]

export const EMPTY: Bundle<pure> = Object.create(null);
EMPTY.string = ""
EMPTY.number = 0
EMPTY.boolean = false
EMPTY.bundle = Object.freeze(Object.create(null))
EMPTY.array = Object.freeze([]) as pure[]
EMPTY.function = Object.freeze(function nil(any: any): any {}),
Object.freeze(EMPTY);

export const NIL: Bundle<pure> = Object.create(EMPTY);
NIL.value = null
NIL.void = undefined
NIL.unknown = NaN
Object.freeze(NIL);

