import { z } from "zod";
import { sectionSchema, sectionsSchema } from "./validation";

export type Section = z.infer<typeof sectionSchema>;
export type Sections = z.infer<typeof sectionsSchema>;
