import {
    UnauthorizedException,
  } from '@nestjs/common';
  import { AuthGuard } from '@nestjs/passport';
   
  export class JwtGuard extends AuthGuard('jwt') {
    handleRequest(err, user, info?: Error) {
      if (err || !user) {
        throw err || new UnauthorizedException("Your session has expired. Please log in again to continue.");
      }
      return user;
    }
  }
  