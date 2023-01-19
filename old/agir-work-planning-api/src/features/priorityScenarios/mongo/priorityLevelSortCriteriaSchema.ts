import { Schema } from 'mongoose';

export interface IPriorityLevelSortCriteriaMongoAttributes {
  name: string;
  service?: string;
  rank: number;
}

export const sortCriteriaSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    service: {
      type: String,
      required: false
    },
    rank: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);
