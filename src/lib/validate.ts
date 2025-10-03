import { z } from "zod";

export function validate<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const err = parsed.error.flatten();
    throw new Error(`Validation failed: ${JSON.stringify(err)}`);
  }
  return parsed.data;
}


