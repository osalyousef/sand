import HealthDemographics from "@/app/components/data/HealthDemographics";
import SystemKPIs from "@/app/components/data/SystemKPIs";
import ResourceOccupancy from "@/app/components/data/ResourceOccupancy";

export default function DataTab() {
  return (
    <div className="flex gap-3 h-full">
      <div className="w-64 flex flex-col">
        <HealthDemographics />
      </div>
      <SystemKPIs />
      <ResourceOccupancy />
    </div>
  );
}
