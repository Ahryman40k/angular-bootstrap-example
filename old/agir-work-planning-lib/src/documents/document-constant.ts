import { IAllowedMimeType } from '../planning';

export const DOCUMENT_EXTENSIONS_ALLOWED: string[] = [
  'doc',
  'docx',
  'dwg',
  'gif',
  'jpg',
  'kml',
  'kmz',
  'pdf',
  'png',
  'ppt',
  'shp',
  'xls',
  'xlsx'
];

export const DOCUMENT_ALLOWED_MIME_TYPES: IAllowedMimeType[] = [
  'application/pdf',
  'application/msword',
  'image/x-dwg',
  'application/octet-stream',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.ms-powerpoint',
  'application/vnd',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/tiff'
];
