import { z } from 'zod'

export const STATUS_META = {
  new:       { label: 'New',       cls: 'bg-blue-50   text-blue-700   border-blue-200'  },
  contacted: { label: 'Contacted', cls: 'bg-amber-50  text-amber-700  border-amber-200' },
  converted: { label: 'Converted', cls: 'bg-green-50  text-green-700  border-green-200' },
  closed:    { label: 'Closed',    cls: 'bg-slate-100 text-slate-500  border-slate-200' },
}

export const STATUS_OPTIONS = ['new', 'contacted', 'converted', 'closed']

export const FILTER_TABS = [
  { key: '',          label: 'All'       },
  { key: 'new',       label: 'New'       },
  { key: 'contacted', label: 'Contacted' },
  { key: 'converted', label: 'Converted' },
  { key: 'closed',    label: 'Closed'    },
]

export const STYLE_OPTIONS  = ['', 'Modern', 'Traditional', 'Contemporary', 'Minimalist', 'Eclectic', 'Other']
export const BUDGET_OPTIONS = ['', 'Under ₹5L', '₹5L–₹10L', '₹10L–₹25L', 'Above ₹25L']

export const addLeadSchema = z.object({
  name:         z.string().min(2, 'Name required'),
  email:        z.string().email('Valid email required'),
  phone:        z.string().optional(),
  style_pref:   z.string().optional(),
  budget_range: z.string().optional(),
  message:      z.string().optional(),
})

export const convertSchema = z.object({
  project_name: z.string().optional(),
})
