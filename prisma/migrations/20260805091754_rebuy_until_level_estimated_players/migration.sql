-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "buyIn" REAL NOT NULL DEFAULT 0,
    "freeroll" BOOLEAN NOT NULL DEFAULT false,
    "startingStack" INTEGER NOT NULL DEFAULT 10000,
    "levels" TEXT NOT NULL,
    "prizeTiers" TEXT NOT NULL,
    "session" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "ownerAnonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "allowRebuys" BOOLEAN NOT NULL DEFAULT true,
    "maxRebuys" INTEGER NOT NULL DEFAULT 0,
    "rebuyChips" INTEGER NOT NULL DEFAULT 10000,
    "rebuyAmount" REAL NOT NULL DEFAULT 0,
    "rebuyUntilLevel" INTEGER NOT NULL DEFAULT 0,
    "trackPlayers" BOOLEAN NOT NULL DEFAULT true,
    "bountyAmount" REAL NOT NULL DEFAULT 0,
    "estimatedPlayers" INTEGER NOT NULL DEFAULT 9,
    CONSTRAINT "Tournament_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("allowRebuys", "bountyAmount", "buyIn", "createdAt", "freeroll", "id", "levels", "maxRebuys", "name", "ownerAnonId", "ownerUserId", "prizeTiers", "rebuyAmount", "rebuyChips", "session", "startingStack", "trackPlayers", "updatedAt") SELECT "allowRebuys", "bountyAmount", "buyIn", "createdAt", "freeroll", "id", "levels", "maxRebuys", "name", "ownerAnonId", "ownerUserId", "prizeTiers", "rebuyAmount", "rebuyChips", "session", "startingStack", "trackPlayers", "updatedAt" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_ownerUserId_idx" ON "Tournament"("ownerUserId");
CREATE INDEX "Tournament_ownerAnonId_idx" ON "Tournament"("ownerAnonId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
