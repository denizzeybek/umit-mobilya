import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import {
  PriceBookResponseDto,
  PriceBookVersionDto,
  TextureUploadBodyDto,
  TextureUploadResponseDto,
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

  /**
   * Kaplama deseni yükler.
   *
   * Yükleme yayınlamadan AYRI: görsel kovaya hemen gidiyor, anahtarı kitaba
   * yazmak adminin "Yeni sürüm yayınla" kararına kalıyor. Birleştirilseydi tek
   * bir desen denemesi bütün fiyat kitabını yeni bir sürüme itecekti.
   */
  @Post('texture')
  @ApiCreatedResponse({ type: TextureUploadResponseDto })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: TextureUploadBodyDto })
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadTexture(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<TextureUploadResponseDto> {
    /*
     * FileInterceptor dosya gelmediğinde hata vermiyor, `undefined` bırakıyor.
     * Kontrol edilmezse `file.buffer` okunurken 500 patlıyor — "dosya seçmeyi
     * unuttum" bir sunucu hatasına dönüşürdü.
     */
    if (!file) throw new BadRequestException('Desen görseli gerekli');

    return this.service.saveTexture(file);
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
