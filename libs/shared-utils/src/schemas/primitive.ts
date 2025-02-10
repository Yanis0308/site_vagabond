import { Type } from "@sinclair/typebox";

export const NonEmptyString = Type.String({
  minLength: 1,
  $id: "NonEmptyString",
});
export const LimitedString = Type.String({
  maxLength: 1000,
  $id: "LimitedString",
});
