export const CardWithEmoji = ({
  emoji,
  children,
}: {
  emoji: string;
  children: React.ReactNode;
}): React.ReactNode => {
  return (
    <div className="relative mb-8 rounded-lg bg-white p-4 text-left md:mb-12 md:p-8">
      <div className="absolute -left-4 -top-4 flex size-14 items-center justify-center rounded-full border-4 border-white bg-gray-200 shadow-lg md:-left-8 md:-top-8 md:size-20">
        <span className="text-2xl md:text-4xl">{emoji}</span>
      </div>
      {children}
    </div>
  );
};
