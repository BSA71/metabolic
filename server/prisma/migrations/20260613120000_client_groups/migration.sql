-- CreateTable
CREATE TABLE "ClientGroup" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientGroup_coachId_idx" ON "ClientGroup"("coachId");

-- CreateIndex
CREATE INDEX "ClientGroupMember_userId_idx" ON "ClientGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ClientGroupMember_groupId_userId_key" ON "ClientGroupMember"("groupId", "userId");

-- AddForeignKey
ALTER TABLE "ClientGroup" ADD CONSTRAINT "ClientGroup_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientGroupMember" ADD CONSTRAINT "ClientGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ClientGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientGroupMember" ADD CONSTRAINT "ClientGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
