enum EOrderStatus {
  NEW = 'NEW',
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  CANCELED = 'cancelled',
}

interface OrderInformation {
  Success: boolean;

  ErrorCode: string;

  Message: string;

  TerminalKey: string;

  OrderId: string;

  Payments: Payment[];
}

interface Payment {
  Success: boolean;

  Amount: number;

  Status: string;

  PaymentId: string;

  RRN: string;
}

export { EOrderStatus, OrderInformation };
