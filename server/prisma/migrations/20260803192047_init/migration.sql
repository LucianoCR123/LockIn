-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Group" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "minDailySteps" INTEGER NOT NULL DEFAULT 10000,
    "minWeeklyWorkouts" INTEGER NOT NULL DEFAULT 5,
    "shitMealsPerWeek" INTEGER NOT NULL DEFAULT 1,
    "shitDaysPerMonth" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedRulesAt" DATETIME,
    CONSTRAINT "GroupMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "steps" INTEGER NOT NULL DEFAULT 0,
    "workoutDone" BOOLEAN NOT NULL DEFAULT false,
    "dietOk" BOOLEAN NOT NULL DEFAULT false,
    "usedShitMeal" BOOLEAN NOT NULL DEFAULT false,
    "usedShitDay" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cheer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cheer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cheer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cheer_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Group_inviteCode_key" ON "Group"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_userId_groupId_key" ON "GroupMembership"("userId", "groupId");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_userId_date_key" ON "DailyLog"("userId", "date");
