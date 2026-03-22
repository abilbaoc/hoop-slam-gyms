import Badge from "../ui/Badge";

type MatchFormat = "1v1" | "2v2" | "3v3";

interface FormatBadgeProps {
  format: MatchFormat;
}

const formatVariant: Record<MatchFormat, "green" | "blue" | "yellow"> = {
  "1v1": "green",
  "2v2": "blue",
  "3v3": "yellow",
};

export default function FormatBadge({ format }: FormatBadgeProps) {
  return <Badge variant={formatVariant[format]}>{format}</Badge>;
}
