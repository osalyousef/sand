import MapPanel from "@/app/components/live/MapPanel";
import AlertsFeed from "@/app/components/live/AlertsFeed";
import TeamsPanel from "@/app/components/live/TeamsPanel";
import EnvStrip from "@/app/components/live/EnvStrip";

export default function LiveTab() {
  return (
    <div className="flex flex-col h-full">
      <EnvStrip />
      <div className="flex gap-3 flex-1 min-h-0">
        <AlertsFeed />
        <MapPanel />
        <TeamsPanel />
      </div>
    </div>
  );
}
