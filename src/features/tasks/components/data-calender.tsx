import { Task } from "../types";

import {
  format,
  getDay,
  parse,
  startOfWeek,
  subMonths,
  addMonths,
} from "date-fns";

import { enUS } from "date-fns/locale";
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./data-calendar.css";
import { EventCard } from "./event-card";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});
interface DataCalenderProps {
  data: Task[];
}
interface CustomToolbarProps {
  date: Date;
  onNavigate: (action: "NEXT" | "PREV" | "TODAY") => void;
}

const CustomToolbar = ({ date, onNavigate }: CustomToolbarProps) => {
  const month = format(date, "MMMM yyyy", { locale: enUS });
  return (
    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white via-blue-50/30 to-white rounded-t-lg border-b border-gray-100">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("PREV")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onNavigate("TODAY")}
          className="px-4 py-1.5 bg-primary text-white rounded-full text-xs font-medium hover:bg-primary/90 transition-all duration-200 shadow-sm flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30 hover:shadow-md"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Today</span>
        </button>
        <button
          onClick={() => onNavigate("NEXT")}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-gray-100">
        <CalendarDays className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm text-gray-800">{month}</span>
      </div>
    </div>
  );
};

export default CustomToolbar;

export const DataCalender = ({ data }: DataCalenderProps) => {
  const [value, setValue] = useState(
    data.length > 0 ? new Date(data[0].dueDate) : new Date()
  );

  const events = data.map((task) => ({
    start: new Date(task.dueDate),
    end: new Date(task.dueDate),
    title: task.name,
    project: task.project,
    assignee: task.assignee,
    status: task.status,
    id: task.$id,
  }));

  const handleNavigate = (action: "NEXT" | "PREV" | "TODAY") => {
    if (action === "PREV") {
      setValue(subMonths(value, 1));
    } else if (action === "NEXT") {
      setValue(addMonths(value, 1));
    } else if (action === "TODAY") {
      setValue(new Date());
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white">
      <Calendar
        localizer={localizer}
        events={events}
        date={value}
        views={["month"]}
        defaultView="month"
        toolbar
        showAllEvents
        className="h-full calendar-with-animation"
        max={new Date(new Date().setFullYear(new Date().getFullYear() + 1))}
        formats={{
          weekdayFormat: (date, culture, localizer) =>
            localizer?.format(date, "EEEE", culture) ?? "",
        }}
        components={{
          eventWrapper: ({ event }) => (
            <EventCard
              id={event.id}
              title={event.title}
              assignee={event.assignee}
              project={event.project}
              status={event.status}
            />
          ),
          toolbar: () => (
            <CustomToolbar date={value} onNavigate={handleNavigate} />
          ),
        }}
      />
    </div>
  );
};
