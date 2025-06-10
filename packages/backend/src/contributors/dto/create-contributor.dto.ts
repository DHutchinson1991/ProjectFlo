// packages/backend/src/contributors/dto/create-contributor.dto.ts
export class CreateContributorDto {
  email: string;
  password_hash: string; // The service will handle hashing
  first_name: string;
  last_name: string;
  role_id: number;
}
