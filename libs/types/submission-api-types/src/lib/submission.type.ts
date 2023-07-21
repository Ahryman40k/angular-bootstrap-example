import {boolean, z} from 'zod'

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




export const ProgressHistoryItem = z.object({
    progressStatus: z.string(),
    createdAt: z.date(),
    createdBy: z.string(),
})
export type ProgressHistoryItem = z.infer<typeof ProgressHistoryItem>

export const StatusHistoryItem = z.object({
    status: z.string(),
    comment: z.string(),
    createdAt: z.date(),
    createdBy: z.string()
})
export type StatusHistoryItem = z.infer<typeof StatusHistoryItem>

export const SubmissionDocument = z.object({

})
export type SubmissionDocument = z.infer<typeof SubmissionDocument>


export const SubmissionRequirement = z.object({
    id: z.string().uuid(),
    mentionId: z.string(),
    typeId: z.string(),
    isDeprecated: z.boolean(),
    text: z. string(),
    subTypeId: z.string(),

    // planningRequirementid
    // audit

    projectIds: z.array(z.string()),

})
export type SubmissionRequirement = z.infer<typeof SubmissionRequirement>

export const Submission = z.object({
    submissionNumber: z.string(),
    drmNumber: z.string(),
    status: z.string(),
    progressStatus: z.string(),
    programBookId: z.string(),
    projectIds: z.array(z.string()),
    progressHistory: z.array(ProgressHistoryItem),
    statusHistory: z.array(StatusHistoryItem),
    documents: z.array(SubmissionDocument),
    requirements: z.array(SubmissionRequirement),
    audit: Audit,
})
export type Submission = z.infer<typeof Submission>