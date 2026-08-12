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
  Res,
  UseGuards,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateQuoteDto } from './dto/create-quote.dto';
import { buildQuoteHtml, quoteDocumentModel } from './quote-document';
import { renderQuotePdf } from './quote-pdf';
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
  private readonly logger = new Logger(QuoteController.name);

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

  /*
   * Belge de public: teklifi veren oturum açmıyor ve kendi teklifini
   * indirebilmeli. Erişimi tahmin edilemez kod koruyor.
   *
   * PDF üretimi hata verirse HTML'e düşülüyor — belge hiç gelmemektense
   * biçimi düşsün. Düşüş `warn` olarak loglanıyor, yoksa sessizce herkes
   * HTML almaya başlar ve kimse fark etmez.
   */
  @Get(':code/document')
  async document(
    @Param('code') code: string,
    @Query('format') format: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const quote = await this.service.byCode(code);
    const model = quoteDocumentModel(quote);

    if (format !== 'html') {
      try {
        const pdf = await renderQuotePdf(model);

        response
          .type('application/pdf')
          .setHeader(
            'Content-Disposition',
            `attachment; filename="teklif-${model.code}.pdf"`,
          )
          .send(pdf);
        return;
      } catch (error) {
        this.logger.warn(
          `PDF üretilemedi, HTML'e düşülüyor (${model.code}): ${String(error)}`,
        );
      }
    }

    response.type('text/html').send(buildQuoteHtml(model));
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  remove(@Param('code') code: string): Promise<void> {
    return this.service.remove(code);
  }
}
