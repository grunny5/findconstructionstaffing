#!/usr/bin/env node

// Script to check Vercel deployment usage

const https = require('https');

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_ORG_ID;

if (!VERCEL_TOKEN) {
  console.error('❌ VERCEL_TOKEN environment variable is required');
  process.exit(1);
}

// Get deployments from last 24 hours
const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

const options = {
  hostname: 'api.vercel.com',
  path: `/v6/deployments?since=${since}${VERCEL_TEAM_ID ? `&teamId=${VERCEL_TEAM_ID}` : ''}`,
  method: 'GET',
  headers: {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.deployments) {
        const deploymentCount = response.deployments.length;
        const hoursAgo = (hours) =>
          new Date(Date.now() - hours * 60 * 60 * 1000);

        console.log('📊 Vercel Deployment Usage (Last 24 Hours)');
        console.log('==========================================');
        console.log(`Total deployments: ${deploymentCount}/100`);
        console.log(
          `Status: ${deploymentCount >= 100 ? '❌ LIMIT REACHED' : '✅ Within limit'}`
        );

        // Show deployments by hour
        const last3h = response.deployments.filter(
          (d) => new Date(d.created) > hoursAgo(3)
        ).length;
        const last6h = response.deployments.filter(
          (d) => new Date(d.created) > hoursAgo(6)
        ).length;
        const last12h = response.deployments.filter(
          (d) => new Date(d.created) > hoursAgo(12)
        ).length;

        console.log('\n📈 Deployment Timeline:');
        console.log(`  Last 3 hours:  ${last3h} deployments`);
        console.log(`  Last 6 hours:  ${last6h} deployments`);
        console.log(`  Last 12 hours: ${last12h} deployments`);

        // Estimate when limit will reset
        if (deploymentCount >= 100) {
          const oldestDeployment =
            response.deployments[response.deployments.length - 1];
          const resetTime = new Date(
            new Date(oldestDeployment.created).getTime() + 24 * 60 * 60 * 1000
          );
          const hoursUntilReset = Math.ceil(
            (resetTime - Date.now()) / (60 * 60 * 1000)
          );

          console.log(
            `\n⏰ Rate limit will start resetting in approximately ${hoursUntilReset} hours`
          );
          console.log(`   (at ${resetTime.toLocaleString()})`);
        }

        // Show recent deployments
        console.log('\n📋 Recent Deployments:');
        response.deployments.slice(0, 5).forEach((dep) => {
          const time = new Date(dep.created).toLocaleString();
          console.log(`  - ${dep.url || dep.id} (${time})`);
        });
      } else {
        console.error('❌ Unable to fetch deployment data');
        console.error(data);
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.end();
