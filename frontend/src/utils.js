import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const IST = 'Asia/Kolkata'

export function formatIST(dateStr, fmt = 'DD/MM/YYYY, h:mm A') {
  if (!dateStr) return '—'
  return dayjs(dateStr).tz(IST).format(fmt)
}

export function formatDateIST(dateStr) {
  if (!dateStr) return '—'
  return dayjs(dateStr).tz(IST).format('DD/MM/YYYY')
}

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function statusBadgeClass(status) {
  const map = {
    draft: 'badge-draft',
    sent: 'badge-sent',
    accepted: 'badge-accepted',
    rejected: 'badge-rejected',
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    todo: 'badge-todo',
    in_progress: 'badge-in_progress',
    done: 'badge-done',
    active: 'badge-accepted',
  }
  return map[status] || 'badge-draft'
}

export function statusLabel(status) {
  const map = {
    draft: 'Draft',
    sent: 'Sent',
    accepted: 'Accepted',
    rejected: 'Rejected',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
    active: 'Active',
    quotation_meeting: 'Quotation Meeting',
    site_visit: 'Site Visit',
    follow_up: 'Follow Up',
    other: 'Other',
  }
  return map[status] || status
}

export function aptTypeLabel(type) {
  return statusLabel(type)
}

export function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
