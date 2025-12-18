export enum AddressTypes {
  LEGAL = 'legal',
  ACTUAL = 'actual',
  POST = 'post',
  OTHER = 'other',
}

export enum PhoneTypes {
  COMMON = 'common',
  FAX = 'fax',
  OTHER = 'other',
}

export enum CountryCode {
  RUS = 'RUS',
}

export type MarketplaceAddressType = {
  type: AddressTypes;
  zip: string;
  country: string;
  city: string;
  street: string;
  description?: string;
};

export interface Phone {
  type: PhoneTypes;
  phone: string;
  description?: string;
}

export interface Founders {
  individuals: IndividualFounder[];
}

export interface IndividualFounder {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  citizenship: string;
  docType: string;
  docNumber: string;
  issueDate: string;
  issuedBy: string;
  address: string;
}

export interface CEO {
  firstName: string;
  lastName: string;
  middleName: string;
  birthDate: string;
  birthPlace: string;
  phone: string;
  country: CountryCode;
  docType: string;
  docNumber: string;
  issueDate: string;
  issuedBy: string;
  address: string;
}

export interface License {
  type: string;
  number: string;
  issueDate: string;
  issuedBy: string;
  expiryDate: string;
  description: string;
}
