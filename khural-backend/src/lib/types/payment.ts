enum PaymentProvider {
  TBANK = 't-bank',
}

class Shop {
  ShopCode: string;
  Amount: string;
  Name: string;
  Fee: string;
}

class Item {
  Name: string;
  Price: number;
  Quantity: number;
  Amount: number;
  Tax: string;
  Ean13: string;
}

class Receipt {
  Email: string;
  Phone: string;
  Taxation: string;
  Items: Array<Item>;
}

class MarketplaceReceipt extends Receipt {}

export { PaymentProvider, Shop, Receipt, MarketplaceReceipt };
