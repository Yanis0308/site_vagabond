import { memo } from "react";

import { getOsmUrl } from "@/utils/openstreetmap";

import { CustomText } from "../custom-ui/CustomText";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";

export const AdminInfoSection = memo(
  ({ placeId, placeName }: { placeId: string; placeName: string }) => {
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
            href={`https://www.google.com/maps/search/?api=1&query=${placeName}`}
          >
            <ButtonText>{"Maps"}</ButtonText>
          </Button>
        </Box>

        <CustomText type="title" className="text-center text-primary-700">
          {"- POI Info -"}
        </CustomText>
        <Box className="flex">
          <CustomText>
            {`ID: ${placeId}\n`}
            {`Name: ${placeName}`}
          </CustomText>
        </Box>
      </Box>
    );
  },
);

AdminInfoSection.displayName = "AdminInfoSection";
