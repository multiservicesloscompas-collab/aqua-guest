export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}

export type CustomerDraft = Omit<Customer, 'id'>;

export type CustomerUpdate = Partial<CustomerDraft>;
