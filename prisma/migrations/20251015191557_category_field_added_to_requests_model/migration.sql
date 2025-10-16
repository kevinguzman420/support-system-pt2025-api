-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_requests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "category" TEXT NOT NULL DEFAULT 'TECHNICAL_SUPPORT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_requests" ("createdAt", "description", "id", "priority", "status", "title", "updatedAt", "userId") SELECT "createdAt", "description", "id", "priority", "status", "title", "updatedAt", "userId" FROM "requests";
DROP TABLE "requests";
ALTER TABLE "new_requests" RENAME TO "requests";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
