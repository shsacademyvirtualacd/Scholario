/**
 * Semantic Versioning (SemVer) Parser and Comparator
 * Enforces strict X.Y.Z semver format and checks if a new version is strictly higher.
 */

export interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  raw: string;
}

const SEMVER_REGEX = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

export function isValidSemver(version: string): boolean {
  if (!version || typeof version !== 'string') return false;
  return SEMVER_REGEX.test(version.trim());
}

export function parseSemver(version: string): ParsedSemver | null {
  if (!version || typeof version !== 'string') return null;
  const match = version.trim().match(SEMVER_REGEX);
  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    raw: version.trim().replace(/^v/i, ''),
  };
}

/**
 * Returns:
 *  1 if a > b
 * -1 if a < b
 *  0 if a === b
 */
export function compareSemver(a: string, b: string): number {
  const pA = parseSemver(a);
  const pB = parseSemver(b);

  if (!pA || !pB) {
    throw new Error(`Invalid semver comparison: "${a}" vs "${b}"`);
  }

  if (pA.major !== pB.major) {
    return pA.major > pB.major ? 1 : -1;
  }
  if (pA.minor !== pB.minor) {
    return pA.minor > pB.minor ? 1 : -1;
  }
  if (pA.patch !== pB.patch) {
    return pA.patch > pB.patch ? 1 : -1;
  }

  // Handle prerelease: a version without prerelease is higher than one with prerelease (e.g. 1.0.0 > 1.0.0-rc.1)
  if (!pA.prerelease && pB.prerelease) return 1;
  if (pA.prerelease && !pB.prerelease) return -1;
  if (pA.prerelease && pB.prerelease) {
    return pA.prerelease.localeCompare(pB.prerelease);
  }

  return 0;
}

/**
 * Checks if newVersion is strictly higher than currentVersion.
 * If currentVersion is null or empty, any valid semver is accepted.
 */
export function isVersionHigher(newVersion: string, currentVersion?: string | null): {
  isHigher: boolean;
  error?: string;
} {
  if (!isValidSemver(newVersion)) {
    return {
      isHigher: false,
      error: `Invalid version "${newVersion}". Version must follow SemVer format (e.g. 1.0.4).`,
    };
  }

  if (!currentVersion || !isValidSemver(currentVersion)) {
    return { isHigher: true };
  }

  const comparison = compareSemver(newVersion, currentVersion);
  if (comparison <= 0) {
    const cleanCur = currentVersion.trim().replace(/^v/i, '');
    const cleanNew = newVersion.trim().replace(/^v/i, '');
    const curParsed = parseSemver(cleanCur);
    const suggested = curParsed ? `${curParsed.major}.${curParsed.minor}.${curParsed.patch + 1}` : '1.0.4';

    return {
      isHigher: false,
      error: `Version ${cleanNew} must be higher than current published version ${cleanCur}. Recommended next version: ${suggested}.`,
    };
  }

  return { isHigher: true };
}
