# Release Guide for @skippr/mcp-x-ray

This document outlines the release process and NPM token management for the Skippr MCP X-Ray package.

## Table of Contents
- [Release Process](#release-process)
- [NPM Token Management](#npm-token-management)
- [Emergency Procedures](#emergency-procedures)
- [Troubleshooting](#troubleshooting)

## Release Process

### Pre-Release Checklist

Before creating a release, ensure:
- [ ] All tests pass: `npm test`
- [ ] Build succeeds: `npm run build`
- [ ] Version updated in package.json
- [ ] Changelog updated (if applicable)
- [ ] Local testing completed

### Creating a Release

#### Method 1: GitHub Release (Recommended)

1. **Update version in package.json:**
   ```bash
   # For patch release (bug fixes)
   npm version patch

   # For minor release (new features, backward compatible)
   npm version minor

   # For major release (breaking changes)
   npm version major
   ```

2. **Commit and push the version change:**
   ```bash
   git add package.json package-lock.json
   git commit -m "chore: release v$(node -p "require('./package.json').version")"
   git push origin main
   ```

3. **Create GitHub release:**
   ```bash
   # Using gh CLI
   VERSION=$(node -p "require('./package.json').version")
   gh release create "v${VERSION}" \
     --title "v${VERSION}" \
     --notes "Release notes here" \
     --target main
   ```

   The GitHub Actions workflow will automatically:
   - Build the project
   - Run tests
   - Add shebang to dist/server.js
   - Publish to NPM

4. **Verify the release:**
   ```bash
   # Check NPM
   npm view @skippr/mcp-x-ray version

   # Test installation
   npm install -g @skippr/mcp-x-ray@latest
   skippr-mcp-x-ray --version
   ```

#### Method 2: Manual Release (Emergency Only)

Only use this method if GitHub Actions is unavailable:

```bash
# Ensure you're on main with latest changes
git checkout main
git pull

# Clean install and test
rm -rf node_modules dist
npm ci
npm test

# Build the project
npm run build

# Add shebang to server.js
echo '#!/usr/bin/env node' | cat - dist/server.js > temp && mv temp dist/server.js
chmod +x dist/server.js

# Publish to NPM
npm publish --access public

# Create git tag
VERSION=$(node -p "require('./package.json').version")
git tag -a "v${VERSION}" -m "Release v${VERSION}"
git push origin "v${VERSION}"
```

## NPM Token Management

### ⚠️ Important: NPM Security Changes (October 2025)

Starting October 13, 2025:
- Automation tokens limited to 90-day maximum lifetime
- Classic tokens will be revoked in November 2025
- TOTP setup will be disabled
- Update CI/CD workflows before these dates

### Token Rotation Schedule

**Rotation Required: Every 80 days**

Set calendar reminders for token rotation to avoid expiration.

### Creating a New NPM Token

1. **Generate automation token via npm CLI:**
   ```bash
   # Login to NPM (if not already logged in)
   npm login

   # Create automation token
   npm token create --read-only=false --cidr=0.0.0.0/0
   ```

   Save the token output - you'll need it for GitHub secrets.

2. **Alternative: Generate via NPM website:**
   - Visit https://www.npmjs.com/settings/skippr/tokens
   - Click "Generate New Token"
   - Select: **Automation** (for CI/CD)
   - Permissions: **Publish**
   - Expiration: **90 days** (maximum allowed)
   - Name: `github-actions-mcp-x-ray`

### Adding Token to GitHub

Using GitHub CLI:
```bash
# Set the NPM token as a repository secret
gh secret set NPM_TOKEN --body="<your-npm-token-here>" --repo skippr/mcp-x-ray

# Verify it was added (won't show the value)
gh secret list --repo skippr/mcp-x-ray
```

Alternative manual method:
1. Go to repository Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Your NPM automation token
5. Click "Add secret"

### Token Rotation Process

1. **Generate new token** (see above)
2. **Update GitHub secret:**
   ```bash
   gh secret set NPM_TOKEN --body="<new-npm-token>" --repo skippr/mcp-x-ray
   ```
3. **Test the new token:**
   ```bash
   # Trigger a test build
   gh workflow run test.yml --repo skippr/mcp-x-ray
   ```
4. **Delete old token from NPM:**
   ```bash
   # List tokens
   npm token list

   # Revoke old token
   npm token revoke <token-id>
   ```
5. **Update tracking table** (below)

### Token Tracking

| Token Name | Created | Expires | Status | Notes |
|------------|---------|---------|--------|-------|
| github-actions-mcp-x-ray | TBD | TBD | Active | Update when rotating |

## Emergency Procedures

### If NPM Token Expires

1. **Generate new token immediately** (see above)
2. **Update GitHub secret**
3. **Re-run failed workflow:**
   ```bash
   gh run rerun <run-id> --repo skippr/mcp-x-ray
   ```

### If Release Fails

1. **Check GitHub Actions logs:**
   ```bash
   gh run list --repo skippr/mcp-x-ray
   gh run view <run-id> --repo skippr/mcp-x-ray
   ```

2. **Common issues:**
   - Token expired: Rotate token
   - Version already exists: Bump version
   - Tests failing: Fix tests first
   - Network issues: Retry the workflow

### Rolling Back a Release

If a bad version was published:

1. **Deprecate the version:**
   ```bash
   npm deprecate @skippr/mcp-x-ray@<bad-version> "This version has issues, please use <good-version>"
   ```

2. **Publish a fix:**
   - Bump version (patch/minor as appropriate)
   - Fix the issue
   - Release new version

Note: NPM doesn't allow unpublishing versions that might be in use.

## Troubleshooting

### NPM Login Issues
```bash
# Check current login
npm whoami

# Re-login if needed
npm login --registry=https://registry.npmjs.org --scope=@skippr
```

### Permission Denied
- Verify you're member of @skippr organization
- Check token has publish permissions
- Ensure token hasn't expired

### Package Not Found After Publishing
- Wait 1-2 minutes for NPM CDN to update
- Clear npm cache: `npm cache clean --force`
- Try explicit version: `npm install @skippr/mcp-x-ray@0.1.0`

### GitHub Actions Not Triggering
- Verify workflow file syntax
- Check branch protection rules
- Ensure NPM_TOKEN secret exists

## Version History

| Version | Date | Type | Notes |
|---------|------|------|-------|
| 0.1.0 | TBD | Initial | First beta release |

---

For additional help, contact the development team at contact@skippr.ai