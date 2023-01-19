import * as superagent from 'superagent';
import { configs } from '../../config/configs';
import { btoa } from '../../src/utils/btoa';

export class TokenGenerator {
  /**
   * Returns the token to used in the Authorization header.
   *
   * @param userName
   * @param password
   * @return Either an access token or an id token (local only)
   */
  public async getAuthorizationToken(username: string, password: string): Promise<string> {
    const gluuResponse = await superagent
      .post(`${configs.gluu.urlToken}/oxauth/restv1/token`)
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set(
        'Authorization',
        `Basic ${btoa(`${configs.gluu.openIdClient.username}:${configs.gluu.openIdClient.password}`)}`
      )
      .send(`grant_type=password&username=${username}&password=${password}&scope=openid%20profile%20user_name`);
    return `Bearer ${gluuResponse.body.access_token}`;
  }
}
