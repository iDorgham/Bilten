#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Progress tracking script
function updateProgress() {
  console.log('🔄 Updating Bilten Platform Progress...\n');
  
  const tasksFile = path.join(__dirname, '../../docs/plans/PLANS/core-platform-tasks.md');
  const trackerFile = path.join(__dirname, '../../docs/plans/PLANS/PROGRESS_TRACKER.md');
  
  try {
    // Read the tasks file
    const content = fs.readFileSync(tasksFile, 'utf8');
    
    // Count completed vs total tasks
    const totalTasks = (content.match(/- \[[ x]\]/g) || []).length;
    const completedTasks = (content.match(/- \[x\]/g) || []).length;
    const completionPercentage = Math.round((completedTasks / totalTasks) * 100);
    
    console.log(`📊 Progress Summary:`);
    console.log(`   Total Tasks: ${totalTasks}`);
    console.log(`   Completed: ${completedTasks}`);
    console.log(`   Completion: ${completionPercentage}%\n`);
    
    // Update the tracker file
    const trackerContent = `# 📊 Progress Tracker

## Current Status: ${completionPercentage}% Complete

### ✅ Completed Phases
- Phase 1: Foundation Infrastructure (95%)
- Phase 3: User-Facing Applications (100%)

### 🔄 In Progress
- Phase 2: Core Business Logic (70%)
- Phase 4: Advanced Features (67%)

### ❌ Not Started
- Phase 5: Enterprise Features (0%)
- Phase 6: Performance and Scale (0%)

## How to Update Progress

1. **Edit core-platform-tasks.md** - Mark tasks as complete [x]
2. **Update this tracker** - Refresh percentages
3. **Document changes** - Add implementation notes

## Next Priority: Payment Processing

**Last Updated**: ${new Date().toLocaleDateString()}
**Completion**: ${completionPercentage}%
`;

    fs.writeFileSync(trackerFile, trackerContent);
    console.log('✅ Progress tracker updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating progress:', error.message);
  }
}

// Run the update
updateProgress();
