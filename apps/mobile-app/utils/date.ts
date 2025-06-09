import "dayjs/locale/fr";
import "dayjs/locale/en";

import dayjs from "dayjs";

export const getPlainTextDate = ({
  locale,
  date,
}: {
  locale: string;
  date?: Date;
}): string => {
  return dayjs(date).locale(locale).format("DD MMM YYYY");
};
