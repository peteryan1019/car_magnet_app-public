// ---- Row types (inferred from db/schema.ts) ----

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  date_created: Date;
}

export interface VerificationTokenRow {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  code: string;
  expiresAt: Date;
}

export interface DesignRow {
  id: number;
  userId: number;
  imageUrl: string;
  dateCreated: Date;
  two_doors: boolean;
  purchased: boolean;
}

export interface OrderRow {
  id: number;
  stripe_payment_id: string;
  email: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at: Date;
}

// ---- Repository interfaces ----

export interface IUserRepo {
  findByUsernameOrEmail(username: string, email: string): Promise<UserRow | null>;
  findByUsername(username: string): Promise<UserRow | null>;
  findEmailById(userId: number): Promise<string | null>;
  insertReturning(data: {
    username: string;
    email: string;
    password_hash: string;
  }): Promise<{ id: number; username: string }>;
  count(): Promise<number>;
}

export interface IVerificationTokenRepo {
  upsertByEmail(data: {
    email: string;
    username: string;
    password_hash: string;
    code: string;
    expiresAt: Date;
  }): Promise<void>;
  findByEmail(email: string): Promise<VerificationTokenRow | null>;
  deleteByEmail(email: string): Promise<void>;
}

export interface IDesignRepo {
  insertBatch(
    designs: Array<{ userId: number; imageUrl: string; two_doors: boolean }>
  ): Promise<void>;
  findByUserId(userId: number): Promise<DesignRow[]>;
  deleteByIdAndUserId(designId: number, userId: number): Promise<void>;
  findPurchasedById(designId: number): Promise<{ purchased: boolean } | null>;
  markPurchased(designId: number): Promise<void>;
}

export interface IOrderRepo {
  upsert(order: {
    stripe_payment_id: string;
    email?: string;
    amount: number;
    currency: string;
    status: string;
  }): Promise<OrderRow[]>;
  findAll(): Promise<OrderRow[]>;
  findByStripePaymentId(stripePaymentId: string): Promise<OrderRow | null>;
}

export interface IPreferencesRepo {
  upsertByUserId(userId: number, data: Record<string, unknown>): Promise<void>;
}
