import { HttpStatusCodes } from '@villemontreal/access-control-api-commons-lib/dist/src';
import { ErrorCodes } from '@villemontreal/agir-work-planning-lib/dist/src';
import { assert } from 'chai';
import { NextFunction, Request, Response } from 'express';
import * as formData from 'form-data';
import * as httpMocks from 'node-mocks-http';
import * as sinon from 'sinon';

import { configs } from '../../../config/configs';
import { constants } from '../../../config/constants';
import { mergeProperties } from '../../../tests/utils/testHelper';
import { ErrorCode } from '../domainErrors/errorCode';
import { UploadFile } from './uploadFile';
import { uploadMiddleWare } from './uploadMiddleware';

const mockExpressRequest = require('mock-express-request');

// tslint:disable:max-func-body-length
// tslint:disable:await-promise
describe('Upload Middleware Tests', () => {
  let res: any;
  let next: any;
  let uploadMiddleware: (request: Request, response: Response, next: NextFunction) => Promise<void>;
  const fileOptions = {
    filename: 'myPDF.pdf',
    contentType: 'application/pdf'
  };

  function defaultUploadMiddleware(
    allowEmptyFile = false
  ): (request: Request, response: Response, next: NextFunction) => Promise<void> {
    return uploadMiddleWare(
      [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ],
      allowEmptyFile,
      configs.storageObject.maxByteWeight
    );
  }

  // tslint:disable:no-async-without-await
  before(function() {
    this.timeout(10000);
  });

  beforeEach(async () => {
    uploadMiddleware = defaultUploadMiddleware();
    res = httpMocks.createResponse();
    next = sinon.spy();
  });

  describe('Negative', () => {
    [
      {
        description: `File not detected/Invalid file`,
        fileOptions: {
          filename: undefined
        },
        expectedError: {
          code: ErrorCodes.MissingValue,
          message: 'file is null or undefined',
          target: 'file'
        }
      },
      {
        description: `Unauthorized mime type`,
        fileOptions: {
          contentType: 'text/html'
        },
        expectedError: {
          code: ErrorCode.NOT_ACCEPTED_MIME_TYPE,
          message: 'Mime type is invalid',
          target: 'file'
        }
      },
      {
        description: `File is too big`,
        fileOptions: {
          size: configs.storageObject.maxByteWeight + 1
        },
        expectedError: {
          code: ErrorCode.FILE_SIZE_EXCEDEED,
          message: 'File size excedeed',
          target: 'file'
        }
      }
    ].forEach(test => {
      it(`should return error when ${test.description}`, async () => {
        const mockFormData = new formData();
        let uploadedData = 'uploadedData';
        if (test.fileOptions.size > configs.storageObject.maxByteWeight) {
          while (uploadedData.length < test.fileOptions.size) {
            uploadedData += uploadedData + uploadedData;
          }
        } else if (test.fileOptions.size === 0) {
          uploadedData = '';
        }
        mockFormData.append(constants.request.FILE, uploadedData, mergeProperties(fileOptions, test.fileOptions));
        const mockedExpressRequest = new mockExpressRequest({
          method: 'POST',
          host: 'localhost',
          url: '/upload',
          headers: mockFormData.getHeaders()
        });
        mockFormData.pipe(mockedExpressRequest);
        let errorResponse: any;
        try {
          await uploadMiddleware(mockedExpressRequest, res, next);
        } catch (error) {
          errorResponse = error;
        }
        assert.strictEqual(errorResponse.httpStatus, HttpStatusCodes.BAD_REQUEST);
        const responseBodyError = errorResponse.error;
        assert.strictEqual(responseBodyError.details.length, 1);
        assert.deepEqual(responseBodyError.details[0], test.expectedError);
      });
    });
  });

  describe('Positive', () => {
    it(`uploaded file is set on request as data`, async () => {
      const mockFormData = new formData();
      mockFormData.append(constants.request.FILE, fileOptions.filename, fileOptions);

      const mockedExpressRequest = new mockExpressRequest({
        method: 'POST',
        host: 'localhost',
        url: '/upload',
        headers: mockFormData.getHeaders()
      });
      mockFormData.pipe(mockedExpressRequest);

      assert.isUndefined(mockedExpressRequest[constants.request.FILE], `FILE is undefined on request`);
      await uploadMiddleware(mockedExpressRequest, res, next);
      assert.isDefined(mockedExpressRequest[constants.request.FILE], `FILE is defined on request`);
      const data: UploadFile = mockedExpressRequest[constants.request.FILE];
      assert.strictEqual(data.originalname, fileOptions.filename);
      assert.strictEqual(data.mimetype, fileOptions.contentType);
    });
    it(`should not return badRequest when middleware accept empty file`, async () => {
      uploadMiddleware = defaultUploadMiddleware(true);
      const mockFormData = new formData();

      const mockedExpressRequest = new mockExpressRequest({
        method: 'POST',
        host: 'localhost',
        url: '/upload',
        headers: mockFormData.getHeaders()
      });
      mockFormData.pipe(mockedExpressRequest);

      await uploadMiddleware(mockedExpressRequest, res, next);
      assert.notEqual(mockedExpressRequest.status, HttpStatusCodes.BAD_REQUEST);
    });
  });
});
