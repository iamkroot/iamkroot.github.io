export function addTilPrefix(str: string): string {
    if (!str.startsWith("TIL: ")) {
        return "TIL: " + str;
    }
    return str;
}
