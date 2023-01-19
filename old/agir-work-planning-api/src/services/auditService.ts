import { IAudit, IAuthor } from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';

import { userService } from './userService';

interface IAuditService {
  buildAudit(audit?: IAudit): IAudit;
}

export const systemUser: IAuthor = {
  userName: 'system',
  displayName: 'Système'
};

class AuditService implements IAuditService {
  public buildAudit(audit?: IAudit): IAudit {
    const user = userService.currentUser;
    return this.generateAudit({ userName: user.userName, displayName: user.name }, audit);
  }

  public buildSystemAudit(audit?: IAudit): IAudit {
    return this.generateAudit(systemUser, audit);
  }

  private generateAudit(author: IAuthor, audit?: IAudit): IAudit {
    const date = new Date();
    const dateIso = date.toISOString();

    // On create
    if (!audit) {
      return {
        createdAt: dateIso,
        createdBy: author
      };
    }

    // On update
    const newAudit = _.cloneDeep(audit);
    newAudit.lastModifiedAt = dateIso;
    newAudit.lastModifiedBy = author;
    return newAudit;
  }
}

export const auditService = new AuditService();
