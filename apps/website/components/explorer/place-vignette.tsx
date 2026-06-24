import Image from "next/image";
import { type ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  imageUrl: string;
}

export function PlaceVignette({ title, subtitle, imageUrl }: Props): ReactNode {
  return (
    <div className="relative aspect-4/3 overflow-hidden rounded-2xl">
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover"
      />
      <div
        className="
          absolute inset-0 bg-linear-to-t from-black/75 via-black/25
          to-transparent
        "
      />
      <div className="absolute inset-x-0 bottom-0 p-4">
        <h3 className="font-display text-lg font-bold text-white">{title}</h3>
        <p className="mt-1 text-sm font-medium text-white/85">{subtitle}</p>
      </div>
    </div>
  );
}
