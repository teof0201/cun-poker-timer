-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buyIn" REAL NOT NULL DEFAULT 0,
    "rebuyAmount" REAL NOT NULL DEFAULT 0,
    "startingStack" INTEGER NOT NULL DEFAULT 10000,
    "levels" TEXT NOT NULL,
    "prizeTiers" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "ownerAnonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tournament_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Tournament_ownerUserId_idx" ON "Tournament"("ownerUserId");

-- CreateIndex
CREATE INDEX "Tournament_ownerAnonId_idx" ON "Tournament"("ownerAnonId");
