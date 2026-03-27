import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { ContactsModule } from './users/contacts/contacts.module';
import { ContributorsModule } from './users/contributors/contributors.module';
import { RolesModule } from './users/roles/roles.module';

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        BrandsModule,
        ContactsModule,
        ContributorsModule,
        RolesModule,
    ],
    exports: [
        PrismaModule,
        AuthModule,
        BrandsModule,
        ContactsModule,
        ContributorsModule,
        RolesModule,
    ],
})
export class PlatformModule {}
