import { Schema } from 'mongoose';

export interface IServicePriorityAttributes {
  service: string;
  priorityId: string;
}

export const servicePrioritySchema = new Schema<IServicePriorityAttributes>(
  {
    service: {
      type: String,
      required: true
    },
    priorityId: {
      type: String,
      required: true
    }
  },
  { _id: false }
);
