const https = require('https');

// Configuration
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID; // The Team ID, e.g. "aa-1234-..."

if (!LINEAR_API_KEY || !LINEAR_TEAM_ID) {
  console.error('Missing LINEAR_API_KEY or LINEAR_TEAM_ID environment variables.');
  process.exit(1);
}

// Parse input from GitHub Action environment
const payloadPath = process.env.GITHUB_EVENT_PATH;
if (!payloadPath) {
  console.error('Missing GITHUB_EVENT_PATH.');
  process.exit(1);
}

const fs = require('fs');
const event = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));

// We support 'pull_request_review_comment' and 'issue_comment'
// But wait, Greptile reviews might come as review comments or regular comments.
// Greptile bot name usually 'greptile' or similar
const comment = event.comment;
const sender = comment?.user?.login;

if (!sender || !sender.toLowerCase().includes('greptile')) {
  console.log(`Comment sender '${sender}' is not Greptile. Skipping.`);
  process.exit(0);
}

const body = comment.body;
const prUrl = event.pull_request?.html_url || event.issue?.html_url || 'Unknown PR/Issue';
const title = `Greptile Review on ${prUrl}`;

async function linearRequest(query, variables) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query, variables });
    const options = {
      hostname: 'api.linear.app',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: LINEAR_API_KEY,
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => (responseBody += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(responseBody));
        } else {
          reject(new Error(`Linear API request failed: ${res.statusCode} ${responseBody}`));
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function getLabels() {
  const query = `
    query {
      issueLabels {
        nodes {
          id
          name
        }
      }
    }
  `;
  const result = await linearRequest(query);
  return result.data.issueLabels.nodes;
}

async function createIssue(teamId, title, description, labelIds) {
  const query = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;
  const variables = {
    input: {
      teamId,
      title,
      description,
      labelIds,
    },
  };
  return linearRequest(query, variables);
}

async function main() {
  try {
    console.log('Fetching Linear labels...');
    const allLabels = await getLabels();

    // FETCH TEAM ID IF NEEDED
    let teamIdToUse = LINEAR_TEAM_ID;
    console.log(`Resolving Team ID for: ${LINEAR_TEAM_ID}`);
    try {
      const teamsQuery = `
          query {
            teams {
              nodes {
                id
                key
                name
              }
            }
          }
        `;
      const teamsResult = await linearRequest(teamsQuery);
      // Safely access nested properties
      if (
        teamsResult &&
        teamsResult.data &&
        teamsResult.data.teams &&
        teamsResult.data.teams.nodes
      ) {
        const teamNode = teamsResult.data.teams.nodes.find(
          (t) => t.id === LINEAR_TEAM_ID || t.key === LINEAR_TEAM_ID
        );

        if (!teamNode) {
          console.error(`Could not find team with ID or Key: ${LINEAR_TEAM_ID}`);
          console.log(
            'Available teams:',
            teamsResult.data.teams.nodes.map((t) => `${t.name} (${t.key}) - ${t.id}`).join(', ')
          );
          process.exit(1);
        }
        teamIdToUse = teamNode.id;
        console.log(`Using Team UUID: ${teamIdToUse} (${teamNode.name})`);
      } else {
        console.error('Failed to fetch teams structure from Linear:', JSON.stringify(teamsResult));
      }
    } catch (e) {
      console.error('Error resolving team:', e);
    }

    const bugsLabel = allLabels.find(
      (l) => l.name.toLowerCase() === 'bugs' || l.name.toLowerCase() === 'bug'
    );
    const reviewLabel = allLabels.find((l) => l.name.toLowerCase() === 'agentic review');

    const labelIds = [];
    if (bugsLabel) labelIds.push(bugsLabel.id);
    if (reviewLabel) labelIds.push(reviewLabel.id);

    console.log(`Found labels: Bug(${bugsLabel?.id}), Agentic Review(${reviewLabel?.id})`);

    const description = `This issue was automatically created from a Greptile review comment.\n\n**Source:** ${prUrl}\n\n---\n\n${body}`;

    console.log('Creating Linear issue...');
    const result = await createIssue(teamIdToUse, title, description, labelIds);

    if (result.data?.issueCreate?.success) {
      console.log(
        `Successfully created Linear issue: ${result.data.issueCreate.issue.identifier} (${result.data.issueCreate.issue.url})`
      );
    } else {
      console.error('Failed to create Linear issue:', JSON.stringify(result));
      process.exit(1);
    }
  } catch (error) {
    console.error('Error syncing to Linear:', error);
    process.exit(1);
  }
}

main();
