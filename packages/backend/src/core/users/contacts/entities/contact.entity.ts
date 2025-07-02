import { contacts_type } from '@prisma/client';

export class Contact {
  id: number;
  first_name?: string | null;
  last_name?: string | null;
  email: string;
  phone_number?: string | null;
  company_name?: string | null;
  type: contacts_type;
}
