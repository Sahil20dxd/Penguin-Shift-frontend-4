# Git Push Error Workaround - Signal 10 (SIGBUS)

## Problem
Getting `error: pack-objects died of signal 10` when trying to push to GitHub.

## Solutions (Try in order)

### Solution 1: Create a Patch and Apply It

1. **Create a patch file from your commit:**
   ```bash
   cd /Users/skincorporation/Documents/Mohawk/Sem\ 6/Capstone/Front-end
   git format-patch -1 64ffe98 --stdout > /tmp/push-commit.patch
   ```

2. **On a different machine or after restarting:**
   ```bash
   cd /path/to/repo
   git apply /tmp/push-commit.patch
   git push origin feature-F/F8-added-history-functionality-and-publicPlaylist-UI
   ```

### Solution 2: Push Using GitHub Desktop

1. Install [GitHub Desktop](https://desktop.github.com/)
2. Clone the repository: `https://github.com/Sahil20dxd/PenguinShift-frontend-deploy.git`
3. Create/checkout the branch: `feature-F/F8-added-history-functionality-and-publicPlaylist-UI`
4. Copy your changes to the cloned repository
5. Commit and push using GitHub Desktop GUI

### Solution 3: Use a Fresh Clone

1. **Clone the repository in a new location:**
   ```bash
   cd ~/Desktop
   git clone https://github.com/Sahil20dxd/PenguinShift-frontend-deploy.git
   cd PenguinShift-frontend-deploy
   git checkout feature-F/F8-added-history-functionality-and-publicPlaylist-UI
   ```

2. **Copy your changes:**
   ```bash
   cp -r /Users/skincorporation/Documents/Mohawk/Sem\ 6/Capstone/Front-end/src/* ./src/
   cp /Users/skincorporation/Documents/Mohawk/Sem\ 6/Capstone/Front-end/package*.json ./
   ```

3. **Commit and push:**
   ```bash
   git add .
   git commit -m "pushing files for deployment"
   git push origin feature-F/F8-added-history-functionality-and-publicPlaylist-UI
   ```

### Solution 4: Manual File Upload via GitHub Web

1. Go to: https://github.com/Sahil20dxd/PenguinShift-frontend-deploy/tree/feature-F/F8-added-history-functionality-and-publicPlaylist-UI
2. Click "Add file" → "Upload files"
3. Upload your changed files
4. Commit with message: "pushing files for deployment"

### Solution 5: System-Level Fixes

**Check available memory:**
```bash
vm_stat
```

**Try updating Git:**
```bash
brew install git
```

**Restart your Mac** (memory fragmentation can cause signal 10)

### Solution 6: Use Git LFS (if large files)

If you have large files, use Git LFS:
```bash
git lfs install
git lfs track "*.png"
git add .gitattributes
git commit -m "Add Git LFS tracking"
git push origin feature-F/F8-added-history-functionality-and-publicPlaylist-UI
```

## Why This Happens

Signal 10 (SIGBUS) indicates a memory access error. Common causes:
- **Memory exhaustion** during pack creation
- **Git repository corruption**
- **macOS Git version bugs**
- **System resource limits**

## Current Status

- ✅ Repository size is normal (1.45 MiB)
- ✅ Files are small (largest is 356KB PNG)
- ✅ Bundle creation works (8KB bundle)
- ❌ Push operation fails with signal 10

The most reliable solution is **Solution 3** (Fresh Clone) or **Solution 2** (GitHub Desktop).

