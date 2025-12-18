export enum Locale {
  RU = 'ru',
  TYV = 'tyv',
}

export interface ILocalizable {
  locale: Locale;
}

export interface ILocalizedContent {
  locale: Locale;
  title?: string;
  description?: string;
  content?: string;
  [key: string]: any;
}

