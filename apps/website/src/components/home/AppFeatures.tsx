import { CardWithEmoji } from "./CardWithEmoji";

interface AppFeaturesProps {
  texts: {
    title: string;
    feature1: string;
    feature2: string;
    feature3: string;
    feature4: string;
    footer: string;
  };
  star: string;
  arrow: string;
  lock: string;
}

export default function AppFeatures({
  texts,
  star,
  arrow,
  lock,
}: AppFeaturesProps) {
  return (
    <CardWithEmoji emoji={star}>
      <h2 className="ml-12 pt-2 text-3xl font-bold text-primary">
        {texts.title}
      </h2>
      <ul className="mt-6 space-y-4">
        <li className="flex items-start">
          <div className="mr-4 flex size-6 items-center justify-center rounded-sm shadow-sm">
            <span className="text-white">{arrow}</span>
          </div>
          <span className="text-base">{texts.feature1}</span>
        </li>
        <li className="flex items-start">
          <div className="mr-4 flex size-6 items-center justify-center rounded-sm shadow-sm">
            <span className="text-white">{arrow}</span>
          </div>
          <span className="text-base">{texts.feature2}</span>
        </li>
        <li className="flex items-start">
          <div className="mr-4 flex size-6 items-center justify-center rounded-sm shadow-sm">
            <span className="text-white">{arrow}</span>
          </div>
          <span className="text-base">{texts.feature3}</span>
        </li>
        <li className="flex items-start">
          <div className="mr-4 flex size-6 items-center justify-center rounded-sm shadow-sm">
            <span className="text-white">{arrow}</span>
          </div>
          <span className="text-base">{texts.feature4}</span>
        </li>
      </ul>
      <p className="mt-6 text-center">
        <span className="mr-2 inline-block size-6 rounded-full p-1 text-xs leading-none text-white">
          {lock}
        </span>
        <span>{texts.footer}</span>
      </p>
    </CardWithEmoji>
  );
}
