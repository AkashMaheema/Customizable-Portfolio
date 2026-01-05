import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3)
  .max(24)
  .regex(/^[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/, {
    message:
      "Use 3-24 chars: lowercase letters, numbers, underscores; no leading/trailing underscore.",
  });

export const registerSchema = z.object({
  email: z.string().email(),
  username: usernameSchema,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const sectionTypeSchema = z.enum([
  "hero",
  "about",
  "skills",
  "projects",
  "contact",
  "custom",
]);

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: sectionTypeSchema,
  position: z.number().int().nonnegative(),
  content: z.record(z.string(), z.any()),
});

export const sectionsSchema = z.array(sectionSchema);

export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

export const saveSectionsSchema = z.object({
  sections: sectionsSchema,
});

export const publishSchema = z.object({
  isPublished: z.boolean(),
});
