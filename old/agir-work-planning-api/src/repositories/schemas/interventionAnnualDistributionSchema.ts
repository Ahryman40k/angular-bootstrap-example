import { Schema } from 'mongoose';

const annualInterventionDistributionSummarySchema = new Schema(
  {
    totalAllowance: {
      type: Number,
      required: false
    },
    totalLength: {
      type: Number,
      required: false
    },
    note: {
      type: String,
      required: false
    }
  },
  { _id: false }
);

const interventionAnnualPeriodSchema = new Schema(
  {
    rank: {
      type: Number,
      required: false
    },
    year: {
      type: Number,
      required: false
    },
    annualAllowance: {
      type: Number,
      required: false,
      default: 0
    },
    annualLength: {
      type: Number,
      required: false,
      default: 0
    },
    accountId: {
      type: Number,
      required: false,
      default: 0
    }
  },
  { _id: false }
);

export const interventionAnnualDistributionSchema = new Schema(
  {
    distributionSummary: {
      type: annualInterventionDistributionSummarySchema,
      required: false
    },
    annualPeriods: {
      type: [interventionAnnualPeriodSchema],
      required: false
    }
  },
  { _id: false }
);
