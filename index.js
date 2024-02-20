// require = require('esm')(module);
const express = require('express')
const app = express()
const port = 3000
require('dotenv').config()
const { GITHUB_ACCESS_TOKEN, GITHUB_USERNAME, GITHUB_REPO_NAME } = process.env
// const { Octokit } = require("@octokit/rest");
const fetch = require('node-fetch');
// app.get('/', (req, res) => res.send('Hello World!'))

const fs = require('fs');
// const octokit = new Octokit({
//     auth: GITHUB_ACCESS_TOKEN,// Replace with your personal access token
//     request: {
//         fetch: fetch
//     }
// });

const owner = GITHUB_USERNAME;
const repo = GITHUB_REPO_NAME;
const apiUrl = 'https://api.github.com';

// Define the file path and commit message
const filePath = 'nature.json';
const commitMessage = 'Committing changes via GitHub API';

const headers = {
    'Authorization': `token ${GITHUB_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent': 'Node.js'
  };

// Read the JSON file
fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    // Parse the JSON data
    let json = JSON.parse(data);

    // Modify the JSON data
    json.forEach(item => {
        let increase = getRandomInt(0, 50); // Random increase between 40 and 50
        item.downloads += increase;
        item.share += increase;
        item.saved += increase;
        item.views += increase;
        item.likes += increase;
    });

    // console.log(json);

    // Write the modified JSON back to the file
    fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
        if (err) {
            console.error('Error writing file:', err);
            return;
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');

        createCommit(fileContent)
        console.log('File has been updated successfully');
    });
});

// Function to generate a random integer between min and max (inclusive)
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Function to create a new commit
async function createCommit(fileContent) {
    try {
      // Get the latest commit SHA for the default branch
      const refResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/git/refs/heads/gh-pages`, { headers });
      const refData = await refResponse.json();
      const latestCommitSha = refData.object.sha;
  
      // Create a blob with the file content
      const blobResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: fileContent,
          encoding: 'utf-8'
        })
      });
      const blobData = await blobResponse.json();
      const blobSha = blobData.sha;
  
      // Create a new tree with the updated file
      const treeResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/git/trees`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base_tree: latestCommitSha,
          tree: [{
            path: filePath,
            mode: '100644',
            type: 'blob',
            sha: blobSha
          }]
        })
      });
      const treeData = await treeResponse.json();
      const newTreeSha = treeData.sha;
  
      // Create a new commit
      const commitResponse = await fetch(`${apiUrl}/repos/${owner}/${repo}/git/commits`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeSha,
          parents: [latestCommitSha]
        })
      });
      const commitData = await commitResponse.json();
      const newCommitSha = commitData.sha;
  
      // Update the reference to point to the new commit
      await fetch(`${apiUrl}/repos/${owner}/${repo}/git/refs/heads/gh-pages`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          sha: newCommitSha
        })
      });
  
      console.log('Commit created successfully!');
    } catch (error) {
      console.error('Error creating commit:', error);
    }
  }
// Create a new commit
// async function createCommit() {
//     try {
//         console.log("{{{{{{{{{{{{{{{}}}}}}}}}}}}}}");
//       // Get the latest commit SHA for the default branch
//       const { data: { object: { sha: latestCommitSha } } } = await octokit.git.getRef({
//         owner,
//         repo,
//         ref: 'heads/gh-pages' // Change to your default branch name if it's different
//       });

//       console.log(":::::::::::::::::::latestCommitSha", latestCommitSha);
  
//       // Create a blob with the file content
//       const { data: { sha: blobSha } } = await octokit.git.createBlob({
//         owner,
//         repo,
//         content: fileContent,
//         encoding: 'utf-8'
//       });
  
//       // Create a new tree with the updated file
//       const { data: { sha: newTreeSha } } = await octokit.git.createTree({
//         owner,
//         repo,
//         base_tree: latestCommitSha,
//         tree: [{
//           path: filePath,
//           mode: '100644',
//           type: 'blob',
//           sha: blobSha
//         }]
//       });
  
//       // Create a new commit
//       const { data: { sha: newCommitSha } } = await octokit.git.createCommit({
//         owner,
//         repo,
//         message: commitMessage,
//         tree: newTreeSha,
//         parents: [latestCommitSha]
//       });
  
//       // Update the reference to point to the new commit
//       await octokit.git.updateRef({
//         owner,
//         repo,
//         ref: 'heads/gh-pages', // Change to your default branch name if it's different
//         sha: newCommitSha
//       });
  
//       console.log('Commit created successfully!');
//     } catch (error) {
//       console.error('Error creating commit:', error);
//     }
//   }

app.listen(port, () => console.log(`Example app listening on port ${port}!`))