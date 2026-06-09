import { Headset } from "lucide-react";

export default function EmptySession() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 rounded-xl border border-gray-800 border-dashed text-center p-8">
      <Headset className="w-12 h-12 text-gray-700 mb-4" strokeWidth={1.5} />
      <p className="text-gray-400 text-sm font-medium">لا توجد جلسة نشطة</p>
      <p className="text-gray-600 text-xs mt-1.5 max-w-xs">
        اختر مكالمة أو محادثة من طابور الانتظار للرد على الحاج
      </p>
    </div>
  );
}
