# Security Incident Report

**Date:** 2025-01-27
**Affected file:** `astro.config.mjs`
**Status:** Resolved
**Commit with fix:** `91b019e`

---

## Summary

Malicious JavaScript code was discovered injected into `astro.config.mjs`. The malware was causing build failures with error `require is not defined` because it used CommonJS `require()` in an ESM module context.

---

## Timeline

| Commit | Status |
|--------|--------|
| `fe8da4c` | Clean |
| `ae98d25` | **Infected** — malware first appeared |
| `91b019e` | **Fixed** — malware removed |

---

## Malware Analysis

### Identification Markers

- Campaign ID: `4-1147` (stored in `global['!']`)
- Obfuscation seed: `2857687`
- Payload parameter: `2509`

### Code Structure

```
1. Initialization
   └── global['!'] = '4-1147'  // Campaign marker

2. String deobfuscation function (_$_1e42)
   └── Decodes strings via character permutation
   └── Sets up: global.require, global.module

3. Main payload loader (sfL function)
   └── Decrypts obfuscated strings (joW, pYd)
   └── Uses Function constructor to create executable code
   └── Executes payload: Tgw(2509)
```

### Obfuscation Technique

The malware uses a character permutation algorithm with mathematical seeds:

```javascript
// Simplified deobfuscation logic
for (var j = 0; j < length; j++) {
    var s = seed * (j + 489) + (seed % 19597);
    var w = seed * (j + 659) + (seed % 48014);
    // swap characters at positions s%length and w%length
    seed = (s + w) % 4573868;
}
```

### Probable Behavior

Based on the code patterns, this is likely an **infostealer** targeting:

| Target | Description |
|--------|-------------|
| `process.env` | Environment variables (API keys, tokens, secrets) |
| `.npmrc` / `.yarnrc` | npm authentication tokens |
| `~/.ssh/` | SSH private keys |
| `~/.aws/` | AWS credentials |
| Browser data | Cookies, localStorage tokens |

---

## Infection Vector

Most likely scenarios:

1. **Compromised npm package** — malicious postinstall script injected code into project files
2. **Compromised IDE extension** — VS Code or other editor extension with malicious code
3. **Compromised local machine** — trojan modifying JavaScript files

---

## Recommended Actions

### Immediate

- [x] Remove malicious code from `astro.config.mjs`
- [x] Commit and deploy fix
- [ ] Run `npm audit` to check for vulnerable packages
- [ ] Review `package-lock.json` for suspicious packages

### Credential Rotation

If any of these were accessible during infection period, rotate them:

- [ ] API keys in `.env` files
- [ ] npm tokens (`npm token revoke` + create new)
- [ ] SSH keys (if `~/.ssh/` was accessible)
- [ ] AWS credentials (if `~/.aws/` was accessible)
- [ ] Database credentials
- [ ] Third-party service tokens (Firebase, etc.)

### Prevention

- [ ] Review installed npm packages and their dependencies
- [ ] Check IDE extensions for suspicious permissions
- [ ] Enable npm package lockfile (`package-lock.json`) verification
- [ ] Consider using `npm ci` instead of `npm install` in CI/CD
- [ ] Set up Git hooks to scan for obfuscated code patterns

---

## Detection Patterns

For future reference, scan for these patterns:

```regex
global\[['"]!\['"]\]
_\$_[a-z0-9]+
sfL\s*\(
\.split\(.*\)\.join\(.*\)\.split\(.*\)\.join\(
String\.fromCharCode\(127\)
```

---

## References

- [npm security best practices](https://docs.npmjs.com/cli/v10/using-npm/security)
- [OWASP Supply Chain Security](https://owasp.org/www-project-web-security-testing-guide/)
