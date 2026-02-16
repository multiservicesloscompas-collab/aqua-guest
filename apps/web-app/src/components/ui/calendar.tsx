import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-5 pt-6", className)}
      classNames={{
        months: "flex flex-col space-y-6",
        month: "space-y-2 w-full",
        month_caption: "flex justify-center relative items-center h-5 mb-2",
        caption_label: "text-lg font-bold",
        nav: "space-x-2 flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-12 w-12 bg-transparent p-0 opacity-60 hover:opacity-100 absolute left-0 z-10 transition-all hover:bg-accent hover:scale-110",
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-12 w-12 bg-transparent p-0 opacity-60 hover:opacity-100 absolute right-0 z-10 transition-all hover:bg-accent hover:scale-110",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex w-full",
        weekday: "text-muted-foreground rounded-md flex-1 font-semibold text-[0.9rem] text-center h-10 flex items-center justify-center",
        weeks: "w-full space-y-0",
        week: "flex w-full mt-0",
        day: "h-11 flex-1 text-center text-base p-0 relative flex items-center justify-center",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-11 w-11 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground transition-all rounded-full"
        ),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-full shadow-lg",
        today: "bg-accent/50 text-accent-foreground font-black border-2 border-primary/20",
        outside: "text-muted-foreground opacity-30",
        disabled: "text-muted-foreground opacity-30",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
          return <Icon className="h-8 w-8" />;
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
