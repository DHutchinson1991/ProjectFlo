import { contributors_type } from '@prisma/client';
import { Contact } from '../../contacts/entities/contact.entity'; // Adjust path as needed
import { Role } from '../../roles/entities/role.entity'; // Adjust path as needed

export class Contributor {
  id: number;
  contact_id: number;
  role_id: number;
  contributor_type?: contributors_type | null;
  // password_hash is sensitive and typically not included in entity returned to client

  // Optional related entities, populated when service includes them
  contact?: Contact; 
  role?: Role;

  // You can add a constructor or methods if needed, for example:
  // constructor(partial: Partial<Contributor>) {
  //   Object.assign(this, partial);
  // }
}
