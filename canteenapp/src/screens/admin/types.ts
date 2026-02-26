export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  image?: string;
  description?: string;
}

export type OrderStatus = 'Pending' | 'Preparing' | 'Ready' | 'Completed';

export interface OrderItemRow {
  name: string;
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  items: OrderItemRow[];
  totalPrice: number;
  status: OrderStatus;
  timestamp: string;
  tokenNumber?: number;
}
