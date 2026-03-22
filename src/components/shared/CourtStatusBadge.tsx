import Badge from "../ui/Badge";

type CourtStatus = "online" | "offline" | "maintenance";

interface CourtStatusBadgeProps {
  status: CourtStatus;
}

const statusConfig: Record<CourtStatus, { variant: "green" | "red" | "yellow"; label: string }> = {
  online: { variant: "green", label: "Activa" },
  offline: { variant: "red", label: "Inactiva" },
  maintenance: { variant: "yellow", label: "Mantenimiento" },
};

export default function CourtStatusBadge({ status }: CourtStatusBadgeProps) {
  const { variant, label } = statusConfig[status];
  return <Badge variant={variant}>{label}</Badge>;
}
