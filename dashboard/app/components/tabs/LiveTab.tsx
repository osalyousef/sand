import MapPanel from "@/app/components/live/MapPanel";
import AlertsFeed from "@/app/components/live/AlertsFeed";
import TeamsPanel from "@/app/components/live/TeamsPanel";

export default function LiveTab() {
  return (
    <div className="flex gap-3 h-full">
      <AlertsFeed />
      <MapPanel />
      <TeamsPanel />
    </div>
  );
}
