export function levenshtein(a: string, b: string): number {
    const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
        new Array(b.length + 1).fill(0)
    );

    for (let i = 0; i <= a.length; i++) {
        dp[i][0] = i;
    }
    for (let j = 0; j <= b.length; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,      // deletion
                dp[i][j - 1] + 1,      // insertion
                dp[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return dp[a.length][b.length];
}

export function findBestMatch(name: string, candidates: string[]): string | null {
    let best: string | null = null;
    let bestScore = Infinity;

    for (const c of candidates) {
        const d = levenshtein(name.toLowerCase(), c.toLowerCase());

        if (d < bestScore) {
            bestScore = d;
            best = c;
        }
    }

    // Heuristic: only suggest if it's "close enough"
    if (best !== null && bestScore <= 2) {
        return best;
    }

    return null;
}