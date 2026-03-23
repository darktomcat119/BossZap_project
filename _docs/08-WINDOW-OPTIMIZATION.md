# BossZap — 24-Hour Window Optimization

## Why This Matters
This directly impacts BossZap's operating costs. Proper window management can reduce messaging costs by 80%+.

## How Meta's Window Works
- Subscriber sends message → Meta opens 24h free conversation window.
- During window: BossZap can send unlimited messages for FREE.
- After window closes: must use HSM template ($$ per message).

## Implementation

### Window Tracking
- On every inbound message: update `message_window_tracking` table.
- Set `window_expires_at = last_inbound_at + 24 hours`.
- Before ANY outbound message: check if window is open.

### Outbound Message Priority Queue
| Priority | Category | Behavior |
|---|---|---|
| P1 | Payment recovery, critical alerts | Send ALWAYS (HSM if window closed) |
| P2 | Agenda reminders, budget ready, financial confirmations | Send only if window OPEN, otherwise queue |
| P3 | Weekly summaries, tips, promotional | Queue until window opens |

### Proactive Batch Sending
When an inbound message arrives (opening a window):
1. Update window tracker.
2. Process the message normally.
3. ALSO check `pending_notifications` for this subscriber.
4. Send ALL pending P2 and P3 notifications during the open window.
5. Mark sent notifications as `sent`.

### Rules
- NEVER send P2/P3 messages via HSM (too expensive at scale).
- P1 messages: try window first, fall back to HSM.
- Track HSM costs per subscriber for cost analysis in admin dashboard.
- Log every outbound message with: window_status, message_type, cost (free/hsm).

### Expected Behavior
Most MEI subscribers will use BossZap daily (registering expenses, checking agenda), so their windows will be open frequently. The system should leverage this pattern aggressively.
