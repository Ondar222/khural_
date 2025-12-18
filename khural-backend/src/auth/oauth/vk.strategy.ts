import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';

type GetAccessTokenDTO = {
  code: string;
  code_verifier: string;
  state: string;
  device_id: string;
};

@Injectable()
export class VkStrategy {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const clientId = this.configService.get<string>('oauth.vk.clientId');
    if (clientId) {
      this.client_id = clientId;
    }
  }

  client_id: string;

  async getAccessToken(dto: GetAccessTokenDTO): Promise<any> {
    const { code, code_verifier, state, device_id } = dto;
    const grant_type = 'authorization_code';
    const redirect_uri = 'https://test.partners.yurta.site/oauth/vk';

    const url = `https://oauth.vk.com/access_token`;
    const body = new FormData();
    body.append('code', code);
    const params = {
      grant_type,
      redirect_uri,
      client_id: this.client_id,
      code_verifier,
      state,
      device_id,
    };

    const response = await this.httpService
      .post(url, body, { params })
      .toPromise();
    return response?.data;
  }

  async getUserData(access_token: string): Promise<any> {
    const client_id = this.configService.get<string>('oauth.vk.clientId');
    const url = `https://id.vk.com/oauth2/user_info`;
    const params = {
      client_id,
    };
    const headers = {
      Authorization: `Bearer ${access_token}`,
    };

    const response = await firstValueFrom(
      this.httpService.get(url, { params, headers }).pipe(
        catchError(() => {
          throw new Error(`cannot send verification code to`);
        }),
      ),
    );
    return response?.data.request[0];
  }
}
