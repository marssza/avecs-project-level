const https = require("https");

const token = process.env.GH_TOKEN;
const projectNumber = parseInt(process.env.PROJECT_NUMBER);
const owner = process.env.PROJECT_OWNER;
const ownerType = process.env.OWNER_TYPE; // "user" or "organization"

const query = `
query {
  ${ownerType}(login: "${owner}") {
    projectV2(number: ${projectNumber}) {
      title
      items(first: 100) {
        nodes {
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field {
                  ... on ProjectV2SingleSelectField {
                    name
                  }
                }
              }
            }
          }
          content {
            ... on Issue {
              title
              number
              url
            }
          }
        }
      }
    }
  }
}
`;

function graphql(query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query });
    const options = {
      hostname: "api.github.com",
      path: "/graphql",
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "weekly-report-action",
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => resolve(JSON.parse(body)));
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const result = await graphql(query);
  const project = result.data[ownerType].projectV2;
  const items = project.items.nodes;

  // Group items by their Status column value
  const columns = {};

  for (const item of items) {
    if (!item.content || !item.content.title) continue;

    let status = "No Status";
    for (const fieldValue of item.fieldValues.nodes) {
      if (fieldValue.field && fieldValue.field.name === "Status") {
        status = fieldValue.name;
        break;
      }
    }

    if (!columns[status]) columns[status] = [];
    columns[status].push(item.content);
  }

  // Build email body
  let body = `Hi,\n\nPlease see report from Avecs Support project board\n\n`;
  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  for (const [columnName, issues] of Object.entries(columns)) {
    body += `📋 ${columnName.toUpperCase()}\n`;
    body += `─────────────────────────────\n`;
    if (issues.length === 0) {
      body += `  No items\n`;
    } else {
      for (const issue of issues) {
        body += `  • #${issue.number} — ${issue.title}\n`;
        body += `    ${issue.url}\n`;
      }
    }
    body += `\n`;
  }

  body += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  body += `This is an automated report from GitHub Actions.\n`;

  process.stdout.write(body);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
