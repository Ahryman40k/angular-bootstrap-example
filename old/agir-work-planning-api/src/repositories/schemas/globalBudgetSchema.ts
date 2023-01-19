import { Schema } from 'mongoose';

export const globalBudgetSchema = new Schema(
  {
    allowance: {
      type: Number,
      required: false
    },
    burnedDown: {
      type: Number,
      required: false
    },
    balance: {
      type: Number,
      required: false
    }
  },
  { _id: false }
);
