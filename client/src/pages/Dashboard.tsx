import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CalendarDays,
  AlertTriangle,
  Clock,
  UmbrellaOff,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Department scheduling overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-blue-900" />
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Department scheduling overview — {format(new Date(), "EEEE, MMMM d, yyyy")}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Officers"
          value={stats?.totalOfficers ?? 0}
          icon={Users}
          color="bg-blue-900"
          subtitle={`${stats?.activeOfficers ?? 0} active`}
        />
        <StatCard
          title="Active Officers"
          value={stats?.activeOfficers ?? 0}
          icon={ShieldCheck}
          color="bg-green-600"
        />
        <StatCard
          title="Total Shifts"
          value={stats?.totalShifts ?? 0}
          icon={CalendarDays}
          color="bg-indigo-600"
        />
        <StatCard
          title="Shift Shortages"
          value={stats?.shortageShifts ?? 0}
          icon={AlertTriangle}
          color={
            (stats?.shortageShifts ?? 0) > 0 ? "bg-red-600" : "bg-gray-400"
          }
          subtitle={
            (stats?.shortageShifts ?? 0) > 0 ? "Needs attention" : "All covered"
          }
        />
        <StatCard
          title="Pending PTO"
          value={stats?.pendingPto ?? 0}
          icon={UmbrellaOff}
          color={
            (stats?.pendingPto ?? 0) > 0 ? "bg-amber-500" : "bg-gray-400"
          }
          subtitle={
            (stats?.pendingPto ?? 0) > 0 ? "Awaiting review" : "None pending"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shortage Alerts */}
        {(stats?.recentShortages?.length ?? 0) > 0 && (
          <Card className="border-0 shadow-sm bg-white border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Shift Shortage Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.recentShortages.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {shift.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(shift.date), "EEE, MMM d")} •{" "}
                      {shift.startTime} – {shift.endTime}
                    </p>
                    {shift.unit && (
                      <p className="text-xs text-gray-400">{shift.unit}</p>
                    )}
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    Shortage
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Shifts */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-900" />
              Upcoming Shifts (Next 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(stats?.upcomingShifts?.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No upcoming shifts scheduled
              </p>
            ) : (
              stats?.upcomingShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {shift.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(shift.date), "EEE, MMM d")} •{" "}
                      {shift.startTime} – {shift.endTime}
                    </p>
                    {shift.unit && (
                      <p className="text-xs text-gray-400">{shift.unit}</p>
                    )}
                  </div>
                  <Badge
                    variant={
                      shift.status === "filled"
                        ? "default"
                        : shift.status === "shortage"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs capitalize"
                  >
                    {shift.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
