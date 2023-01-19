import { IAllowedMimeType } from '@villemontreal/agir-work-planning-lib';
import express = require('express');
import { NextFunction } from 'express';
import { isNil } from 'lodash';
import * as multer from 'multer';
import { configs } from '../../../config/configs';
import { constants } from '../../../config/constants';
import { IApiError } from '../../utils/utils';
import { ErrorCode } from '../domainErrors/errorCode';
import { errorMtlMapper } from '../domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../domainErrors/invalidParameterError';
import { Guard, GuardType } from '../logic/guard';
import { Result } from '../logic/result';
import { UploadFile } from './uploadFile';

function formatMulterError(multerError: multer.MulterError): IApiError {
  return {
    ...multerError,
    target: constants.request.FILE
  };
}

// Upload a received file, create an domain instance of UploadFile and put it as object on request
export function uploadMiddleWare(
  acceptedMimeTypes: IAllowedMimeType[],
  allowEmptyFile = false,
  maxFileSize = configs.storageObject.maxByteWeight
): (request: express.Request, response: express.Response, next: express.NextFunction) => Promise<void> {
  return async (request: express.Request, response: express.Response, next: NextFunction) => {
    const multerUpload = multer({
      storage: multer.memoryStorage(),
      fileFilter: (_, file, cb) => {
        if (isNil(file) && allowEmptyFile) {
          cb(null, true);
        }
        if (!acceptedMimeTypes.includes(file.mimetype as IAllowedMimeType)) {
          cb(null, false);
          return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
        }
        cb(null, true);
      },
      limits: maxFileSize ? { fileSize: configs.storageObject.maxByteWeight } : {}
    });
    await new Promise((resolve, reject) => {
      multerUpload.single(constants.request.FILE)(request, response, err => {
        if (allowEmptyFile && isNil(request.file) && isNil(err)) {
          resolve();
        }
        if (err != null) {
          const error = formatMulterError(err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            error.code = ErrorCode.FILE_SIZE_EXCEDEED;
            error.message = `File size excedeed`;
          }
          if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            error.code = ErrorCode.NOT_ACCEPTED_MIME_TYPE;
            error.message = `Mime type is invalid`;
          }
          const apiError: any = errorMtlMapper.toApiError(new InvalidParameterError(error, error.message));
          reject(apiError);
        }
        const checkFileDetected = Guard.guard({
          argument: request.file,
          argumentName: constants.request.FILE,
          guardType: [GuardType.NULL_OR_UNDEFINED]
        });
        if (!checkFileDetected.succeeded) {
          // Middleware did not detect the file
          const errorMessage = `Could not find file in multipart/form-data : '${constants.request.FILE}'`;
          const apiError: any = errorMtlMapper.toApiError(new InvalidParameterError(checkFileDetected, errorMessage));
          reject(apiError);
        } else {
          const uploadFileResult = UploadFile.create(request.file);
          if (uploadFileResult.isFailure) {
            const apiError: any = errorMtlMapper.toApiError(
              new InvalidParameterError(Result.combine([uploadFileResult]).error)
            );
            reject(apiError);
          } else {
            request[constants.request.FILE] = uploadFileResult.getValue();
          }
          resolve();
        }
      });
    });
    next();
  };
}
