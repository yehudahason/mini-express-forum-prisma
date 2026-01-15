-- CreateTable
CREATE TABLE "Users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "forums" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "description" TEXT,

    CONSTRAINT "forums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threads" (
    "id" SERIAL NOT NULL,
    "forum_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replies" (
    "id" SERIAL NOT NULL,
    "thread_id" INTEGER NOT NULL,
    "author" TEXT,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Users_username_key" ON "Users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "forums_slug_key" ON "forums"("slug");

-- CreateIndex
CREATE INDEX "threads_forum_id_idx" ON "threads"("forum_id");

-- CreateIndex
CREATE INDEX "threads_created_at_idx" ON "threads"("created_at");

-- CreateIndex
CREATE INDEX "replies_thread_id_idx" ON "replies"("thread_id");

-- CreateIndex
CREATE INDEX "replies_created_at_idx" ON "replies"("created_at");

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_forum_id_fkey" FOREIGN KEY ("forum_id") REFERENCES "forums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replies" ADD CONSTRAINT "replies_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
