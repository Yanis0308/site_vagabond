"use client";

import { type ReactElement, useEffect, useState } from "react";

import { selectAllPoisByTags } from "@/query/select";
import { logger } from "@/utils/utils";

export default function QueryTestPage(): ReactElement {
  const [data, setData] = useState<unknown>(null);

  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      // console.log("Fetching data...");
      const pois = await selectAllPoisByTags();
      setData(pois);
      // console.log(pois);
    };

    void fetchData();
  }, []);

  useEffect(() => {
    logger.info(data);
  }, [data]);

  return (
    <div>
      <button onClick={() => void selectAllPoisByTags()}>Fetch Data</button>
    </div>
  );
}
