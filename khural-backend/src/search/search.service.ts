import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsEntity } from '../news/entities/news.entity';
import { DocumentEntity } from '../documents/entities/document.entity';
import { PersonEntity } from '../persons/entities/person.entity';
import { SearchQueryDto, SearchContentType } from './dto/search-query.dto';

export interface SearchResult {
  type: SearchContentType;
  id: number;
  title: string;
  description?: string;
  content?: string;
  url?: string;
  highlights?: string[];
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  query: string;
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(NewsEntity)
    private readonly newsRepository: Repository<NewsEntity>,
    @InjectRepository(DocumentEntity)
    private readonly documentRepository: Repository<DocumentEntity>,
    @InjectRepository(PersonEntity)
    private readonly personRepository: Repository<PersonEntity>,
  ) {}

  async search(dto: SearchQueryDto): Promise<SearchResponse> {
    const query = dto.query.trim();
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const contentTypes = dto.contentTypes || (dto.contentType ? [dto.contentType] : [SearchContentType.ALL]);

    const allResults: SearchResult[] = [];

    // Поиск по новостям
    if (
      contentTypes.includes(SearchContentType.ALL) ||
      contentTypes.includes(SearchContentType.NEWS)
    ) {
      const newsResults = await this.searchNews(query, skip, limit);
      allResults.push(...newsResults);
    }

    // Поиск по документам
    if (
      contentTypes.includes(SearchContentType.ALL) ||
      contentTypes.includes(SearchContentType.DOCUMENTS)
    ) {
      const documentResults = await this.searchDocuments(query, skip, limit);
      allResults.push(...documentResults);
    }

    // Поиск по депутатам
    if (
      contentTypes.includes(SearchContentType.ALL) ||
      contentTypes.includes(SearchContentType.PERSONS)
    ) {
      const personResults = await this.searchPersons(query, skip, limit);
      allResults.push(...personResults);
    }

    // Сортируем по релевантности (score)
    allResults.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Применяем пагинацию
    const total = allResults.length;
    const paginatedResults = allResults.slice(skip, skip + limit);

    return {
      results: paginatedResults,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      query,
    };
  }

  private async searchNews(
    query: string,
    skip: number,
    limit: number,
  ): Promise<SearchResult[]> {
    const searchQuery = `%${query}%`;

    // News in this project is localized: title/description/content live in news_content.
    const news = await this.newsRepository
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.content', 'content')
      .andWhere(
        '(content.title ILIKE :query OR content.description ILIKE :query OR content.content ILIKE :query)',
        { query: searchQuery },
      )
      .orderBy('news.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return news.map((item: any) => {
      const contents = Array.isArray(item.content) ? item.content : [];
      const ru =
        contents.find((c) => String(c?.locale || '').toLowerCase() === 'ru') ||
        contents[0] ||
        null;
      const title = ru?.title || `Новость #${item.id}`;
      const description = ru?.description || '';
      const body = ru?.content || '';

      return {
        type: SearchContentType.NEWS,
        id: item.id,
        title,
        description,
        content: body,
        url: `/news/${item.id}`,
        highlights: this.extractHighlights(`${title} ${description}`, query),
        score: this.calculateScore(title, description, query),
      };
    });
  }

  private async searchDocuments(
    query: string,
    skip: number,
    limit: number,
  ): Promise<SearchResult[]> {
    const searchQuery = `%${query}%`;

    const documents = await this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.category', 'category')
      .where('document.isPublished = :isPublished', { isPublished: true })
      .andWhere(
        '(document.title ILIKE :query OR document.number ILIKE :query OR document.content ILIKE :query)',
        { query: searchQuery },
      )
      .orderBy('document.publishedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    return documents.map((item) => ({
      type: SearchContentType.DOCUMENTS,
      id: item.id,
      title: item.title,
      description: item.number ? `№ ${item.number}` : undefined,
      content: item.content,
      url: `/documents/${item.id}`,
      highlights: this.extractHighlights(item.title + ' ' + (item.number || ''), query),
      score: this.calculateScore(item.title, item.number || '', query),
    }));
  }

  private async searchPersons(
    query: string,
    skip: number,
    limit: number,
  ): Promise<SearchResult[]> {
    const searchQuery = `%${query}%`;

    const persons = await this.personRepository
      .createQueryBuilder('person')
      .where(
        '(person.fullName ILIKE :query OR person.description ILIKE :query OR person.education ILIKE :query)',
        { query: searchQuery },
      )
      .orderBy('person.fullName', 'ASC')
      .skip(skip)
      .take(limit)
      .getMany();

    return persons.map((item) => ({
      type: SearchContentType.PERSONS,
      id: item.id,
      title: item.fullName,
      description: item.description,
      url: `/persons/${item.id}`,
      highlights: this.extractHighlights(item.fullName + ' ' + (item.description || ''), query),
      score: this.calculateScore(item.fullName, item.description || '', query),
    }));
  }

  private extractHighlights(text: string, query: string): string[] {
    const highlights: string[] = [];
    const words = query.toLowerCase().split(/\s+/);
    const lowerText = text.toLowerCase();

    words.forEach((word) => {
      if (word.length > 2) {
        const index = lowerText.indexOf(word);
        if (index !== -1) {
          const start = Math.max(0, index - 20);
          const end = Math.min(text.length, index + word.length + 20);
          highlights.push(text.substring(start, end));
        }
      }
    });

    return highlights.slice(0, 3); // Максимум 3 подсветки
  }

  private calculateScore(title: string, description: string, query: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = title.toLowerCase();
    const descLower = (description || '').toLowerCase();

    let score = 0;

    // Точное совпадение в заголовке
    if (titleLower.includes(queryLower)) {
      score += 10;
    }

    // Совпадение отдельных слов в заголовке
    const queryWords = queryLower.split(/\s+/);
    queryWords.forEach((word) => {
      if (titleLower.includes(word)) {
        score += 5;
      }
    });

    // Совпадение в описании
    if (descLower.includes(queryLower)) {
      score += 3;
    }

    return score;
  }
}

