import {
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ConfigService } from '@nestjs/config';
  import { PassportStrategy } from '@nestjs/passport';
  import { ExtractJwt, Strategy } from 'passport-jwt';
  import { PrismaService } from '../../prisma/prisma.service';
  
  @Injectable()
  export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService, private prismaService: PrismaService) {
      super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('JWT_SECRET'),
      });
    }
  
    async validate(payload: { userId: string; email_mobile: string }) {
      const user = await this.validateUser(payload.userId);
      return user;
    }
  
    async validateUser(userId: string) {
      const user = await this.prismaService.user.findFirst({
        where: { userId },
      });
  
      if (!user) {
        throw new HttpException('User does not exist', HttpStatus.NOT_FOUND);
      }
  
      return user;
    }
  }
  