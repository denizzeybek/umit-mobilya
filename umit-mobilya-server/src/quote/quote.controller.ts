import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuoteListDto, QuoteResponseDto } from './dto/quote-response.dto';
import { QuoteService } from './quote.service';

/**
 * Teklif uçları.
 *
 * `POST /api/quotes` PUBLIC — Rule 05'in "POST/PUT/DELETE auth arkasında"
 * kuralına bilinçli bir istisna, tıpkı `POST /api/products/filter` gibi.
 * Teklifi veren kişi oturum açmıyor; açsaydı akış zaten çalışmazdı.
 *
 * Karşılığında üç koruma var: IP başına dakikada 5 istek, doğrulanmış
 * telefon numarası, ve tutarın istemciden DEĞİL sunucudan hesaplanması.
 *
 * `GET /:code` de public: teklifi yaratan kendi teklifini başka türlü
 * okuyamaz. Kod bu yüzden tahmin edilemez üretiliyor (`quote-code.ts`).
 */
@ApiTags('quotes')
@Controller('api/quotes')
export class QuoteController {
  constructor(private readonly service: QuoteService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiCreatedResponse({ type: QuoteResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateQuoteDto): Promise<QuoteResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: QuoteListDto })
  list(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ): Promise<QuoteListDto> {
    const take = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const offset = Math.max(Number(skip) || 0, 0);

    return this.service.list(take, offset);
  }

  @Get(':code')
  @ApiOkResponse({ type: QuoteResponseDto })
  byCode(@Param('code') code: string): Promise<QuoteResponseDto> {
    return this.service.byCode(code);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param('code') code: string): Promise<void> {
    return this.service.remove(code);
  }
}
