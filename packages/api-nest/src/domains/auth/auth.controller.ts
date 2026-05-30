import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/auth/public.decorator';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import type { AuthUser } from '../../common/auth/current-user.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { MessageResponseDto } from '../../common/dto/message-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { RefreshDto } from './dto/refresh.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register a user',
    description:
      'Creates a new user (passwordless). The returned user can then log in via the OTP flow.',
  })
  @ApiCreatedResponse({ description: 'User created.', type: UserResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already taken.',
    type: ErrorResponseDto,
  })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('request-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request a login OTP',
    description:
      'Emails a 6-digit one-time code to a registered user. Rate-limited to 5 requests/minute.',
  })
  @ApiOkResponse({ description: 'OTP sent.', type: MessageResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No user with that email.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded.',
    type: ErrorResponseDto,
  })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.email);
  }

  @Public()
  @Post('verify-otp')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify OTP and log in',
    description:
      'Exchanges a valid email + 6-digit code for an access/refresh token pair. Rate-limited to 10/minute.',
  })
  @ApiOkResponse({
    description: 'Authenticated — token pair issued.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired code.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No user with that email.',
    type: ErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Rate limit exceeded.',
    type: ErrorResponseDto,
  })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.email, dto.code);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Rotates a valid refresh token, returning a fresh access/refresh pair. The old refresh token is revoked.',
  })
  @ApiOkResponse({
    description: 'New token pair issued.',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired refresh token.',
    type: ErrorResponseDto,
  })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Log out',
    description:
      'Revokes the current session (identified by the access token), invalidating its refresh token.',
  })
  @ApiOkResponse({ description: 'Logged out.', type: MessageResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token.',
    type: ErrorResponseDto,
  })
  logout(@CurrentUser() user: AuthUser) {
    return this.auth.logout(user.sid);
  }
}
