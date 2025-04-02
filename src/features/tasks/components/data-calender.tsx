import { Task } from "../types";

import {
  format,
  getDay,
  parse,
  startOfWeek,
  addDays,
  subMonths,
  addMonths,
} from "date-fns";

import { enUS } from "date-fns/locale";
import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./data-calendar.css";
import { EventCard } from "./event-card";
import { ArrowLeft, ArrowRight, Calendar1 } from "lucide-react";
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
    <div className="flex items-center justify-between p-4 bg-white shadow-sm border-b">
      <div className="flex items-center gap-3">
        <button
          onClick={() => onNavigate("PREV")}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => onNavigate("TODAY")}
          className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition"
        >
          Today
        </button>
        <button
          onClick={() => onNavigate("NEXT")}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Calendar1 className="w-5 h-5 text-gray-600" />
        <span className="font-semibold text-gray-700">{month}</span>
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
    <Calendar
      localizer={localizer}
      events={events}
      date={value}
      views={["month"]}
      defaultView="month"
      toolbar
      showAllEvents
      className="h-full"
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
  );
};
