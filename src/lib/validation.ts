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

const colorStringSchema = z.string().min(1).max(64);

export const backgroundDirectionSchema = z.enum([
  "to-r",
  "to-l",
  "to-b",
  "to-t",
  "to-br",
  "to-bl",
  "to-tr",
  "to-tl",
]);

export const backgroundStyleSchema = z
  .object({
    mode: z.enum(["solid", "gradient"]).optional(),
    color: colorStringSchema.optional(),
    from: colorStringSchema.optional(),
    to: colorStringSchema.optional(),
    direction: backgroundDirectionSchema.optional(),
  })
  .optional();

export const textStyleSchema = z
  .object({
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    color: colorStringSchema.optional(),
    font: z.enum(["sans", "serif", "mono"]).optional(),
  })
  .optional();

export const sectionStyleSchema = z
  .object({
    background: backgroundStyleSchema,
    text: textStyleSchema,
  })
  .optional();

export const sectionLayoutSchema = z
  .object({
    x: z.number().finite().optional(),
    y: z.number().finite().optional(),
    w: z.number().finite().positive().max(5000).optional(),
    h: z.number().finite().positive().max(5000).optional(),
    orientation: z.enum(["portrait", "landscape"]).optional(),
  })
  .optional();

export const sectionSchema = z.object({
  id: z.string().min(1),
  type: sectionTypeSchema,
  position: z.number().int().nonnegative(),
  content: z.record(z.string(), z.any()),
  style: sectionStyleSchema,
  layout: sectionLayoutSchema,
});

export const sectionsSchema = z.array(sectionSchema);

export const pageStyleSchema = z
  .object({
    background: backgroundStyleSchema,
  })
  .optional();

export const portfolioDataSchema = z.preprocess(
  (val) => {
    if (Array.isArray(val)) return { sections: val };
    return val;
  },
  z.object({
    page: pageStyleSchema,
    sections: sectionsSchema,
  })
);

export const updateUsernameSchema = z.object({
  username: usernameSchema,
});

export const savePortfolioSchema = z.object({
  page: pageStyleSchema,
  sections: sectionsSchema,
});

export const publishSchema = z.object({
  isPublished: z.boolean(),
});
