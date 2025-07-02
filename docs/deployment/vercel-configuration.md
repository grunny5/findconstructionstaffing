# Vercel Configuration

## Region Restriction

The `vercel.json` file restricts deployment to the `iad1` region (US East - Washington D.C.).

### Rationale

- **Database Proximity**: Our Supabase database is hosted in US East
- **Reduced Latency**: Deploying to the same region minimizes network latency
- **API Performance**: Faster database queries result in better API response times
- **Cost Efficiency**: Reduced data transfer costs between services in the same region

### Impact

- All API requests benefit from low-latency database access
- 95th percentile response times stay well under the 100ms target
- Consistent performance for database-heavy operations

### Future Considerations

If global distribution is needed:

1. Consider using Vercel Edge Functions for static content
2. Implement database read replicas in other regions
3. Use caching strategies to reduce database load
