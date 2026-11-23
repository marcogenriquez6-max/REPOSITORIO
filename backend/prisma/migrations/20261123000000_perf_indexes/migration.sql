--Indexes for listing, review, stats and hierarchical filters

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

-- User search by full name
CREATE INDEX "users_full_name_idx" ON "users" USING GIN ("full_name" gin_trgm_ops);

-- Community discovery and hierarchy traversal
CREATE INDEX "communities_parent_id_sort_order_idx" ON "communities"("parent_id", "sort_order");
CREATE INDEX "communities_is_active_sort_order_name_idx" ON "communities"("is_active", "sort_order", "name");

-- Collection discovery and nested listing
CREATE INDEX "collections_community_id_sort_order_idx" ON "collections"("community_id", "sort_order");
CREATE INDEX "collections_is_active_sort_order_name_idx" ON "collections"("is_active", "sort_order", "name");

-- Item listings, inbox filters and popularity stats
CREATE INDEX "items_status_created_at_idx" ON "items"("status", "created_at" DESC);
CREATE INDEX "items_status_submitted_at_idx" ON "items"("status", "submitted_at" DESC);
CREATE INDEX "items_status_view_count_idx" ON "items"("status", "view_count" DESC);
CREATE INDEX "items_assigned_reviewer_id_status_idx" ON "items"("assigned_reviewer_id", "status");

-- Primary bitstream ordering and download ranking
CREATE INDEX "bitstreams_item_id_is_primary_created_at_idx" ON "bitstreams"("item_id", "is_primary", "created_at");
CREATE INDEX "bitstreams_download_count_idx" ON "bitstreams"("download_count" DESC);

-- Pending observation indicators
CREATE INDEX "observations_status_idx" ON "observations"("status");
