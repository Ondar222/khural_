import { ApiProperty } from '@nestjs/swagger';

// ----- pagination -------
interface PaginationMeta {
  offset: number;
  limit: number;
  total: number;
  page: number;
  pages: number;
  isHidden?: boolean;
}

interface ApiMetadata {
  pagination?: PaginationMeta;
}

// ----- pagination -------

// ------- queries --------
type Sort<T> = {
  [k in keyof T]: string;
};

type Filter<T> = {
  [k in keyof T]: any;
};

type PaginationQuery = {
  offset: number;
  limit: number;
  page: number;
  isHidden?: boolean;
};

interface ApiQueries<T> {
  sort: Sort<T>;
  pagination: PaginationQuery;
  filter: Filter<T>;
  id: string | number;
}

class ApiResponses<T> {
  @ApiProperty({ required: true })
  data: T;
  @ApiProperty({ required: false })
  meta?: ApiMetadata;
}

export type { ApiMetadata, PaginationMeta, ApiQueries };
export { ApiResponses };
