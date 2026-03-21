import { Project } from 'ts-morph';
import path from 'path';

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

const clientFolders = ['components', 'features', 'hooks', 'pages', 'sections'];
const clientFiles = ['App.tsx', 'main.tsx', 'index.css'];

const serverFolders = ['controllers', 'routes', 'services', 'middleware'];
const serverFiles = [];

const sharedFolders = ['lib', 'utils'];
const sharedFiles = ['types.ts'];

async function refactor() {
  console.log('Starting structural refactor...');

  // 1. Get all source files to track them
  const sourceFiles = project.getSourceFiles();

  // 2. Move files and directories
  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath();
    if (!filePath.includes('/src/')) continue;

    const relativePath = filePath.split('/src/')[1]; // e.g., 'components/Button.tsx' or 'App.tsx'
    const topLevelDirOrFile = relativePath.split('/')[0]; // 'components' or 'App.tsx'

    let newDir = '';

    if (clientFolders.includes(topLevelDirOrFile) || clientFiles.includes(topLevelDirOrFile)) {
      newDir = 'client';
    } else if (serverFolders.includes(topLevelDirOrFile) || serverFiles.includes(topLevelDirOrFile)) {
      newDir = 'server';
    } else if (sharedFolders.includes(topLevelDirOrFile) || sharedFiles.includes(topLevelDirOrFile)) {
      newDir = 'shared';
    }

    if (newDir) {
      const newPath = filePath.replace('/src/', `/src/${newDir}/`);
      console.log(`Moving ${relativePath} -> ${newDir}/${relativePath}`);
      sourceFile.move(newPath);
    }
  }

  // 3. Save the project (ts-morph automatically updates all imports)
  console.log('Saving project and updating imports. This may take a moment...');
  await project.save();
  console.log('Refactor complete!');
}

refactor().catch(console.error);
