import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type {
  CalendarEvent,
  CalendarEventCreate,
  CalendarEventUpdate,
  CalendarDay,
  EventsParams,
} from '@/lib/types';

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  );
  if (entries.length === 0) return '';
  return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
}

export const eventsService = {
  /** List events with optional filters and pagination. */
  async getEvents(
    params: EventsParams = {},
  ): Promise<ApiResponse<CalendarEvent[]>> {
    const qs = toQuery({
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      search: params.search,
      page: params.page,
      limit: params.limit,
    });
    return api.get<CalendarEvent[]>(`/events${qs}`);
  },

  /** Get upcoming events (default limit = 5). */
  async getUpcoming(limit?: number): Promise<ApiResponse<CalendarEvent[]>> {
    const qs = limit !== undefined ? toQuery({ limit }) : '';
    return api.get<CalendarEvent[]>(`/events/upcoming${qs}`);
  },

  /** Get calendar view for a given month. */
  async getCalendar(
    year: number,
    month: number,
  ): Promise<ApiResponse<CalendarDay[]>> {
    const qs = toQuery({ year, month });
    return api.get<CalendarDay[]>(`/events/calendar${qs}`);
  },

  /** Get a single event by ID. */
  async getById(id: string): Promise<ApiResponse<CalendarEvent>> {
    return api.get<CalendarEvent>(`/events/${id}`);
  },

  /** Create a new event. */
  async create(data: CalendarEventCreate): Promise<ApiResponse<CalendarEvent>> {
    return api.post<CalendarEvent>('/events', data);
  },

  /** Update an existing event. */
  async update(
    id: string,
    data: CalendarEventUpdate,
  ): Promise<ApiResponse<CalendarEvent>> {
    return api.patch<CalendarEvent>(`/events/${id}`, data);
  },

  /** Cancel a scheduled event. */
  async cancel(id: string): Promise<ApiResponse<CalendarEvent>> {
    return api.patch<CalendarEvent>(`/events/${id}/cancel`, {});
  },

  /** Mark an event as completed. */
  async complete(id: string): Promise<ApiResponse<CalendarEvent>> {
    return api.patch<CalendarEvent>(`/events/${id}/complete`, {});
  },
};
