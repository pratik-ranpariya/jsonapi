require('dotenv').config()
const { GITHUB_ACCESS_TOKEN, GITHUB_USERNAME, GITHUB_REPO_NAME } = process.env
const fetch = require('node-fetch');
const cron = require('node-cron');
const fs = require('fs');

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

  // Schedule the cron job to run every 6 hour
 cron.schedule('0 */6 * * *', () => {
    console.log("cron called at: ", new Date());
    updateNatureFileDoc();
    });

  const updateNatureFileDoc = () => {
      fs.readFile(filePath, 'utf8', (err, data) => {
          if (err) {
              console.error('Error reading file:', err);
              return;
          }
      
          // Parse the JSON data
          let json = JSON.parse(data);
      
          // Modify the JSON data
          json.forEach(item => {
            //   let increase = getRandomInt(0, 50); // Random increase between 40 and 50
              item.downloads += getRandomInt(0, 15);
              item.share += getRandomInt(0, 5);
              item.saved += getRandomInt(0, 15);
              item.views += getRandomInt(0, 50);
              item.likes += getRandomInt(0, 25);

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
  }

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