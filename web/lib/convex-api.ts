import { anyApi } from "convex/server";

export const api = anyApi;

export type Id<TableName extends string> = string & {
  __tableName?: TableName;
};
