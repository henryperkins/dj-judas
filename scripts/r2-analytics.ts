// R2 Storage Analytics using Cloudflare GraphQL API
// Monitor usage, costs, and performance metrics

interface R2Metrics {
  bucketName: string;
  storageBytes: number;
  objectCount: number;
  classAOperations: number; // List, Get
  classBOperations: number; // Put, Delete
  inboundBandwidth: number;
  outboundBandwidth: number;
}

/**
 * Query R2 storage metrics for the last 30 days
 */
export async function fetchR2Metrics(
  accountId: string,
  apiToken: string
): Promise<R2Metrics[]> {
  const query = `
    query GetR2Metrics($accountId: string!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          r2StorageAdaptiveGroups(limit: 1000, filter: {
            datetime_geq: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
          }) {
            sum {
              payloadSize
              metadataSize
              uploadCount
              downloadCount
            }
            dimensions {
              bucketName
              storageClass
            }
          }
          r2OperationsAdaptiveGroups(limit: 1000, filter: {
            datetime_geq: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
          }) {
            sum {
              classAOperations
              classBOperations
            }
            dimensions {
              bucketName
              actionType
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
    body: JSON.stringify({ query, variables: { accountId } }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL query failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Process and aggregate metrics
  const metrics: Map<string, R2Metrics> = new Map();

  // Aggregate storage metrics
  for (const group of data.data.viewer.accounts[0].r2StorageAdaptiveGroups || []) {
    const bucketName = group.dimensions.bucketName;
    if (!metrics.has(bucketName)) {
      metrics.set(bucketName, {
        bucketName,
        storageBytes: 0,
        objectCount: 0,
        classAOperations: 0,
        classBOperations: 0,
        inboundBandwidth: 0,
        outboundBandwidth: 0,
      });
    }
    const metric = metrics.get(bucketName)!;
    metric.storageBytes += group.sum.payloadSize + group.sum.metadataSize;
    metric.objectCount += group.sum.uploadCount;
  }

  // Aggregate operations metrics
  for (const group of data.data.viewer.accounts[0].r2OperationsAdaptiveGroups || []) {
    const bucketName = group.dimensions.bucketName;
    if (!metrics.has(bucketName)) continue;

    const metric = metrics.get(bucketName)!;
    metric.classAOperations += group.sum.classAOperations;
    metric.classBOperations += group.sum.classBOperations;
  }

  return Array.from(metrics.values());
}

/**
 * Calculate estimated monthly costs
 */
export function calculateMonthlyCost(metrics: R2Metrics): {
  storageCost: number;
  operationsCost: number;
  total: number;
} {
  // R2 Pricing (as of 2025)
  const STORAGE_COST_PER_GB = 0.015; // $0.015/GB/month
  const CLASS_A_COST_PER_MILLION = 4.5; // $4.50/million operations
  const CLASS_B_COST_PER_MILLION = 0.36; // $0.36/million operations

  const storageGB = metrics.storageBytes / (1024 ** 3);
  const storageCost = storageGB * STORAGE_COST_PER_GB;

  const classACost = (metrics.classAOperations / 1_000_000) * CLASS_A_COST_PER_MILLION;
  const classBCost = (metrics.classBOperations / 1_000_000) * CLASS_B_COST_PER_MILLION;
  const operationsCost = classACost + classBCost;

  return {
    storageCost,
    operationsCost,
    total: storageCost + operationsCost,
  };
}

/**
 * Example usage:
 *
 * const metrics = await fetchR2Metrics('your-account-id', 'your-api-token');
 * for (const bucket of metrics) {
 *   console.log(`Bucket: ${bucket.bucketName}`);
 *   console.log(`  Storage: ${(bucket.storageBytes / (1024**3)).toFixed(2)} GB`);
 *   console.log(`  Objects: ${bucket.objectCount.toLocaleString()}`);
 *
 *   const cost = calculateMonthlyCost(bucket);
 *   console.log(`  Estimated cost: $${cost.total.toFixed(2)}/month`);
 * }
 */
