import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchQueryDto, SearchContentType } from './dto/search-query.dto';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Поиск по сайту' })
  @ApiQuery({ name: 'query', required: true, description: 'Поисковый запрос' })
  @ApiQuery({ name: 'contentType', required: false, enum: SearchContentType })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(@Query() query: SearchQueryDto) {
    return this.searchService.search(query);
  }
}

