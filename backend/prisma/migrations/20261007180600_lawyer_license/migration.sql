-- AlterTable
ALTER TABLE "User" ADD COLUMN "licenseId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_licenseId_key" ON "User"("licenseId");

