import { Schema } from 'mongoose';

const additionalCostSchema = new Schema(
  {
    type: {
      type: String,
      required: false
    },
    amount: {
      type: Number,
      required: false
    },
    accountId: {
      type: Number,
      required: false
    },
    note: {
      type: String,
      required: false
    }
  },
  {
    _id: false
  }
);

const annualBudgetDistributionSummarySchema = new Schema({
  _id: String,
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
});

const distributionSummarySchema = new Schema(
  {
    totalBudget: {
      type: Number,
      required: false
    },
    additionalCostTotals: {
      type: [additionalCostSchema],
      required: false
    },
    totalAdditionalCosts: {
      type: Number,
      required: false
    },
    totalInterventionBudgets: {
      type: Number,
      required: false
    },
    totalAnnualBudget: {
      type: annualBudgetDistributionSummarySchema,
      required: false
    }
  },
  { _id: false }
);

const annualPeriodSchema = new Schema(
  {
    rank: {
      type: Number,
      required: false
    },
    year: {
      type: Number,
      required: false
    },
    annualBudget: {
      type: Number,
      required: false
    },
    annualAllowance: {
      type: Number,
      required: false
    },
    accountId: {
      type: Number,
      required: false
    },
    categoryId: {
      type: String,
      required: false
    },
    interventionIds: {
      type: [String],
      required: false,
      default: undefined
    },
    programBookId: {
      type: Schema.Types.ObjectId,
      ref: 'program_books',
      required: false,
      default: undefined
    },
    additionalCosts: {
      type: [additionalCostSchema],
      required: false
    },
    additionalCostsTotalBudget: {
      type: Number,
      required: false
    },
    interventionsTotalBudget: {
      type: Number,
      required: false
    },
    status: {
      type: String,
      required: false
    }
  },
  {
    _id: false
  }
);

export const annualDistributionSchema = new Schema(
  {
    distributionSummary: {
      type: distributionSummarySchema,
      required: false
    },
    annualPeriods: {
      type: [annualPeriodSchema],
      required: false
    }
  },
  {
    _id: false
  }
);
