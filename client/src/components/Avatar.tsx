interface AvatarProps {
  name: string;
  className?: string;
}

export default function Avatar({ name, className }: AvatarProps) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-brand text-white font-semibold shrink-0 ${
        className ?? "w-10 h-10 text-sm"
      }`}
    >
      {initials}
    </div>
  );
}
