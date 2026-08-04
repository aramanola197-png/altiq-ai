const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await repairOpportunityIndex();
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

/**
 * One-time self-healing step. An earlier version of the Opportunity
 * schema had a unique index on {source, externalId} only, missing
 * `type`. Because grant/bounty/gig/quest ids from the official API
 * aren't unique across resource types, records with a matching id
 * silently overwrote each other regardless of type during sync —
 * which is why opportunities could end up showing the wrong tag
 * (e.g. everything appearing as "gig"). This runs automatically on
 * startup so nobody has to touch MongoDB by hand: it drops the old,
 * incorrect index if present, and clears the opportunity cache so
 * the next sync rebuilds it cleanly under the corrected
 * {source, type, externalId} index. Safe to run repeatedly — once
 * the old index is gone, this becomes a no-op on every future boot.
 */
async function repairOpportunityIndex() {
  try {
    const collection = mongoose.connection.collection('opportunities');
    const indexes = await collection.indexes().catch(() => []);

    const staleIndex = indexes.find(
      (idx) => idx.key && Object.keys(idx.key).length === 2 && idx.key.source === 1 && idx.key.externalId === 1 && !idx.key.type
    );

    if (staleIndex) {
      console.log(`[migration] Dropping stale opportunity index "${staleIndex.name}" (missing type in uniqueness key)`);
      await collection.dropIndex(staleIndex.name);
      const deleted = await collection.deleteMany({});
      console.log(`[migration] Cleared ${deleted.deletedCount} potentially mis-tagged cached opportunities — the next sync will rebuild this correctly.`);
    }
  } catch (err) {
    // Non-fatal — worst case the old index lingers until manually
    // dropped, but the app should still function.
    console.warn('[migration] Opportunity index repair skipped:', err.message);
  }
}

module.exports = connectDB;
