import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Ruler,
  Weight,
  Gauge,
  Hand,
  Calendar,
  GraduationCap,
} from "lucide-react";

export function ParticipantCard({ participant }) {
  if (!participant) return null;

  return (
    <Card className="overflow-hidden border border-border shadow-sm rounded-xl">
      {/* Header */}
      <div className="relative bg-blue-600 px-6 py-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-blue-400 flex items-center justify-center text-2xl font-bold">
              {participant.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{participant.name}</h2>
              <div className="flex items-center gap-3 mt-1.5 text-blue-100 text-sm">
                <span className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Class {participant.grade ?? "—"}
                </span>
                <span className="opacity-30">|</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {participant.age ?? "—"} tahun
                </span>
                <span className="opacity-30">|</span>
                <span className="capitalize">{participant.gender ?? "—"}</span>
              </div>
            </div>
          </div>
          <Badge className="bg-blue-400 text-white border border-border shadow-sm font-mono hover:bg-blue-400">
            {participant.uid}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Biometric info grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          <BioItem
            icon={<Ruler className="h-4 w-4" />}
            label="Class"
            value={participant.grade != null ? `${participant.grade}` : "—"}
          />
          <BioItem
            icon={<Ruler className="h-4 w-4" />}
            label="Umur"
            value={participant.age != null ? `${participant.age} tahun` : "—"}
          />
          {/* <BioItem
            icon={<Ruler className="h-4 w-4" />}
            label="Tinggi"
            value={participant.height != null ? `${participant.height} cm` : "—"}
          /> */}
          {/* <BioItem
            icon={<Weight className="h-4 w-4" />}
            label="Berat"
            value={participant.weight != null ? `${participant.weight} kg` : "—"}
          /> */}
          {/* <BioItem
            icon={<Gauge className="h-4 w-4" />}
            label="Dexterity"
            value={
              participant.dexterity != null
                ? `${participant.dexterity}`
                : "—"
            }
          /> */}
          {/* <BioItem
            icon={<Hand className="h-4 w-4" />}
            label="Grip Strength"
            value={
              participant.grip_strength != null
                ? `${participant.grip_strength} kg`
                : "—"
            }
          /> */}
          <BioItem
            icon={<User className="h-4 w-4" />}
            label="Gender"
            value={<span className="capitalize">{participant.gender ?? "—"}</span>}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BioItem({ icon, label, value, accent }) {
  const accentMap = {
    red: "border border-border bg-red-50",
    blue: "border border-border bg-blue-50",
  };

  return (
    <div
      className={`flex flex-col items-center gap-1.5 rounded-xl border border-border shadow-sm p-3 ${
        accent ? accentMap[accent] : "bg-[#f3f4f6]"
      }`}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}
