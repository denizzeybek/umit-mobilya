import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  PriceBookResponseDto,
  PriceBookVersionDto,
  UpdatePriceBookDto,
} from './dto/pricebook.dto';
import { PriceBookService } from './pricebook.service';

import type { IPriceBook } from './generated/pricing/priceBook';

/**
 * Fiyat kitabı uçları.
 *
 * `GET /api/pricebook` PUBLIC çünkü konfigüratörün kataloğu ondan besleniyor;
 * karşılığında kâr marjı gövdeden çıkarılıyor. Yazma uçları auth arkasında.
 */
@ApiTags('pricebook')
@Controller('api/pricebook')
export class PriceBookController {
  constructor(private readonly service: PriceBookService) {}

  @Get()
  @ApiOkResponse({ type: PriceBookResponseDto })
  async active(): Promise<PriceBookResponseDto> {
    const book = await this.service.activePublic();
    return { version: book.version, data: book as unknown as Record<string, unknown> };
  }

  @Get('versions')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [PriceBookVersionDto] })
  versions(): Promise<PriceBookVersionDto[]> {
    return this.service.versions();
  }

  @Get('versions/:version')
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PriceBookResponseDto })
  async byVersion(
    @Param('version', ParseIntPipe) version: number,
  ): Promise<PriceBookResponseDto> {
    const book = await this.service.byVersion(version);
    return {
      version: book?.version ?? version,
      data: (book ?? {}) as unknown as Record<string, unknown>,
    };
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: PriceBookResponseDto })
  async publish(
    @Body() dto: UpdatePriceBookDto,
  ): Promise<PriceBookResponseDto> {
    const saved = await this.service.publish(dto.data as unknown as IPriceBook);
    return { version: saved.version, data: saved as unknown as Record<string, unknown> };
  }
}
