'use client';

import { useState } from 'react';
import { GripVertical, X, Plus, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Widget {
  id: string;
  type: 'analytics' | 'incidents' | 'activity' | 'leaderboard' | 'health';
  title: string;
  component: React.ReactNode;
}

interface SortableWidgetProps {
  widget: Widget;
  onRemove: (id: string) => void;
}

function SortableWidget({ widget, onRemove }: SortableWidgetProps) {
  const { theme } = useTheme();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group", {
        "bg-white border-slate-200": theme === 'light',
        "bg-[#141416] border-slate-700": theme === 'dark-plus'
      })}
    >
      <div className={cn("absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing", {
        "text-slate-400": theme === 'light',
        "text-slate-600": theme === 'dark-plus'
      })} {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </div>
      <button
        type="button"
        onClick={() => onRemove(widget.id)}
        className={cn("absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-slate-100", {
          "text-slate-400 hover:text-slate-600": theme === 'light',
          "text-slate-600 hover:text-slate-200 hover:bg-slate-700": theme === 'dark-plus'
        })}
      >
        <X className="w-4 h-4" />
      </button>
      {widget.component}
    </div>
  );
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
  availableWidgets: Widget[];
}

export function DashboardWidgets({ widgets, onWidgetsChange, availableWidgets }: DashboardWidgetsProps) {
  const { theme } = useTheme();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);
      onWidgetsChange(arrayMove(widgets, oldIndex, newIndex));
    }
  };

  const handleAddWidget = (widget: Widget) => {
    onWidgetsChange([...widgets, widget]);
    setAddDialogOpen(false);
  };

  const handleRemoveWidget = (id: string) => {
    onWidgetsChange(widgets.filter((w) => w.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className={cn("font-bold text-lg", {
          "text-slate-900": theme === 'light',
          "text-slate-100": theme === 'dark-plus'
        })}>
          Dashboard Widgets
        </h3>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Widget</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              {availableWidgets
                .filter((w) => !widgets.find((existing) => existing.id === w.id))
                .map((widget) => (
                  <button
                    type="button"
                    key={widget.id}
                    onClick={() => handleAddWidget(widget)}
                    className={cn("p-4 border rounded-lg hover:border-indigo-500 transition-colors text-left", {
                      "border-slate-200 hover:bg-slate-50": theme === 'light',
                      "border-slate-700 hover:bg-slate-800": theme === 'dark-plus'
                    })}
                  >
                    <h4 className={cn("font-semibold text-sm mb-1", {
                      "text-slate-900": theme === 'light',
                      "text-slate-100": theme === 'dark-plus'
                    })}>
                      {widget.title}
                    </h4>
                    <p className={cn("text-xs", {
                      "text-slate-600": theme === 'light',
                      "text-slate-400": theme === 'dark-plus'
                    })}>
                      {widget.type}
                    </p>
                  </button>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {widgets.map((widget) => (
              <SortableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {widgets.length === 0 && (
        <div className={cn("text-center py-12 border-2 border-dashed rounded-lg", {
          "border-slate-200": theme === 'light',
          "border-slate-700": theme === 'dark-plus'
        })}>
          <LayoutGrid className={cn("w-12 h-12 mx-auto mb-4", {
            "text-slate-400": theme === 'light',
            "text-slate-600": theme === 'dark-plus'
          })} />
          <p className={cn("text-sm", {
            "text-slate-500": theme === 'light',
            "text-slate-400": theme === 'dark-plus'
          })}>
            No widgets yet. Add one to get started.
          </p>
        </div>
      )}
    </div>
  );
}
