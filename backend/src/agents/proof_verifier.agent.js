import { describeImage, verifyHabitProof } from '../services/vision.service.js'
import { query } from '../db/query.js'
import { cacheDelete, CacheKeys } from '../utils/cache.js'

async function verifyProof({ logId, userId, habitId, habitTitle, imagePath }) {
  const visionDescription = await describeImage(imagePath)
  const { approved, reason, confidence } = await verifyHabitProof(habitTitle, visionDescription)

  const status = approved ? 'approved' : 'rejected'

  const { rows } = await query(
    `UPDATE habit_logs
     SET vision_description       = $1,
         verification_status      = $2,
         verification_comment     = $3,
         verification_confidence  = $4,
         verified_at              = NOW()
     WHERE id = $5
     RETURNING *`,
    [visionDescription, status, reason, confidence, logId]
  )

  if (approved) {
    await cacheDelete(CacheKeys.streak(userId, habitId))
    await cacheDelete(CacheKeys.streakAll(userId))
    await cacheDelete(CacheKeys.dashboard(userId))
  }

  return {
    visionDescription,
    approved,
    reason,
    confidence,
    status,
    log: rows[0]
  }
}

export { verifyProof }
