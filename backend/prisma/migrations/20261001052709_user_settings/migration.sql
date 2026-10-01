-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "idCard" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" DATETIME,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "avatarUrl" TEXT,
    "bio" TEXT,
    "about" TEXT,
    "showContact" BOOLEAN NOT NULL DEFAULT false,
    "notifyPosts" BOOLEAN NOT NULL DEFAULT true,
    "notifyChat" BOOLEAN NOT NULL DEFAULT true,
    "notifyCases" BOOLEAN NOT NULL DEFAULT true,
    "postAnonymously" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("about", "avatarUrl", "bio", "createdAt", "dateOfBirth", "email", "firstName", "id", "idCard", "lastName", "password", "phone", "role", "showContact", "updatedAt") SELECT "about", "avatarUrl", "bio", "createdAt", "dateOfBirth", "email", "firstName", "id", "idCard", "lastName", "password", "phone", "role", "showContact", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_idCard_key" ON "User"("idCard");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
