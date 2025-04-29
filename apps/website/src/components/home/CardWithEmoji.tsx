export const CardWithEmoji = ({
  emoji,
  children,
}: {
  emoji: string;
  children: React.ReactNode;
}): React.ReactNode => {
  return (
    <div className="relative mb-12 rounded-lg bg-white p-8 text-left">
      <div className="absolute -left-8 -top-8 flex size-20 items-center justify-center rounded-full border-4 border-white bg-gray-200 shadow-lg">
        <span className="text-4xl">{emoji}</span>
      </div>
      {children}
    </div>
  );
};
