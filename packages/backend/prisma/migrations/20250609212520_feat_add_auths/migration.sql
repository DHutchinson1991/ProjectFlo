/*
  Warnings:

  - You are about to drop the `Contributor` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "contacts_type" AS ENUM ('Client_Lead', 'Client', 'Contributor', 'Vendor');

-- CreateEnum
CREATE TYPE "contributors_type" AS ENUM ('Internal', 'External', 'Freelance');

-- DropTable
DROP TABLE "Contributor";

-- CreateTable
CREATE TABLE "contacts" (
    "id" SERIAL NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "company_name" TEXT,
    "type" "contacts_type" NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contributors" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,
    "contributor_type" "contributors_type",

    CONSTRAINT "contributors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "contact_id" INTEGER NOT NULL,
    "inquiry_id" INTEGER,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_users" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "last_login_date" TIMESTAMP(3),

    CONSTRAINT "client_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "action_name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_permissionsToroles" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_permissionsToroles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "contacts_email_key" ON "contacts"("email");

-- CreateIndex
CREATE UNIQUE INDEX "contributors_contact_id_key" ON "contributors"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_contact_id_key" ON "clients"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_client_id_key" ON "client_users"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "client_users_email_key" ON "client_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_action_name_key" ON "permissions"("action_name");

-- CreateIndex
CREATE INDEX "_permissionsToroles_B_index" ON "_permissionsToroles"("B");

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contributors" ADD CONSTRAINT "contributors_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_users" ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsToroles" ADD CONSTRAINT "_permissionsToroles_A_fkey" FOREIGN KEY ("A") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_permissionsToroles" ADD CONSTRAINT "_permissionsToroles_B_fkey" FOREIGN KEY ("B") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
