import { CasingCache, toCamelCase, toSnakeCase } from "drizzle-orm/casing";
import type { SQL } from "drizzle-orm/sql";

import type { CasingType } from "../config/schema";

export const sqlToStr = (sql: SQL, casing: CasingType | undefined) => {
  return sql.toQuery({
    escapeName: () => {
      throw new Error("we don't support params for `sql` default values");
    },
    escapeParam: () => {
      throw new Error("we don't support params for `sql` default values");
    },
    escapeString: () => {
      throw new Error("we don't support params for `sql` default values");
    },
    casing: new CasingCache(casing),
  }).sql;
};

export function getColumnCasing(
  column: { keyAsName: boolean; name: string | undefined },
  casing: CasingType | undefined,
) {
  if (!column.name) return "";
  return !column.keyAsName || casing === undefined
    ? column.name
    : casing === "camelCase"
      ? toCamelCase(column.name)
      : toSnakeCase(column.name);
}

declare global {
  interface String {
    trimChar(char: string): string;
    squashSpaces(): string;
    capitalise(): string;
    camelCase(): string;
    snake_case(): string;

    concatIf(it: string, condition: boolean): string;
  }

  interface Array<T> {
    random(): T;
  }
}

String.prototype.trimChar = function (char: string) {
  let start = 0;
  let end = this.length;

  while (start < end && this[start] === char) ++start;
  while (end > start && this[end - 1] === char) --end;

  // this.toString() due to ava deep equal issue with String { "value" }
  return start > 0 || end < this.length
    ? this.substring(start, end)
    : this.toString();
};

String.prototype.squashSpaces = function () {
  return this.replace(/  +/g, " ").trim();
};

String.prototype.camelCase = function () {
  // return camelcase(String(this));
  return String(this);
};

String.prototype.snake_case = function () {
  return this && this.length > 0
    ? `${this.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)}`
    : String(this);
};

String.prototype.capitalise = function () {
  return this && this.length > 0
    ? `${this[0].toUpperCase()}${this.slice(1)}`
    : String(this);
};

String.prototype.concatIf = function (it: string, condition: boolean) {
  return condition ? `${this}${it}` : String(this);
};
