import * as journalService from './journal.service.js'
import { success, created, error } from '../../utils/response.js'

/** Create a new journal entry for the authenticated user. */
async function createEntry(req, res, next) {
  try {
    const { content } = req.body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return error(res, 'Journal content is required')
    }

    const entry = await journalService.createEntry(req.user.id, content.trim())
    return created(res, { entry }, 'Journal entry created')
  } catch (err) {
    next(err)
  }
}

/** List journal entries for the authenticated user, paginated. */
async function getEntries(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 20

    if (page < 1) {
      return error(res, 'page must be >= 1')
    }
    if (limit < 1 || limit > 100) {
      return error(res, 'limit must be between 1 and 100')
    }

    const data = await journalService.getEntries(req.user.id, page, limit)
    return success(res, data, 'Journal entries fetched')
  } catch (err) {
    next(err)
  }
}

/** Update a journal entry owned by the authenticated user. */
async function updateEntry(req, res, next) {
  try {
    const { content } = req.body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return error(res, 'Journal content is required')
    }

    const entry = await journalService.updateEntry(req.user.id, req.params.id, content.trim())
    return success(res, { entry }, 'Journal entry updated')
  } catch (err) {
    next(err)
  }
}

/** Delete a journal entry owned by the authenticated user. */
async function deleteEntry(req, res, next) {
  try {
    await journalService.deleteEntry(req.user.id, req.params.id)
    return success(res, null, 'Journal entry deleted')
  } catch (err) {
    next(err)
  }
}

/** Get journal entries created within a local-day timestamp range (?from=ISO&to=ISO). */
async function getEntriesForDate(req, res, next) {
  try {
    const { from, to } = req.query
    if (!from || !to) {
      return error(res, 'from and to query params are required (ISO timestamps)')
    }
    const entries = await journalService.getEntriesForDate(req.user.id, from, to)
    return success(res, { entries }, 'Journal entries for date fetched')
  } catch (err) {
    next(err)
  }
}

/** Get aggregated mood insights for the past 14 days. */
async function getInsights(req, res, next) {
  try {
    const data = await journalService.getInsights(req.user.id)
    return success(res, data, 'Insights fetched')
  } catch (err) {
    next(err)
  }
}

export { createEntry, getEntries, updateEntry, deleteEntry, getEntriesForDate, getInsights }
