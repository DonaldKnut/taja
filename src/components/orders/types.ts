export interface DashboardOrder {
  id: string;
  orderNumber: string;
  status:
    | "pending"
    | "confirmed"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "escrowed";
  total: number;
  date: string;
  estimatedDelivery?: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    image: string;
    seller: {
      name: string;
      shop: string;
    };
  }>;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
}
