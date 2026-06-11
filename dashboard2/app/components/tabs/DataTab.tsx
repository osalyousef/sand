import HealthDemographics from "@/app/components/data/HealthDemographics";
import SystemKPIs from "@/app/components/data/SystemKPIs";
import ResourceOccupancy from "@/app/components/data/ResourceOccupancy";
import ShiftPanel from "@/app/components/data/ShiftPanel";

export default function DataTab() {
  return (
    <div className="flex gap-3 h-full overflow-x-auto">
      <div className="w-64 flex flex-col shrink-0">
        <HealthDemographics />
      </div>
      <SystemKPIs />
      <div className="shrink-0 flex">
        <ResourceOccupancy />
      </div>
      <div className="shrink-0 flex">
        <ShiftPanel />
      </div>
    </div>
  );
}
