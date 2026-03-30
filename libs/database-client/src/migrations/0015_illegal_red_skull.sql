CREATE INDEX "idx_poi_boundaries_boundary_id" ON "poi_boundaries" USING btree ("boundary_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_poi_data_poi_id_lang_id" ON "poi_data" USING btree ("poi_id" text_ops,"language" enum_ops DESC,"id");
