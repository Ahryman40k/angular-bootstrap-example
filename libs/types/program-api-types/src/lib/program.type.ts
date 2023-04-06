import { z } from 'zod';

export const AuditCreatedBy = z.object({
  userName: z.string(),
  displayName: z.string(),
});
export type AuditCreatedBy = z.infer<typeof AuditCreatedBy>;

export const AuditLastModifiedBy = z.object({
  userName: z.string(),
  displayName: z.string(),
});
export type AuditLastModifiedBy = z.infer<typeof AuditLastModifiedBy>;

export const Audit = z.object({
  createdAt: z.date(),
  createdBy: AuditCreatedBy,
  lastModifiedAt: z.date(),
  lastModifiedBy: AuditLastModifiedBy,
});
export type Audit = z.infer<typeof Audit>;

export const ProgramBook = z.object({});
export type ProgramBook = z.infer<typeof ProgramBook>;

export const AnnualProgramStatus = z.union([z.literal('submittedFinal'), z.literal('programming'), z.literal('new')]);
export type AnnualProgramStatus = z.infer<typeof AnnualProgramStatus>;

export const AnnualProgram = z.object({
  executorId: z.string(),
  key: z.string().uuid().optional(),
  year: z.number().int().positive().gte(2000),
  description: z.string().optional(),
  status: AnnualProgramStatus,
  programBooks: z.array(ProgramBook).optional(),
  budgetCap: z.number().positive(),
  sharedRoles: z.array(z.string()).optional(),
});
export type AnnualProgram = z.infer<typeof AnnualProgram>;

export const StoredAnnualProgram = AnnualProgram.merge(
  z.object({
    id: z.string(),
    audit: Audit,
  })
);
export type StoredAnnualProgram = z.infer<typeof StoredAnnualProgram>;
