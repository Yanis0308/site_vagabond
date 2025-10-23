import { memo } from "react";

import { getOsmUrl } from "@/utils/openstreetmap";
import { type PoiType } from "@/utils/types";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";

export const AdminInfoSection = memo(
  ({
    placeId,
    placeData,
  }: {
    placeId: string;
    placeData: PoiType["data"][0];
  }) => {
    return (
      <Box className="mx-3 mt-6 flex gap-2 border border-dashed border-primary-500 px-3">
        <CustomText type="title" className="text-center text-primary-700">
          {"- Admin section -"}
        </CustomText>

        <Box className="flex-row flex-wrap gap-2">
          <Button
            size="small"
            action="secondary"
            href={getOsmUrl(placeId)}
            isDisabled={getOsmUrl(placeId) === null}
          >
            <ButtonText>{"OSM"}</ButtonText>
          </Button>
          <Button
            size="small"
            action="secondary"
            href={`https://www.google.com/maps/search/?api=1&query=${placeData.name}`}
          >
            <ButtonText>{"Maps"}</ButtonText>
          </Button>
          <Button
            size="small"
            action="secondary"
            //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
            href={`https://www.wikidata.org/wiki/${placeData.rawInfo?.wikidata}`}
            //eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe for testing
            isDisabled={placeData.rawInfo?.wikidata === undefined}
          >
            <ButtonText>{"Wikidata"}</ButtonText>
          </Button>
        </Box>

        <CustomText type="title" className="text-center text-primary-700">
          {"- OSM tags -"}
        </CustomText>
        <Box className="flex">
          <CustomText>
            {`ID: ${placeId}\n`}
            {`Filter level: ${placeData.filterLevel}`}
          </CustomText>
          {
            //eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- safe for testing
            Object.entries(placeData.rawInfo).map(([key, value]) => (
              <CustomText key={key}>
                {/* @ts-expect-error safe for testing */}
                {key}: {value}
              </CustomText>
            ))
          }
        </Box>
      </Box>
    );
  },
);

AdminInfoSection.displayName = "AdminInfoSection";
