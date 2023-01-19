import { User } from '@villemontreal/agir-work-planning-lib';
import * as express from 'express';
import { UploadFile } from '../shared/upload/uploadFile';

export type AgirRequest = express.Request & { user: User };
export type UploadRequest = AgirRequest & { file: UploadFile };
