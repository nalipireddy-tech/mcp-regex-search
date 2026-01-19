#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import fs from "fs";
import path from "path";
import readline from "readline";

async function regexSearch(directory, pattern) {
  const regex = new RegExp(pattern);
  const results = [];

  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);

    if (!fs.statSync(fullPath).isFile()) continue;

    const rl = readline.createInterface({
      input: fs.createReadStream(fullPath),
      crlfDelay: Infinity
    });

    let lineNumber = 0;

    for await (const line of rl) {
      lineNumber++;
      if (regex.test(line)) {
        results.push({
          file: file,
          line: lineNumber,
          content: line.trim()
        });
      }
    }
  }

  return results;
}
const server = new Server(
  {
    name: "regex-search-mcp",
    version: "1.0.0"
  },
  {
    tools: {
      regex_search: {
        description: "Search files using regex and return line numbers",
        inputSchema: {
          type: "object",
          properties: {
            directory: { type: "string" },
            pattern: { type: "string" }
          },
          required: ["directory", "pattern"]
        },
        handler: async ({ directory, pattern }) => {
          const matches = await regexSearch(directory, pattern);
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(matches, null, 2)
              }
            ]
          };
        }
      }
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
