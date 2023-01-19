import { Aggregate, Document, Model, Schema } from 'mongoose';

export type CustomModel<IModelAttributes> = Model<IModelAttributes & Document> & {
  schema: Schema<any>;
  hasObjectId: boolean;
  lookups: (aggregate: Aggregate<any>, expand: string[]) => void;
};
