import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { ContactsModule } from './users/contacts/contacts.module';
import { UserAccountsModule } from './users/user-accounts/user-accounts.module';
import { RolesModule } from './users/roles/roles.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        BrandsModule,
        ContactsModule,
        UserAccountsModule,
        RolesModule,
    ],
    exports: [
        PrismaModule,
        AuthModule,
        BrandsModule,
        ContactsModule,
        UserAccountsModule,
        RolesModule,
    ],
})
export class PlatformModule {}
