-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'REVISOR', 'DEPOSITANTE');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('BORRADOR', 'EN_REVISION', 'OBSERVADO', 'PUBLICADO', 'EMBARGADO');

-- CreateEnum
CREATE TYPE "BitstreamBundle" AS ENUM ('ORIGINAL', 'THUMBNAIL', 'LICENCIA');

-- CreateEnum
CREATE TYPE "WorkflowAction" AS ENUM ('ENVIADO', 'APROBADO', 'OBSERVADO', 'DEVUELTO', 'PUBLICADO', 'EMBARGADO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" CITEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "last_login_at" TIMESTAMPTZ(6),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_faculties" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "community_id" UUID NOT NULL,
    "assigned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_faculties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collections" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "short_description" TEXT,
    "license_text" TEXT,
    "workflow_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "community_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "status" "ItemStatus" NOT NULL DEFAULT 'BORRADOR',
    "embargo_date" DATE,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "handle_uri" TEXT,
    "submitted_at" TIMESTAMPTZ(6),
    "published_at" TIMESTAMPTZ(6),
    "collection_id" UUID NOT NULL,
    "creator_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metadata_values" (
    "id" BIGSERIAL NOT NULL,
    "schema" VARCHAR(32) NOT NULL DEFAULT 'dc',
    "element" VARCHAR(64) NOT NULL,
    "qualifier" VARCHAR(64),
    "value" TEXT NOT NULL,
    "lang" VARCHAR(16) DEFAULT 'es',
    "place" INTEGER NOT NULL DEFAULT 0,
    "item_id" UUID NOT NULL,

    CONSTRAINT "metadata_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitstreams" (
    "id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_name" TEXT NOT NULL,
    "mime_type" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL,
    "sha256_hash" CHAR(64) NOT NULL,
    "bundle" "BitstreamBundle" NOT NULL,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "item_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitstreams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_logs" (
    "id" BIGSERIAL NOT NULL,
    "action" "WorkflowAction" NOT NULL,
    "comment" TEXT,
    "from_status" "ItemStatus",
    "to_status" "ItemStatus",
    "item_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "user_faculties_community_id_idx" ON "user_faculties"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_faculties_user_id_community_id_key" ON "user_faculties"("user_id", "community_id");

-- CreateIndex
CREATE INDEX "communities_parent_id_idx" ON "communities"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "communities_parent_id_slug_key" ON "communities"("parent_id", "slug");

-- CreateIndex
CREATE INDEX "collections_community_id_idx" ON "collections"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "collections_community_id_slug_key" ON "collections"("community_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "items_handle_uri_key" ON "items"("handle_uri");

-- CreateIndex
CREATE INDEX "items_collection_id_status_idx" ON "items"("collection_id", "status");

-- CreateIndex
CREATE INDEX "items_creator_id_idx" ON "items"("creator_id");

-- CreateIndex
CREATE INDEX "items_status_published_at_idx" ON "items"("status", "published_at" DESC);

-- CreateIndex
CREATE INDEX "items_embargo_date_idx" ON "items"("embargo_date");

-- CreateIndex
CREATE INDEX "metadata_values_item_id_idx" ON "metadata_values"("item_id");

-- CreateIndex
CREATE INDEX "metadata_values_item_id_element_qualifier_place_idx" ON "metadata_values"("item_id", "element", "qualifier", "place");

-- CreateIndex
CREATE INDEX "metadata_values_schema_element_qualifier_idx" ON "metadata_values"("schema", "element", "qualifier");

-- CreateIndex
CREATE INDEX "metadata_values_element_qualifier_idx" ON "metadata_values"("element", "qualifier");

-- CreateIndex
CREATE INDEX "bitstreams_item_id_idx" ON "bitstreams"("item_id");

-- CreateIndex
CREATE INDEX "bitstreams_item_id_bundle_idx" ON "bitstreams"("item_id", "bundle");

-- CreateIndex
CREATE INDEX "bitstreams_sha256_hash_idx" ON "bitstreams"("sha256_hash");

-- CreateIndex
CREATE INDEX "workflow_logs_item_id_created_at_idx" ON "workflow_logs"("item_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "workflow_logs_actor_id_idx" ON "workflow_logs"("actor_id");

-- CreateIndex
CREATE INDEX "workflow_logs_action_idx" ON "workflow_logs"("action");

-- AddForeignKey
ALTER TABLE "user_faculties" ADD CONSTRAINT "user_faculties_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_faculties" ADD CONSTRAINT "user_faculties_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collections" ADD CONSTRAINT "collections_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metadata_values" ADD CONSTRAINT "metadata_values_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitstreams" ADD CONSTRAINT "bitstreams_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_logs" ADD CONSTRAINT "workflow_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

