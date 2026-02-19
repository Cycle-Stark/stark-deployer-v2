


export const checkIfEndwithSlash = (st: string) => {
    const len = st.length;
    const end = st.substring(len - 1, len)
    const regex = new RegExp(/\//)
    return regex.test(end)
}

export const removeLastSlash = (st: string) => {
    const len = st.length;
    return st.substring(0, len - 1);
}

export const matchTest = (str1: string, str2: string) => {
    let string1 = str1;
    let string2 = str2;

    const str1endswithslash = checkIfEndwithSlash(string1)
    const str2endswithslash = checkIfEndwithSlash(string2)

    if (str1endswithslash) {
        string1 = removeLastSlash(string1)
    }
    if (str2endswithslash) {
        string2 = removeLastSlash(string2)
    }

    const testpath = `^${string1}$`

    const regex = new RegExp(testpath, "gi");

    return regex.test(string2);
}

export  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}