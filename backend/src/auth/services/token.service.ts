/**
 * Authentication Token Service (JWT & Refresh Token Rotation)
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokenPayload, AuthTokens, RefreshTokenEntity } from '../auth.types';
import { IRefreshTokenRepository } from '../../repositories/interfaces/IRefreshTokenRepository';
import { CryptoUtils } from '../../core/security/crypto.utils';
import { InvalidTokenError, TokenExpiredError, TokenRevokedError, TokenReusedBreachError } from '../../core/errors/DomainErrors';
import { config } from '../../config';
import { logger } from '../../core/logger/Logger';
import { eventBus } from '../../core/events/EventBus';

export class TokenService {
  private readonly refreshTokenRepo: IRefreshTokenRepository;

  constructor(refreshTokenRepo: IRefreshTokenRepository) {
    this.refreshTokenRepo = refreshTokenRepo;
  }

  /**
   * Signs a stateless JWT access token
   */
  public generateAccessToken(payload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'>): string {
    const signOptions: SignOptions = {
      expiresIn: config.security.token.accessExpiresIn as jwt.SignOptions['expiresIn'],
      issuer: config.security.token.issuer,
      audience: config.security.token.audience,
      jwtid: uuidv4(),
    };

    return jwt.sign(payload, config.security.token.accessSecret, signOptions);
  }

  /**
   * Verifies and decodes an access token
   */
  public verifyAccessToken(token: string): AuthTokenPayload {
    try {
      const verifyOptions: VerifyOptions = {
        issuer: config.security.token.issuer,
        audience: config.security.token.audience,
      };

      const decoded = jwt.verify(token, config.security.token.accessSecret, verifyOptions) as AuthTokenPayload;
      return decoded;
    } catch (err: any) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new TokenExpiredError('Access token has expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new InvalidTokenError(`Invalid access token: ${err.message}`);
      }
      throw new InvalidTokenError('Failed to verify access token');
    }
  }

  /**
   * Generates a cryptographically secure refresh token entity with family tracking
   */
  public async createRefreshToken(
    userId: string,
    familyId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ rawToken: string; entity: RefreshTokenEntity }> {
    const rawToken = CryptoUtils.generateSecureToken(48);
    const tokenHash = CryptoUtils.hashSha256(rawToken);
    const tokenFamily = familyId || uuidv4();

    const expiresAt = new Date(Date.now() + config.security.token.refreshExpiresInSeconds * 1000);

    const entity = await this.refreshTokenRepo.create({
      id: uuidv4(),
      userId,
      familyId: tokenFamily,
      tokenHash,
      isRevoked: false,
      expiresAt,
      createdAt: new Date(),
      ipAddress,
      userAgent,
    });

    return { rawToken, entity };
  }

  /**
   * Rotates a refresh token, issuing a new pair and detecting reuse breaches
   */
  public async rotateRefreshToken(
    rawRefreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ newRawRefreshToken: string; newEntity: RefreshTokenEntity; userId: string; familyId: string }> {
    const tokenHash = CryptoUtils.hashSha256(rawRefreshToken);
    const existingToken = await this.refreshTokenRepo.findByTokenHash(tokenHash);

    if (!existingToken) {
      logger.warn('Refresh token rotation attempted with unknown token hash');
      throw new InvalidTokenError('Invalid refresh token');
    }

    // Reuse detection: If a revoked token is used again, someone stole the token!
    if (existingToken.isRevoked) {
      logger.fatal(`SECURITY BREACH: Reuse of revoked refresh token detected for user '${existingToken.userId}', family '${existingToken.familyId}'`);

      // Invalidate the entire token family
      await this.refreshTokenRepo.revokeTokenFamily(existingToken.familyId);

      await eventBus.publish('security.token_reuse', {
        userId: existingToken.userId,
        familyId: existingToken.familyId,
        compromisedTokenHash: tokenHash,
        detectedAt: new Date().toISOString(),
      });

      throw new TokenReusedBreachError();
    }

    // Check expiration
    if (existingToken.expiresAt <= new Date()) {
      throw new TokenExpiredError('Refresh token has expired. Please log in again.');
    }

    // Generate new rotated refresh token in the same family
    const { rawToken: newRawRefreshToken, entity: newEntity } = await this.createRefreshToken(
      existingToken.userId,
      existingToken.familyId,
      ipAddress,
      userAgent
    );

    // Revoke old token and mark replacedBy
    await this.refreshTokenRepo.revokeToken(tokenHash, newEntity.tokenHash);

    return {
      newRawRefreshToken,
      newEntity,
      userId: existingToken.userId,
      familyId: existingToken.familyId,
    };
  }

  /**
   * Revokes a refresh token
   */
  public async revokeRefreshToken(rawRefreshToken: string): Promise<boolean> {
    const tokenHash = CryptoUtils.hashSha256(rawRefreshToken);
    return this.refreshTokenRepo.revokeToken(tokenHash);
  }

  /**
   * Issues both access token and refresh token for a user session
   */
  public async issueAuthTokens(
    payload: Omit<AuthTokenPayload, 'iat' | 'exp' | 'jti' | 'iss' | 'aud'>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(payload);
    const { rawToken: refreshToken } = await this.createRefreshToken(payload.sub, undefined, ipAddress, userAgent);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresInSeconds: config.security.token.accessExpiresInSeconds,
      refreshTokenExpiresInSeconds: config.security.token.refreshExpiresInSeconds,
    };
  }
}
