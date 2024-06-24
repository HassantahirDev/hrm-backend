import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LogInDto, TeamDTO } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private configService: ConfigService,
    private jwt: JwtService,
  ) {}

  async signup(signupDto: SignUpDto) {
    try {
      const { email_mobile, ...userData } = signupDto;
      if (signupDto?.username) {
        signupDto.username = signupDto.username.replace(/\s/g, '');
      }
      const existingUser = await this.prismaService.user.findFirst({
        where: {
          email_mobile: email_mobile,
        },
      });

      if (existingUser) {
        throw new ConflictException('User already signed up');
      }

      const usernameExists = await this.prismaService.user.findFirst({
        where: {
          username: signupDto.username,
        },
      });

      if (usernameExists) {
        throw new ConflictException('Username already in use');
      }

      const hash = await bcrypt.hash(userData.password, 10);

      const userCreated: any = await this.prismaService.user.create({
        data: {
          ...userData,
          email_mobile: email_mobile,
          password: hash,
          isVerified: false,
        },
      });

      const { password, ...user } = userCreated;
      return { data: user };
    } catch (error) {
      console.log('error', error);
      if (error.code === 'P2002') {
        throw new ConflictException('Email OR Mobile already exists');
      }
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async login(loginDto: LogInDto) {
    try {
      const isVerified = await this.prismaService.user.findFirst({
        where: {
          email_mobile: loginDto.email_mobile,
          deleted: false,
        },
      });
      const user = await this.prismaService.user.findFirst({
        where: {
          email_mobile: {
            equals: loginDto.email_mobile,
            mode: 'insensitive',
          },
          deleted: false,
        },
      });

      if (!user) {
        throw new NotFoundException('User does not exist! Check Email');
      }

      const isPasswordMatch = await bcrypt.compare(
        loginDto.password,
        user.password,
      );

      if (!isPasswordMatch) {
        throw new ForbiddenException('Incorrect Credentials');
      }

      const { password, ...userData } = user;
      const token = await this.generateToken(
        user.userId,
        user.email_mobile,
        this.configService.get('JWT_EXPIRY_TIME'),
        userData.userType
      );

      return { data: userData, token: token };
    } catch (error) {
      console.error('Login error:', error);

      if (error instanceof NotFoundException) {
        throw new HttpException(`${error.message}`, HttpStatus.NOT_FOUND);
      } else if (
        error instanceof ForbiddenException ||
        error instanceof HttpException
      ) {
        throw new HttpException(`${error.message}`, HttpStatus.FORBIDDEN);
      } else {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }
    }
  }
 
  async generateToken(id: string, email_mobile: string, time: string, role:string) {
    const payload = {
      userId: id,
      email_mobile: email_mobile,
      role: role
    };

    console.log('payload', payload)

    const jwt_secret = this.configService.get('JWT_SECRET');
    const jwt_expiryTime = time;

    const token = await this.jwt.signAsync(payload, {
      expiresIn: jwt_expiryTime,
      secret: jwt_secret,
    });

    return {
      access_token: token,
    };
  }

  async getTeam(teamDto: TeamDTO){
    console.log(teamDto)
    const team = await this.prismaService.user.findMany({
      where:{
        departmentId:teamDto.departmentId,
      }
    })

    return team;
  }

  async getUser(userId: string){
    console.log(userId)
    const team = await this.prismaService.user.findFirst({
      where:{
        userId:userId,
      }
    })

    return team;
  }
}
