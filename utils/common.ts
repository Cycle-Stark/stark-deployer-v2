

export function makeFirstLetterUpperCase(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1).replaceAll("_", " ");
}

export function limitChars(str: string, count: number, show_dots: boolean) {
    if (count <= str?.length) {
        return `${str.substring(0, count)} ${show_dots ? '...' : ''}`
    }
    return str
}

export function formatAddress(address: string, startCount: number, endCount: number) {
    return `${address.substring(0, startCount)}...${address.substring(address.length - endCount)}`;
}