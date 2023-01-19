import { Schema } from 'mongoose';

export interface IProjectCategoryCriteriaMongoAttributes {
  category: string;
  subCategory: string;
}

export const projectCategoryCriteriaSchema = new Schema({
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    required: false
  }
});
