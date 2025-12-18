import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { VkStrategy } from '../oauth/vk.strategy';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Controller('oauth')
export class OauthController {
  constructor(
    private vkStrategy: VkStrategy,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  @Get('vk')
  async vkLogin(@Res() res: Response, @Param() param, @Query() query) {
    const creds = await this.vkStrategy.getAccessToken({
      code: query.code,
      code_verifier: query.code_verifier,
      device_id: query.device_id,
      state: query.state,
    });

    const vkUser = await this.vkStrategy.getUserData(creds.access_token);

    return { data: vkUser };
    return res.send(JSON.stringify(vkUser));
    return res.redirect('https://test.partners.yurta.site/oauth/vk');
  }

  @Get('vk/callback')
  @UseGuards(AuthGuard('vkontakte'))
  async vkLoginCallback(@Req() req) {
    // Handles the VK OAuth2 callback and user data
    return req.user;
  }
}
