-- CreateEnum
CREATE TYPE "ObservationType" AS ENUM ('OBSERVACION', 'DEVOLUCION', 'RECHAZO');

-- CreateEnum
CREATE TYPE "ObservationStatus" AS ENUM ('PENDIENTE', 'RESUELTA');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "WorkflowAction" ADD VALUE 'REVISION_INICIADA';
ALTER TYPE "WorkflowAction" ADD VALUE 'RECHAZADO';

-- AlterTable
ALTER TABLE "items" ADD COLUMN     "assigned_reviewer_id" UUID,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "review_checks" (
    "id" BIGSERIAL NOT NULL,
    "item_id" UUID NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "notes" TEXT,
    "checked_by_id" UUID NOT NULL,
    "checked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "observations" (
    "id" BIGSERIAL NOT NULL,
    "item_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "type" "ObservationType" NOT NULL DEFAULT 'OBSERVACION',
    "description" TEXT NOT NULL,
    "status" "ObservationStatus" NOT NULL DEFAULT 'PENDIENTE',
    "response" TEXT,
    "resolved_by_id" UUID,
    "resolved_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "observations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_checks_item_id_idx" ON "review_checks"("item_id");

-- CreateIndex
CREATE UNIQUE INDEX "review_checks_item_id_key_key" ON "review_checks"("item_id", "key");

-- CreateIndex
CREATE INDEX "observations_item_id_status_idx" ON "observations"("item_id", "status");

-- CreateIndex
CREATE INDEX "observations_item_id_created_at_idx" ON "observations"("item_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_assigned_reviewer_id_fkey" FOREIGN KEY ("assigned_reviewer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_checks" ADD CONSTRAINT "review_checks_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_checks" ADD CONSTRAINT "review_checks_checked_by_id_fkey" FOREIGN KEY ("checked_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "observations" ADD CONSTRAINT "observations_resolved_by_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

