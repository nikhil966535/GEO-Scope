const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');

const token = process.env.GITHUB_TOKEN || process.argv[2];

if (!token) {
  console.log('=======================================================');
  console.log('🔑 GitHub Authentication Required');
  console.log('=======================================================');
  console.log('To push your committed code to GitHub:');
  console.log('');
  console.log('Option 1: Pass your token as an argument:');
  console.log('   node scripts/push-to-github.js <YOUR_GITHUB_TOKEN>');
  console.log('');
  console.log('Option 2: Using standard Git / VS Code / GitHub Desktop:');
  console.log('   git push -u origin main');
  console.log('   (or click "Sync Changes" / "Publish Branch" in VS Code)');
  console.log('=======================================================');
  process.exit(1);
}

async function push() {
  console.log('🚀 Pushing to https://github.com/nikhil966535/GEO-Scope.git (branch: main)...');

  try {
    const res = await git.push({
      fs,
      http,
      dir: '.',
      remote: 'origin',
      ref: 'main',
      force: true,
      onAuth: () => ({ username: token.trim() }),
    });

    console.log('✅ Push completed successfully!');
    if (res.ok) {
      console.log('🎉 Your repository is live at: https://github.com/nikhil966535/GEO-Scope');
    }
  } catch (err) {
    console.error('❌ Push failed:', err.message);
    if (err.message.includes('401')) {
      console.error('👉 Error 401 Unauthorized: Please check your GitHub Token permissions (needs "repo" scope).');
    }
    process.exit(1);
  }
}

push();
