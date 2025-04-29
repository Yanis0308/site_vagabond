import { type ReactNode } from "react";

import { CardWithEmoji } from "./CardWithEmoji";

interface WhatIsVagabondProps {
  texts: {
    title: string;
    description1: string;
    description2: string;
    description3: string;
    goal: string;
  };
  compass: string;
}

export default function WhatIsVagabond({
  texts,
  compass,
}: WhatIsVagabondProps): ReactNode {
  return (
    <CardWithEmoji emoji={compass}>
      <h2 className="ml-12 pt-2 text-3xl font-bold text-primary">
        {texts.title}
      </h2>
      <div className="mt-6 space-y-4 text-base text-gray-700">
        <p>{texts.description1}</p>
        <p>{texts.description2}</p>
        <p>{texts.description3}</p>
        <p className="font-bold text-primary">{texts.goal}</p>
      </div>
    </CardWithEmoji>
  );
}
