import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { SignUpDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LogInDto, TeamDTO } from './dto/login.dto';
import { JwtGuard } from './guard/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() signupDto: SignUpDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  login(@Body() logInDto: LogInDto) {
    
    return this.authService.login(logInDto);
  }

  @Post('team')
  async getTeam(@Body() teamDto: TeamDTO) {
    console.log(teamDto.departmentId)
    const team =
      await this.authService.getTeam(teamDto);
    return team;
  }

  @UseGuards(JwtGuard)
  @Get('user')
  async getUser(@Req() req) {
    const team =
      await this.authService.getUser(req.user.userId);
    return team;
  }

}
