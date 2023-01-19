import * as _ from 'lodash';

export const generateIdFilter = () => {
  return ['match', ['to-string', ['get', 'id']], [''], true, false];
};
