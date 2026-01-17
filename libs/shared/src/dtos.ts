import { IsString, IsNumber, IsOptional, IsPositive, IsNotEmpty, Min } from 'class-validator';

/**
 * DTO for purchase request from frontend/public-api
 */
export class BuyRequestDto {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

/**
 * DTO for querying user purchases
 */
export class GetPurchasesQueryDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

/**
 * DTO for health check response
 */
export class HealthCheckDto {
  @IsString()
  status!: 'healthy' | 'unhealthy' | 'degraded';

  @IsString()
  service!: string;

  @IsNumber()
  timestamp!: number;

  @IsOptional()
  checks?: Record<string, { status: string; message?: string }>;
}