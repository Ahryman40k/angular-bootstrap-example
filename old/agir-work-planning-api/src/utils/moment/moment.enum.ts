export enum TimeUnits {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
  DAY = 'day',
  HOUR = 'hour',
  MINUTE = 'minute',
  SECOND = 'second',
  DATE = 'date' // used to get day
}

export enum When {
  START = 'start',
  END = 'end',
  NOW = 'now'
}

export enum AuthorizedDateFormats {
  DAY = 'YYYY-MM-DD',
  MINUTE = 'YYYY-MM-DDTHH:mm',
  COMPLETE = 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  SECOND = 'YYYY-MM-DD HH:mm:ss',
  MINUTE_WITH_SPACE = 'YYYY-MM-DD HH:mm',
  MILLISECONDS_WITH_SPACE = 'YYYY-MM-DD HH:mm:ss.SSS'
}

export enum DateError {
  INVALID_DATE = 'INVALID_DATE',
  INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT'
}
