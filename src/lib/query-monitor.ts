// Query monitoring utility for development
// Note: Prisma middleware ($use) is deprecated in newer versions
// For production monitoring, consider using Prisma's built-in logging or APM tools

let queryCount = 0;
let slowQueries: Array<{ query: string; duration: number }> = [];

// Manual tracking functions for query monitoring
export function trackQuery(model: string, action: string, duration: number) {
  queryCount++;
  if (duration > 100) {
    slowQueries.push({ query: `${model}.${action}`, duration });
    if (process.env.NODE_ENV === "development") {
      console.warn(`🐌 Slow query (${duration}ms): ${model}.${action}`);
    }
  }
}

export function getQueryStats() {
  return {
    total: queryCount,
    slowQueries: slowQueries.slice(-10), // Last 10 slow queries
  };
}

export function resetQueryStats() {
  queryCount = 0;
  slowQueries = [];
}

export function logQueryStats(label = "Request") {
  if (process.env.NODE_ENV === "development") {
    console.log(`📊 ${label} - Total queries: ${queryCount}`);
    if (slowQueries.length > 0) {
      console.log(`   Slow queries: ${slowQueries.length}`);
    }
  }
}
