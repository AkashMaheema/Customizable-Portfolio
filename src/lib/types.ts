import { z } from "zod";
import {
  portfolioDataSchema,
  sectionSchema,
  sectionsSchema,
} from "./validation";

export type Section = z.infer<typeof sectionSchema>;
export type Sections = z.infer<typeof sectionsSchema>;

export type PortfolioData = z.infer<typeof portfolioDataSchema>;
