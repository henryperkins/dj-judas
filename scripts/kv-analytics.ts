// KV Analytics using Cloudflare GraphQL API
// Monitor usage, costs, and performance metrics for Workers KV

interface KVMetrics {
  namespace: string;
  namespaceId: string;
  reads: number;
  writes: number;
  deletes: number;
  lists: number;
  storageBytes: number;
  costs: {
    reads: number;
    writes: number;
    storage: number;
    total: number;
  };
}

/**
 * Fetch KV metrics for the last 30 days
 */
export async function fetchKVMetrics(
  accountId: string,
  apiToken: string,
  namespaceId: string,
  namespaceName = 'SESSIONS'
): Promise<KVMetrics> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const query = `
    query GetKVMetrics($accountId: String!, $namespaceId: String!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          kvOperationsAdaptiveGroups(
            limit: 1000
            filter: {
              namespaceId: $namespaceId
              date_geq: "${thirtyDaysAgo}"
            }
          ) {
            sum {
              requests
            }
            dimensions {
              actionType
            }
          }
          kvStorageAdaptiveGroups(
            filter: { namespaceId: $namespaceId }
          ) {
            max {
              storedBytes
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { accountId, namespaceId } }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL query failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  // Aggregate metrics
  let reads = 0, writes = 0, deletes = 0, lists = 0;
  const operations = data.data?.viewer?.accounts?.[0]?.kvOperationsAdaptiveGroups || [];

  for (const group of operations) {
    const actionType = group.dimensions.actionType;
    const count = group.sum.requests;

    switch (actionType) {
      case 'read':
        reads += count;
        break;
      case 'write':
        writes += count;
        break;
      case 'delete':
        deletes += count;
        break;
      case 'list':
        lists += count;
        break;
    }
  }

  const storageGroups = data.data?.viewer?.accounts?.[0]?.kvStorageAdaptiveGroups || [];
  const storageBytes = storageGroups[0]?.max?.storedBytes || 0;

  // Calculate costs (Workers Paid Plan pricing as of 2025)
  // Reads: $0.50 per million (after 10M free)
  // Writes: $5.00 per million (after 1M free)
  // Storage: $0.50 per GB-month (after 1GB free)
  const readCost = Math.max(0, (reads - 10_000_000) / 1_000_000 * 0.50);
  const writeCost = Math.max(0, (writes - 1_000_000) / 1_000_000 * 5.00);
  const storageGb = storageBytes / (1024 ** 3);
  const storageCost = Math.max(0, (storageGb - 1) * 0.50);

  return {
    namespace: namespaceName,
    namespaceId,
    reads,
    writes,
    deletes,
    lists,
    storageBytes,
    costs: {
      reads: readCost,
      writes: writeCost,
      storage: storageCost,
      total: readCost + writeCost + storageCost,
    },
  };
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Calculate cache hit rate estimate
 * (Assumes 80% of reads should hit edge cache with proper cacheTtl settings)
 */
function estimateCacheHitRate(reads: number): {
  edgeHits: number;
  kvHits: number;
  hitRate: string;
} {
  // With proper cacheTtl, ~80% of reads should hit edge cache
  // Remaining 20% hit KV
  const edgeHits = Math.floor(reads * 0.8);
  const kvHits = reads - edgeHits;

  return {
    edgeHits,
    kvHits,
    hitRate: '80%', // Ideal target
  };
}

/**
 * Main execution
 */
async function main() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const namespaceId = process.env.KV_NAMESPACE_ID || 'b7654d69472c4e1b8eda8bbae8ee2776';

  if (!accountId || !apiToken) {
    console.error('❌ Error: Missing environment variables');
    console.error('   Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN');
    console.error('\n   Example:');
    console.error('   export CLOUDFLARE_ACCOUNT_ID="your-account-id"');
    console.error('   export CLOUDFLARE_API_TOKEN="your-api-token"');
    process.exit(1);
  }

  console.log('📊 Fetching KV metrics for the last 30 days...\n');

  try {
    const metrics = await fetchKVMetrics(accountId, apiToken, namespaceId);

    console.log('='.repeat(60));
    console.log(`  Workers KV Analytics: ${metrics.namespace}`);
    console.log('='.repeat(60));
    console.log();

    console.log('📈 Operations (Last 30 Days):');
    console.log(`   Reads:   ${metrics.reads.toLocaleString()}`);
    console.log(`   Writes:  ${metrics.writes.toLocaleString()}`);
    console.log(`   Deletes: ${metrics.deletes.toLocaleString()}`);
    console.log(`   Lists:   ${metrics.lists.toLocaleString()}`);
    console.log();

    console.log('💾 Storage:');
    console.log(`   Total Size: ${formatBytes(metrics.storageBytes)}`);
    console.log(`   Namespace ID: ${metrics.namespaceId}`);
    console.log();

    console.log('💰 Estimated Monthly Cost:');
    console.log(`   Reads:   $${metrics.costs.reads.toFixed(2)}`);
    console.log(`   Writes:  $${metrics.costs.writes.toFixed(2)}`);
    console.log(`   Storage: $${metrics.costs.storage.toFixed(2)}`);
    console.log(`   ─────────────────────────`);
    console.log(`   TOTAL:   $${metrics.costs.total.toFixed(2)}`);
    console.log();

    // Cache efficiency estimate
    const cacheEstimate = estimateCacheHitRate(metrics.reads);
    console.log('🎯 Cache Efficiency (Estimated):');
    console.log(`   Edge Cache Hits: ${cacheEstimate.edgeHits.toLocaleString()} (~80%)`);
    console.log(`   KV Hits:         ${cacheEstimate.kvHits.toLocaleString()} (~20%)`);
    console.log(`   Target Hit Rate: ${cacheEstimate.hitRate}`);
    console.log();

    // Recommendations
    console.log('💡 Optimization Recommendations:');

    if (metrics.writes > 1_000_000) {
      console.log('   ⚠️  High write volume detected');
      console.log('      → Consider migrating sessions to Durable Objects');
      console.log('      → See: docs/KV_OPTIMIZATION_GUIDE.md#priority-1');
    }

    if (metrics.reads > 10_000_000) {
      console.log('   ⚠️  High read volume detected');
      console.log('      → Increase cacheTtl to reduce KV reads');
      console.log('      → Implement cache coalescing for related data');
      console.log('      → See: docs/KV_OPTIMIZATION_GUIDE.md#priority-2');
    }

    const storageGb = metrics.storageBytes / (1024 ** 3);
    if (storageGb > 1) {
      console.log('   ⚠️  Storage exceeding free tier (1GB)');
      console.log('      → Audit keys without expiration TTL');
      console.log('      → Run cleanup script: npm run kv:cleanup');
    }

    if (metrics.writes > 0 && metrics.reads > 0) {
      const writeToReadRatio = metrics.writes / metrics.reads;
      if (writeToReadRatio > 0.1) {
        console.log('   ⚠️  High write-to-read ratio detected');
        console.log('      → Are you caching effectively?');
        console.log('      → Consider longer TTLs for static data');
      }
    }

    if (metrics.costs.total < 5) {
      console.log('   ✅ Cost optimization looks good!');
    }

    console.log();
    console.log('📚 Documentation: docs/KV_OPTIMIZATION_GUIDE.md');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Error fetching KV metrics:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchKVMetrics, formatBytes, estimateCacheHitRate };
