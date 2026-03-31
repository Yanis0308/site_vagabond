CREATE INDEX "idx_poi_boundaries_poi_id" ON "poi_boundaries" USING btree ("poi_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_poi_data_poi_id" ON "poi_data" USING btree ("poi_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_processing_results_target_id" ON "processing_results" USING btree ("target_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_processing_results_updated_at" ON "processing_results" USING btree ("updated_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_visited_pois_poi_id" ON "visited_pois" USING btree ("poi_id" text_ops);
